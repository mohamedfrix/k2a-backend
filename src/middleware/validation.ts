import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/utils/logger';

/**
 * Request Validation Middleware
 * Validates request data using Zod schemas
 */

/**
 * Validates request body, query parameters, or path parameters
 */
export const validateRequest = (
  schema: ZodSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the specified property
      const validated = schema.parse(req[property]);
      
      // Replace the original property with validated data
      req[property] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const errors = error.errors.map(err => {
          const path = err.path.length > 0 ? err.path.join('.') : 'root';
          return `${path}: ${err.message}`;
        });

        logger.warn('Validation failed:', {
          property,
          errors,
          url: req.url,
          method: req.method,
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Handle unexpected validation errors
      logger.error('Unexpected validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
        timestamp: new Date().toISOString(),
      });
    }
  };
};
