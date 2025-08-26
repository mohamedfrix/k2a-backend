import { Response } from 'express';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/services/AuthService';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  LoginRequest, 
  RefreshTokenRequest,
  CreateAdminRequest 
} from '@/types/auth';
import { SuccessResponse } from '@/types/api';
import { asyncHandler } from '@/middleware/errorHandler';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  private authService: AuthService;

  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {
    this.authService = new AuthService(prisma, logger);
  }

  /**
   * POST /api/v1/auth/login
   * Admin login endpoint
   */
  login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const loginData: LoginRequest = req.body;

    this.logger.info('Login request received', { 
      email: loginData.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const result = await this.authService.login(loginData);

    const response: SuccessResponse = {
      success: true,
      message: 'Login successful',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token endpoint
   */
  refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken }: RefreshTokenRequest = req.body;

    this.logger.debug('Token refresh request received', { 
      ip: req.ip 
    });

    const result = await this.authService.refreshToken(refreshToken);

    const response: SuccessResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/logout
   * Admin logout endpoint
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;
    const adminId = req.admin?.adminId;

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Admin not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.info('Logout request received', { 
      adminId,
      ip: req.ip 
    });

    await this.authService.logout(adminId, refreshToken);

    const response: SuccessResponse = {
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/auth/profile
   * Get admin profile endpoint
   */
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Admin not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.debug('Get profile request received', { adminId });

    const profile = await this.authService.getAdminProfile(adminId);

    const response: SuccessResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/setup
   * Create first admin (setup endpoint)
   * This should be disabled after initial setup
   */
  setupAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminData: CreateAdminRequest = req.body;

    // Check if any admin already exists
    const existingAdminCount = await this.prisma.admin.count();
    
    if (existingAdminCount > 0) {
      this.logger.warn('Setup attempt when admins already exist', {
        ip: req.ip,
        email: adminData.email
      });
      
      res.status(403).json({
        success: false,
        message: 'Setup is not allowed. Admin accounts already exist.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.info('Admin setup request received', { 
      email: adminData.email,
      ip: req.ip 
    });

    const admin = await this.authService.createAdmin(adminData);

    const response: SuccessResponse = {
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        createdAt: admin.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  });

  /**
   * POST /api/v1/auth/cleanup
   * Clean up expired tokens (maintenance endpoint)
   */
  cleanupTokens = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Admin not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.info('Token cleanup request received', { adminId });

    await this.authService.cleanupExpiredTokens();

    const response: SuccessResponse = {
      success: true,
      message: 'Token cleanup completed successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });
}
