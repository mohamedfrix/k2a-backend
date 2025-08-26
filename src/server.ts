import { createApp } from './app';
import { prisma, connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';
import { config, validateConfig } from '@/config';
import { seedAdmin } from '../scripts/seed-admin';

/**
 * Server Entry Point
 * Initializes and starts the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Validate environment configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');

    // Ensure initial admin exists
    try {
      await seedAdmin();
      logger.info('Initial admin verification completed');
    } catch (error) {
      logger.error('Failed to verify/create initial admin:', error);
      // Don't exit - this is not critical for server startup
    }

    // Create Express application
    const app = createApp(prisma, logger);

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port} in ${config.server.nodeEnv} mode`);
      logger.info(`📚 API Documentation: http://localhost:${config.server.port}/api/${config.server.apiVersion}`);
      logger.info(`🏥 Health Check: http://localhost:${config.server.port}/health`);
      
      if (config.server.nodeEnv === 'development') {
        logger.info('🔧 Development mode active');
        logger.info(`🎯 Frontend URL: ${config.cors.frontendUrl}`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`📥 Received ${signal}. Starting graceful shutdown...`);
      
      // Set a timeout for graceful shutdown
      const shutdownTimeout = setTimeout(() => {
        logger.error('❌ Graceful shutdown timeout. Forcing exit...');
        process.exit(1);
      }, 10000); // 10 second timeout

      try {
        // Close HTTP server
        server.close(async () => {
          logger.info('🔴 HTTP server closed');
          
          try {
            // Disconnect from database
            await disconnectDatabase();
            logger.info('🔌 Database disconnected');
            
            clearTimeout(shutdownTimeout);
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during database disconnection:', error);
            clearTimeout(shutdownTimeout);
            process.exit(1);
          }
        });
      } catch (error) {
        logger.error('❌ Error during server shutdown:', error);
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      logger.error('Stack trace:', error.stack);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('🔥 Unhandled Rejection at:', promise);
      logger.error('Reason:', reason);
      process.exit(1);
    });

    // Handle process warnings
    process.on('warning', (warning) => {
      logger.warn('⚠️ Process warning:', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    logger.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { startServer };
