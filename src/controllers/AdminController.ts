import { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { EmailService } from '@/services/EmailService';
import { sendSuccess, sendError, asyncHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

export class AdminController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Get server statistics
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { days = 7 } = req.query;
    const daysCount = parseInt(days as string);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const [
        totalEmails,
        totalAddresses,
        recentEmails,
        recentAddresses,
        topDomains,
        emailsByDay
      ] = await Promise.all([
        // Total emails count
        prisma.email.count(),
        
        // Total email addresses count
        prisma.emailAddress.count(),
        
        // Recent emails count
        prisma.email.count({
          where: { createdAt: { gte: startDate } }
        }),
        
        // Recent addresses count
        prisma.emailAddress.count({
          where: { createdAt: { gte: startDate } }
        }),
        
        // Top sender domains
        prisma.email.groupBy({
          by: ['from'],
          _count: { from: true },
          orderBy: { _count: { from: 'desc' } },
          take: 10
        }),
        
        // Emails by day
        prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as count
          FROM Email 
          WHERE createdAt >= ${startDate}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `
      ]);      // Process top domains to extract domain part
      const processedTopDomains = topDomains.map((item: any) => {
        const domain = item.from.split('@')[1] || item.from;
        return {
          domain,
          count: item._count.from
        };
      });

      const stats = {
        total: {
          emails: totalEmails,
          addresses: totalAddresses
        },
        recent: {
          emails: recentEmails,
          addresses: recentAddresses
        },
        topSenderDomains: processedTopDomains,
        emailsByDay,
        period: `${daysCount} days`
      };

      sendSuccess(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting stats:', error);
      sendError(res, 'Failed to retrieve statistics', 500);
    }
  });

  /**
   * Clean up expired emails
   */
  cleanupEmails = asyncHandler(async (req: Request, res: Response) => {
    try {
      const deletedCount = await this.emailService.cleanupExpiredEmails();
      sendSuccess(res, { deletedCount }, `${deletedCount} expired emails cleaned up`);
    } catch (error) {
      logger.error('Error cleaning up emails:', error);
      sendError(res, 'Failed to cleanup emails', 500);
    }
  });

  /**
   * Blacklist a domain
   */
  blacklistDomain = asyncHandler(async (req: Request, res: Response) => {
    const { domain, reason } = req.body;

    try {
      const blacklistedDomain = await prisma.blacklistedDomain.create({
        data: {
          domain: domain.toLowerCase(),
          reason: reason || 'No reason provided'
        }
      });      sendSuccess(res, blacklistedDomain, 'Domain blacklisted successfully', 201);
    } catch (error: any) {
      logger.error('Error blacklisting domain:', error);
      if (error?.code === 'P2002') {
        return sendError(res, 'Domain is already blacklisted', 409);
      }
      sendError(res, 'Failed to blacklist domain', 500);
    }
  });

  /**
   * Remove domain from blacklist
   */
  removeFromBlacklist = asyncHandler(async (req: Request, res: Response) => {
    const { domain } = req.params;

    try {
      await prisma.blacklistedDomain.delete({
        where: { domain: domain.toLowerCase() }
      });      sendSuccess(res, null, 'Domain removed from blacklist');
    } catch (error: any) {
      logger.error('Error removing domain from blacklist:', error);
      if (error?.code === 'P2025') {
        return sendError(res, 'Domain not found in blacklist', 404);
      }
      sendError(res, 'Failed to remove domain from blacklist', 500);
    }
  });

  /**
   * Get blacklisted domains
   */
  getBlacklistedDomains = asyncHandler(async (req: Request, res: Response) => {
    try {
      const blacklistedDomains = await prisma.blacklistedDomain.findMany({
        orderBy: { createdAt: 'desc' }
      });

      sendSuccess(res, blacklistedDomains, 'Blacklisted domains retrieved successfully');
    } catch (error) {
      logger.error('Error getting blacklisted domains:', error);
      sendError(res, 'Failed to retrieve blacklisted domains', 500);
    }
  });

  /**
   * Get recent API usage
   */
  getApiUsage = asyncHandler(async (req: Request, res: Response) => {
    const { hours = 24 } = req.query;
    const hoursCount = parseInt(hours as string);

    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursCount);

      const usage = await prisma.apiUsage.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });      const groupedUsage = usage.reduce((acc: Record<string, number>, item: any) => {
        const endpoint = item.endpoint;
        if (!acc[endpoint]) {
          acc[endpoint] = 0;
        }
        acc[endpoint]++;
        return acc;
      }, {});

      sendSuccess(res, {
        totalRequests: usage.length,
        byEndpoint: groupedUsage,
        period: `${hoursCount} hours`
      }, 'API usage retrieved successfully');
    } catch (error) {
      logger.error('Error getting API usage:', error);
      sendError(res, 'Failed to retrieve API usage', 500);
    }
  });

  /**
   * Get server health status
   */
  getHealth = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      const health = {
        status: 'healthy',
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        database: 'connected',
        timestamp: new Date().toISOString()
      };

      sendSuccess(res, health, 'Server is healthy');
    } catch (error) {
      logger.error('Health check failed:', error);
      sendError(res, 'Server health check failed', 500);
    }
  });
}
