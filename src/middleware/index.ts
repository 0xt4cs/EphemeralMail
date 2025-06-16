import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { sendError } from '@/utils/response';

/**
 * Global rate limiting middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit reached for IP: ${req.ip}`);
    sendError(res, 'Too many requests from this IP, please try again later.', 429);
  },
});

/**
 * API key authentication middleware (for admin endpoints)
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey || apiKey !== config.security.apiKeySecret) {
    return sendError(res, 'Invalid or missing API key', 401);
  }
  
  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ValidationError') {
    return sendError(res, error.message, 400);
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    return sendError(res, 'Database error', 500);
  }

  return sendError(res, 'Internal server error', 500);
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
}
