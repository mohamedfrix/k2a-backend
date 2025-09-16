import { PrismaClient, Prisma } from '@prisma/client';
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
  VehicleCalendarDay,
  ContractDashboardData,
  BulkContractResult
} from '../types/contract';

export class ContractRepository {
  constructor(private prisma: PrismaClient) {}

  // Generate unique contract number
  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CNT${year}`;
    
    // Find the last contract number for this year
    const lastContract = await this.prisma.contract.findFirst({
      where: {
        contractNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        contractNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastContract) {
      const lastNumber = parseInt(lastContract.contractNumber.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate contract totals
  private calculateContractTotals(input: CreateContractInput): {
    totalDays: number;
    subtotal: number;
    accessoriesTotal: number;
    totalAmount: number;
  } {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const subtotal = input.dailyRate * totalDays;
    const accessoriesTotal = input.accessories?.reduce((sum, acc) => sum + (acc.price * acc.quantity), 0) || 0;
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + accessoriesTotal - discountAmount;

    return {
      totalDays,
      subtotal,
      accessoriesTotal,
      totalAmount
    };
  }

  // Create a new contract
  async create(input: CreateContractInput): Promise<ContractResponse> {
    const contractNumber = await this.generateContractNumber();
    const calculations = this.calculateContractTotals(input);

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        clientId: input.clientId,
        vehicleId: input.vehicleId,
        adminId: input.adminId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays: calculations.totalDays,
        serviceType: input.serviceType,
        dailyRate: input.dailyRate,
        accessoriesTotal: calculations.accessoriesTotal,
        subtotal: calculations.subtotal,
        discountAmount: input.discountAmount,
        totalAmount: calculations.totalAmount,
        notes: input.notes,
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        accessories: {
          create: input.accessories?.map(acc => ({
            name: acc.name,
            price: acc.price,
            quantity: acc.quantity
          })) || []
        }
      },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            pricePerDay: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        accessories: true
      }
    });

    return this.mapToContractResponse(contract);
  }

  // Find all contracts with filtering and pagination
  async findAll(query: ContractQuery): Promise<ContractListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      clientId,
      vehicleId,
      adminId,
      status,
      paymentStatus,
      serviceType,
      startDate,
      endDate,
      contractNumber,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: Prisma.ContractWhereInput = {
      ...(clientId && { clientId }),
      ...(vehicleId && { vehicleId }),
      ...(adminId && { adminId }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(serviceType && { serviceType }),
      ...(contractNumber && { contractNumber: { contains: contractNumber, mode: 'insensitive' } }),
      ...(startDate && endDate && {
        OR: [
          {
            startDate: { gte: startDate, lte: endDate }
          },
          {
            endDate: { gte: startDate, lte: endDate }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      }),
      ...(search && {
        OR: [
          { contractNumber: { contains: search, mode: 'insensitive' } },
          { client: { nom: { contains: search, mode: 'insensitive' } } },
          { client: { prenom: { contains: search, mode: 'insensitive' } } },
          { vehicle: { make: { contains: search, mode: 'insensitive' } } },
          { vehicle: { model: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              telephone: true,
              email: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
              pricePerDay: true
            }
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          accessories: true
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.contract.count({ where })
    ]);

    return {
      contracts: contracts.map(this.mapToContractResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Find contract by ID
  async findById(id: string): Promise<ContractResponse | null> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            pricePerDay: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        accessories: true
      }
    });

    return contract ? this.mapToContractResponse(contract) : null;
  }

  // Update contract
  async update(id: string, input: UpdateContractInput): Promise<ContractResponse | null> {
    // If dates or pricing changed, recalculate totals
    let updateData: any = { ...input };
    
    if (input.startDate || input.endDate || input.dailyRate || input.accessories) {
      const currentContract = await this.prisma.contract.findUnique({
        where: { id },
        include: { accessories: true }
      });

      if (!currentContract) return null;

      const calculationInput: CreateContractInput = {
        clientId: currentContract.clientId,
        vehicleId: currentContract.vehicleId,
        startDate: input.startDate || currentContract.startDate,
        endDate: input.endDate || currentContract.endDate,
        serviceType: currentContract.serviceType,
        dailyRate: input.dailyRate || Number(currentContract.dailyRate),
        discountAmount: input.discountAmount ?? Number(currentContract.discountAmount || 0),
        accessories: input.accessories || currentContract.accessories.map(acc => ({
          name: acc.name,
          price: Number(acc.price),
          quantity: acc.quantity
        }))
      };

      const calculations = this.calculateContractTotals(calculationInput);
      updateData = {
        ...updateData,
        totalDays: calculations.totalDays,
        subtotal: calculations.subtotal,
        accessoriesTotal: calculations.accessoriesTotal,
        totalAmount: calculations.totalAmount
      };

      // Update accessories if provided
      if (input.accessories) {
        // Delete existing accessories and create new ones
        await this.prisma.contractAccessory.deleteMany({
          where: { contractId: id }
        });
        
        updateData.accessories = {
          create: input.accessories.map(acc => ({
            name: acc.name,
            price: acc.price,
            quantity: acc.quantity
          }))
        };
      }
    }

    const contract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            pricePerDay: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        accessories: true
      }
    });

    return this.mapToContractResponse(contract);
  }

  // Delete contract
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.contract.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check vehicle availability
  async checkVehicleAvailability(request: VehicleAvailabilityRequest): Promise<VehicleAvailabilityResponse> {
    const conflictingContracts = await this.prisma.contract.findMany({
      where: {
        vehicleId: request.vehicleId,
        ...(request.excludeContractId && { NOT: { id: request.excludeContractId } }),
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE'] // Exclude completed and cancelled
        },
        OR: [
          {
            startDate: { lte: request.endDate },
            endDate: { gte: request.startDate }
          }
        ]
      },
      select: {
        id: true,
        contractNumber: true,
        startDate: true,
        endDate: true,
        status: true
      }
    });

    return {
      available: conflictingContracts.length === 0,
      conflictingContracts: conflictingContracts as any
    };
  }

  // Get vehicle calendar data
  async getVehicleCalendar(vehicleId: string, month: number, year: number): Promise<VehicleCalendarResponse> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const contracts = await this.prisma.contract.findMany({
      where: {
        vehicleId,
        OR: [
          {
            startDate: { lte: endOfMonth },
            endDate: { gte: startOfMonth }
          }
        ]
      },
      include: {
        client: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });

    const days: VehicleCalendarDay[] = [];
    
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayContracts = contracts.filter(contract => {
        const contractStart = new Date(contract.startDate);
        const contractEnd = new Date(contract.endDate);
        // Treat contract coverage as inclusive of the end date when marking calendar days.
        // Compare currentDate < contractEnd + 1 day to ensure the end date is shown as unavailable.
        const contractEndPlusOne = new Date(contractEnd.getFullYear(), contractEnd.getMonth(), contractEnd.getDate() + 1);
        return currentDate >= contractStart && currentDate < contractEndPlusOne;
      });

      days.push({
        date: currentDate,
        isAvailable: dayContracts.length === 0,
        contracts: dayContracts.map(contract => ({
          id: contract.id,
          contractNumber: contract.contractNumber,
          status: contract.status as any,
          client: {
            nom: contract.client.nom,
            prenom: contract.client.prenom
          }
        }))
      });
    }

    return {
      vehicleId,
      month,
      year,
      days
    };
  }

  // Get contract statistics
  async getContractStats(): Promise<ContractStatsResponse> {
    const [
      totalContracts,
      statusCounts,
      paymentCounts,
      serviceTypeCounts,
      revenueData,
      recentContracts
    ] = await Promise.all([
      this.prisma.contract.count(),
      this.prisma.contract.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.contract.groupBy({
        by: ['paymentStatus'],
        _count: { paymentStatus: true },
        _sum: { paidAmount: true },
        where: {
          status: { not: 'CANCELLED' } // Exclude cancelled contracts from payment statistics
        }
      }),
      this.prisma.contract.groupBy({
        by: ['serviceType'],
        _count: { serviceType: true },
        _sum: { totalAmount: true },
        where: {
          status: { not: 'CANCELLED' } // Exclude cancelled contracts from service type revenue
        }
      }),
      this.prisma.contract.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        _avg: { totalAmount: true, totalDays: true },
        where: {
          status: { not: 'CANCELLED' } // Exclude cancelled contracts from overall revenue calculations
        }
      }),
      this.prisma.contract.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return {
      totalContracts,
      activeContracts: statusCounts.find(s => s.status === 'ACTIVE')?._count.status || 0,
      completedContracts: statusCounts.find(s => s.status === 'COMPLETED')?._count.status || 0,
      cancelledContracts: statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      pendingContracts: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      
      totalRevenue: Number(revenueData._sum.totalAmount || 0),
      paidRevenue: Number(revenueData._sum.paidAmount || 0),
      pendingRevenue: Number(revenueData._sum.totalAmount || 0) - Number(revenueData._sum.paidAmount || 0),
      
      serviceTypeBreakdown: serviceTypeCounts.map(item => ({
        serviceType: item.serviceType as any,
        count: item._count.serviceType,
        revenue: Number(item._sum.totalAmount || 0)
      })),
      
      statusBreakdown: statusCounts.map(item => ({
        status: item.status as any,
        count: item._count.status
      })),
      
      paymentStatusBreakdown: paymentCounts.map(item => ({
        paymentStatus: item.paymentStatus as any,
        count: item._count.paymentStatus,
        amount: Number(item._sum.paidAmount || 0)
      })),
      
      recentContracts,
      averageContractValue: Number(revenueData._avg.totalAmount || 0),
      averageRentalDuration: Number(revenueData._avg.totalDays || 0)
    };
  }

  // Get dashboard data
  async getDashboardData(): Promise<ContractDashboardData> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      todayCheckIns,
      todayCheckOuts,
      upcomingContracts,
      overduePayments
    ] = await Promise.all([
      this.prisma.contract.findMany({
        where: {
          startDate: { gte: todayStart, lt: todayEnd },
          status: 'CONFIRMED'
        },
        include: this.getContractIncludes(),
        take: 10
      }),
      this.prisma.contract.findMany({
        where: {
          endDate: { gte: todayStart, lt: todayEnd },
          status: 'ACTIVE'
        },
        include: this.getContractIncludes(),
        take: 10
      }),
      this.prisma.contract.findMany({
        where: {
          startDate: { gt: today },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: this.getContractIncludes(),
        orderBy: { startDate: 'asc' },
        take: 10
      }),
      this.prisma.contract.findMany({
        where: {
          paymentStatus: { in: ['PENDING', 'PARTIAL'] },
          endDate: { lt: today }
        },
        include: this.getContractIncludes(),
        take: 10
      })
    ]);

    return {
      todayCheckIns: todayCheckIns.map(this.mapToContractResponse),
      todayCheckOuts: todayCheckOuts.map(this.mapToContractResponse),
      upcomingContracts: upcomingContracts.map(this.mapToContractResponse),
      overduePayments: overduePayments.map(this.mapToContractResponse),
      recentActivity: [] // TODO: Implement activity tracking
    };
  }

  // Bulk update contract status
  async bulkUpdateStatus(contractIds: string[], status: any, adminId?: string): Promise<BulkContractResult> {
    try {
      const result = await this.prisma.contract.updateMany({
        where: { id: { in: contractIds } },
        data: { 
          status,
          ...(adminId && { adminId })
        }
      });

      return {
        success: true,
        affectedCount: result.count
      };
    } catch (error) {
      return {
        success: false,
        affectedCount: 0,
        errors: [{ contractId: 'bulk', error: 'Failed to update contracts' }]
      };
    }
  }

  // Helper method for contract includes
  private getContractIncludes() {
    return {
      client: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
          email: true
        }
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          licensePlate: true,
          pricePerDay: true
        }
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      accessories: true
    };
  }

  // Helper method to map Prisma result to ContractResponse
  private mapToContractResponse(contract: any): ContractResponse {
    return {
      id: contract.id,
      contractNumber: contract.contractNumber,
      clientId: contract.clientId,
      vehicleId: contract.vehicleId,
      adminId: contract.adminId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      totalDays: contract.totalDays,
      status: contract.status,
      serviceType: contract.serviceType,
      dailyRate: Number(contract.dailyRate),
      accessoriesTotal: Number(contract.accessoriesTotal),
      subtotal: Number(contract.subtotal),
      discountAmount: contract.discountAmount ? Number(contract.discountAmount) : null,
      totalAmount: Number(contract.totalAmount),
      paymentStatus: contract.paymentStatus,
      paidAmount: Number(contract.paidAmount),
      notes: contract.notes,
      pickupLocation: contract.pickupLocation,
      dropoffLocation: contract.dropoffLocation,
      client: contract.client,
      vehicle: contract.vehicle,
      admin: contract.admin,
      accessories: contract.accessories?.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        price: Number(acc.price),
        quantity: acc.quantity
      })) || [],
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt
    };
  }
}