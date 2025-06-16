import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError } from '@/utils/response';

/**
 * Validation middleware factory
 */
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const message = error.details[0].message;
      return sendError(res, message, 400);
    }
    
    next();
  };
}
