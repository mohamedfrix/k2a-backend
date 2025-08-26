import { Router } from 'express';
import { ContractController } from '../controllers/ContractController';
import { ContractService } from '../services/ContractService';
import { ContractRepository } from '../repositories/ContractRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { ClientRepository } from '../repositories/ClientRepository';
import { authenticateAdmin } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// Initialize dependencies
const contractRepository = new ContractRepository(prisma);
const vehicleRepository = new VehicleRepository(prisma);
const clientRepository = new ClientRepository(prisma);
const contractService = new ContractService(contractRepository, vehicleRepository, clientRepository);
const contractController = new ContractController(contractService);

/**
 * @route   POST /api/v1/contracts
 * @desc    Create a new contract
 * @access  Admin
 */
router.post(
  '/',
  authenticateAdmin,
  contractController.createContract
);

/**
 * @route   GET /api/v1/contracts
 * @desc    Get all contracts with filtering and pagination
 * @access  Admin
 */
router.get(
  '/',
  authenticateAdmin,
  contractController.getContracts
);

/**
 * @route   GET /api/v1/contracts/stats
 * @desc    Get contract statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticateAdmin,
  contractController.getContractStats
);

/**
 * @route   GET /api/v1/contracts/dashboard
 * @desc    Get dashboard data
 * @access  Admin
 */
router.get(
  '/dashboard',
  authenticateAdmin,
  contractController.getDashboardData
);

/**
 * @route   GET /api/v1/contracts/today-active
 * @desc    Get today's active contracts
 * @access  Admin
 */
router.get(
  '/today-active',
  authenticateAdmin,
  contractController.getTodayActiveContracts
);

/**
 * @route   GET /api/v1/contracts/ending-soon
 * @desc    Get contracts ending soon
 * @access  Admin
 */
router.get(
  '/ending-soon',
  authenticateAdmin,
  contractController.getContractsEndingSoon
);

/**
 * @route   PUT /api/v1/contracts/bulk-status
 * @desc    Bulk update contract status
 * @access  Admin
 */
router.put(
  '/bulk-status',
  authenticateAdmin,
  contractController.bulkUpdateStatus
);

/**
 * @route   POST /api/v1/contracts/auto-update-statuses
 * @desc    Auto-update contract statuses based on dates
 * @access  Admin
 */
router.post(
  '/auto-update-statuses',
  authenticateAdmin,
  contractController.autoUpdateStatuses
);

/**
 * @route   GET /api/v1/contracts/client/:clientId
 * @desc    Get contracts by client
 * @access  Admin
 */
router.get(
  '/client/:clientId',
  authenticateAdmin,
  contractController.getContractsByClient
);

/**
 * @route   GET /api/v1/contracts/vehicle/:vehicleId
 * @desc    Get contracts by vehicle
 * @access  Admin
 */
router.get(
  '/vehicle/:vehicleId',
  authenticateAdmin,
  contractController.getContractsByVehicle
);

/**
 * @route   GET /api/v1/contracts/vehicle/:vehicleId/availability
 * @desc    Check vehicle availability for date range
 * @access  Public (for booking form)
 */
router.get(
  '/vehicle/:vehicleId/availability',
  contractController.checkVehicleAvailability
);

/**
 * @route   GET /api/v1/contracts/vehicle/:vehicleId/calendar
 * @desc    Get vehicle calendar data
 * @access  Public (for calendar component)
 */
router.get(
  '/vehicle/:vehicleId/calendar',
  contractController.getVehicleCalendar
);

/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  Admin
 */
router.get(
  '/:id',
  authenticateAdmin,
  contractController.getContractById
);

/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update contract
 * @access  Admin
 */
router.put(
  '/:id',
  authenticateAdmin,
  contractController.updateContract
);

/**
 * @route   PUT /api/v1/contracts/:id/cancel
 * @desc    Cancel contract
 * @access  Admin
 */
router.put(
  '/:id/cancel',
  authenticateAdmin,
  contractController.cancelContract
);

/**
 * @route   PUT /api/v1/contracts/:id/confirm
 * @desc    Confirm contract
 * @access  Admin
 */
router.put(
  '/:id/confirm',
  authenticateAdmin,
  contractController.confirmContract
);

/**
 * @route   PUT /api/v1/contracts/:id/start
 * @desc    Start contract
 * @access  Admin
 */
router.put(
  '/:id/start',
  authenticateAdmin,
  contractController.startContract
);

/**
 * @route   PUT /api/v1/contracts/:id/complete
 * @desc    Complete contract
 * @access  Admin
 */
router.put(
  '/:id/complete',
  authenticateAdmin,
  contractController.completeContract
);

/**
 * @route   PUT /api/v1/contracts/:id/payment
 * @desc    Update payment status
 * @access  Admin
 */
router.put(
  '/:id/payment',
  authenticateAdmin,
  contractController.updatePayment
);

/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete contract (only pending contracts)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticateAdmin,
  contractController.deleteContract
);

export default router;