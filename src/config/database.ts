import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

/**
 * Prisma Client Instance
 * Singleton pattern for database connection management
 */
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with appropriate logging based on environment
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
} else {
  // In development, reuse the client to avoid hot reload issues
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
      ],
    });
  }
  prisma = global.__prisma;
}

// Set up event listeners for database logging
if (process.env.NODE_ENV === 'production') {
  (prisma as any).$on('error', (e: any) => {
    logger.error('Database error:', e);
  });

  (prisma as any).$on('warn', (e: any) => {
    logger.warn('Database warning:', e);
  });
} else {
  // Only log queries in development for debugging
  (prisma as any).$on('query', (e: any) => {
    logger.debug('Database query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  (prisma as any).$on('info', (e: any) => {
    logger.info('Database info:', e);
  });

  (prisma as any).$on('error', (e: any) => {
    logger.error('Database error:', e);
  });

  (prisma as any).$on('warn', (e: any) => {
    logger.warn('Database warning:', e);
  });
}

export { prisma };

/**
 * Connect to the database
 * Tests the connection and logs success/failure
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

/**
 * Disconnect from the database
 * Clean shutdown of database connection
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
    throw error;
  }
};
