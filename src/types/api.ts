/**
 * API Response Types
 * Standard response format for all API endpoints
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error response structure
export interface ErrorResponse extends ApiResponse {
  success: false;
  statusCode?: number;
  stack?: string; // Only included in development
}

// Success response structure
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
}

/**
 * Custom Application Error
 * Extended Error class for consistent error handling
 */
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
