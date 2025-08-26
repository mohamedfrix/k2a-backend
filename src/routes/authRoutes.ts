import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { authenticateAdmin } from '@/middleware/auth';
import { authLimiter, strictLimiter } from '@/middleware/rateLimiter';
import { 
  loginSchema, 
  refreshTokenSchema, 
  createAdminSchema 
} from '@/validators/authValidators';

/**
 * Authentication Routes
 * Defines all auth-related endpoints with appropriate middleware
 */
export function createAuthRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();
  const authController = new AuthController(prisma, logger);

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Admin login
   * @access  Public
   * @rateLimit 5 requests per 15 minutes
   */
  router.post(
    '/login',
    authLimiter, // Rate limiting for auth attempts
    validateRequest(loginSchema), // Validate request body
    authController.login
  );

  /**
   * @route   POST /api/v1/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   * @rateLimit 5 requests per 15 minutes
   */
  router.post(
    '/refresh',
    authLimiter, // Rate limiting for auth attempts
    validateRequest(refreshTokenSchema), // Validate request body
    authController.refreshToken
  );

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Admin logout
   * @access  Private (Admin)
   */
  router.post(
    '/logout',
    authenticateAdmin, // Verify admin token
    authController.logout
  );

  /**
   * @route   GET /api/v1/auth/profile
   * @desc    Get admin profile
   * @access  Private (Admin)
   */
  router.get(
    '/profile',
    authenticateAdmin, // Verify admin token
    authController.getProfile
  );

  /**
   * @route   POST /api/v1/auth/setup
   * @desc    Create first admin account (setup only)
   * @access  Public (only when no admins exist)
   * @rateLimit 10 requests per 15 minutes (strict)
   */
  router.post(
    '/setup',
    strictLimiter, // Strict rate limiting
    validateRequest(createAdminSchema), // Validate request body
    authController.setupAdmin
  );

  /**
   * @route   POST /api/v1/auth/cleanup
   * @desc    Clean up expired refresh tokens
   * @access  Private (Admin)
   * @rateLimit 10 requests per 15 minutes (strict)
   */
  router.post(
    '/cleanup',
    strictLimiter, // Strict rate limiting
    authenticateAdmin, // Verify admin token
    authController.cleanupTokens
  );

  return router;
}
