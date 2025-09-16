import { PrismaClient, ClientStatus, Prisma } from '@prisma/client';
import { 
  ClientQuery, 
  CreateClientInput, 
  UpdateClientInput, 
  ClientListResponse,
  ClientStatsResponse,
  ClientSearchResult
} from '../types/client';
import { logger } from '../utils/logger';

export class ClientRepository {
  constructor(private prisma: PrismaClient) {}

  // Get clients with filtering, sorting, and pagination
  async findMany(query: ClientQuery): Promise<ClientListResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ClientWhereInput = {
        isActive: true,
        ...(status && { status }),
        ...(search && {
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { telephone: { contains: search, mode: 'insensitive' } },
            { adresse: { contains: search, mode: 'insensitive' } },
            { profession: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      // Build order by clause
      const orderBy: Prisma.ClientOrderByWithRelationInput = {
        [sortBy]: sortOrder
      };

      // Execute queries in parallel
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.client.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        clients,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error in ClientRepository.findMany:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  // Get client by ID
  async findById(id: string) {
    try {
      return await this.prisma.client.findFirst({
        where: {
          id,
          isActive: true
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.findById:', error);
      throw new Error('Failed to fetch client');
    }
  }

  // Create new client
  async create(data: CreateClientInput) {
    try {
      return await this.prisma.client.create({
        data: {
          ...data,
          dateNaissance: typeof data.dateNaissance === 'string' ? new Date(data.dateNaissance) : data.dateNaissance,
          datePermis: typeof data.datePermis === 'string' ? new Date(data.datePermis) : data.datePermis
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.create:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A client with this email or phone number already exists');
        }
      }
      throw new Error('Failed to create client');
    }
  }

  // Update client
  async update(id: string, data: UpdateClientInput) {
    try {
      const updateData: any = { ...data };
      
      // Convert date strings to Date objects if present
      if (data.dateNaissance) {
        updateData.dateNaissance = typeof data.dateNaissance === 'string' ? new Date(data.dateNaissance) : data.dateNaissance;
      }
      if (data.datePermis) {
        updateData.datePermis = typeof data.datePermis === 'string' ? new Date(data.datePermis) : data.datePermis;
      }

      return await this.prisma.client.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      logger.error('Error in ClientRepository.update:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A client with this email or phone number already exists');
        }
        if (error.code === 'P2025') {
          throw new Error('Client not found');
        }
      }
      throw new Error('Failed to update client');
    }
  }

  // Soft delete client
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.client.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      logger.error('Error in ClientRepository.delete:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Client not found');
        }
      }
      throw new Error('Failed to delete client');
    }
  }

  // Hard delete client
  async hardDelete(id: string): Promise<boolean> {
    try {
      await this.prisma.client.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error('Error in ClientRepository.hardDelete:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Client not found');
        }
      }
      throw new Error('Failed to permanently delete client');
    }
  }

