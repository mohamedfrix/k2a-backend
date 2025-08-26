import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { config } from '@/config';
import { createRoutes } from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimiter';

/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */
export function createApp(prisma: PrismaClient, logger: Logger): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration with debugging
  app.use(cors({
    origin: function (origin, callback) {
      console.log(`CORS: Request from origin: ${origin}`);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      // In development, allow localhost on any port
      if (config.server.nodeEnv === 'development') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          console.log('CORS: Allowing localhost origin in development');
          return callback(null, true);
        }
      }
      
      // Allow configured frontend URL
      if (origin === config.cors.frontendUrl) {
        console.log('CORS: Allowing configured frontend URL');
        return callback(null, true);
      }
      
      // Reject other origins
      console.log(`CORS: Rejecting origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-HTTP-Method-Override'
    ],
    exposedHeaders: ['X-Total-Count'],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false,
  }));

  // Explicit OPTIONS handler for preflight requests
  app.options('*', (req, res) => {
    console.log(`OPTIONS request for: ${req.path} from origin: ${req.get('Origin')}`);
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,X-HTTP-Method-Override');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(200);
  });

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    // Custom error handling for malformed JSON
    strict: true,
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Request logging middleware
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
    // Skip logging for health checks to reduce noise
    skip: (req) => req.url === '/health' || req.url === '/api/v1/health',
  }));

  // Rate limiting middleware
  app.use(generalLimiter);

  // Trust proxy for accurate IP addresses in production
  if (config.server.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  // Global health check endpoint (before API versioning)
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
    });
  });

  // API routes with versioning
  app.use(`/api/${config.server.apiVersion}`, createRoutes(prisma, logger));

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
