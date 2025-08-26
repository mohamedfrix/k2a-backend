import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 * Centralized configuration management with validation
 */
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT configuration with configurable expiry times
  jwt: {
    secret: process.env.JWT_SECRET as string,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN as string || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN as string || '7d',
  },

  // CORS configuration
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5'),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // MinIO Object Storage configuration
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucketName: process.env.MINIO_BUCKET_NAME || 'vehicle-images',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    baseUrl: process.env.MINIO_BASE_URL || 'http://localhost:9000',
  },
} as const;

/**
 * Validates required environment variables
 * Throws error if any required variables are missing
 */
export const validateConfig = (): void => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT secrets are sufficiently long for security
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long for security');
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = config.server.nodeEnv === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = config.server.nodeEnv === 'production';

/**
 * Check if running in test mode
 */
export const isTest = config.server.nodeEnv === 'test';
