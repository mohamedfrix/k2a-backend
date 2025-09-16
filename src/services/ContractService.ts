import { 
  ContractQuery, 
  ContractResponse, 
  ContractListResponse,
  CreateContractInput,
  UpdateContractInput,
  ContractStatsResponse,
  VehicleAvailabilityRequest,
  VehicleAvailabilityResponse,
  VehicleCalendarResponse,
  ContractDashboardData,
  BulkContractResult
} from '../types/contract';
import { ContractRepository } from '../repositories/ContractRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { ClientRepository } from '../repositories/ClientRepository';

export class ContractService {
  constructor(
    private contractRepository: ContractRepository,
    private vehicleRepository: VehicleRepository,
    private clientRepository: ClientRepository
  ) {}

  // Create a new contract
  async createContract(input: CreateContractInput): Promise<ContractResponse> {
    // Validate client exists and is active
    const client = await this.clientRepository.findById(input.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    if (!client.isActive) {
      throw new Error('Client is not active');
    }

    // Validate vehicle exists and is active
    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    if (!vehicle.isActive || !vehicle.availability) {
      throw new Error('Vehicle is not available');
    }

    // Validate dates (compare by local date-only so "today" is allowed)
    const toLocalDateOnly = (d: any): Date | null => {
      if (!d) return null;
      const dt = d instanceof Date ? new Date(d) : new Date(String(d));
      if (isNaN(dt.getTime())) return null;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const start = toLocalDateOnly(input.startDate);
    const end = toLocalDateOnly(input.endDate);
    const today = toLocalDateOnly(new Date())!;

    if (!start) throw new Error('Invalid start date');
    if (!end) throw new Error('Invalid end date');

    if (start.getTime() < today.getTime()) {
      throw new Error('Start date cannot be in the past');
    }
    if (end.getTime() <= start.getTime()) {
      throw new Error('End date must be after start date');
    }

    // Check vehicle availability for the requested period
    const availabilityRequest: VehicleAvailabilityRequest = {
      vehicleId: input.vehicleId,
      startDate: start,
      endDate: end
    };
    
    const availability = await this.contractRepository.checkVehicleAvailability(availabilityRequest);
    if (!availability.available) {
      throw new Error(`Vehicle is not available for the selected dates. Conflicting contracts: ${availability.conflictingContracts.map(c => c.contractNumber).join(', ')}`);
    }

    // Validate service type is supported by vehicle
    const vehicleServices = vehicle.rentalServices.map(rs => rs.rentalServiceType);
    if (!vehicleServices.includes(input.serviceType)) {
      throw new Error(`Vehicle does not support ${input.serviceType} service type`);
    }

    // Create the contract
    return await this.contractRepository.create(input);
  }

  // Get all contracts with filtering and pagination
  async getContracts(query: ContractQuery): Promise<ContractListResponse> {
    return await this.contractRepository.findAll(query);
  }

  // Get contract by ID
  async getContractById(id: string): Promise<ContractResponse | null> {
    return await this.contractRepository.findById(id);
  }

  // Update contract
  async updateContract(id: string, input: UpdateContractInput, adminId?: string): Promise<ContractResponse> {
    const existingContract = await this.contractRepository.findById(id);
    if (!existingContract) {
      throw new Error('Contract not found');
    }

    // If dates are being changed, check availability
    if (input.startDate || input.endDate) {
      // Normalize to local date-only for comparison
      const toLocalDateOnly = (d: any): Date | null => {
        if (!d) return null;
        const dt = d instanceof Date ? new Date(d) : new Date(String(d));
        if (isNaN(dt.getTime())) return null;
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      };

      const start = toLocalDateOnly(input.startDate || existingContract.startDate)!;
      const end = toLocalDateOnly(input.endDate || existingContract.endDate)!;

      if (end.getTime() <= start.getTime()) {
        throw new Error('End date must be after start date');
      }

      const availabilityRequest: VehicleAvailabilityRequest = {
        vehicleId: existingContract.vehicleId,
        startDate: start,
        endDate: end,
        excludeContractId: id // Exclude current contract from availability check
      };
      
      const availability = await this.contractRepository.checkVehicleAvailability(availabilityRequest);
      if (!availability.available) {
        throw new Error(`Vehicle is not available for the selected dates. Conflicting contracts: ${availability.conflictingContracts.map(c => c.contractNumber).join(', ')}`);
      }
    }

    // Add admin ID to update if provided
    const updateData = adminId ? { ...input, adminId } : input;
    
    const updatedContract = await this.contractRepository.update(id, updateData);
    if (!updatedContract) {
      throw new Error('Failed to update contract');
    }

    return updatedContract;
  }

  // Cancel contract
  async cancelContract(id: string, adminId?: string): Promise<ContractResponse> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status === 'COMPLETED' || contract.status === 'CANCELLED') {
      throw new Error('Cannot cancel a completed or already cancelled contract');
    }

    // If contract is active and has already started, may need special handling
    const now = new Date();
    if (contract.status === 'ACTIVE' && contract.startDate <= now) {
      // Contract has started, may need to calculate partial refunds, etc.
      // For now, we'll allow cancellation but this could be enhanced
    }

    const updatedContract = await this.contractRepository.update(id, {
      status: 'CANCELLED',
      ...(adminId && { adminId })
    });

    if (!updatedContract) {
      throw new Error('Failed to cancel contract');
    }

    return updatedContract;
  }

