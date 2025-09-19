import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';

/**
 * Unified Booking Conflict Detection Service
 * 
 * This service provides conflict detection that checks both:
 * 1. Contracts with status CONFIRMED or ACTIVE
 * 2. Rent Requests with status APPROVED or CONFIRMED
 * 
 * Used by both contract creation/confirmation and rent request approval workflows
 */

export interface ConflictingBooking {
  id: string;
  type: 'CONTRACT' | 'RENT_REQUEST';
  identifier: string; // contractNumber or requestId
  startDate: Date;
  endDate: Date;
  status: string;
  client: {
    nom: string;
    prenom: string;
  };
}

export interface BookingAvailabilityResult {
  available: boolean;
  conflictingBookings: ConflictingBooking[];
}

export interface RentRequestApprovability {
  requestId: string;
  isApprovable: boolean;
  conflictingBookings?: ConflictingBooking[];
}

export class BookingConflictService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check if a vehicle is available for the specified date range
   * This is the unified method that checks both contracts and rent requests atomically
   */
  async isVehicleAvailableForPeriod(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeContractId?: string,
    excludeRequestId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<BookingAvailabilityResult> {
    const client = tx || this.prisma;

    try {
      logger.debug('Checking vehicle availability for period', {
        vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        excludeContractId,
        excludeRequestId
      });

      // Check for conflicting contracts (CONFIRMED and ACTIVE status)
      const conflictingContracts = await client.contract.findMany({
        where: {
          vehicleId,
          ...(excludeContractId && { NOT: { id: excludeContractId } }),
          status: {
            in: ['CONFIRMED', 'ACTIVE'] // Only these statuses block new bookings
          },
          // Date overlap detection: (startA <= endB) AND (endA >= startB)
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        },
        select: {
          id: true,
          contractNumber: true,
          startDate: true,
          endDate: true,
          status: true,
          client: {
            select: {
              nom: true,
              prenom: true
            }
          }
        }
      });

      // Check for conflicting rent requests (APPROVED and CONFIRMED status)
      const conflictingRequests = await client.rentRequest.findMany({
        where: {
          vehicleId,
          ...(excludeRequestId && { NOT: { id: excludeRequestId } }),
          status: {
            in: ['APPROVED', 'CONFIRMED'] // Only these statuses block new bookings
          },
          // Date overlap detection: (startA <= endB) AND (endA >= startB)
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        },
        select: {
          id: true,
          requestId: true,
          startDate: true,
          endDate: true,
          status: true,
          clientName: true
        }
      });

      // Convert to unified format
      const conflictingBookings: ConflictingBooking[] = [
        // Add conflicting contracts
        ...conflictingContracts.map(contract => ({
          id: contract.id,
          type: 'CONTRACT' as const,
          identifier: contract.contractNumber,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          client: {
            nom: contract.client.nom,
            prenom: contract.client.prenom
          }
        })),
        // Add conflicting rent requests
        ...conflictingRequests.map(request => {
          const [prenom, ...nomParts] = request.clientName.split(' ');
          return {
            id: request.id,
            type: 'RENT_REQUEST' as const,
            identifier: request.requestId,
            startDate: request.startDate,
            endDate: request.endDate,
            status: request.status,
            client: {
              nom: nomParts.join(' ') || '',
              prenom: prenom || ''
            }
          };
        })
      ];

      const isAvailable = conflictingBookings.length === 0;

      logger.debug('Vehicle availability check result', {
        vehicleId,
        available: isAvailable,
        conflictingBookingsCount: conflictingBookings.length,
        conflictingBookings: conflictingBookings.map(b => ({
          type: b.type,
          identifier: b.identifier,
          status: b.status
        }))
      });

      return {
        available: isAvailable,
        conflictingBookings
      };

    } catch (error) {
      logger.error('Error checking vehicle availability', {
        vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate a user-friendly error message for booking conflicts
   */
  generateConflictErrorMessage(conflictingBookings: ConflictingBooking[]): string {
    if (conflictingBookings.length === 0) {
      return '';
    }

    const conflictDetails = conflictingBookings
      .map(booking => {
        const clientName = `${booking.client.nom} ${booking.client.prenom}`.trim();
        const bookingType = booking.type === 'CONTRACT' ? 'Contrat' : 'Demande';
        return `${bookingType} ${booking.identifier} (${clientName})`;
      })
      .join(', ');

    return `Conflit de réservation : Ce véhicule est déjà réservé ou a une demande approuvée pour une partie de la période sélectionnée. Réservations en conflit : ${conflictDetails}`;
  }

  /**
   * Convenience method for checking availability with automatic error throwing
   */
  async validateVehicleAvailabilityOrThrow(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeContractId?: string,
    excludeRequestId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const result = await this.isVehicleAvailableForPeriod(
      vehicleId,
      startDate,
      endDate,
      excludeContractId,
      excludeRequestId,
      tx
    );

    if (!result.available) {
      const errorMessage = this.generateConflictErrorMessage(result.conflictingBookings);
      throw new Error(errorMessage);
    }
  }

  /**
   * Bulk check approvability for multiple rental requests efficiently
   * This method avoids N+1 queries by fetching all relevant conflicts upfront
   */
  async checkBulkRentRequestApprovability(
    requests: Array<{
      id: string;
      requestId: string;
      vehicleId: string;
      startDate: Date;
      endDate: Date;
      status: string;
    }>
  ): Promise<Map<string, RentRequestApprovability>> {
    const result = new Map<string, RentRequestApprovability>();

    // Filter only PENDING requests that could potentially be approved
    const pendingRequests = requests.filter(req => req.status === 'PENDING');
    
    if (pendingRequests.length === 0) {
      // If no pending requests, mark all as not approvable
      requests.forEach(req => {
        result.set(req.id, {
          requestId: req.requestId,
          isApprovable: false,
          conflictingBookings: []
        });
      });
      return result;
    }

    logger.debug('Bulk checking approvability for requests', {
      totalRequests: requests.length,
      pendingRequests: pendingRequests.length
    });

    try {
      // Get the date range for all requests to optimize queries
      const minStartDate = new Date(Math.min(...pendingRequests.map(r => r.startDate.getTime())));
      const maxEndDate = new Date(Math.max(...pendingRequests.map(r => r.endDate.getTime())));
      
      // Get all unique vehicle IDs
      const vehicleIds = [...new Set(pendingRequests.map(r => r.vehicleId))];

      logger.debug('Fetching conflicts in bulk', {
        vehicleIds: vehicleIds.length,
        dateRange: { minStartDate, maxEndDate }
      });

      // Fetch all potentially conflicting contracts in one query
      const conflictingContracts = await this.prisma.contract.findMany({
        where: {
          vehicleId: { in: vehicleIds },
          status: { in: ['CONFIRMED', 'ACTIVE'] },
          // Broad date range to catch all potential conflicts
          startDate: { lte: maxEndDate },
          endDate: { gte: minStartDate }
        },
        select: {
          id: true,
          contractNumber: true,
          vehicleId: true,
          startDate: true,
          endDate: true,
          status: true,
          client: {
            select: {
              nom: true,
              prenom: true
            }
          }
        }
      });

      // Fetch all potentially conflicting rent requests in one query
      const conflictingRequests = await this.prisma.rentRequest.findMany({
        where: {
          vehicleId: { in: vehicleIds },
          status: { in: ['APPROVED', 'CONFIRMED'] },
          // Broad date range to catch all potential conflicts
          startDate: { lte: maxEndDate },
          endDate: { gte: minStartDate }
        },
        select: {
          id: true,
          requestId: true,
          vehicleId: true,
          startDate: true,
          endDate: true,
          status: true,
          clientName: true
        }
      });

      logger.debug('Fetched conflicts in bulk', {
        conflictingContracts: conflictingContracts.length,
        conflictingRequests: conflictingRequests.length
      });

      // Group conflicts by vehicle for efficient lookup
      const contractsByVehicle = new Map<string, typeof conflictingContracts>();
      const requestsByVehicle = new Map<string, typeof conflictingRequests>();

      conflictingContracts.forEach(contract => {
        if (!contractsByVehicle.has(contract.vehicleId)) {
          contractsByVehicle.set(contract.vehicleId, []);
        }
        contractsByVehicle.get(contract.vehicleId)!.push(contract);
      });

      conflictingRequests.forEach(request => {
        if (!requestsByVehicle.has(request.vehicleId)) {
          requestsByVehicle.set(request.vehicleId, []);
        }
        requestsByVehicle.get(request.vehicleId)!.push(request);
      });

      // Check each pending request for conflicts in memory
      for (const request of pendingRequests) {
        const vehicleContracts = contractsByVehicle.get(request.vehicleId) || [];
        const vehicleRequests = requestsByVehicle.get(request.vehicleId) || [];

        const conflicts: ConflictingBooking[] = [];

        // Check contract conflicts
        for (const contract of vehicleContracts) {
          if (this.datesOverlap(request.startDate, request.endDate, contract.startDate, contract.endDate)) {
            conflicts.push({
              id: contract.id,
              type: 'CONTRACT',
              identifier: contract.contractNumber,
              startDate: contract.startDate,
              endDate: contract.endDate,
              status: contract.status,
              client: contract.client
            });
          }
        }

        // Check rent request conflicts (exclude self)
        for (const otherRequest of vehicleRequests) {
          if (otherRequest.id !== request.id && 
              this.datesOverlap(request.startDate, request.endDate, otherRequest.startDate, otherRequest.endDate)) {
            
            // Parse client name from clientName field
            const [prenom = '', nom = ''] = otherRequest.clientName.split(' ');
            
            conflicts.push({
              id: otherRequest.id,
              type: 'RENT_REQUEST',
              identifier: otherRequest.requestId,
              startDate: otherRequest.startDate,
              endDate: otherRequest.endDate,
              status: otherRequest.status,
              client: { nom, prenom }
            });
          }
        }

        result.set(request.id, {
          requestId: request.requestId,
          isApprovable: conflicts.length === 0,
          conflictingBookings: conflicts
        });
      }

      // Mark non-pending requests as not approvable
      requests.forEach(req => {
        if (req.status !== 'PENDING' && !result.has(req.id)) {
          result.set(req.id, {
            requestId: req.requestId,
            isApprovable: false,
            conflictingBookings: []
          });
        }
      });

      logger.debug('Bulk approvability check completed', {
        totalChecked: requests.length,
        approvableCount: Array.from(result.values()).filter(r => r.isApprovable).length
      });

      return result;

    } catch (error) {
      logger.error('Error in bulk approvability check', { error });
      
      // Fallback: mark all as not approvable on error
      requests.forEach(req => {
        result.set(req.id, {
          requestId: req.requestId,
          isApprovable: false,
          conflictingBookings: []
        });
      });
      
      return result;
    }
  }

  /**
   * Helper method to check if two date ranges overlap
   * Two ranges overlap if: (startA <= endB) AND (endA >= startB)
   */
  private datesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA <= endB && endA >= startB;
  }
}

// Export singleton instance
export const bookingConflictService = new BookingConflictService(new PrismaClient());