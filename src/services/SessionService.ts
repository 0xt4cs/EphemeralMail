import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export interface UserSession {
  id: string;
  sessionId: string;
  fingerprint: string;
  ipAddress: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  expiresAt: Date;
}

export interface SessionData {
  sessionId: string;
  fingerprint: string;
  ipAddress: string;
  userAgent?: string;
}

export class SessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Start cleanup timer for expired sessions
    setInterval(this.cleanupExpiredSessions.bind(this), SessionService.CLEANUP_INTERVAL);
  }

  /**
   * Generate browser fingerprint from request data
   */
  generateFingerprint(req: any): string {
    const data = {
      userAgent: req.headers['user-agent'] || '',
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || '',
      ip: req.ip || req.connection.remoteAddress || '',
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Create or get existing session
   */
  async createOrGetSession(sessionData: SessionData): Promise<UserSession> {
    try {
      // First, try to find existing active session
      const existingSession = await prisma.userSession.findFirst({
        where: {
          fingerprint: sessionData.fingerprint,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingSession) {
        // Update last used time
        const updatedSession = await prisma.userSession.update({
          where: { id: existingSession.id },
          data: {
            lastUsed: new Date(),
            ipAddress: sessionData.ipAddress, // Update IP if changed
          },
        });
        
        logger.info(`Session updated: ${existingSession.sessionId}`);
        return updatedSession as UserSession;
      }

      // Create new session
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + SessionService.SESSION_DURATION);

      const newSession = await prisma.userSession.create({
        data: {
          sessionId,
          fingerprint: sessionData.fingerprint,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          expiresAt,
        },
      });

      logger.info(`New session created: ${sessionId}`);
      return newSession as UserSession;
    } catch (error) {
      logger.error('Failed to create/get session:', error);
      throw new Error('Failed to manage session');
    }
  }

  /**
   * Validate session and fingerprint
   */
  async validateSession(sessionId: string, fingerprint: string): Promise<UserSession | null> {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          sessionId,
          fingerprint,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (session) {
        // Update last used time
        await prisma.userSession.update({
          where: { id: session.id },
          data: { lastUsed: new Date() },
        });
      }

      return session as UserSession | null;
    } catch (error) {
      logger.error('Failed to validate session:', error);
      return null;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { sessionId },
      });

      return session as UserSession | null;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Deactivate session
   */
  async deactivateSession(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { sessionId },
        data: { isActive: false },
      });

      logger.info(`Session deactivated: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to deactivate session:', error);
      throw new Error('Failed to deactivate session');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false },
          ],
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired sessions`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get all active sessions for debugging (admin only)
   */
  async getActiveSessions(): Promise<UserSession[]> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sessions as UserSession[];
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      throw new Error('Failed to retrieve sessions');
    }
  }
}
