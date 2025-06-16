import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError } from '@/utils/response';

export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return sendError(res, `Validation error: ${message}`, 400);
    }
    
    next();
  };
}
