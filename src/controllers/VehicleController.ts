import { Request, Response } from 'express';
import { 
  VehicleQuery, 
  CreateVehicleRequest, 
  UpdateVehicleRequest
} from '../types/vehicle';
import { 
  createVehicleSchema, 
  updateVehicleSchema, 
  vehicleQuerySchema,
  uploadImageSchema
} from '../validators/vehicleValidators';
import { 
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleQueryInput
} from '../validators/vehicleValidators';
import { VehicleService } from '../services/VehicleService';
import { ImageService } from '../services/ImageService';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { VehicleCategory, RentalServiceType } from '@prisma/client';

export class VehicleController {
  private vehicleService: VehicleService;
  private imageService: ImageService;

  constructor() {
    this.vehicleService = new VehicleService(prisma);
    this.imageService = new ImageService();
  }

  // Helper method for consistent error responses
  private sendError(res: Response, message: string, statusCode: number = 500, details?: any): Response {
    logger.error(`VehicleController Error: ${message}`, { statusCode, details });
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details })
    });
  }

  // Helper method for consistent success responses
  private sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  // Helper method for error handling
  private handleError(error: any, res: Response, operation: string): Response {
    if (error.name === 'ZodError') {
      return this.sendError(res, 'Validation failed', 400, error.errors);
    }
    
    logger.error(`Error in ${operation}:`, error);
    return this.sendError(res, `Failed to ${operation}`, 500);
  }

  // Get all vehicles with filtering, sorting, and pagination
  getAllVehicles = async (req: Request, res: Response): Promise<Response> => {
    try {
      const validatedQuery = vehicleQuerySchema.parse(req.query);
      const result = await this.vehicleService.getAllVehicles(validatedQuery);
      return this.sendSuccess(res, result, 'Vehicles retrieved successfully');
    } catch (error: any) {
      // Handle specific database/table errors gracefully
      if (error.code === 'P2021') {
        // Table doesn't exist, return empty result with helpful message
        const emptyResult = {
          vehicles: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        };
        return this.sendSuccess(res, emptyResult, 'No vehicles found - database not initialized. Please run migrations and seed data.');
      }
      
      return this.handleError(error, res, 'get vehicles');
    }
  };

  // Get vehicle by ID
  getVehicleById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(id);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'get vehicle');
    }
  };

  // Create a new vehicle
  createVehicle = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const validatedData = createVehicleSchema.parse(req.body);
      const vehicle = await this.vehicleService.createVehicle(validatedData);
      
      logger.info(`Vehicle created successfully: ${vehicle.id}`, {
        adminId: req.admin?.adminId,
        vehicleId: vehicle.id
      });
      
      return this.sendSuccess(res, vehicle, 'Vehicle created successfully', 201);
    } catch (error) {
      return this.handleError(error, res, 'createVehicle');
    }
  };

  // Update a vehicle
  updateVehicle = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const validatedData = updateVehicleSchema.parse(req.body);
      
      const vehicle = await this.vehicleService.updateVehicle(id, validatedData);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateVehicle');
    }
  };

  // Soft delete a vehicle
  deleteVehicle = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      const success = await this.vehicleService.deleteVehicle(id);
      
      if (!success) {
        return this.sendError(res, 'Failed to delete vehicle', 500);
      }
      
      return this.sendSuccess(res, null, 'Vehicle deleted successfully');
    } catch (error) {
      return this.handleError(error, res, 'deleteVehicle');
    }
  };

  // Hard delete a vehicle (permanently remove)
  hardDeleteVehicle = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      const success = await this.vehicleService.hardDeleteVehicle(id);
      
      if (!success) {
        return this.sendError(res, 'Failed to permanently delete vehicle', 500);
      }
      
      return this.sendSuccess(res, null, 'Vehicle permanently deleted');
    } catch (error) {
      return this.handleError(error, res, 'hardDeleteVehicle');
    }
  };

  // Update vehicle availability
  updateVehicleAvailability = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { availability } = req.body;
      
      if (typeof availability !== 'boolean') {
        return this.sendError(res, 'Availability must be a boolean value', 400);
      }
      
      const vehicle = await this.vehicleService.updateVehicleAvailability(id, availability);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle availability updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateVehicleAvailability');
    }
  };

  // Update vehicle featured status
  updateVehicleFeaturedStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      
      if (typeof featured !== 'boolean') {
        return this.sendError(res, 'Featured must be a boolean value', 400);
      }
      
      const vehicle = await this.vehicleService.updateVehicleFeaturedStatus(id, featured);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle featured status updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateVehicleFeaturedStatus');
    }
  };

  // Update vehicle rental services
  updateVehicleRentalServices = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { rentalServices } = req.body;
      
      if (!Array.isArray(rentalServices)) {
        return this.sendError(res, 'Rental services must be an array', 400);
      }
      
      const vehicle = await this.vehicleService.updateVehicleRentalServices(id, rentalServices);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle rental services updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateVehicleRentalServices');
    }
  };

  // Update vehicle rating
  updateVehicleRating = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { rating, reviewCount } = req.body;
      
      if (typeof rating !== 'number' || typeof reviewCount !== 'number') {
        return this.sendError(res, 'Rating and review count must be numbers', 400);
      }
      
      if (rating < 0 || rating > 5) {
        return this.sendError(res, 'Rating must be between 0 and 5', 400);
      }
      
      const vehicle = await this.vehicleService.updateVehicleRating(id, rating, reviewCount);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }
      
      return this.sendSuccess(res, vehicle, 'Vehicle rating updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateVehicleRating');
    }
  };

  // Get featured vehicles
  getFeaturedVehicles = async (req: Request, res: Response): Promise<Response> => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const vehicles = await this.vehicleService.getFeaturedVehicles(limit);
      return this.sendSuccess(res, vehicles, 'Featured vehicles retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getFeaturedVehicles');
    }
  };

  // Get vehicles by category
  getVehiclesByCategory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { category } = req.params;
      
      if (!Object.values(VehicleCategory).includes(category as VehicleCategory)) {
        return this.sendError(res, 'Invalid vehicle category', 400);
      }
      
      const vehicles = await this.vehicleService.getVehiclesByCategory(category as VehicleCategory);
      return this.sendSuccess(res, vehicles, `Vehicles in ${category} category retrieved successfully`);
    } catch (error) {
      return this.handleError(error, res, 'getVehiclesByCategory');
    }
  };

  // Get vehicles by rental service
  getVehiclesByRentalService = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { serviceType } = req.params;
      
      if (!Object.values(RentalServiceType).includes(serviceType as RentalServiceType)) {
        return this.sendError(res, 'Invalid rental service type', 400);
      }
      
      const vehicles = await this.vehicleService.getVehiclesByRentalService(serviceType as RentalServiceType);
      return this.sendSuccess(res, vehicles, `Vehicles with ${serviceType} service retrieved successfully`);
    } catch (error) {
      return this.handleError(error, res, 'getVehiclesByRentalService');
    }
  };

  // Check vehicle availability for booking
  checkVehicleAvailability = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return this.sendError(res, 'Start date and end date are required', 400);
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return this.sendError(res, 'Invalid date format', 400);
      }
      
      if (start >= end) {
        return this.sendError(res, 'Start date must be before end date', 400);
      }
      
      const availability = await this.vehicleService.checkVehicleAvailability(id, start, end);
      return this.sendSuccess(res, availability, 'Vehicle availability checked successfully');
    } catch (error) {
      return this.handleError(error, res, 'checkVehicleAvailability');
    }
  };

  // Search vehicles
  searchVehicles = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { query, limit } = req.query;
      const searchTerm = query as string;
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        return this.sendError(res, 'Search query is required', 400);
      }
      
      const searchLimit = parseInt(limit as string) || 10;
      const vehicles = await this.vehicleService.searchVehicles(searchTerm, searchLimit);
      return this.sendSuccess(res, vehicles, 'Vehicle search completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'searchVehicles');
    }
  };

  // Get vehicle recommendations
  getVehicleRecommendations = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const recommendations = await this.vehicleService.getVehicleRecommendations(id, limit);
      return this.sendSuccess(res, recommendations, 'Vehicle recommendations retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getVehicleRecommendations');
    }
  };

  // Get vehicle statistics
  getVehicleStats = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const stats = await this.vehicleService.getVehicleStats();
      return this.sendSuccess(res, stats, 'Vehicle statistics retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getVehicleStats');
    }
  };

  // Get vehicle statistics comparison
  getVehicleStatsComparison = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      
      if (period <= 0 || period > 365) {
        return this.sendError(res, 'Period must be between 1 and 365 days', 400);
      }

      const comparison = await this.vehicleService.getVehicleStatsComparison(period);
      return this.sendSuccess(res, comparison, 'Vehicle statistics comparison retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getVehicleStatsComparison');
    }
  };

  // Bulk update vehicle availability
  bulkUpdateVehicleAvailability = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { vehicleIds, availability } = req.body;
      
      if (!Array.isArray(vehicleIds) || typeof availability !== 'boolean') {
        return this.sendError(res, 'Invalid request data', 400);
      }
      
      const result = await this.vehicleService.bulkUpdateVehicleAvailability(vehicleIds, availability);
      return this.sendSuccess(res, result, 'Bulk availability update completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'bulkUpdateVehicleAvailability');
    }
  };

  // Bulk update vehicle featured status
  bulkUpdateVehicleFeaturedStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { vehicleIds, featured } = req.body;
      
      if (!Array.isArray(vehicleIds) || typeof featured !== 'boolean') {
        return this.sendError(res, 'Invalid request data', 400);
      }
      
      const result = await this.vehicleService.bulkUpdateVehicleFeaturedStatus(vehicleIds, featured);
      return this.sendSuccess(res, result, 'Bulk featured status update completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'bulkUpdateVehicleFeaturedStatus');
    }
  };

  // Upload vehicle images
  uploadVehicleImages = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return this.sendError(res, 'No images provided', 400);
      }

      // Validate vehicle exists
      const vehicle = await this.vehicleService.getVehicleById(id);
      if (!vehicle) {
        return this.sendError(res, 'Vehicle not found', 404);
      }

      // Validate image files
      const validationResult = uploadImageSchema.safeParse({ files });
      if (!validationResult.success) {
        return this.sendError(res, 'Invalid image files', 400, validationResult.error.errors);
      }

      const uploadResults = await this.vehicleService.uploadVehicleImages(id, files);
      
      logger.info(`Uploaded ${files.length} images for vehicle ${id}`, {
        adminId: req.admin?.adminId,
        vehicleId: id,
        imageCount: files.length
      });

      return this.sendSuccess(res, uploadResults, 'Images uploaded successfully', 201);
    } catch (error) {
      return this.handleError(error, res, 'uploadVehicleImages');
    }
  };

  // Delete vehicle image
  deleteVehicleImage = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id, imageId } = req.params;
      
      const success = await this.vehicleService.deleteVehicleImage(imageId);
      
      if (!success) {
        return this.sendError(res, 'Failed to delete image', 500);
      }
      
      logger.info(`Deleted image ${imageId} for vehicle ${id}`, {
        adminId: req.admin?.adminId,
        vehicleId: id,
        imageId
      });

      return this.sendSuccess(res, null, 'Image deleted successfully');
    } catch (error) {
      return this.handleError(error, res, 'deleteVehicleImage');
    }
  };

  // Set primary vehicle image
  setPrimaryVehicleImage = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id, imageId } = req.params;
      
      const vehicle = await this.vehicleService.setPrimaryVehicleImage(id, imageId);
      
      if (!vehicle) {
        return this.sendError(res, 'Vehicle or image not found', 404);
      }
      
      logger.info(`Set image ${imageId} as primary for vehicle ${id}`, {
        adminId: req.admin?.adminId,
        vehicleId: id,
        imageId
      });

      return this.sendSuccess(res, vehicle, 'Primary image updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'setPrimaryVehicleImage');
    }
  };
}

export default VehicleController;
