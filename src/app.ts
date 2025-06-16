import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { swaggerSpec } from '@/config/swagger';
import routes from '@/routes';
import { 
  rateLimiter, 
  requestLogger, 
  errorHandler, 
  notFoundHandler 
} from '@/middleware';
import { SMTPService } from '@/services/SMTPService';
import { EmailService } from '@/services/EmailService';

export class App {
  public app: express.Application;
  private smtpService: SMTPService;
  private emailService: EmailService;

  constructor() {
    this.app = express();
    this.smtpService = new SMTPService();
    this.emailService = new EmailService();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.setupCleanupJob();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.security.allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Request logging
    this.app.use(requestLogger);

    // Trust proxy if behind reverse proxy
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Temporary Email API Documentation',
    }));

    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Temporary Email Service',
        version: '1.0.0',
        description: 'A modern temporary email service with advanced features',
        documentation: '/api-docs',
        endpoints: {
          generateEmail: 'POST /api/emails/generate',
          getEmails: 'GET /api/emails/{address}',
          getEmail: 'GET /api/emails/message/{id}',
          health: 'GET /api/health'
        },
        domain: config.email.domain,
        maxEmailSize: config.email.maxSize,
        retentionHours: config.email.retentionHours,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private setupCleanupJob(): void {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        const deletedCount = await this.emailService.cleanupExpiredEmails();
        if (deletedCount > 0) {
          logger.info(`Cleanup job: removed ${deletedCount} expired emails`);
        }
      } catch (error) {
        logger.error('Cleanup job failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  public async start(): Promise<void> {
    try {
      // Start SMTP server
      await this.smtpService.start();
      
      // Start HTTP server
      this.app.listen(config.port, () => {
        logger.info(`HTTP server listening on port ${config.port}`);
        logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');
    
    try {
      await this.smtpService.stop();
      logger.info('Application shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}
