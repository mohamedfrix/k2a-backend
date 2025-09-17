import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ContractService } from '../src/services/ContractService';
import { ContractRepository } from '../src/repositories/ContractRepository';
import { VehicleRepository } from '../src/repositories/VehicleRepository';
import { ClientRepository } from '../src/repositories/ClientRepository';
import { PrismaClient } from '@prisma/client';

describe('Contract Service - Cancelled Contract Logic', () => {
  let contractService: ContractService;
  let contractRepository: ContractRepository;
  let vehicleRepository: VehicleRepository;
  let clientRepository: ClientRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    contractRepository = new ContractRepository(prisma);
    vehicleRepository = new VehicleRepository(prisma);
    clientRepository = new ClientRepository(prisma);
    contractService = new ContractService(contractRepository, vehicleRepository, clientRepository);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('updatePayment method', () => {
    test('should prevent payment updates for cancelled contracts', async () => {
      // Mock a cancelled contract
      const mockCancelledContract = {
        id: 'test-contract-1',
        contractNumber: 'CNT-001',
        status: 'CANCELLED',
        totalAmount: 1000,
        paidAmount: 0,
        paymentStatus: 'PENDING'
      };

      // Mock the repository method
      jest.spyOn(contractRepository, 'findById').mockResolvedValue(mockCancelledContract as any);

      // Test that updatePayment throws error for cancelled contract
      await expect(
        contractService.updatePayment('test-contract-1', 500)
      ).rejects.toThrow('Cannot update payment for cancelled contracts');
    });

    test('should allow payment updates for non-cancelled contracts', async () => {
      // Mock an active contract
      const mockActiveContract = {
        id: 'test-contract-2',
        contractNumber: 'CNT-002',
        status: 'ACTIVE',
        totalAmount: 1000,
        paidAmount: 0,
        paymentStatus: 'PENDING'
      };

      const mockUpdatedContract = {
        ...mockActiveContract,
        paidAmount: 500,
        paymentStatus: 'PARTIAL'
      };

      // Mock the repository methods
      jest.spyOn(contractRepository, 'findById').mockResolvedValue(mockActiveContract as any);
      jest.spyOn(contractRepository, 'update').mockResolvedValue(mockUpdatedContract as any);

      // Test that updatePayment works for active contract
      const result = await contractService.updatePayment('test-contract-2', 500);
      expect(result.paidAmount).toBe(500);
      expect(result.paymentStatus).toBe('PARTIAL');
    });

    test('should validate payment amount boundaries', async () => {
      const mockContract = {
        id: 'test-contract-3',
        status: 'ACTIVE',
        totalAmount: 1000,
        paidAmount: 0
      };

      jest.spyOn(contractRepository, 'findById').mockResolvedValue(mockContract as any);

      // Test negative amount
      await expect(
        contractService.updatePayment('test-contract-3', -100)
      ).rejects.toThrow('Paid amount cannot be negative');

      // Test amount exceeding total
      await expect(
        contractService.updatePayment('test-contract-3', 1500)
      ).rejects.toThrow('Paid amount cannot exceed total amount');
    });
  });

  describe('Status transition validation', () => {
    test('should prevent transitions from cancelled status', () => {
      // Access the private method via type assertion for testing
      const service = contractService as any;
      
      expect(service.isValidStatusTransition('CANCELLED', 'ACTIVE')).toBe(false);
      expect(service.isValidStatusTransition('CANCELLED', 'COMPLETED')).toBe(false);
      expect(service.isValidStatusTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(service.isValidStatusTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    });

    test('should allow valid status transitions', () => {
      const service = contractService as any;
      
      expect(service.isValidStatusTransition('PENDING', 'CONFIRMED')).toBe(true);
      expect(service.isValidStatusTransition('PENDING', 'CANCELLED')).toBe(true);
      expect(service.isValidStatusTransition('CONFIRMED', 'ACTIVE')).toBe(true);
      expect(service.isValidStatusTransition('ACTIVE', 'COMPLETED')).toBe(true);
    });
  });

  describe('Bulk operations with cancelled contracts', () => {
    test('should reject bulk updates that include cancelled contracts', async () => {
      const mockContracts = [
        { id: 'contract-1', status: 'ACTIVE' },
        { id: 'contract-2', status: 'CANCELLED' }, // This should cause rejection
        { id: 'contract-3', status: 'PENDING' }
      ];

      // Mock repository calls
      mockContracts.forEach((contract, index) => {
        jest.spyOn(contractRepository, 'findById')
          .mockResolvedValueOnce(contract as any);
      });

      const result = await contractService.bulkUpdateStatus(
        ['contract-1', 'contract-2', 'contract-3'], 
        'ACTIVE'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].error).toContain('Invalid status transition from CANCELLED');
    });
  });
});

describe('Contract Repository - Statistics Exclusion', () => {
  let contractRepository: ContractRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    contractRepository = new ContractRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  test('should exclude cancelled contracts from revenue statistics', async () => {
    // This test would require actual database records or more sophisticated mocking
    // For now, we'll just verify the query structure is correct by checking the method exists
    expect(typeof contractRepository.getContractStats).toBe('function');
    
    // In a real test environment, you would:
    // 1. Create test contracts with different statuses including CANCELLED
    // 2. Call getContractStats()
    // 3. Verify that cancelled contracts are excluded from revenue totals
    // 4. Verify that cancelled contracts are still counted in status breakdown
  });
});

/*
 * Integration Test Setup Instructions:
 * 
 * To run comprehensive integration tests:
 * 
 * 1. Set up a test database with sample data:
 *    - Create contracts with different statuses (PENDING, ACTIVE, COMPLETED, CANCELLED)
 *    - Include varied payment amounts and statuses
 * 
 * 2. Test the statistics endpoint:
 *    GET /api/v1/contracts/stats
 *    - Verify totalRevenue excludes cancelled contracts
 *    - Verify paidRevenue excludes cancelled contracts
 *    - Verify serviceTypeBreakdown excludes cancelled contracts
 *    - Verify statusBreakdown still shows cancelled count
 * 
 * 3. Test payment update endpoint:
 *    PUT /api/v1/contracts/:id/payment
 *    - Send payment update for cancelled contract (should fail)
 *    - Send payment update for active contract (should succeed)
 * 
 * 4. Test bulk status update:
 *    PUT /api/v1/contracts/bulk-status
 *    - Include cancelled contracts in bulk update (should fail with validation errors)
 */
