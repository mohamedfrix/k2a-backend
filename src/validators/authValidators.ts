import { z } from 'zod';

/**
 * Authentication Validation Schemas
 * Zod schemas for validating auth-related requests
 */

/**
 * Login request validation
 * Matches the frontend LoginForm interface
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must not exceed 255 characters'),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password must not exceed 255 characters'),
});

/**
 * Refresh token request validation
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

/**
 * Admin creation validation (for setup/seeding)
 */
export const createAdminSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must not exceed 255 characters'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .optional(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must not exceed 255 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must not exceed 255 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
