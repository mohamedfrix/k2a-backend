/**
 * Rent Request Types
 * TypeScript interfaces and types for the rent request system
 */

// Rent Request Status enum (matching Prisma schema)
export enum RentRequestStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED'
}

export interface CreateRentRequestData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: Date;
  endDate: Date;
  message?: string;
  vehicleId: string;
}

export interface UpdateRentRequestData {
  status?: RentRequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
}

export interface RentRequestFilters {
  status?: RentRequestStatus;
  clientEmail?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
}

export interface RentRequestWithVehicle {
  id: string;
  requestId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: Date;
  endDate: Date;
  message?: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  pricePerDay: number | string;
  currency: string;
  status: RentRequestStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed field for proactive UI - indicates if request can be approved
  isApprovable?: boolean;
  // Optional field for debugging/admin interface showing conflict details
  conflictingBookings?: Array<{
    id: string;
    type: 'CONTRACT' | 'RENT_REQUEST';
    identifier: string;
    startDate: Date;
    endDate: Date;
    status: string;
    client: {
      nom: string;
      prenom: string;
    };
  }>;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    category: string;
    availability: boolean;
    images?: Array<{
      id: string;
      imageUrl: string;
      alt?: string;
      isPrimary: boolean;
    }>;
  };
  statusHistory?: Array<{
    id: string;
    oldStatus?: RentRequestStatus;
    newStatus: RentRequestStatus;
    changedBy?: string;
    notes?: string;
    changedAt: Date;
  }>;
}

export interface RentRequestStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  contactedRequests: number;
  reviewedRequests: number;
  confirmedRequests: number;
  monthlyStats: Array<{
    month: string;
    year: number;
    count: number;
  }>;
  topVehicles: Array<{
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    requestCount: number;
  }>;
  recentRequests: RentRequestWithVehicle[];
}

export interface VehicleAvailability {
  isAvailable: boolean;
  conflictingRequests?: Array<{
    requestId: string;
    startDate: Date;
    endDate: Date;
    status: RentRequestStatus;
  }>;
}

export interface RentRequestResponse {
  success: boolean;
  data?: RentRequestWithVehicle | RentRequestWithVehicle[] | RentRequestStatistics;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedRentRequestsResponse {
  success: boolean;
  data: {
    requests: RentRequestWithVehicle[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message?: string;
  timestamp: string;
}

// Status transition rules
export const VALID_STATUS_TRANSITIONS: Record<RentRequestStatus, RentRequestStatus[]> = {
  [RentRequestStatus.PENDING]: [RentRequestStatus.REVIEWED, RentRequestStatus.APPROVED, RentRequestStatus.REJECTED, RentRequestStatus.CONTACTED],
  [RentRequestStatus.REVIEWED]: [RentRequestStatus.PENDING, RentRequestStatus.APPROVED, RentRequestStatus.REJECTED, RentRequestStatus.CONTACTED],
  [RentRequestStatus.APPROVED]: [RentRequestStatus.CONFIRMED, RentRequestStatus.CONTACTED, RentRequestStatus.REJECTED],
  [RentRequestStatus.REJECTED]: [RentRequestStatus.PENDING, RentRequestStatus.REVIEWED],
  [RentRequestStatus.CONTACTED]: [RentRequestStatus.CONFIRMED, RentRequestStatus.APPROVED, RentRequestStatus.REJECTED],
  [RentRequestStatus.CONFIRMED]: [], // Final status - no transitions allowed
};

// Status display names for UI
export const STATUS_DISPLAY_NAMES: Record<RentRequestStatus, string> = {
  [RentRequestStatus.PENDING]: 'En attente',
  [RentRequestStatus.REVIEWED]: 'Examinée',
  [RentRequestStatus.APPROVED]: 'Approuvée',
  [RentRequestStatus.REJECTED]: 'Rejetée',
  [RentRequestStatus.CONTACTED]: 'Client contacté',
  [RentRequestStatus.CONFIRMED]: 'Confirmée',
};

// Business constants
export const RENT_REQUEST_CONSTANTS = {
  MAX_RENTAL_DAYS: 90,
  MIN_ADVANCE_BOOKING_HOURS: 24,
  AUTO_EXPIRY_DAYS: 7,
  REQUEST_ID_PREFIX: 'req',
  DUPLICATE_CHECK_WINDOW_HOURS: 1,
} as const;
