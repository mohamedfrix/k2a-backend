import { PrismaClient, ClientStatus } from '@prisma/client';
import { ClientRepository } from '../repositories/ClientRepository';
import { 
  ClientQuery, 
  CreateClientInput, 
  UpdateClientInput, 
  ClientListResponse,
  ClientStatsResponse,
  ClientSearchResult,
  BulkOperationResult
} from '../types/client';
import { validateClientDates } from '../validators/clientValidators';
import { logger } from '../utils/logger';

export class ClientService {
  private clientRepository: ClientRepository;

  constructor(private prisma: PrismaClient) {
    this.clientRepository = new ClientRepository(prisma);
  }

  // Get all clients with filtering, sorting, and pagination
  async getAllClients(query: ClientQuery): Promise<ClientListResponse> {
    try {
      logger.info('Fetching clients with query:', query);
      return await this.clientRepository.findMany(query);
    } catch (error) {
      logger.error('Error in ClientService.getAllClients:', error);
      throw error;
    }
  }

  // Get client by ID
  async getClientById(id: string) {
    try {
      logger.info(`Fetching client with ID: ${id}`);
      const client = await this.clientRepository.findById(id);
      
      if (!client) {
        throw new Error('Client not found');
      }
      
      return client;
    } catch (error) {
      logger.error('Error in ClientService.getClientById:', error);
      throw error;
    }
  }

  // Create new client
  async createClient(data: CreateClientInput) {
    try {
      logger.info('Creating new client:', { nom: data.nom, prenom: data.prenom });

      // Validate business rules
      await this.validateClientData(data);

      // Create the client
      const client = await this.clientRepository.create(data);
      
      logger.info(`Client created successfully with ID: ${client.id}`);
      return client;
    } catch (error) {
      logger.error('Error in ClientService.createClient:', error);
      throw error;
    }
  }

  // Update existing client
  async updateClient(id: string, data: UpdateClientInput) {
    try {
      logger.info(`Updating client with ID: ${id}`, data);

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      // Validate business rules for updated data
      await this.validateClientData(data, id);

      // Update the client
      const updatedClient = await this.clientRepository.update(id, data);
      
      logger.info(`Client updated successfully: ${id}`);
      return updatedClient;
    } catch (error) {
      logger.error('Error in ClientService.updateClient:', error);
      throw error;
    }
  }