  // Confirm contract
  async confirmContract(id: string, adminId?: string): Promise<ContractResponse> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'PENDING') {
      throw new Error('Only pending contracts can be confirmed');
    }

    // Double-check availability before confirming
    const availabilityRequest: VehicleAvailabilityRequest = {
      vehicleId: contract.vehicleId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      excludeContractId: id
    };
    
    const availability = await this.contractRepository.checkVehicleAvailability(availabilityRequest);
    if (!availability.available) {
      throw new Error(`Cannot confirm contract: Vehicle is no longer available for the selected dates`);
    }

    const updatedContract = await this.contractRepository.update(id, {
      status: 'CONFIRMED',
      ...(adminId && { adminId })
    });

    if (!updatedContract) {
      throw new Error('Failed to confirm contract');
    }

    return updatedContract;
  }

  // Start contract (mark as active)
  async startContract(id: string, adminId?: string): Promise<ContractResponse> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'CONFIRMED') {
      throw new Error('Only confirmed contracts can be started');
    }

    // Allow starting on the contract start date (compare by date-only)
    const toLocalDateOnly = (d: any): Date | null => {
      if (!d) return null;
      const dt = d instanceof Date ? new Date(d) : new Date(String(d));
      if (isNaN(dt.getTime())) return null;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const today = toLocalDateOnly(new Date())!;
    const contractStart = toLocalDateOnly(contract.startDate)!;
    if (contractStart.getTime() > today.getTime()) {
      throw new Error('Contract cannot be started before the start date');
    }

    const updatedContract = await this.contractRepository.update(id, {
      status: 'ACTIVE',
      ...(adminId && { adminId })
    });

    if (!updatedContract) {
      throw new Error('Failed to start contract');
    }

    return updatedContract;
  }

  // Complete contract
  async completeContract(id: string, adminId?: string): Promise<ContractResponse> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'ACTIVE') {
      throw new Error('Only active contracts can be completed');
    }

    const updatedContract = await this.contractRepository.update(id, {
      status: 'COMPLETED',
      ...(adminId && { adminId })
    });

    if (!updatedContract) {
      throw new Error('Failed to complete contract');
    }

    return updatedContract;
  }

  // Update payment status
  async updatePayment(id: string, paidAmount: number, adminId?: string): Promise<ContractResponse> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Prevent payment updates for cancelled contracts
    if (contract.status === 'CANCELLED') {
      throw new Error('Cannot update payment for cancelled contracts');
    }

    if (paidAmount < 0) {
      throw new Error('Paid amount cannot be negative');
    }

    if (paidAmount > contract.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }

    let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
    if (paidAmount === 0) {
      paymentStatus = 'PENDING';
    } else if (paidAmount < contract.totalAmount) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'PAID';
    }

    const updatedContract = await this.contractRepository.update(id, {
      paidAmount,
      paymentStatus,
      ...(adminId && { adminId })
    });

    if (!updatedContract) {
      throw new Error('Failed to update payment');
    }

    return updatedContract;
  }

  // Check vehicle availability
  async checkVehicleAvailability(request: VehicleAvailabilityRequest): Promise<VehicleAvailabilityResponse> {
    // First check vehicle-level availability flag
    const vehicle = await this.vehicleRepository.findById(request.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (!vehicle.availability) {
      // Vehicle is marked unavailable (in service/maintenance)
      return {
        available: false,
        conflictingContracts: [],
        vehicleUnavailable: true,
        vehicle
      };
    }

    // Delegate to repository for overlapping-contract checks
    const availability = await this.contractRepository.checkVehicleAvailability(request);
    // Attach vehicle info for richer frontend UX
    return {
      ...availability,
      vehicleUnavailable: false,
      vehicle
    };
  }

  // Get vehicle calendar
  async getVehicleCalendar(vehicleId: string, month: number, year: number): Promise<VehicleCalendarResponse> {
    // Validate vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return await this.contractRepository.getVehicleCalendar(vehicleId, month, year);
  }

  // Get contract statistics
  async getContractStats(): Promise<ContractStatsResponse> {
    return await this.contractRepository.getContractStats();
  }

  // Get dashboard data
  async getDashboardData(): Promise<ContractDashboardData> {
    return await this.contractRepository.getDashboardData();
  }

  // Bulk update contract status
  async bulkUpdateStatus(contractIds: string[], status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED', adminId?: string): Promise<BulkContractResult> {
    // Validate all contracts exist and can be updated to the new status
    const contracts = await Promise.all(
      contractIds.map(id => this.contractRepository.findById(id))
    );

    const errors: Array<{ contractId: string; error: string }> = [];

    contracts.forEach((contract, index) => {
      if (!contract) {
        errors.push({ contractId: contractIds[index], error: 'Contract not found' });
        return;
      }

      // Add business logic validation for status transitions
      if (!this.isValidStatusTransition(contract.status, status)) {
        errors.push({ 
          contractId: contractIds[index], 
          error: `Invalid status transition from ${contract.status} to ${status}` 
        });
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        affectedCount: 0,
        errors
      };
    }

    return await this.contractRepository.bulkUpdateStatus(contractIds, status, adminId);
  }

  // Delete contract (only if pending)
  async deleteContract(id: string): Promise<boolean> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'PENDING') {
      throw new Error('Only pending contracts can be deleted');
    }

    return await this.contractRepository.delete(id);
  }

  // Auto-update contract statuses based on dates
  async autoUpdateContractStatuses(): Promise<void> {
    const now = new Date();
    
    // Find confirmed contracts that should be active (start date has passed)
    const contractsToActivate = await this.contractRepository.findAll({
      status: 'CONFIRMED',
      startDate: now,
      limit: 1000 // Process in batches
    });

    for (const contract of contractsToActivate.contracts) {
      if (contract.startDate <= now) {
        await this.contractRepository.update(contract.id, { status: 'ACTIVE' });
      }
    }

    // Find active contracts that should be completed (end date has passed)
    const contractsToComplete = await this.contractRepository.findAll({
      status: 'ACTIVE',
      endDate: now,
      limit: 1000
    });

    for (const contract of contractsToComplete.contracts) {
      if (contract.endDate < now) {
        await this.contractRepository.update(contract.id, { status: 'COMPLETED' });
      }
    }
  }

  // Helper method to validate status transitions
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': [] // No transitions from cancelled
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Get contracts by client
  async getContractsByClient(clientId: string, query?: Partial<ContractQuery>): Promise<ContractListResponse> {
    return await this.contractRepository.findAll({
      ...query,
      clientId
    });
  }

  // Get contracts by vehicle
  async getContractsByVehicle(vehicleId: string, query?: Partial<ContractQuery>): Promise<ContractListResponse> {
    return await this.contractRepository.findAll({
      ...query,
      vehicleId
    });
  }

  // Get active contracts for today
  async getTodayActiveContracts(): Promise<ContractResponse[]> {
    const today = new Date();
    const result = await this.contractRepository.findAll({
      status: 'ACTIVE',
      startDate: today,
      endDate: today,
      limit: 1000
    });
    return result.contracts;
  }

  // Get contracts ending soon (for reminders)
  async getContractsEndingSoon(days: number = 7): Promise<ContractResponse[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const result = await this.contractRepository.findAll({
      status: 'ACTIVE',
      endDate,
      limit: 1000
    });
    return result.contracts;
  }
}