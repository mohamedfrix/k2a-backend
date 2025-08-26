import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { JwtPayload } from '@/types/auth';

/**
 * Authentication Middleware
 * Protects routes requiring admin authentication
 */

// Extend Request interface to include admin data
export interface AuthenticatedRequest extends Request {
  admin?: JwtPayload;
}

/**
 * Middleware to authenticate admin using JWT access token
 * Verifies Bearer token in Authorization header
 */
export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify the token
    const decoded = await verifyAccessToken(token);
    
    // Add admin data to request object
    req.admin = decoded;

    logger.debug('Admin authenticated successfully', {
      adminId: decoded.adminId,
      email: decoded.email,
      url: req.url,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    res.status(403).json({
      success: false,
      message: 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional authentication middleware
 * Adds admin data to request if valid token is provided, but doesn't block request if not
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = await verifyAccessToken(token);
      req.admin = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    logger.debug('Optional auth: Invalid token provided, continuing without auth', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
      method: req.method,
    });
    
    next();
  }
};
