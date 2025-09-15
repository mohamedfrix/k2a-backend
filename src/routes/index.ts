import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { createAuthRoutes } from './authRoutes';
import { createTestRoutes } from './testRoutes';
import vehicleRoutes from './vehicleRoutes';
import clientRoutes from './clientRoutes';
import contractRoutes from './contractRoutes';
import reviewRoutes from './reviewRoutes';
import rentRequestRoutes from './rentRequestRoutes';

/**
 * Main Routes Configuration
 * Aggregates all route modules
 */
export function createRoutes(prisma: PrismaClient, logger: Logger): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    logger.debug('Health check accessed', { ip: req.ip });
    
    res.json({
      success: true,
      message: 'API is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.API_VERSION || 'v1',
      },
    });
  });

  // API status endpoint
  router.get('/status', (req, res) => {
    logger.debug('Status endpoint accessed', { ip: req.ip });
    
    res.json({
      success: true,
      message: 'K2A Backend API is running',
      data: {
        service: 'k2a-backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())} seconds`,
        memory: process.memoryUsage(),
        pid: process.pid,
      },
    });
  });

  // Mount feature routes
  router.use('/auth', createAuthRoutes(prisma, logger));
  router.use('/test', createTestRoutes(prisma, logger));
  router.use('/vehicles', vehicleRoutes);
  router.use('/clients', clientRoutes);
  router.use('/contracts', contractRoutes);
  router.use('/reviews', reviewRoutes);
  router.use('/rent-requests', rentRequestRoutes);

  return router;
}
