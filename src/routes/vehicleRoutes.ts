import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { validateRequest } from '../middleware/validation';
import { authenticateAdmin } from '../middleware/auth';
import { 
  createVehicleSchema, 
  updateVehicleSchema, 
  vehicleQuerySchema,
  vehicleRentalServiceSchema 
} from '../validators/vehicleValidators';
import { uploadMultipleImages, handleMulterError } from '../middleware/upload';

const router = Router();
const vehicleController = new VehicleController();

// Public routes

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get all vehicles with filters and pagination
 * @access  Public
 */
router.get(
  '/',
  vehicleController.getAllVehicles
);

/**
 * @route   GET /api/v1/vehicles/search
 * @desc    Search vehicles by term
 * @access  Public
 */
router.get(
  '/search',
  vehicleController.searchVehicles
);

/**
 * @route   GET /api/v1/vehicles/featured
 * @desc    Get featured vehicles
 * @access  Public
 */
router.get(
  '/featured',
  vehicleController.getFeaturedVehicles
);

/**
 * @route   GET /api/v1/vehicles/category/:category
 * @desc    Get vehicles by category
 * @access  Public
 */
router.get(
  '/category/:category',
  vehicleController.getVehiclesByCategory
);

/**
 * @route   GET /api/v1/vehicles/rental-service/:serviceType
 * @desc    Get vehicles by rental service type
 * @access  Public
 */
router.get(
  '/rental-service/:serviceType',
  vehicleController.getVehiclesByRentalService
);

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Public
 */
router.get(
  '/:id',
  vehicleController.getVehicleById
);

/**
 * @route   GET /api/v1/vehicles/:id/availability
 * @desc    Check vehicle availability for date range
 * @access  Public
 */
router.get(
  '/:id/availability',
  vehicleController.checkVehicleAvailability
);

/**
 * @route   GET /api/v1/vehicles/:id/recommendations
 * @desc    Get vehicle recommendations based on similar vehicles
 * @access  Public
 */
router.get(
  '/:id/recommendations',
  vehicleController.getVehicleRecommendations
);

// Admin routes

/**
 * @route   GET /api/v1/vehicles/admin/stats
 * @desc    Get vehicle statistics
 * @access  Private (Admin only)
 */
router.get(
  '/admin/stats',
  authenticateAdmin,
  vehicleController.getVehicleStats
);

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create new vehicle
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateAdmin,
  validateRequest(createVehicleSchema),
  vehicleController.createVehicle
);

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update vehicle
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticateAdmin,
  validateRequest(updateVehicleSchema),
  vehicleController.updateVehicle
);

/**
 * @route   PATCH /api/v1/vehicles/bulk/availability
 * @desc    Bulk update vehicle availability
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk/availability',
  authenticateAdmin,
  vehicleController.bulkUpdateVehicleAvailability
);

/**
 * @route   PATCH /api/v1/vehicles/bulk/featured
 * @desc    Bulk update vehicle featured status
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk/featured',
  authenticateAdmin,
  vehicleController.bulkUpdateVehicleFeaturedStatus
);

/**
 * @route   PATCH /api/v1/vehicles/:id/availability
 * @desc    Update vehicle availability
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/availability',
  authenticateAdmin,
  vehicleController.updateVehicleAvailability
);

/**
 * @route   PATCH /api/v1/vehicles/:id/featured
 * @desc    Update vehicle featured status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/featured',
  authenticateAdmin,
  vehicleController.updateVehicleFeaturedStatus
);

/**
 * @route   PATCH /api/v1/vehicles/:id/rental-services
 * @desc    Update vehicle rental services
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/rental-services',
  authenticateAdmin,
  validateRequest(vehicleRentalServiceSchema),
  vehicleController.updateVehicleRentalServices
);

/**
 * @route   PATCH /api/v1/vehicles/:id/rating
 * @desc    Update vehicle rating and review count
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/rating',
  authenticateAdmin,
  vehicleController.updateVehicleRating
);

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Soft delete vehicle (mark as inactive)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticateAdmin,
  vehicleController.deleteVehicle
);

/**
 * @route   DELETE /api/v1/vehicles/:id/hard
 * @desc    Permanently delete vehicle and all related data
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/hard',
  authenticateAdmin,
  vehicleController.hardDeleteVehicle
);

// Image management routes

/**
 * @route   POST /api/v1/vehicles/:id/images
 * @desc    Upload images for a vehicle
 * @access  Private (Admin only)
 */
router.post(
  '/:id/images',
  authenticateAdmin,
  uploadMultipleImages,
  handleMulterError,
  vehicleController.uploadVehicleImages
);

/**
 * @route   DELETE /api/v1/vehicles/:id/images/:imageId
 * @desc    Delete a specific vehicle image
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/images/:imageId',
  authenticateAdmin,
  vehicleController.deleteVehicleImage
);

/**
 * @route   PUT /api/v1/vehicles/:id/images/:imageId/primary
 * @desc    Set a vehicle image as primary
 * @access  Private (Admin only)
 */
router.put(
  '/:id/images/:imageId/primary',
  authenticateAdmin,
  vehicleController.setPrimaryVehicleImage
);

export default router;
