import { VehicleRepository } from '../repositories/VehicleRepository';
import { VehicleQuery, CreateVehicleRequest, UpdateVehicleRequest, VehicleWithImages, VehicleStats } from '../types/vehicle';
import { PaginatedResponse } from '../types/api';
import { VehicleCategory, RentalServiceType, PrismaClient } from '@prisma/client';
import { imageService } from '@/services/ImageService';

export class VehicleService {
  private vehicleRepository: VehicleRepository;

  constructor(private prisma: PrismaClient) {
    this.vehicleRepository = new VehicleRepository(prisma);
  }

  async getAllVehicles(query: VehicleQuery): Promise<PaginatedResponse<VehicleWithImages>> {
    return this.vehicleRepository.findAll(query);
  }

  async getVehicleById(id: string): Promise<VehicleWithImages | null> {
    return this.vehicleRepository.findById(id);
  }

  async createVehicle(data: CreateVehicleRequest): Promise<VehicleWithImages> {
    // Check if license plate already exists
    const existingVehicle = await this.vehicleRepository.findByLicensePlate(data.licensePlate);
    if (existingVehicle) {
      throw new Error('Vehicle with this license plate already exists');
    }

    // Check VIN if provided
    if (data.vin) {
      const existingVin = await this.prisma.vehicle.findUnique({
        where: { vin: data.vin },
      });

      if (existingVin) {
        throw new Error('Vehicle with this VIN already exists');
      }
    }

    // Ensure at least one rental service is provided
    if (!data.rentalServices || data.rentalServices.length === 0) {
      throw new Error('At least one rental service must be specified');
    }

    return this.vehicleRepository.create(data);
  }

  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<VehicleWithImages | null> {
    // Check if vehicle exists
    const existingVehicle = await this.vehicleRepository.findById(id);
    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    // Check license plate uniqueness if it's being updated
    if (data.licensePlate && data.licensePlate !== existingVehicle.licensePlate) {
      const vehicleWithSamePlate = await this.vehicleRepository.findByLicensePlate(data.licensePlate);
      if (vehicleWithSamePlate) {
        throw new Error('Vehicle with this license plate already exists');
      }
    }

    // Check VIN uniqueness if being updated
    if (data.vin && data.vin !== existingVehicle.vin) {
      const existingVin = await this.prisma.vehicle.findUnique({
        where: { vin: data.vin },
      });

      if (existingVin) {
        throw new Error('Vehicle with this VIN already exists');
      }
    }

    return this.vehicleRepository.update(id, data);
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return this.vehicleRepository.delete(id);
  }

  async hardDeleteVehicle(id: string): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findByIdIncludingInactive(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return this.vehicleRepository.hardDelete(id);
  }

