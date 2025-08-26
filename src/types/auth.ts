/**
 * Authentication Types
 * Types related to admin authentication and JWT tokens
 */

// Login request payload (matches frontend LoginForm)
export interface LoginRequest {
  email: string;
  password: string;
}

// Admin profile data (returned after login)
export interface AdminProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
}

// Authentication response (login/refresh success)
export interface AuthResponse {
  admin: AdminProfile;
  accessToken: string;
  refreshToken: string;
}

// JWT payload structure
export interface JwtPayload {
  adminId: string;
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

// Refresh token request payload
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Token pair response (after refresh)
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Admin creation request (for seeding/setup)
export interface CreateAdminRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}
