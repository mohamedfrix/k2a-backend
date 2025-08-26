import { ContractStatus, PaymentStatus, RentalServiceType } from '@prisma/client';
import { BaseQuery } from './index';

// Query interface for filtering and pagination
export interface ContractQuery extends BaseQuery {
  clientId?: string;
  vehicleId?: string;
  adminId?: string;
  status?: ContractStatus;
  paymentStatus?: PaymentStatus;
  serviceType?: RentalServiceType;
  startDate?: Date;
  endDate?: Date;
  contractNumber?: string;
  search?: string; // Search across client name, vehicle make/model, contract number
  sortBy?: 'contractNumber' | 'startDate' | 'endDate' | 'totalAmount' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Request interfaces for API operations
export interface CreateContractRequest {
  clientId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  serviceType: RentalServiceType;
  dailyRate: number;
  discountAmount?: number;
  notes?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  accessories?: CreateContractAccessoryRequest[];
}

export interface CreateContractAccessoryRequest {
  name: string;
  price: number;
  quantity?: number;
}

export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  status?: ContractStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
}

// Response interfaces
export interface ContractAccessoryResponse {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ContractResponse {
  id: string;
  contractNumber: string;
  clientId: string;
  vehicleId: string;
  adminId?: string | null;
  
  // Booking Details
  startDate: Date;
  endDate: Date;
  totalDays: number;
  status: ContractStatus;
  serviceType: RentalServiceType;
  
  // Pricing
  dailyRate: number;
  accessoriesTotal: number;
  subtotal: number;
  discountAmount?: number | null;
  totalAmount: number;
  
  // Payment
  paymentStatus: PaymentStatus;
  paidAmount: number;
  
  // Additional Info
  notes?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  
  // Relations
  client: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string | null;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    pricePerDay: number;
  };
  admin?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  accessories: ContractAccessoryResponse[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractListResponse {
  contracts: ContractResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics interfaces
export interface ContractStatsResponse {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  pendingContracts: number;
  
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  
  serviceTypeBreakdown: Array<{
    serviceType: RentalServiceType;
    count: number;
    revenue: number;
  }>;
  
  statusBreakdown: Array<{
    status: ContractStatus;
    count: number;
  }>;
  
  paymentStatusBreakdown: Array<{
    paymentStatus: PaymentStatus;
    count: number;
    amount: number;
  }>;
  
  recentContracts: number; // Contracts created in last 30 days
  averageContractValue: number;
  averageRentalDuration: number;
}

// Internal service interfaces
export interface CreateContractInput {
  clientId: string;
  vehicleId: string;
  adminId?: string;
  startDate: Date;
  endDate: Date;
  serviceType: RentalServiceType;
  dailyRate: number;
  discountAmount?: number;
  notes?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  accessories?: CreateContractAccessoryInput[];
}

export interface CreateContractAccessoryInput {
  name: string;
  price: number;
  quantity: number;
}

export interface UpdateContractInput {
  status?: ContractStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  startDate?: Date;
  endDate?: Date;
  dailyRate?: number;
  discountAmount?: number;
  notes?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  accessories?: CreateContractAccessoryInput[];
}

// Calendar and availability interfaces
export interface VehicleAvailabilityRequest {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  excludeContractId?: string; // For checking availability when updating existing contract
}

export interface VehicleAvailabilityResponse {
  available: boolean;
  conflictingContracts: Array<{
    id: string;
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    status: ContractStatus;
  }>;
  // Optional fields added to indicate vehicle-level availability
  vehicleUnavailable?: boolean;
  vehicle?: any;
}

export interface VehicleCalendarDay {
  date: Date;
  isAvailable: boolean;
  contracts: Array<{
    id: string;
    contractNumber: string;
    status: ContractStatus;
    client: {
      nom: string;
      prenom: string;
    };
  }>;
}

export interface VehicleCalendarResponse {
  vehicleId: string;
  month: number;
  year: number;
  days: VehicleCalendarDay[];
}

// Bulk operation interfaces
export interface BulkContractStatusUpdate {
  contractIds: string[];
  status: ContractStatus;
  adminId?: string;
}

export interface BulkContractResult {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    contractId: string;
    error: string;
  }>;
}

// Contract generation helpers
export interface ContractCalculation {
  dailyRate: number;
  totalDays: number;
  subtotal: number;
  accessoriesTotal: number;
  discountAmount: number;
  totalAmount: number;
}

// Payment tracking
export interface PaymentRecord {
  amount: number;
  date: Date;
  method?: string;
  reference?: string;
  notes?: string;
}

// Dashboard integration
export interface ContractDashboardData {
  todayCheckIns: ContractResponse[];
  todayCheckOuts: ContractResponse[];
  upcomingContracts: ContractResponse[];
  overduePayments: ContractResponse[];
  recentActivity: Array<{
    type: 'contract_created' | 'contract_confirmed' | 'payment_received' | 'contract_completed';
    contractId: string;
    contractNumber: string;
    timestamp: Date;
    details: string;
  }>;
}