  // Delete client (soft delete)
  async deleteClient(id: string): Promise<boolean> {
    try {
      logger.info(`Soft deleting client with ID: ${id}`);

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const success = await this.clientRepository.delete(id);
      
      if (success) {
        logger.info(`Client soft deleted successfully: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error('Error in ClientService.deleteClient:', error);
      throw error;
    }
  }

  // Permanently delete client
  async hardDeleteClient(id: string): Promise<boolean> {
    try {
      logger.info(`Hard deleting client with ID: ${id}`);

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const success = await this.clientRepository.hardDelete(id);
      
      if (success) {
        logger.info(`Client permanently deleted: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error('Error in ClientService.hardDeleteClient:', error);
      throw error;
    }
  }

  // Update client status
  async updateClientStatus(id: string, status: ClientStatus) {
    try {
      logger.info(`Updating client status: ${id} to ${status}`);

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const updatedClient = await this.clientRepository.updateStatus(id, status);
      
      logger.info(`Client status updated successfully: ${id}`);
      return updatedClient;
    } catch (error) {
      logger.error('Error in ClientService.updateClientStatus:', error);
      throw error;
    }
  }

  // Search clients
  async searchClients(searchTerm: string, limit: number = 10): Promise<ClientSearchResult[]> {
    try {
      logger.info(`Searching clients with term: ${searchTerm}`);
      
      if (searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }

      return await this.clientRepository.search(searchTerm, limit);
    } catch (error) {
      logger.error('Error in ClientService.searchClients:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(): Promise<ClientStatsResponse> {
    try {
      logger.info('Fetching client statistics');
      return await this.clientRepository.getStats();
    } catch (error) {
      logger.error('Error in ClientService.getClientStats:', error);
      throw error;
    }
  }

  async getClientStatsComparison(period: number = 30): Promise<import('../types/statistics').ClientStatsComparison> {
    try {
      logger.info(`Fetching client statistics comparison for period: ${period} days`);
      return await this.clientRepository.getClientStatsComparison(period);
    } catch (error) {
      logger.error('Error in ClientService.getClientStatsComparison:', error);
      throw error;
    }
  }

  // Bulk update client status
  async bulkUpdateClientStatus(clientIds: string[], status: ClientStatus): Promise<BulkOperationResult> {
    try {
      logger.info(`Bulk updating ${clientIds.length} clients to status: ${status}`);

      if (clientIds.length === 0) {
        throw new Error('No client IDs provided');
      }

      if (clientIds.length > 100) {
        throw new Error('Cannot update more than 100 clients at once');
      }

      // Validate that all clients exist
      const errors: Array<{ clientId: string; error: string }> = [];
      
      for (const clientId of clientIds) {
        const exists = await this.clientRepository.exists(clientId);
        if (!exists) {
          errors.push({ clientId, error: 'Client not found' });
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          affectedCount: 0,
          errors
        };
      }

      const affectedCount = await this.clientRepository.bulkUpdateStatus(clientIds, status);
      
      logger.info(`Bulk status update completed: ${affectedCount} clients updated`);
      
      return {
        success: true,
        affectedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      logger.error('Error in ClientService.bulkUpdateClientStatus:', error);
      throw error;
    }
  }

  // Get clients by status
  async getClientsByStatus(status: ClientStatus, limit?: number) {
    try {
      logger.info(`Fetching clients with status: ${status}`);
      return await this.clientRepository.findByStatus(status, limit);
    } catch (error) {
      logger.error('Error in ClientService.getClientsByStatus:', error);
      throw error;
    }
  }

  // Check if client availability for booking (for future use)
  async checkClientAvailability(clientId: string, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      logger.info(`Checking client availability: ${clientId} from ${startDate} to ${endDate}`);
      
      // Check if client exists and is active
      const client = await this.clientRepository.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      if (client.status !== ClientStatus.ACTIF) {
        return false;
      }

      // TODO: When reservation system is implemented, check for overlapping bookings
      // For now, just check if client is active
      return true;
    } catch (error) {
      logger.error('Error in ClientService.checkClientAvailability:', error);
      throw error;
    }
  }

  // Validate unique email
  async validateUniqueEmail(email: string, excludeClientId?: string): Promise<boolean> {
    try {
      const existingClient = await this.clientRepository.findByEmail(email, excludeClientId);
      return !existingClient;
    } catch (error) {
      logger.error('Error in ClientService.validateUniqueEmail:', error);
      return false;
    }
  }

  // Validate unique phone
  async validateUniquePhone(telephone: string, excludeClientId?: string): Promise<boolean> {
    try {
      const existingClient = await this.clientRepository.findByPhone(telephone, excludeClientId);
      return !existingClient;
    } catch (error) {
      logger.error('Error in ClientService.validateUniquePhone:', error);
      return false;
    }
  }

  // Private method to validate client data
  private async validateClientData(data: CreateClientInput | UpdateClientInput, excludeClientId?: string) {
    // Validate date logic if both dates are provided
    if (data.dateNaissance && data.datePermis) {
      const birthDateStr = typeof data.dateNaissance === 'string' ? data.dateNaissance : data.dateNaissance.toISOString().split('T')[0];
      const licenseDateStr = typeof data.datePermis === 'string' ? data.datePermis : data.datePermis.toISOString().split('T')[0];
      
      if (!validateClientDates(birthDateStr, licenseDateStr)) {
        throw new Error('La date de permis doit être au moins 16 ans après la date de naissance');
      }
    }

    // Validate unique email if provided
    if (data.email) {
      const isEmailUnique = await this.validateUniqueEmail(data.email, excludeClientId);
      if (!isEmailUnique) {
        throw new Error('Un client avec cette adresse email existe déjà');
      }
    }

    // Validate unique phone
    if (data.telephone) {
      const isPhoneUnique = await this.validateUniquePhone(data.telephone, excludeClientId);
      if (!isPhoneUnique) {
        throw new Error('Un client avec ce numéro de téléphone existe déjà');
      }
    }
  }

  // Get recent clients (for dashboard)
  async getRecentClients(limit: number = 5) {
    try {
      logger.info(`Fetching ${limit} recent clients`);
      
      return await this.clientRepository.findMany({
        page: 1,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      logger.error('Error in ClientService.getRecentClients:', error);
      throw error;
    }
  }

  // Get client count by status (quick stats)
  async getClientCountByStatus(): Promise<Record<ClientStatus, number>> {
    try {
      const stats = await this.getClientStats();
      return {
        [ClientStatus.ACTIF]: stats.activeClients,
        [ClientStatus.INACTIF]: stats.inactiveClients,
        [ClientStatus.SUSPENDU]: stats.suspendedClients
      };
    } catch (error) {
      logger.error('Error in ClientService.getClientCountByStatus:', error);
      throw error;
    }
  }
}