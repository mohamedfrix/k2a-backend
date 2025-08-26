import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

/**
 * Create a rate limiter with custom configuration
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message?: string,
  skipSuccessfulRequests = false
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    skipSuccessfulRequests,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });

      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
      });
    },
    // Custom skip function for health checks
    skip: (req: Request) => {
      return req.url === '/health' || req.url === '/api/v1/health';
    },
  });
};

/**
 * General rate limiter for most endpoints
 * 100 requests per 15 minutes
 */
export const generalLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests,
  'Too many requests from this IP, please try again later'
);

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes to prevent brute force attacks
 */
export const authLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.authMaxRequests,
  'Too many authentication attempts, please try again later',
  true // Don't count successful requests
);

/**
 * Very strict rate limiter for sensitive operations
 * 10 requests per 15 minutes
 */
export const strictLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  10,
  'Too many requests for this sensitive operation, please try again later'
);
