import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { rentRequestController } from '@/controllers/RentRequestController';
import { authenticateAdmin } from '@/middleware/auth';
import { logger } from '@/utils/logger';

/**
 * Rent Request Routes
 * Defines all API endpoints for rent request operations
 */

const router = Router();

/**
 * Rate limiting middleware for public endpoints
 * Limits requests per IP to prevent abuse
 */
const createRentRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
  max: 20, // 20 requests per 15 minutes per IP (increased from 5/hour)
  message: {
    success: false,
    message: 'Trop de demandes de location. Veuillez réessayer dans 15 minutes.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin requests
    const authHeader = req.headers.authorization;
    return !!authHeader && authHeader.startsWith('Bearer ');
  },
  handler: (req, res) => {
    logger.warn('Rate limit reached for rent request creation', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(429).json({
      success: false,
      message: 'Trop de demandes de location. Veuillez réessayer dans une heure.',
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiting for availability check endpoint
 */
const availabilityCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes per IP
  message: {
    success: false,
    message: 'Trop de vérifications de disponibilité. Veuillez réessayer plus tard.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for admin endpoints
 */
const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per admin
  message: {
    success: false,
    message: 'Trop de requêtes administrateur. Veuillez patienter.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use admin ID as key for admin rate limiting
    return req.admin?.adminId || req.ip;
  },
});

/**
 * PUBLIC ENDPOINTS
 */

/**
 * POST /api/rent-requests
 * Create a new rent request
 * Rate limited: 5 requests per hour per IP
 */
router.post(
  '/',
  createRentRequestLimiter,
  rentRequestController.createRentRequest.bind(rentRequestController)
);

/**
 * GET /api/rent-requests/check-availability
 * Check vehicle availability for given dates
 * Rate limited: 30 requests per 15 minutes per IP
 */
router.get(
  '/check-availability',
  availabilityCheckLimiter,
  rentRequestController.checkVehicleAvailability.bind(rentRequestController)
);

/**
 * ADMIN ENDPOINTS (Protected with authentication and rate limiting)
 */

/**
 * GET /api/rent-requests/statistics
 * Get rent request statistics for dashboard
 */
router.get(
  '/statistics',
  authenticateAdmin,
  adminRateLimiter,
  rentRequestController.getRentRequestStatistics.bind(rentRequestController)
);

/**
 * GET /api/rent-requests
 * Get all rent requests with filters and pagination
 */
router.get(
  '/',
  authenticateAdmin,
  adminRateLimiter,
  rentRequestController.getRentRequests.bind(rentRequestController)
);

/**
 * GET /api/rent-requests/:id
 * Get a specific rent request by ID
 */
router.get(
  '/:id',
  authenticateAdmin,
  adminRateLimiter,
  rentRequestController.getRentRequestById.bind(rentRequestController)
);

/**
 * PATCH /api/rent-requests/:id
 * Update a rent request (status, notes, etc.)
 */
router.patch(
  '/:id',
  authenticateAdmin,
  adminRateLimiter,
  rentRequestController.updateRentRequest.bind(rentRequestController)
);

/**
 * DELETE /api/rent-requests/:id
 * Delete a rent request (only pending/rejected)
 */
router.delete(
  '/:id',
  authenticateAdmin,
  adminRateLimiter,
  rentRequestController.deleteRentRequest.bind(rentRequestController)
);

/**
 * Error handling middleware for rent request routes
 */
router.use((error: Error, req: any, res: any, next: any) => {
  logger.error('Rent request route error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    adminId: req.admin?.adminId,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    timestamp: new Date().toISOString(),
  });
});

export default router;
