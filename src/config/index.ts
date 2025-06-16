import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4444', 10),
  smtpPort: parseInt(process.env.SMTP_PORT || '25', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'file:./emails.db',
  },    security: {
    apiKeySecret: process.env.API_KEY_SECRET || 'default-secret-change-in-production',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4444,http://localhost:4173').split(','),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  email: {
    maxSize: parseInt(process.env.MAX_EMAIL_SIZE || '10485760', 10), // 10MB
    retentionHours: parseInt(process.env.EMAIL_RETENTION_HOURS || '24', 10),
    maxEmailsPerAddress: parseInt(process.env.MAX_EMAILS_PER_ADDRESS || '50', 10),
    domain: process.env.DOMAIN || 'localhost',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
