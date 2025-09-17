import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import {
  CreateRentRequestData,
  UpdateRentRequestData,
  RentRequestFilters,
  RentRequestWithVehicle,
  VehicleAvailability,
  RentRequestStatistics,
  RENT_REQUEST_CONSTANTS
} from '@/types/rentRequest';
import { RentRequestStatus } from '@/types/rentRequest';

/**
 * Repository layer for Rent Request operations
 * Handles all database interactions for rent requests
 */
export class RentRequestRepository {

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${RENT_REQUEST_CONSTANTS.REQUEST_ID_PREFIX}_${timestamp}_${random}`;
  }

  /**
   * Check if a vehicle exists and get its details
   */
  async getVehicleById(vehicleId: string) {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: { 
          id: vehicleId, 
          isActive: true,
          availability: true // Only available vehicles
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      });

      if (!vehicle) {
        logger.warn('Vehicle not found or not available', { vehicleId });
        return null;
      }

      return vehicle;
    } catch (error) {
      logger.error('Error fetching vehicle:', { vehicleId, error });
      throw new Error('Failed to fetch vehicle information');
    }
  }

  /**
   * Check vehicle availability for given date range
   */
  async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<VehicleAvailability> {
    try {
      // Check for any active rental requests that would conflict
      // Only CONFIRMED and APPROVED requests block availability
      const whereClause: any = {
        vehicleId,
        status: {
          in: ['CONFIRMED', 'APPROVED']
        },
        OR: [
          {
            // Request starts before our end date and ends after our start date
            startDate: { lte: endDate },
            endDate: { gte: startDate }
          }
        ]
      };

      if (excludeRequestId) {
        whereClause.id = { not: excludeRequestId };
      }

      const conflictingRequests = await prisma.rentRequest.findMany({
        where: whereClause,
        select: {
          requestId: true,
          startDate: true,
          endDate: true,
          status: true,
        }
      });

      const isAvailable = conflictingRequests.length === 0;

      return {
        isAvailable,
        conflictingRequests: !isAvailable ? conflictingRequests.map(req => ({
          requestId: req.requestId,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status as RentRequestStatus,
        })) : undefined,
      };
    } catch (error) {
      logger.error('Error checking vehicle availability:', { vehicleId, startDate, endDate, error });
      throw new Error('Failed to check vehicle availability');
    }
  }

  /**
   * Check for duplicate requests
   */
  async checkDuplicateRequest(
    clientEmail: string,
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - RENT_REQUEST_CONSTANTS.DUPLICATE_CHECK_WINDOW_HOURS * 60 * 60 * 1000);

      const existingRequest = await prisma.rentRequest.findFirst({
        where: {
          clientEmail: clientEmail.toLowerCase(),
          vehicleId,
          startDate,
          endDate,
          createdAt: { gte: oneHourAgo },
          status: { not: 'REJECTED' }
        },
        select: { id: true }
      });

      return !!existingRequest;
    } catch (error) {
      logger.error('Error checking for duplicate requests:', { clientEmail, vehicleId, error });
      throw new Error('Failed to check for duplicate requests');
    }
  }

  /**
   * Create a new rent request
   */
  async createRentRequest(data: CreateRentRequestData): Promise<any> {
    try {
      // Get vehicle information
      const vehicle = await this.getVehicleById(data.vehicleId);
      if (!vehicle) {
        throw new Error('Véhicule non trouvé ou non disponible');
      }

      // Check for duplicates
      const isDuplicate = await this.checkDuplicateRequest(
        data.clientEmail,
        data.vehicleId,
        data.startDate,
        data.endDate
      );

      if (isDuplicate) {
        throw new Error('Une demande similaire a déjà été soumise récemment');
      }

      // Check vehicle availability
      const availability = await this.checkVehicleAvailability(
        data.vehicleId,
        data.startDate,
        data.endDate
      );

      if (!availability.isAvailable) {
        throw new Error('Le véhicule n\'est pas disponible pour ces dates');
      }

      // Generate unique request ID
      const requestId = this.generateRequestId();

      // Create rent request using Prisma
      const rentRequest = await prisma.rentRequest.create({
        data: {
          requestId,
          clientName: data.clientName.trim(),
          clientEmail: data.clientEmail.toLowerCase().trim(),
          clientPhone: data.clientPhone.trim(),
          startDate: data.startDate,
          endDate: data.endDate,
          message: data.message?.trim(),
          vehicleId: data.vehicleId,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          vehicleYear: vehicle.year,
          pricePerDay: vehicle.pricePerDay,
          currency: 'DZD',
          status: 'PENDING'
        },
        include: {
          vehicle: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              }
            }
          }
        }
      });

      logger.info('Rent request created successfully', {
        requestId: rentRequest.requestId,
        clientEmail: data.clientEmail,
        vehicleId: data.vehicleId,
      });

      return {
        ...rentRequest,
        pricePerDay: Number(rentRequest.pricePerDay),
      };
    } catch (error) {
      logger.error('Error creating rent request:', { error, data });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create rent request');
    }
  }

  /**
   * Get rent request by ID
   */
  async getRentRequestById(id: string): Promise<any> {
    try {
      const rentRequest = await prisma.rentRequest.findUnique({
        where: { id },
        include: {
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              color: true,
              licensePlate: true,
              category: true,
              pricePerDay: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: {
                  id: true,
                  imageUrl: true,
                  alt: true,
                  isPrimary: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 10
          }
        }
      });

      if (!rentRequest) {
        return null;
      }

      return {
        ...rentRequest,
        pricePerDay: Number(rentRequest.pricePerDay),
        vehicle_make: rentRequest.vehicle.make,
        vehicle_model: rentRequest.vehicle.model,
        vehicle_year: rentRequest.vehicle.year,
        vehicle_color: rentRequest.vehicle.color,
        vehicle_licensePlate: rentRequest.vehicle.licensePlate,
      };
    } catch (error) {
      logger.error('Error fetching rent request:', { id, error });
      throw new Error('Failed to fetch rent request');
    }
  }

  /**
   * Get rent requests with filters and pagination
   */
  async getRentRequests(filters: RentRequestFilters): Promise<{
    requests: any[];
    total: number;
  }> {
    try {
      const {
        status,
        clientEmail,
        vehicleId,
        startDate,
        endDate,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      if (clientEmail) {
        where.clientEmail = {
          contains: clientEmail.toLowerCase(),
          mode: 'insensitive'
        };
      }
      if (vehicleId) {
        where.vehicleId = vehicleId;
      }
      if (startDate) {
        where.startDate = { gte: startDate };
      }
      if (endDate) {
        where.endDate = { lte: endDate };
      }

      // Get total count
      const total = await prisma.rentRequest.count({ where });

      // Get requests with vehicle information
      const requests = await prisma.rentRequest.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              color: true,
              licensePlate: true,
              category: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: {
                  imageUrl: true,
                  alt: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      });

      // Transform data for backward compatibility
      const transformedRequests = requests.map(req => ({
        ...req,
        pricePerDay: Number(req.pricePerDay),
        vehicle_make: req.vehicle.make,
        vehicle_model: req.vehicle.model,
        vehicle_year: req.vehicle.year,
        vehicle_color: req.vehicle.color,
        vehicle_licensePlate: req.vehicle.licensePlate,
      }));

      return {
        requests: transformedRequests,
        total,
      };
    } catch (error) {
      logger.error('Error fetching rent requests:', { filters, error });
      throw new Error('Failed to fetch rent requests');
    }
  }

  /**
   * Update rent request
   */
  async updateRentRequest(
    id: string,
    data: UpdateRentRequestData,
    adminId?: string
  ): Promise<any> {
    try {
      const existingRequest = await this.getRentRequestById(id);
      if (!existingRequest) {
        throw new Error('Demande de location non trouvée');
      }

      // Prepare update data
      const updateData: any = {};
      
      if (data.status !== undefined) {
        updateData.status = data.status;
        updateData.reviewedAt = new Date();
        if (adminId) {
          updateData.reviewedBy = adminId;
        }
      }

      if (data.adminNotes !== undefined) {
        updateData.adminNotes = data.adminNotes;
      }

      // Update the request
      const updatedRequest = await prisma.rentRequest.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              color: true,
              licensePlate: true
            }
          }
        }
      });

      // Create status history entry if status changed
      if (data.status && data.status !== existingRequest.status) {
        await prisma.rentRequestStatusHistory.create({
          data: {
            requestId: id,
            oldStatus: existingRequest.status as any,
            newStatus: data.status as any,
            changedBy: adminId || 'System',
            notes: data.adminNotes,
          }
        });

        logger.info('Rent request status updated', {
          requestId: updatedRequest.requestId,
          oldStatus: existingRequest.status,
          newStatus: data.status,
          changedBy: adminId,
        });
      }

      return {
        ...updatedRequest,
        pricePerDay: Number(updatedRequest.pricePerDay),
        vehicle_make: updatedRequest.vehicle.make,
        vehicle_model: updatedRequest.vehicle.model,
        vehicle_year: updatedRequest.vehicle.year,
        vehicle_color: updatedRequest.vehicle.color,
        vehicle_licensePlate: updatedRequest.vehicle.licensePlate,
      };
    } catch (error) {
      logger.error('Error updating rent request:', { id, data, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update rent request');
    }
  }

  /**
   * Delete rent request (only if pending or rejected)
   */
  async deleteRentRequest(id: string): Promise<void> {
    try {
      const existingRequest = await this.getRentRequestById(id);
      if (!existingRequest) {
        throw new Error('Demande de location non trouvée');
      }

      if (!['PENDING', 'REJECTED'].includes(existingRequest.status)) {
        throw new Error('Seules les demandes en attente ou rejetées peuvent être supprimées');
      }

      // Delete using Prisma (will cascade delete status history)
      await prisma.rentRequest.delete({
        where: { id }
      });

      logger.info('Rent request deleted', {
        requestId: existingRequest.requestId,
        status: existingRequest.status,
      });
    } catch (error) {
      logger.error('Error deleting rent request:', { id, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete rent request');
    }
  }

  /**
   * Auto-expire pending requests older than specified date
   */
  async expirePendingRequests(cutoffDate: Date): Promise<number> {
    try {
      // Find pending requests older than cutoff date
      const expiredRequests = await prisma.rentRequest.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: cutoffDate }
        },
        data: {
          status: 'REJECTED',
          adminNotes: 'Demande expirée automatiquement après 7 jours',
          reviewedAt: new Date(),
          reviewedBy: 'System'
        }
      });

      logger.info('Expired old pending requests', {
        count: expiredRequests.count,
        cutoffDate
      });

      return expiredRequests.count;
    } catch (error) {
      logger.error('Error expiring pending requests:', { cutoffDate, error });
      throw new Error('Failed to expire pending requests');
    }
  }

  /**
   * Get statistics for dashboard
   */
  async getRentRequestStatistics(): Promise<RentRequestStatistics> {
    try {
      // Get total count
      const totalRequests = await prisma.rentRequest.count();

      // Get status counts using Prisma aggregation
      const statusResults = await prisma.rentRequest.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const statusCounts = statusResults.reduce((acc: Record<string, number>, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {});

      // Get recent requests with proper relations
      const recentRequests = await prisma.rentRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true
            }
          }
        }
      });

      // Transform for backward compatibility
      const transformedRecentRequests = recentRequests.map(req => ({
        ...req,
        pricePerDay: Number(req.pricePerDay),
        vehicle_make: req.vehicle.make,
        vehicle_model: req.vehicle.model,
        vehicle_year: req.vehicle.year,
      }));

      // Get monthly statistics (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyStats = await prisma.$queryRaw<Array<{month: string, year: number, count: bigint}>>`
        SELECT 
          TO_CHAR("createdAt", 'Mon') as month,
          EXTRACT(YEAR FROM "createdAt")::int as year,
          COUNT(*)::int as count
        FROM "rent_requests" 
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY year, EXTRACT(MONTH FROM "createdAt"), month
        ORDER BY year, EXTRACT(MONTH FROM "createdAt")
      `;

      // Get top requested vehicles
      const topVehicles = await prisma.$queryRaw<Array<{
        vehicleId: string, 
        make: string, 
        model: string, 
        year: number, 
        requestCount: bigint
      }>>`
        SELECT 
          rr."vehicleId",
          rr."vehicleMake" as make,
          rr."vehicleModel" as model,
          rr."vehicleYear" as year,
          COUNT(*)::int as "requestCount"
        FROM "rent_requests" rr
        WHERE rr."createdAt" >= ${sixMonthsAgo}
        GROUP BY rr."vehicleId", rr."vehicleMake", rr."vehicleModel", rr."vehicleYear"
        ORDER BY "requestCount" DESC
        LIMIT 5
      `;

      return {
        totalRequests,
        pendingRequests: statusCounts['PENDING'] || 0,
        approvedRequests: statusCounts['APPROVED'] || 0,
        rejectedRequests: statusCounts['REJECTED'] || 0,
        contactedRequests: statusCounts['CONTACTED'] || 0,
        reviewedRequests: statusCounts['REVIEWED'] || 0,
        confirmedRequests: statusCounts['CONFIRMED'] || 0,
        monthlyStats: monthlyStats.map(stat => ({
          month: stat.month,
          year: stat.year,
          count: Number(stat.count)
        })),
        topVehicles: topVehicles.map(vehicle => ({
          vehicleId: vehicle.vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          requestCount: Number(vehicle.requestCount)
        })),
        recentRequests: transformedRecentRequests as any,
      };
    } catch (error) {
      logger.error('Error fetching rent request statistics:', { error });
      throw new Error('Failed to fetch statistics');
    }
  }
}

// Singleton instance
export const rentRequestRepository = new RentRequestRepository();
