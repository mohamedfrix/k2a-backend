import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { validateRequest } from '../middleware/validation';
import { authenticateAdmin } from '../middleware/auth';
import { 
  createClientSchema, 
  updateClientSchema, 
  clientQuerySchema,
  clientStatusSchema,
  bulkClientStatusSchema,
  clientSearchSchema
} from '../validators/clientValidators';

const router = Router();
const clientController = new ClientController();

// Admin-only routes - All client operations require admin authentication

/**
 * @route   GET /api/v1/clients/export
 * @desc    Export clients to Excel file with filtering
 * @access  Private (Admin only)
 */
router.get(
  '/export',
  authenticateAdmin,
  clientController.exportClients
);

/**
 * @route   GET /api/v1/clients
 * @desc    Get all clients with filters and pagination
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authenticateAdmin,
  clientController.getAllClients
);

/**
 * @route   GET /api/v1/clients/search
 * @desc    Search clients by term
 * @access  Private (Admin only)
 */
router.get(
  '/search',
  authenticateAdmin,
  clientController.searchClients
);

/**
 * @route   GET /api/v1/clients/stats
 * @desc    Get client statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticateAdmin,
  clientController.getClientStats
);

/**
 * @route   GET /api/v1/clients/stats/comparison
 * @desc    Get client statistics comparison (current vs previous period)
 * @access  Private (Admin only)
 */
router.get(
  '/stats/comparison',
  authenticateAdmin,
  clientController.getClientStatsComparison
);

/**
 * @route   GET /api/v1/clients/recent
 * @desc    Get recent clients for dashboard
 * @access  Private (Admin only)
 */
router.get(
  '/recent',
  authenticateAdmin,
  clientController.getRecentClients
);

/**
 * @route   GET /api/v1/clients/count-by-status
 * @desc    Get client count by status
 * @access  Private (Admin only)
 */
router.get(
  '/count-by-status',
  authenticateAdmin,
  clientController.getClientCountByStatus
);

/**
 * @route   GET /api/v1/clients/status/:status
 * @desc    Get clients by status
 * @access  Private (Admin only)
 */
router.get(
  '/status/:status',
  authenticateAdmin,
  clientController.getClientsByStatus
);

/**
 * @route   GET /api/v1/clients/:id
 * @desc    Get client by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticateAdmin,
  clientController.getClientById
);

/**
 * @route   GET /api/v1/clients/:id/availability
 * @desc    Check client availability for date range (for future booking system)
 * @access  Private (Admin only)
 */
router.get(
  '/:id/availability',
  authenticateAdmin,
  clientController.checkClientAvailability
);

/**
 * @route   POST /api/v1/clients
 * @desc    Create new client
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateAdmin,
  validateRequest(createClientSchema),
  clientController.createClient
);

/**
 * @route   POST /api/v1/clients/validate-email
 * @desc    Validate unique email
 * @access  Private (Admin only)
 */
router.post(
  '/validate-email',
  authenticateAdmin,
  clientController.validateUniqueEmail
);

/**
 * @route   POST /api/v1/clients/validate-phone
 * @desc    Validate unique phone number
 * @access  Private (Admin only)
 */
router.post(
  '/validate-phone',
  authenticateAdmin,
  clientController.validateUniquePhone
);

/**
 * @route   PUT /api/v1/clients/:id
 * @desc    Update client
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticateAdmin,
  validateRequest(updateClientSchema),
  clientController.updateClient
);

/**
 * @route   PATCH /api/v1/clients/bulk/status
 * @desc    Bulk update client status
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk/status',
  authenticateAdmin,
  validateRequest(bulkClientStatusSchema),
  clientController.bulkUpdateClientStatus
);

/**
 * @route   PATCH /api/v1/clients/:id/status
 * @desc    Update client status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticateAdmin,
  validateRequest(clientStatusSchema),
  clientController.updateClientStatus
);

/**
 * @route   DELETE /api/v1/clients/:id
 * @desc    Soft delete client (mark as inactive)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticateAdmin,
  clientController.deleteClient
);

/**
 * @route   DELETE /api/v1/clients/:id/hard
 * @desc    Permanently delete client and all related data
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/hard',
  authenticateAdmin,
  clientController.hardDeleteClient
);

export default router;