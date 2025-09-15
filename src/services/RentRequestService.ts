import { rentRequestRepository } from '@/repositories/RentRequestRepository';
import { emailService, RentRequestEmailData } from '@/services/EmailService';
import { logger } from '@/utils/logger';
import {
  CreateRentRequestData,
  UpdateRentRequestData,
  RentRequestFilters,
  RentRequestWithVehicle,
  RentRequestStatistics,
  VALID_STATUS_TRANSITIONS,
} from '@/types/rentRequest';

import { RentRequestStatus } from '@/types/rentRequest';

/**
 * Service layer for Rent Request operations
 * Handles business logic, validation, and orchestration
 */
export class RentRequestService {

  /**
   * Create a new rent request
   * Handles the complete workflow: validation, creation, email notifications
   */
  async createRentRequest(data: CreateRentRequestData): Promise<RentRequestWithVehicle> {
    try {
      // Validate dates
      if (data.startDate >= data.endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }

      const now = new Date();
      const diffHours = (data.startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        throw new Error('La réservation doit être effectuée au moins 24 heures à l\'avance');
      }

      const diffDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 90) {
        throw new Error('La durée de location ne peut pas dépasser 90 jours');
      }

      logger.info('Creating rent request', {
        clientEmail: data.clientEmail,
        vehicleId: data.vehicleId,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: diffDays,
      });

      // Create the rent request
      const rentRequest = await rentRequestRepository.createRentRequest(data);

      // Prepare email data
      const emailData: RentRequestEmailData = {
        requestId: rentRequest.requestId,
        clientName: rentRequest.clientName,
        clientEmail: rentRequest.clientEmail,
        clientPhone: rentRequest.clientPhone,
        vehicleMake: rentRequest.vehicleMake,
        vehicleModel: rentRequest.vehicleModel,
        vehicleYear: rentRequest.vehicleYear,
        startDate: this.formatDate(rentRequest.startDate),
        endDate: this.formatDate(rentRequest.endDate),
        pricePerDay: Number(rentRequest.pricePerDay),
        currency: rentRequest.currency,
        message: rentRequest.message || undefined,
      };

      // Send emails asynchronously (don't block the response)
      this.sendNewRequestNotifications(emailData).catch(error => {
        logger.error('Failed to send email notifications for new request', {
          requestId: rentRequest.requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      logger.info('Rent request created successfully', {
        requestId: rentRequest.requestId,
        clientEmail: data.clientEmail,
      });

      return rentRequest;
    } catch (error) {
      logger.error('Error in createRentRequest service:', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        clientEmail: data.clientEmail,
        vehicleId: data.vehicleId 
      });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create rent request');
    }
  }

  /**
   * Get rent request by ID
   */
  async getRentRequestById(id: string): Promise<RentRequestWithVehicle> {
    try {
      const rentRequest = await rentRequestRepository.getRentRequestById(id);
      
      if (!rentRequest) {
        throw new Error('Demande de location non trouvée');
      }

      return rentRequest;
    } catch (error) {
      logger.error('Error in getRentRequestById service:', { id, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch rent request');
    }
  }

  /**
   * Get rent requests with filters and pagination
   */
  async getRentRequests(filters: RentRequestFilters): Promise<{
    requests: RentRequestWithVehicle[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    try {
      logger.debug('Fetching rent requests with filters', { filters });

      const { limit = 20, offset = 0 } = filters;
      const page = Math.floor(offset / limit) + 1;

      const { requests, total } = await rentRequestRepository.getRentRequests(filters);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return {
        requests,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrevious,
        },
      };
    } catch (error) {
      logger.error('Error in getRentRequests service:', { filters, error });
      throw new Error('Failed to fetch rent requests');
    }
  }

  /**
   * Update rent request status and send notifications
   */
  async updateRentRequest(
    id: string,
    data: UpdateRentRequestData,
    adminId?: string
  ): Promise<RentRequestWithVehicle> {
    try {
      logger.info('Updating rent request', { id, data, adminId });

      // Get current request to check status transition
      const currentRequest = await rentRequestRepository.getRentRequestById(id);
      if (!currentRequest) {
        throw new Error('Demande de location non trouvée');
      }

      // Validate status transition if status is being updated
      if (data.status && data.status !== currentRequest.status) {
        this.validateStatusTransition(currentRequest.status, data.status);
      }

      // Update the request
      const updatedRequest = await rentRequestRepository.updateRentRequest(id, data, adminId);

      // Send status update email if status changed
      if (data.status && data.status !== currentRequest.status) {
        const emailData: RentRequestEmailData = {
          requestId: updatedRequest.requestId,
          clientName: updatedRequest.clientName,
          clientEmail: updatedRequest.clientEmail,
          clientPhone: updatedRequest.clientPhone,
          vehicleMake: updatedRequest.vehicleMake,
          vehicleModel: updatedRequest.vehicleModel,
          vehicleYear: updatedRequest.vehicleYear,
          startDate: this.formatDate(updatedRequest.startDate),
          endDate: this.formatDate(updatedRequest.endDate),
          pricePerDay: Number(updatedRequest.pricePerDay),
          currency: updatedRequest.currency,
          message: updatedRequest.message || undefined,
          adminNotes: updatedRequest.adminNotes || undefined,
          status: data.status,
        };

        // Send email notification asynchronously
        this.sendStatusUpdateNotification(emailData).catch(error => {
          logger.error('Failed to send status update email', {
            requestId: updatedRequest.requestId,
            newStatus: data.status,
            error,
          });
        });
      }

      logger.info('Rent request updated successfully', {
        requestId: updatedRequest.requestId,
        oldStatus: currentRequest.status,
        newStatus: data.status,
      });

      return updatedRequest;
    } catch (error) {
      logger.error('Error in updateRentRequest service:', { id, data, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update rent request');
    }
  }

  /**
   * Delete rent request
   */
  async deleteRentRequest(id: string): Promise<void> {
    try {
      logger.info('Deleting rent request', { id });

      await rentRequestRepository.deleteRentRequest(id);

      logger.info('Rent request deleted successfully', { id });
    } catch (error) {
      logger.error('Error in deleteRentRequest service:', { id, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete rent request');
    }
  }

  /**
   * Get rent request statistics for dashboard
   */
  async getRentRequestStatistics(): Promise<RentRequestStatistics> {
    try {
      logger.debug('Fetching rent request statistics');

      const statistics = await rentRequestRepository.getRentRequestStatistics();

      return statistics;
    } catch (error) {
      logger.error('Error in getRentRequestStatistics service:', { error });
      throw new Error('Failed to fetch rent request statistics');
    }
  }

  /**
   * Check vehicle availability for given dates
   */
  async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ isAvailable: boolean; conflictingRequests?: any[] }> {
    try {
      const availability = await rentRequestRepository.checkVehicleAvailability(
        vehicleId,
        startDate,
        endDate
      );

      return availability;
    } catch (error) {
      logger.error('Error checking vehicle availability:', { vehicleId, startDate, endDate, error });
      throw new Error('Failed to check vehicle availability');
    }
  }

  /**
   * Auto-expire pending requests older than 7 days
   */
  async expirePendingRequests(): Promise<number> {
    try {
      logger.info('Starting auto-expiry of pending requests');

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const expiredCount = await rentRequestRepository.expirePendingRequests(sevenDaysAgo);
      
      logger.info('Auto-expiry completed', { expiredCount });
      
      return expiredCount;
    } catch (error) {
      logger.error('Error in expirePendingRequests:', { error });
      throw new Error('Failed to expire pending requests');
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: RentRequestStatus, newStatus: RentRequestStatus): void {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Transition de statut invalide: de ${currentStatus} vers ${newStatus}`
      );
    }
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Send notifications for new request
   */
  private async sendNewRequestNotifications(emailData: RentRequestEmailData): Promise<void> {
    try {
      // Send confirmation to client
      await emailService.sendClientConfirmation(emailData);
      
      // Send notification to admins
      await emailService.sendAdminNotification(emailData);

      logger.info('Email notifications sent successfully', {
        requestId: emailData.requestId,
      });
    } catch (error) {
      logger.error('Failed to send email notifications:', {
        requestId: emailData.requestId,
        error,
      });
      // Don't throw error - email failures shouldn't block request creation
    }
  }

  /**
   * Send status update notification
   */
  private async sendStatusUpdateNotification(emailData: RentRequestEmailData): Promise<void> {
    try {
      // Only send status updates for final statuses
      if (['approved', 'rejected', 'contacted'].includes(emailData.status?.toLowerCase() || '')) {
        await emailService.sendStatusUpdate(emailData);

        logger.info('Status update email sent successfully', {
          requestId: emailData.requestId,
          status: emailData.status,
        });
      }
    } catch (error) {
      logger.error('Failed to send status update email:', {
        requestId: emailData.requestId,
        status: emailData.status,
        error,
      });
      // Don't throw error - email failures shouldn't block status updates
    }
  }
}

// Singleton instance
export const rentRequestService = new RentRequestService();
