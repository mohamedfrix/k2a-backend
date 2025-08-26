import { Admin, PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { 
  LoginRequest, 
  AuthResponse, 
  AdminProfile, 
  TokenResponse,
  CreateAdminRequest 
} from '@/types/auth';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokens, generateAccessToken } from '@/utils/jwt';
import { AuthError, BadRequestError, ForbiddenError } from '@/middleware/errorHandler';

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  /**
   * Authenticate admin with email and password
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      this.logger.info('Admin login attempt', { email: loginData.email });

      // Find admin by email
      const admin = await this.prisma.admin.findUnique({
        where: { email: loginData.email },
      });

      if (!admin) {
        this.logger.warn('Login failed: Admin not found', { email: loginData.email });
        throw new AuthError('Invalid credentials');
      }

      if (!admin.isActive) {
        this.logger.warn('Login failed: Admin account is deactivated', { 
          email: loginData.email,
          adminId: admin.id 
        });
        throw new AuthError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(loginData.password, admin.password);
      if (!isPasswordValid) {
        this.logger.warn('Login failed: Invalid password', { 
          email: loginData.email,
          adminId: admin.id 
        });
        throw new AuthError('Invalid credentials');
      }

      // Generate tokens
      const tokens = await generateTokens({
        id: admin.id,
        email: admin.email,
      });

      // Store refresh token in database
      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create admin profile response
      const adminProfile: AdminProfile = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName || undefined,
        lastName: admin.lastName || undefined,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      };

      this.logger.info('Admin login successful', { 
        adminId: admin.id,
        email: admin.email 
      });

      return {
        admin: adminProfile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      this.logger.debug('Token refresh attempt');

      // Find refresh token in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { admin: true },
      });

      if (!storedToken) {
        this.logger.warn('Token refresh failed: Refresh token not found');
        throw new AuthError('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        this.logger.warn('Token refresh failed: Refresh token expired', {
          adminId: storedToken.adminId,
          expiresAt: storedToken.expiresAt,
        });
        
        // Clean up expired token
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        
        throw new AuthError('Refresh token expired');
      }

      if (!storedToken.admin.isActive) {
        this.logger.warn('Token refresh failed: Admin account deactivated', {
          adminId: storedToken.admin.id,
        });
        throw new AuthError('Account is deactivated');
      }

      // Generate new tokens
      const tokens = await generateTokens({
        id: storedToken.admin.id,
        email: storedToken.admin.email,
      });

      // Update refresh token in database
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      this.logger.info('Token refresh successful', {
        adminId: storedToken.admin.id,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout admin and invalidate refresh token
   */
  async logout(adminId: string, refreshToken: string): Promise<void> {
    try {
      this.logger.info('Admin logout attempt', { adminId });

      // Remove refresh token from database
      const deletedToken = await this.prisma.refreshToken.deleteMany({
        where: {
          adminId,
          token: refreshToken,
        },
      });

      if (deletedToken.count === 0) {
        this.logger.warn('Logout: Refresh token not found', { adminId });
        // Don't throw error, logout should be idempotent
      }

      this.logger.info('Admin logout successful', { adminId });
    } catch (error) {
      this.logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get admin profile by ID
   */
  async getAdminProfile(adminId: string): Promise<AdminProfile> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        this.logger.warn('Get profile failed: Admin not found', { adminId });
        throw new AuthError('Admin not found');
      }

      return {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName || undefined,
        lastName: admin.lastName || undefined,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      };
    } catch (error) {
      this.logger.error('Get admin profile error:', error);
      throw error;
    }
  }

  /**
   * Create new admin (for setup/seeding)
   */
  async createAdmin(adminData: CreateAdminRequest): Promise<Admin> {
    try {
      this.logger.info('Creating new admin', { email: adminData.email });

      // Check if admin already exists
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { email: adminData.email },
      });

      if (existingAdmin) {
        this.logger.warn('Admin creation failed: Email already exists', { 
          email: adminData.email 
        });
        throw new BadRequestError('Admin with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(adminData.password);

      // Create admin
      const admin = await this.prisma.admin.create({
        data: {
          email: adminData.email,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          password: hashedPassword,
        },
      });

      this.logger.info('Admin created successfully', { 
        adminId: admin.id,
        email: admin.email 
      });

      return admin;
    } catch (error) {
      this.logger.error('Create admin error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.info('Expired tokens cleaned up', { count: result.count });
    } catch (error) {
      this.logger.error('Token cleanup error:', error);
      throw error;
    }
  }
}
