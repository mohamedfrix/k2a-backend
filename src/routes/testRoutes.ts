import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { authenticateAdmin, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { SuccessResponse } from '@/types/api';

/**
 * Test Routes
 * Protected routes for testing authentication
 */
export function createTestRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();

  /**
   * @route   GET /api/v1/test/admin-only
   * @desc    Test endpoint that requires admin authentication
   * @access  Private (Admin)
   */
  router.get(
    '/admin-only',
    authenticateAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const adminId = req.admin?.adminId;
      const email = req.admin?.email;

      logger.info('Admin-only test endpoint accessed', { 
        adminId, 
        email,
        ip: req.ip 
      });

      const response: SuccessResponse = {
        success: true,
        message: 'Admin authentication successful! This is a protected route.',
        data: {
          adminId,
          email,
          timestamp: new Date().toISOString(),
          message: 'You have successfully accessed an admin-only endpoint.',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * @route   GET /api/v1/test/public
   * @desc    Test endpoint that is publicly accessible
   * @access  Public
   */
  router.get(
    '/public',
    asyncHandler(async (req: Request, res: Response) => {
      logger.debug('Public test endpoint accessed', { ip: req.ip });

      const response: SuccessResponse = {
        success: true,
        message: 'Public endpoint working correctly!',
        data: {
          timestamp: new Date().toISOString(),
          message: 'This endpoint is publicly accessible.',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    })
  );

  return router;
}
