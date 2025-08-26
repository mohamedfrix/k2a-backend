import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

// Custom application error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication-specific error class
export class AuthError extends AppError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthError';
  }
}

// Bad request error class
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

// Forbidden error class
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error with context
  logger.error('Error caught by error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
  });

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'AuthError') {
    statusCode = 401;
    message = error.message;
  } else if (error.name === 'BadRequestError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = error.message;
  } else if (error.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message && error.message.toLowerCase().includes('invalid credentials')) {
    // Handle authentication errors that are thrown as generic Error objects
    statusCode = 401;
    message = 'Invalid credentials';
  } else if (error.message && error.message.toLowerCase().includes('invalid refresh token')) {
    // Handle refresh token errors
    statusCode = 401;
    message = 'Invalid refresh token';
  } else if (error.message && error.message.toLowerCase().includes('account is deactivated')) {
    // Handle deactivated account errors
    statusCode = 401;
    message = 'Account is deactivated';
  }

  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
