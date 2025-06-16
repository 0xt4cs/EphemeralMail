import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

/**
 * Standard API response wrapper
 */
export function sendResponse<T>(
  res: Response,
  success: boolean,
  data?: T,
  message?: string,
  statusCode: number = success ? 200 : 400
): void {
  const response: ApiResponse<T> = {
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  if (!success && !message) {
    response.error = 'An error occurred';
  }

  res.status(statusCode).json(response);
}

/**
 * Success response helper
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  sendResponse(res, true, data, message, statusCode);
}

/**
 * Error response helper
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400
): void {
  sendResponse(res, false, undefined, message, statusCode);
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