  // Update client status
  async updateStatus(id: string, status: ClientStatus) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.updateStatus:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Client not found');
        }
      }
      throw new Error('Failed to update client status');
    }
  }

  // Search clients
  async search(searchTerm: string, limit: number = 10): Promise<ClientSearchResult[]> {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          isActive: true,
          OR: [
            { nom: { contains: searchTerm, mode: 'insensitive' } },
            { prenom: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { telephone: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
          email: true,
          status: true
        },
        take: limit,
        orderBy: {
          nom: 'asc'
        }
      });

      return clients;
    } catch (error) {
      logger.error('Error in ClientRepository.search:', error);
      throw new Error('Failed to search clients');
    }
  }

  // Check if email exists (for uniqueness validation)
  async findByEmail(email: string, excludeId?: string) {
    try {
      return await this.prisma.client.findFirst({
        where: {
          email,
          isActive: true,
          ...(excludeId && { id: { not: excludeId } })
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.findByEmail:', error);
      throw new Error('Failed to check email uniqueness');
    }
  }

  // Check if phone exists (for uniqueness validation)
  async findByPhone(telephone: string, excludeId?: string) {
    try {
      return await this.prisma.client.findFirst({
        where: {
          telephone,
          isActive: true,
          ...(excludeId && { id: { not: excludeId } })
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.findByPhone:', error);
      throw new Error('Failed to check phone uniqueness');
    }
  }

  // Get client statistics
  async getStats(): Promise<ClientStatsResponse> {
    try {
      const [
        totalClients,
        statusCounts,
        recentClientsCount,
        emailStats
      ] = await Promise.all([
        // Total active clients
        this.prisma.client.count({
          where: { isActive: true }
        }),
        // Status breakdown
        this.prisma.client.groupBy({
          by: ['status'],
          where: { isActive: true },
          _count: { status: true }
        }),
        // Recent clients (last 30 days)
        this.prisma.client.count({
          where: {
            isActive: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        // Email statistics
        this.prisma.client.aggregate({
          where: { isActive: true },
          _count: {
            email: true
          }
        })
      ]);

      // Process status breakdown
      const statusBreakdown = statusCounts.map(item => ({
        status: item.status,
        count: item._count.status
      }));

      // Calculate individual status counts
      const activeClients = statusBreakdown.find(s => s.status === ClientStatus.ACTIF)?.count || 0;
      const inactiveClients = statusBreakdown.find(s => s.status === ClientStatus.INACTIF)?.count || 0;
      const suspendedClients = statusBreakdown.find(s => s.status === ClientStatus.SUSPENDU)?.count || 0;

      return {
        totalClients,
        activeClients,
        inactiveClients,
        suspendedClients,
        statusBreakdown,
        recentClients: recentClientsCount,
        clientsWithEmail: emailStats._count.email || 0,
        clientsWithoutEmail: totalClients - (emailStats._count.email || 0)
      };
    } catch (error) {
      logger.error('Error in ClientRepository.getStats:', error);
      throw new Error('Failed to fetch client statistics');
    }
  }

  async getClientStatsComparison(period: number = 30): Promise<import('../types/statistics').ClientStatsComparison> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - (period * 2) * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;

    const [currentStats, previousStats] = await Promise.all([
      this.getClientStatsByPeriod(currentPeriodStart, now),
      this.getClientStatsByPeriod(previousPeriodStart, previousPeriodEnd)
    ]);

    const { calculatePercentageChange } = await import('../types/statistics');

    const percentageChanges = {
      totalClients: calculatePercentageChange(currentStats.totalClients, previousStats.totalClients),
      activeClients: calculatePercentageChange(currentStats.activeClients, previousStats.activeClients),
      inactiveClients: calculatePercentageChange(currentStats.inactiveClients, previousStats.inactiveClients),
      suspendedClients: calculatePercentageChange(currentStats.suspendedClients, previousStats.suspendedClients),
      recentClients: calculatePercentageChange(currentStats.recentClients, previousStats.recentClients),
      clientsWithEmail: calculatePercentageChange(currentStats.clientsWithEmail, previousStats.clientsWithEmail),
      clientsWithoutEmail: calculatePercentageChange(currentStats.clientsWithoutEmail, previousStats.clientsWithoutEmail),
    };

    return {
      current: {
        totalClients: currentStats.totalClients,
        activeClients: currentStats.activeClients,
        inactiveClients: currentStats.inactiveClients,
        suspendedClients: currentStats.suspendedClients,
        recentClients: currentStats.recentClients,
        clientsWithEmail: currentStats.clientsWithEmail,
        clientsWithoutEmail: currentStats.clientsWithoutEmail,
        statusBreakdown: currentStats.statusBreakdown,
      },
      previous: {
        totalClients: previousStats.totalClients,
        activeClients: previousStats.activeClients,
        inactiveClients: previousStats.inactiveClients,
        suspendedClients: previousStats.suspendedClients,
        recentClients: previousStats.recentClients,
        clientsWithEmail: previousStats.clientsWithEmail,
        clientsWithoutEmail: previousStats.clientsWithoutEmail,
        statusBreakdown: previousStats.statusBreakdown,
      },
      percentageChanges
    };
  }

  private async getClientStatsByPeriod(startDate: Date, endDate: Date) {
    try {
      const [
        totalClients,
        statusBreakdown,
        recentClientsCount,
        emailStats
      ] = await Promise.all([
        this.prisma.client.count({
          where: {
            isActive: true,
            createdAt: { lte: endDate }
          }
        }),
        this.prisma.client.groupBy({
          by: ['status'],
          where: {
            isActive: true,
            createdAt: { lte: endDate }
          },
          _count: { status: true }
        }),
        this.prisma.client.count({
          where: {
            isActive: true,
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        this.prisma.client.aggregate({
          where: {
            isActive: true,
            createdAt: { lte: endDate }
          },
          _count: { email: true }
        })
      ]);

      const activeClients = statusBreakdown.find(s => s.status === 'ACTIF')?._count.status || 0;
      const inactiveClients = statusBreakdown.find(s => s.status === 'INACTIF')?._count.status || 0;
      const suspendedClients = statusBreakdown.find(s => s.status === 'SUSPENDU')?._count.status || 0;

      return {
        totalClients,
        activeClients,
        inactiveClients,
        suspendedClients,
        recentClients: recentClientsCount,
        clientsWithEmail: emailStats._count.email || 0,
        clientsWithoutEmail: totalClients - (emailStats._count.email || 0),
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.status,
        }))
      };
    } catch (error) {
      logger.error('Error in ClientRepository.getClientStatsByPeriod:', error);
      throw new Error('Failed to fetch client statistics for period');
    }
  }

  // Bulk status update
  async bulkUpdateStatus(clientIds: string[], status: ClientStatus): Promise<number> {
    try {
      const result = await this.prisma.client.updateMany({
        where: {
          id: { in: clientIds },
          isActive: true
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      logger.error('Error in ClientRepository.bulkUpdateStatus:', error);
      throw new Error('Failed to bulk update client status');
    }
  }

  // Get clients by status
  async findByStatus(status: ClientStatus, limit?: number) {
    try {
      return await this.prisma.client.findMany({
        where: {
          status,
          isActive: true
        },
        ...(limit && { take: limit }),
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error in ClientRepository.findByStatus:', error);
      throw new Error('Failed to fetch clients by status');
    }
  }

  // Check if client exists
  async exists(id: string): Promise<boolean> {
    try {
      const client = await this.prisma.client.findFirst({
        where: {
          id,
          isActive: true
        },
        select: { id: true }
      });

      return !!client;
    } catch (error) {
      logger.error('Error in ClientRepository.exists:', error);
      return false;
    }
  }
}