import { Request, Response, NextFunction } from 'express';
import { SessionService } from '@/services/SessionService';
import { sendError } from '@/utils/response';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include session data
declare global {
  namespace Express {
    interface Request {
      sessionData?: {
        sessionId: string;
        fingerprint: string;
        userId: string;
      };
    }
  }
}

export class SessionMiddleware {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }
  /**
   * Middleware to ensure user has a valid session
   */
  requireSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session ID from cookie or header
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
      
      // Get fingerprint from request header or generate from request data
      const clientFingerprint = req.headers['x-browser-fingerprint'] as string;
      const serverFingerprint = this.sessionService.generateFingerprint(req);
      
      // Use client fingerprint if available, otherwise server-generated
      const fingerprint = clientFingerprint || serverFingerprint;

      let session;

      if (sessionId) {
        // Validate existing session with both session ID and fingerprint
        session = await this.sessionService.validateSession(sessionId, fingerprint);
      }

      if (!session) {
        // Create new session
        const sessionData = {
          sessionId: '',
          fingerprint,
          ipAddress: req.ip || req.connection.remoteAddress || '',
          userAgent: req.headers['user-agent'],
        };

        session = await this.sessionService.createOrGetSession(sessionData);

        // Set session cookie
        res.cookie('sessionId', session.sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }

      // Add session data to request
      req.sessionData = {
        sessionId: session.sessionId,
        fingerprint: session.fingerprint,
        userId: session.id, // Use session DB ID as user ID
      };

      next();
    } catch (error) {
      logger.error('Session middleware error:', error);
      sendError(res, 'Session validation failed', 500);
    }
  };

  /**
   * Middleware to validate existing session (optional for some endpoints)
   */
  validateSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
      const fingerprint = this.sessionService.generateFingerprint(req);

      if (sessionId) {
        const session = await this.sessionService.validateSession(sessionId, fingerprint);
        
        if (session) {
          req.sessionData = {
            sessionId: session.sessionId,
            fingerprint: session.fingerprint,
            userId: session.id,
          };
        }
      }

      // Continue regardless of session validity (for optional session endpoints)
      next();
    } catch (error) {
      logger.error('Session validation error:', error);
      next(); // Continue even if validation fails
    }
  };

  /**
   * Middleware to generate fingerprint and add to request
   */
  addFingerprint = (req: Request, res: Response, next: NextFunction) => {
    try {
      const fingerprint = this.sessionService.generateFingerprint(req);
      req.sessionData = {
        ...req.sessionData,
        fingerprint,
      } as any;
      next();
    } catch (error) {
      logger.error('Fingerprint middleware error:', error);
      next();
    }
  };
}

// Export singleton instance
export const sessionMiddleware = new SessionMiddleware();
