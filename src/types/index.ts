// Re-export all types for easy importing
export * from './api';
export * from './auth';

// Base query parameters
export interface BaseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