  async updateVehicleAvailability(id: string, availability: boolean): Promise<VehicleWithImages | null> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return this.vehicleRepository.updateAvailability(id, availability);
  }

  async updateVehicleFeaturedStatus(id: string, featured: boolean): Promise<VehicleWithImages | null> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return this.vehicleRepository.updateFeaturedStatus(id, featured);
  }

  async updateVehicleRentalServices(id: string, rentalServices: RentalServiceType[]): Promise<VehicleWithImages | null> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (!rentalServices || rentalServices.length === 0) {
      throw new Error('At least one rental service must be specified');
    }

    await this.vehicleRepository.updateRentalServices(id, rentalServices);
    return this.vehicleRepository.findById(id);
  }

  async getFeaturedVehicles(limit: number = 6): Promise<VehicleWithImages[]> {
    return this.vehicleRepository.getFeaturedVehicles(limit);
  }

  async getVehiclesByCategory(category: VehicleCategory): Promise<VehicleWithImages[]> {
    return this.vehicleRepository.getVehiclesByCategory(category);
  }

  async getVehiclesByRentalService(rentalServiceType: RentalServiceType): Promise<VehicleWithImages[]> {
    return this.vehicleRepository.getVehiclesByRentalService(rentalServiceType);
  }

  async getVehicleStats(): Promise<VehicleStats> {
    return this.vehicleRepository.getVehicleStats();
  }

  async getVehicleStatsComparison(period: number = 30): Promise<import('../types/statistics').VehicleStatsComparison> {
    return this.vehicleRepository.getVehicleStatsComparison(period);
  }

  async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: boolean; vehicle?: VehicleWithImages }> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (!vehicle.availability) {
      return { available: false, vehicle };
    }

    // TODO: Implement booking availability check when booking system is ready
    // For now, return true if vehicle is generally available
    return { available: true, vehicle };
  }

  async updateVehicleRating(id: string, rating: number, reviewCount: number): Promise<VehicleWithImages | null> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    if (reviewCount < 0) {
      throw new Error('Review count cannot be negative');
    }

    return this.vehicleRepository.updateRating(id, rating, reviewCount);
  }

  async searchVehicles(searchTerm: string, limit: number = 10): Promise<VehicleWithImages[]> {
    const query: VehicleQuery = {
      search: searchTerm,
      limit,
      available: true,
    };

    const result = await this.vehicleRepository.findAll(query);
    return result.data;
  }

  async getAvailableVehiclesForDateRange(
    startDate: Date,
    endDate: Date,
    filters?: Partial<VehicleQuery>
  ): Promise<VehicleWithImages[]> {
    const query: VehicleQuery = {
      ...filters,
      available: true,
      startDate,
      endDate,
      limit: 100, // Large limit to get all available vehicles
    };

    const result = await this.vehicleRepository.findAll(query);
    return result.data;
  }

  async getVehicleRecommendations(
    vehicleId: string,
    limit: number = 4
  ): Promise<VehicleWithImages[]> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get similar vehicles based on category and price range
    const priceRange = vehicle.pricePerDay * 0.3; // 30% price tolerance
    const query: VehicleQuery = {
      category: vehicle.category,
      minPrice: Math.max(0, vehicle.pricePerDay - priceRange),
      maxPrice: vehicle.pricePerDay + priceRange,
      available: true,
      limit,
    };

    const result = await this.vehicleRepository.findAll(query);
    
    // Filter out the current vehicle from recommendations
    return result.data.filter((v: VehicleWithImages) => v.id !== vehicleId);
  }

  async bulkUpdateVehicleAvailability(
    vehicleIds: string[],
    availability: boolean
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of vehicleIds) {
      try {
        // Check if vehicle exists and is active
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) {
          failed.push(id);
          continue;
        }
        
        // Update availability directly via repository
        const updatedVehicle = await this.vehicleRepository.updateAvailability(id, availability);
        if (updatedVehicle) {
          success.push(id);
        } else {
          failed.push(id);
        }
      } catch (error) {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async bulkUpdateVehicleFeaturedStatus(
    vehicleIds: string[],
    featured: boolean
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of vehicleIds) {
      try {
        // Check if vehicle exists and is active
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) {
          failed.push(id);
          continue;
        }
        
        // Update featured status directly via repository
        const updatedVehicle = await this.vehicleRepository.updateFeaturedStatus(id, featured);
        if (updatedVehicle) {
          success.push(id);
        } else {
          failed.push(id);
        }
      } catch (error) {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async validateVehicleData(data: CreateVehicleRequest | UpdateVehicleRequest): Promise<string[]> {
    const errors: string[] = [];

    // Additional business logic validations
    if ('year' in data && data.year) {
      const currentYear = new Date().getFullYear();
      if (data.year > currentYear + 1) {
        errors.push('Vehicle year cannot be more than one year in the future');
      }
    }

    if ('pricePerDay' in data && data.pricePerDay !== undefined) {
      if (data.pricePerDay <= 0) {
        errors.push('Price per day must be greater than 0');
      }
      if (data.pricePerDay > 10000) {
        errors.push('Price per day cannot exceed 10,000');
      }
    }

    if ('mileage' in data && data.mileage !== undefined) {
      if (data.mileage < 0) {
        errors.push('Mileage cannot be negative');
      }
      if (data.mileage > 1000000) {
        errors.push('Mileage seems unrealistic (over 1,000,000)');
      }
    }

    return errors;
  }
  
  // Image management methods
  async uploadVehicleImages(
    vehicleId: string, 
    files: Express.Multer.File[], 
    imageData: { alt?: string; isPrimary?: boolean }[] = []
  ): Promise<any[]> {
    // Check if vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = imageData[i] || {};
      
      // Upload to MinIO
      const { imagePath } = await imageService.uploadVehicleImage(
        vehicleId, 
        file, 
        data.isPrimary || false
      );
      
      // Save to database
      const dbImage = await this.vehicleRepository.addVehicleImage(
        vehicleId,
        imagePath,
        data.alt,
        data.isPrimary
      );
      
      uploadedImages.push(dbImage);
    }

    return uploadedImages;
  }

  async updateVehicleImage(
    imageId: string,
    alt?: string,
    isPrimary?: boolean
  ): Promise<any> {
    return await this.vehicleRepository.updateVehicleImage(imageId, alt, isPrimary);
  }

  async deleteVehicleImage(imageId: string): Promise<boolean> {
    try {
      const { imagePath } = await this.vehicleRepository.deleteVehicleImage(imageId);
      
      // Delete from MinIO
      await imageService.deleteImage(imagePath);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async setPrimaryVehicleImage(vehicleId: string, imageId: string): Promise<any> {
    // First verify that the image belongs to this vehicle
    const images = await this.vehicleRepository.getVehicleImages(vehicleId);
    const imageExists = images.find(img => img.id === imageId);
    
    if (!imageExists) {
      throw new Error('Image not found for this vehicle');
    }

    // Update the image to be primary
    await this.vehicleRepository.updateVehicleImage(imageId, undefined, true);
    
    // Return the updated vehicle with images
    return this.vehicleRepository.findById(vehicleId);
  }

  async getVehicleImages(vehicleId: string): Promise<any[]> {
    const images = await this.vehicleRepository.getVehicleImages(vehicleId);
    
    // Transform paths to full URLs
    return images.map(image => ({
      ...image,
      imageUrl: image.imageUrl.startsWith('http') 
        ? image.imageUrl 
        : imageService.generateImageUrl(image.imageUrl)
    }));
  }
}
