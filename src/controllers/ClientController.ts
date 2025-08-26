import { Request, Response } from 'express';
import { ClientStatus } from '@prisma/client';
import { 
  ClientQuery, 
  CreateClientRequest, 
  UpdateClientRequest
} from '../types/client';
import { 
  createClientSchema, 
  updateClientSchema, 
  clientQuerySchema,
  clientStatusSchema,
  bulkClientStatusSchema,
  clientSearchSchema,
  CreateClientInput,
  UpdateClientInput,
  ClientQueryInput
} from '../validators/clientValidators';
import { ClientService } from '../services/ClientService';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService(prisma);
  }

  // Helper method for consistent error responses
  private sendError(res: Response, message: string, statusCode: number = 500, details?: any): Response {
    logger.error(`ClientController Error: ${message}`, { statusCode, details });
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details })
    });
  }

  // Helper method for consistent success responses
  private sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  // Helper method for error handling
  private handleError(error: any, res: Response, operation: string): Response {
    if (error.name === 'ZodError') {
      return this.sendError(res, 'Validation failed', 400, error.errors);
    }
    
    logger.error(`Error in ${operation}:`, error);
    return this.sendError(res, error.message || `Failed to ${operation}`, 500);
  }

  // Get all clients with filtering, sorting, and pagination
  getAllClients = async (req: Request, res: Response): Promise<Response> => {
    try {
      const validatedQuery = clientQuerySchema.parse(req.query);
      const result = await this.clientService.getAllClients(validatedQuery);
      return this.sendSuccess(res, result, 'Clients retrieved successfully');
    } catch (error: any) {
      // Handle specific database/table errors gracefully
      if (error.code === 'P2021') {
        // Table doesn't exist, return empty result with helpful message
        const emptyResult = {
          clients: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        };
        return this.sendSuccess(res, emptyResult, 'No clients found - database not initialized. Please run migrations.');
      }
      
      return this.handleError(error, res, 'get clients');
    }
  };

  // Get client by ID
  getClientById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const client = await this.clientService.getClientById(id);
      
      if (!client) {
        return this.sendError(res, 'Client not found', 404);
      }
      
      return this.sendSuccess(res, client, 'Client retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'get client');
    }
  };

  // Create a new client
  createClient = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const validatedData = createClientSchema.parse(req.body);
      const client = await this.clientService.createClient(validatedData);
      
      logger.info(`Client created successfully: ${client.id}`, {
        adminId: req.admin?.adminId,
        clientId: client.id
      });
      
      return this.sendSuccess(res, client, 'Client created successfully', 201);
    } catch (error) {
      return this.handleError(error, res, 'create client');
    }
  };

  // Update a client
  updateClient = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const validatedData = updateClientSchema.parse(req.body);
      
      const client = await this.clientService.updateClient(id, validatedData);
      
      if (!client) {
        return this.sendError(res, 'Client not found', 404);
      }
      
      logger.info(`Client updated successfully: ${id}`, {
        adminId: req.admin?.adminId,
        clientId: id
      });
      
      return this.sendSuccess(res, client, 'Client updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'update client');
    }
  };

  // Soft delete a client
  deleteClient = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      const success = await this.clientService.deleteClient(id);
      
      if (!success) {
        return this.sendError(res, 'Failed to delete client', 500);
      }
      
      logger.info(`Client soft deleted: ${id}`, {
        adminId: req.admin?.adminId,
        clientId: id
      });
      
      return this.sendSuccess(res, null, 'Client deleted successfully');
    } catch (error) {
      return this.handleError(error, res, 'delete client');
    }
  };

  // Hard delete a client (permanently remove)
  hardDeleteClient = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      const success = await this.clientService.hardDeleteClient(id);
      
      if (!success) {
        return this.sendError(res, 'Failed to permanently delete client', 500);
      }
      
      logger.info(`Client permanently deleted: ${id}`, {
        adminId: req.admin?.adminId,
        clientId: id
      });

      return this.sendSuccess(res, null, 'Client permanently deleted');
    } catch (error) {
      return this.handleError(error, res, 'permanently delete client');
    }
  };

  // Update client status
  updateClientStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const validatedData = clientStatusSchema.parse(req.body);
      
      const client = await this.clientService.updateClientStatus(id, validatedData.status);
      
      if (!client) {
        return this.sendError(res, 'Client not found', 404);
      }
      
      logger.info(`Client status updated: ${id} to ${validatedData.status}`, {
        adminId: req.admin?.adminId,
        clientId: id
      });
      
      return this.sendSuccess(res, client, 'Client status updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'update client status');
    }
  };

  // Search clients
  searchClients = async (req: Request, res: Response): Promise<Response> => {
    try {
      const validatedQuery = clientSearchSchema.parse(req.query);
      const clients = await this.clientService.searchClients(validatedQuery.query, validatedQuery.limit);
      return this.sendSuccess(res, clients, 'Client search completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'search clients');
    }
  };

  // Get client statistics
  getClientStats = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const stats = await this.clientService.getClientStats();
      return this.sendSuccess(res, stats, 'Client statistics retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'get client statistics');
    }
  };

  // Bulk update client status
  bulkUpdateClientStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const validatedData = bulkClientStatusSchema.parse(req.body);
      
      const result = await this.clientService.bulkUpdateClientStatus(
        validatedData.clientIds, 
        validatedData.status
      );
      
      logger.info(`Bulk client status update completed: ${result.affectedCount} clients updated`, {
        adminId: req.admin?.adminId,
        status: validatedData.status
      });
      
      return this.sendSuccess(res, result, 'Bulk client status update completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'bulk update client status');
    }
  };

  // Get clients by status
  getClientsByStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { status } = req.params;
      
      if (!Object.values(ClientStatus).includes(status as ClientStatus)) {
        return this.sendError(res, 'Invalid client status', 400);
      }
      
      const limit = parseInt(req.query.limit as string) || undefined;
      const clients = await this.clientService.getClientsByStatus(status as ClientStatus, limit);
      
      return this.sendSuccess(res, clients, `Clients with ${status} status retrieved successfully`);
    } catch (error) {
      return this.handleError(error, res, 'get clients by status');
    }
  };

  // Check client availability (for future booking system)
  checkClientAvailability = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return this.sendError(res, 'Start date and end date are required', 400);
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return this.sendError(res, 'Invalid date format', 400);
      }
      
      if (start >= end) {
        return this.sendError(res, 'Start date must be before end date', 400);
      }
      
      const availability = await this.clientService.checkClientAvailability(id, start, end);
      
      return this.sendSuccess(res, { available: availability }, 'Client availability checked successfully');
    } catch (error) {
      return this.handleError(error, res, 'check client availability');
    }
  };

  // Get recent clients (for dashboard)
  getRecentClients = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await this.clientService.getRecentClients(limit);
      return this.sendSuccess(res, result, 'Recent clients retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'get recent clients');
    }
  };

  // Get client count by status
  getClientCountByStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const counts = await this.clientService.getClientCountByStatus();
      return this.sendSuccess(res, counts, 'Client counts by status retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'get client count by status');
    }
  };

  // Validate unique email
  validateUniqueEmail = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email } = req.body;
      const { excludeId } = req.query;
      
      if (!email) {
        return this.sendError(res, 'Email is required', 400);
      }
      
      const isUnique = await this.clientService.validateUniqueEmail(email, excludeId as string);
      
      return this.sendSuccess(res, { isUnique }, 'Email uniqueness validated');
    } catch (error) {
      return this.handleError(error, res, 'validate email uniqueness');
    }
  };

  // Validate unique phone
  validateUniquePhone = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { telephone } = req.body;
      const { excludeId } = req.query;
      
      if (!telephone) {
        return this.sendError(res, 'Phone number is required', 400);
      }
      
      const isUnique = await this.clientService.validateUniquePhone(telephone, excludeId as string);
      
      return this.sendSuccess(res, { isUnique }, 'Phone uniqueness validated');
    } catch (error) {
      return this.handleError(error, res, 'validate phone uniqueness');
    }
  };
}

export default ClientController;