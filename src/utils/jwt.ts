import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { JwtPayload } from '@/types/auth';

/**
 * JWT Utility Functions
 * Handles creation and verification of access and refresh tokens
 */

/**
 * Generate both access and refresh tokens for an admin
 */
export const generateTokens = async (admin: { id: string; email: string }): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload: JwtPayload = {
    adminId: admin.id,
    email: admin.email,
  };

  // @ts-ignore - JWT typing issue with expiresIn
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiresIn }
  ) as string;

  // @ts-ignore - JWT typing issue with expiresIn
  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTokenExpiresIn }
  ) as string;

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Generate access token only (for refresh endpoint)
 */
export const generateAccessToken = async (admin: { id: string; email: string }): Promise<string> => {
  const payload: JwtPayload = {
    adminId: admin.id,
    email: admin.email,
  };

  // @ts-ignore - JWT typing issue with expiresIn
  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiresIn }
  ) as string;
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};
