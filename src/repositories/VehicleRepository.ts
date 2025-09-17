import { PrismaClient, Vehicle, VehicleCategory, FuelType, Transmission, RentalServiceType } from '@prisma/client';
import { VehicleQuery, CreateVehicleRequest, UpdateVehicleRequest, VehicleWithImages, VehicleStats } from '../types/vehicle';
import { PaginatedResponse } from '../types';
import { imageService } from '@/services/ImageService';

export class VehicleRepository {
  constructor(private prisma: PrismaClient) {}

  // Standard vehicle include for consistent data fetching
  private readonly vehicleInclude = {
    images: {
      orderBy: { isPrimary: 'desc' as const }
    },
    rentalServices: {
      where: { isActive: true },
      select: {
        id: true,
        rentalServiceType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    }
  };

  // Helper function to transform Prisma vehicle data to VehicleWithImages
  private transformVehicleData(vehicle: any): VehicleWithImages {
    return {
      ...vehicle,
      pricePerDay: Number(vehicle.pricePerDay),
      images: vehicle.images?.map((image: any) => ({
        ...image,
        imageUrl: image.imageUrl.startsWith('http') 
          ? image.imageUrl 
          : imageService.generateImageUrl(image.imageUrl)
      })) || []
    };
  }

  async findAll(query: VehicleQuery): Promise<PaginatedResponse<VehicleWithImages>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category,
        fuelType,
        transmission,
        minPrice,
        maxPrice,
        location,
        seats,
        available,
        featured,
        rentalServices,
        startDate,
        endDate,
        search,
      } = query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
        ...(category && { category }),
        ...(fuelType && { fuelType }),
        ...(transmission && { transmission }),
        ...(minPrice && { pricePerDay: { gte: minPrice } }),
        ...(maxPrice && { pricePerDay: { lte: maxPrice } }),
        ...(location && { location: { contains: location, mode: 'insensitive' } }),
        ...(seats && { seats: { gte: seats } }),
        ...(available !== undefined && { availability: available }),
        ...(featured !== undefined && { featured }),
      };

      // Add rental services filter
      if (rentalServices && rentalServices.length > 0) {
        where.rentalServices = {
          some: {
            rentalServiceType: { in: rentalServices },
            isActive: true,
          }
        };
      }

      // Add search functionality
      if (search) {
        where.OR = [
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add date range availability check
      if (startDate && endDate) {
        where.NOT = {
          bookings: {
            some: {
              OR: [
                {
                  startDate: { lte: endDate },
                  endDate: { gte: startDate },
                },
              ],
              status: {
                in: ['CONFIRMED', 'ACTIVE'],
              },
            },
          },
        };
      }

      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where,
          include: this.vehicleInclude,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.vehicle.count({ where }),
      ]);

      return {
        data: vehicles.map(vehicle => ({
          ...vehicle,
          pricePerDay: Number(vehicle.pricePerDay),
        })) as VehicleWithImages[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      // Handle specific database errors
      if (error.code === 'P2021') {
        // Table doesn't exist - return empty result instead of throwing
        console.warn('Vehicle table does not exist, returning empty result');
        return {
          data: [],
          pagination: {
            page: query.page || 1,
            limit: query.limit || 10,
            total: 0,
            totalPages: 0,
          },
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async findById(id: string): Promise<VehicleWithImages | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id, isActive: true },
      include: this.vehicleInclude,
    });

    return vehicle ? this.transformVehicleData(vehicle) : null;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { licensePlate },
    });
  }

  // Find vehicle by ID regardless of active status (for hard delete operations)
  async findByIdIncludingInactive(id: string): Promise<VehicleWithImages | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: this.vehicleInclude,
    });

    return vehicle ? this.transformVehicleData(vehicle) : null;
  }

  async create(data: CreateVehicleRequest): Promise<VehicleWithImages> {
    const { rentalServices, ...vehicleData } = data;

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        rentalServices: {
          create: rentalServices.map(serviceType => ({
            rentalServiceType: serviceType,
            isActive: true,
          })),
        },
      },
      include: this.vehicleInclude,
    });

    return this.transformVehicleData(vehicle);
  }

  async update(id: string, data: UpdateVehicleRequest): Promise<VehicleWithImages | null> {
    const { rentalServices, ...vehicleData } = data;

    // Handle rental services update separately if provided
    if (rentalServices) {
      await this.updateRentalServices(id, rentalServices);
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: vehicleData,
      include: this.vehicleInclude,
    });

    return this.transformVehicleData(vehicle);
  }

  async updateRentalServices(vehicleId: string, rentalServices: RentalServiceType[]): Promise<void> {
    // First, deactivate all existing rental services
    await this.prisma.vehicleRentalService.updateMany({
      where: { vehicleId },
      data: { isActive: false },
    });

    // Then, create or reactivate the specified services
    for (const serviceType of rentalServices) {
      await this.prisma.vehicleRentalService.upsert({
        where: {
          vehicleId_rentalServiceType: {
            vehicleId,
            rentalServiceType: serviceType,
          },
        },
        update: { isActive: true },
        create: {
          vehicleId,
          rentalServiceType: serviceType,
          isActive: true,
        },
      });
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.vehicle.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      // Delete related rental services first
      await this.prisma.vehicleRentalService.deleteMany({
        where: { vehicleId: id },
      });

      // Delete related images
      await this.prisma.vehicleImage.deleteMany({
        where: { vehicleId: id },
      });

      // Finally delete the vehicle
      await this.prisma.vehicle.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateAvailability(id: string, availability: boolean): Promise<VehicleWithImages | null> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { availability },
      include: this.vehicleInclude,
    });

    return vehicle ? this.transformVehicleData(vehicle) : null;
  }

  async updateFeaturedStatus(id: string, featured: boolean): Promise<VehicleWithImages | null> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { featured },
      include: this.vehicleInclude,
    });

    return vehicle ? this.transformVehicleData(vehicle) : null;
  }

  async getFeaturedVehicles(limit: number = 6): Promise<VehicleWithImages[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        featured: true,
        availability: true,
        isActive: true,
      },
      include: this.vehicleInclude,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(vehicle => this.transformVehicleData(vehicle));
  }

  async getVehiclesByCategory(category: VehicleCategory): Promise<VehicleWithImages[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        category,
        availability: true,
        isActive: true,
      },
      include: this.vehicleInclude,
      orderBy: { pricePerDay: 'asc' },
    });

    return vehicles.map(vehicle => this.transformVehicleData(vehicle));
  }

  async getVehiclesByRentalService(rentalServiceType: RentalServiceType): Promise<VehicleWithImages[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        rentalServices: {
          some: {
            rentalServiceType,
            isActive: true,
          },
        },
        availability: true,
        isActive: true,
      },
      include: this.vehicleInclude,
      orderBy: { pricePerDay: 'asc' },
    });

    return vehicles.map(vehicle => this.transformVehicleData(vehicle));
  }

  async getVehicleStats(): Promise<VehicleStats> {
    const [
      totalVehicles,
      availableVehicles,
      bookedVehicles,
      categoryBreakdown,
      rentalServiceBreakdown,
      featuredVehicles,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({ where: { isActive: true, availability: true } }),
      this.prisma.vehicle.count({ where: { isActive: true, availability: false } }),
      this.prisma.vehicle.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { category: true },
      }),
      this.prisma.vehicleRentalService.groupBy({
        by: ['rentalServiceType'],
        where: { isActive: true },
        _count: { rentalServiceType: true },
      }),
      this.prisma.vehicle.count({ where: { isActive: true, featured: true } }),
    ]);

    const maintenanceVehicles = totalVehicles - availableVehicles - bookedVehicles;

    return {
      totalVehicles,
      availableVehicles,
      bookedVehicles,
      maintenanceVehicles,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      rentalServiceBreakdown: rentalServiceBreakdown.map(item => ({
        serviceType: item.rentalServiceType,
        count: item._count.rentalServiceType,
      })),
      featuredVehicles,
    };
  }

  async getVehicleStatsComparison(period: number = 30): Promise<import('../types/statistics').VehicleStatsComparison> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - (period * 2) * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;

    // Get utilization data from contracts for both periods
    const [currentStats, previousStats] = await Promise.all([
      this.getVehicleStatsByPeriod(currentPeriodStart, now),
      this.getVehicleStatsByPeriod(previousPeriodStart, previousPeriodEnd)
    ]);

    const { calculatePercentageChange } = await import('../types/statistics');

    const percentageChanges = {
      totalVehicles: calculatePercentageChange(currentStats.totalVehicles, previousStats.totalVehicles),
      availableVehicles: calculatePercentageChange(currentStats.availableVehicles, previousStats.availableVehicles),
      bookedVehicles: calculatePercentageChange(currentStats.bookedVehicles, previousStats.bookedVehicles),
      maintenanceVehicles: calculatePercentageChange(currentStats.maintenanceVehicles, previousStats.maintenanceVehicles),
      featuredVehicles: calculatePercentageChange(currentStats.featuredVehicles, previousStats.featuredVehicles),
      utilizationRate: calculatePercentageChange(
        currentStats.totalVehicles > 0 ? (currentStats.bookedVehicles / currentStats.totalVehicles) * 100 : 0,
        previousStats.totalVehicles > 0 ? (previousStats.bookedVehicles / previousStats.totalVehicles) * 100 : 0
      )
    };

    return {
      current: {
        totalVehicles: currentStats.totalVehicles,
        availableVehicles: currentStats.availableVehicles,
        bookedVehicles: currentStats.bookedVehicles,
        maintenanceVehicles: currentStats.maintenanceVehicles,
        categoryBreakdown: currentStats.categoryBreakdown,
        rentalServiceBreakdown: currentStats.rentalServiceBreakdown,
        featuredVehicles: currentStats.featuredVehicles,
      },
      previous: {
        totalVehicles: previousStats.totalVehicles,
        availableVehicles: previousStats.availableVehicles,
        bookedVehicles: previousStats.bookedVehicles,
        maintenanceVehicles: previousStats.maintenanceVehicles,
        categoryBreakdown: previousStats.categoryBreakdown,
        rentalServiceBreakdown: previousStats.rentalServiceBreakdown,
        featuredVehicles: previousStats.featuredVehicles,
      },
      percentageChanges
    };
  }

  private async getVehicleStatsByPeriod(startDate: Date, endDate: Date) {
    // Get vehicles that existed during this period
    const [
      totalVehicles,
      categoryBreakdown,
      rentalServiceBreakdown,
      featuredVehicles,
      bookedVehiclesInPeriod
    ] = await Promise.all([
      this.prisma.vehicle.count({ 
        where: { 
          isActive: true,
          createdAt: { lte: endDate }
        } 
      }),
      this.prisma.vehicle.groupBy({
        by: ['category'],
        where: { 
          isActive: true,
          createdAt: { lte: endDate }
        },
        _count: { category: true },
      }),
      this.prisma.vehicleRentalService.groupBy({
        by: ['rentalServiceType'],
        where: { 
          isActive: true,
          createdAt: { lte: endDate }
        },
        _count: { rentalServiceType: true },
      }),
      this.prisma.vehicle.count({ 
        where: { 
          isActive: true, 
          featured: true,
          createdAt: { lte: endDate }
        } 
      }),
      // Count vehicles that were booked during this period
      this.prisma.contract.findMany({
        where: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          OR: [
            {
              startDate: { gte: startDate, lte: endDate }
            },
            {
              endDate: { gte: startDate, lte: endDate }
            },
            {
              startDate: { lte: startDate },
              endDate: { gte: endDate }
            }
          ]
        },
        select: { vehicleId: true },
        distinct: ['vehicleId']
      })
    ]);

    const bookedVehicles = bookedVehiclesInPeriod.length;
    const availableVehicles = totalVehicles - bookedVehicles;
    const maintenanceVehicles = Math.max(0, totalVehicles - availableVehicles - bookedVehicles);

    return {
      totalVehicles,
      availableVehicles,
      bookedVehicles,
      maintenanceVehicles,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      rentalServiceBreakdown: rentalServiceBreakdown.map(item => ({
        serviceType: item.rentalServiceType,
        count: item._count.rentalServiceType,
      })),
      featuredVehicles,
    };
  }

  // TODO: Implement when booking system is ready
  // async checkAvailability(vehicleId: string, startDate: Date, endDate: Date): Promise<boolean> {
  //   const conflictingBooking = await this.prisma.booking.findFirst({
  //     where: {
  //       vehicleId,
  //       OR: [
  //         {
  //           startDate: { lte: endDate },
  //           endDate: { gte: startDate },
  //         },
  //       ],
  //       status: {
  //         in: ['CONFIRMED', 'ACTIVE'],
  //       },
  //     },
  //   });

  //   return !conflictingBooking;
  // }

  async updateRating(id: string, rating: number, reviewCount: number): Promise<VehicleWithImages | null> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { rating, reviewCount },
      include: this.vehicleInclude,
    });

    return vehicle ? this.transformVehicleData(vehicle) : null;
  }

  // Image management methods
  async addVehicleImage(
    vehicleId: string, 
    imagePath: string, 
    alt?: string, 
    isPrimary?: boolean
  ): Promise<any> {
    // If this is set as primary, make sure no other image is primary
    if (isPrimary) {
      await this.prisma.vehicleImage.updateMany({
        where: { vehicleId },
        data: { isPrimary: false },
      });
    }

    return await this.prisma.vehicleImage.create({
      data: {
        vehicleId,
        imageUrl: imagePath, // Store MinIO path, not full URL
        alt,
        isPrimary: isPrimary || false,
      },
    });
  }

  async updateVehicleImage(
    imageId: string,
    alt?: string,
    isPrimary?: boolean
  ): Promise<any> {
    const image = await this.prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // If setting as primary, make sure no other image for this vehicle is primary
    if (isPrimary) {
      await this.prisma.vehicleImage.updateMany({
        where: { 
          vehicleId: image.vehicleId,
          id: { not: imageId }
        },
        data: { isPrimary: false },
      });
    }

    return await this.prisma.vehicleImage.update({
      where: { id: imageId },
      data: {
        ...(alt !== undefined && { alt }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });
  }

  async deleteVehicleImage(imageId: string): Promise<{ imagePath: string; vehicleId: string }> {
    const image = await this.prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    await this.prisma.vehicleImage.delete({
      where: { id: imageId },
    });

    return {
      imagePath: image.imageUrl,
      vehicleId: image.vehicleId,
    };
  }

  async getVehicleImages(vehicleId: string): Promise<any[]> {
    return await this.prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
