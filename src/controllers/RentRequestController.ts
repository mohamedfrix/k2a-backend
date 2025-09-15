import { Request, Response } from 'express';
import { rentRequestService } from '@/services/RentRequestService';
import {
  validateCreateRentRequest,
  validateUpdateRentRequest,
  validateRentRequestFilters,
} from '@/validators/rentRequestValidators';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

/**
 * Controller for Rent Request operations
 * Handles HTTP requests and responses for the rent request endpoints
 */
export class RentRequestController {

  /**
   * POST /api/rent-requests
   * Create a new rent request (Public endpoint with rate limiting)
   */
  async createRentRequest(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Rent request creation attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Validate request data
      const validatedData = validateCreateRentRequest(req.body);

      // Convert date strings to Date objects
      const rentRequestData = {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      };

      // Create rent request
      const rentRequest = await rentRequestService.createRentRequest(rentRequestData);

      logger.info('Rent request created successfully', {
        requestId: rentRequest.requestId,
        clientEmail: rentRequest.clientEmail,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Demande de location créée avec succès',
        data: {
          requestId: rentRequest.requestId,
          id: rentRequest.id,
          status: rentRequest.status,
          vehicleMake: rentRequest.vehicleMake,
          vehicleModel: rentRequest.vehicleModel,
          startDate: rentRequest.startDate,
          endDate: rentRequest.endDate,
          createdAt: rentRequest.createdAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error creating rent request', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
        ip: req.ip,
      });

      const statusCode = error instanceof Error && error.message.includes('validation') ? 400 : 500;
      const message = error instanceof Error ? error.message : 'Erreur interne du serveur';

      res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/rent-requests
   * Get all rent requests with filters and pagination (Admin only)
   */
  async getRentRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.debug('Fetching rent requests', {
        adminId: req.admin?.adminId,
        query: req.query,
      });

      // Validate and parse query parameters
      const filters = validateRentRequestFilters(req.query);

      // Convert date strings to Date objects if present
      if (filters.startDate) {
        filters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        filters.endDate = new Date(filters.endDate);
      }

      // Get rent requests
      const result = await rentRequestService.getRentRequests(filters);

      res.json({
        success: true,
        data: result,
        message: 'Demandes de location récupérées avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching rent requests', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.admin?.adminId,
        query: req.query,
      });

      const statusCode = error instanceof Error && error.message.includes('validation') ? 400 : 500;
      const message = error instanceof Error ? error.message : 'Erreur interne du serveur';

      res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/rent-requests/:id
   * Get a specific rent request by ID (Admin only)
   */
  async getRentRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.debug('Fetching rent request by ID', {
        id,
        adminId: req.admin?.adminId,
      });

      const rentRequest = await rentRequestService.getRentRequestById(id);

      res.json({
        success: true,
        data: rentRequest,
        message: 'Demande de location récupérée avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching rent request by ID', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.admin?.adminId,
      });

      const statusCode = error instanceof Error && error.message.includes('non trouvée') ? 404 : 500;
      const message = error instanceof Error ? error.message : 'Erreur interne du serveur';

      res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/rent-requests/:id
   * Update a rent request (Admin only)
   */
  async updateRentRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.admin?.adminId;

      logger.info('Updating rent request', {
        id,
        adminId,
        updates: req.body,
      });

      // Validate update data
      const validatedData = validateUpdateRentRequest(req.body);

      // Update rent request
      const updatedRequest = await rentRequestService.updateRentRequest(id, validatedData, adminId);

      logger.info('Rent request updated successfully', {
        requestId: updatedRequest.requestId,
        adminId,
        status: updatedRequest.status,
      });

      res.json({
        success: true,
        data: updatedRequest,
        message: 'Demande de location mise à jour avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error updating rent request', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.admin?.adminId,
        updates: req.body,
      });

      const statusCode = (() => {
        if (error instanceof Error) {
          if (error.message.includes('non trouvée')) return 404;
          if (error.message.includes('validation') || error.message.includes('Transition')) return 400;
        }
        return 500;
      })();

      const message = error instanceof Error ? error.message : 'Erreur interne du serveur';

      res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/rent-requests/:id
   * Delete a rent request (Admin only)
   */
  async deleteRentRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.admin?.adminId;

      logger.info('Deleting rent request', {
        id,
        adminId,
      });

      await rentRequestService.deleteRentRequest(id);

      logger.info('Rent request deleted successfully', {
        id,
        adminId,
      });

      res.json({
        success: true,
        message: 'Demande de location supprimée avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error deleting rent request', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.admin?.adminId,
      });

      const statusCode = (() => {
        if (error instanceof Error) {
          if (error.message.includes('non trouvée')) return 404;
          if (error.message.includes('peuvent être supprimées')) return 403;
        }
        return 500;
      })();

      const message = error instanceof Error ? error.message : 'Erreur interne du serveur';

      res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/rent-requests/statistics
   * Get rent request statistics for dashboard (Admin only)
   */
  async getRentRequestStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.debug('Fetching rent request statistics', {
        adminId: req.admin?.adminId,
      });

      const statistics = await rentRequestService.getRentRequestStatistics();

      res.json({
        success: true,
        data: statistics,
        message: 'Statistiques récupérées avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching rent request statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.admin?.adminId,
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/rent-requests/check-availability
   * Check vehicle availability for given dates (Public endpoint)
   */
  async checkVehicleAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, startDate, endDate } = req.query;

      // Basic validation
      if (!vehicleId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'vehicleId, startDate et endDate sont requis',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.debug('Checking vehicle availability', {
        vehicleId,
        startDate,
        endDate,
        ip: req.ip,
      });

      const availability = await rentRequestService.checkVehicleAvailability(
        vehicleId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: availability,
        message: 'Disponibilité vérifiée avec succès',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error checking vehicle availability', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la disponibilité',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const rentRequestController = new RentRequestController();
