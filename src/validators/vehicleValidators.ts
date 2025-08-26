import { z } from 'zod';
import { VehicleCategory, FuelType, Transmission, RentalServiceType } from '@prisma/client';

export const createVehicleSchema = z.object({
  // Basic Vehicle Information
  make: z.string().min(1, 'Make is required').max(50, 'Make must be 50 characters or less'),
  model: z.string().min(1, 'Model is required').max(50, 'Model must be 50 characters or less'),
  year: z.number().int().min(1900, 'Year must be 1900 or later').max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  color: z.string().min(1, 'Color is required').max(30, 'Color must be 30 characters or less'),
  licensePlate: z.string().min(1, 'License plate is required').max(20, 'License plate must be 20 characters or less'),
  vin: z.string().length(17, 'VIN must be exactly 17 characters').optional(),
  mileage: z.number().int().min(0, 'Mileage cannot be negative').optional(),
  
  // Vehicle Specifications
  fuelType: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(Transmission),
  seats: z.number().int().min(1, 'Seats must be at least 1').max(50, 'Seats cannot exceed 50'),
  doors: z.number().int().min(2, 'Doors must be at least 2').max(6, 'Doors cannot exceed 6'),
  category: z.nativeEnum(VehicleCategory),
  
  // Pricing and Location
  pricePerDay: z.number().min(0, 'Price per day cannot be negative'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be 100 characters or less'),
  
  // Optional Fields
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  features: z.array(z.string().max(50)).optional(),
  
  // Business Logic Fields
  featured: z.boolean().optional().default(false),
  
  // Engine & Performance Specifications (all optional for flexibility)
  engine: z.string().max(100, 'Engine specification must be 100 characters or less').optional(),
  power: z.string().max(50, 'Power specification must be 50 characters or less').optional(),
  consumption: z.string().max(50, 'Consumption specification must be 50 characters or less').optional(),
  acceleration: z.string().max(50, 'Acceleration specification must be 50 characters or less').optional(),
  maxSpeed: z.string().max(50, 'Max speed specification must be 50 characters or less').optional(),
  trunkCapacity: z.string().max(50, 'Trunk capacity specification must be 50 characters or less').optional(),
  
  // Rental Services (at least one required)
  rentalServices: z.array(z.nativeEnum(RentalServiceType)).min(1, 'At least one rental service is required'),
});

export const updateVehicleSchema = z.object({
  // Basic Vehicle Information (all optional for updates)
  make: z.string().min(1, 'Make is required').max(50, 'Make must be 50 characters or less').optional(),
  model: z.string().min(1, 'Model is required').max(50, 'Model must be 50 characters or less').optional(),
  year: z.number().int().min(1900, 'Year must be 1900 or later').max(new Date().getFullYear() + 1, 'Year cannot be in the future').optional(),
  color: z.string().min(1, 'Color is required').max(30, 'Color must be 30 characters or less').optional(),
  licensePlate: z.string().min(1, 'License plate is required').max(20, 'License plate must be 20 characters or less').optional(),
  vin: z.string().length(17, 'VIN must be exactly 17 characters').optional(),
  mileage: z.number().int().min(0, 'Mileage cannot be negative').optional(),
  
  // Vehicle Specifications
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  seats: z.number().int().min(1, 'Seats must be at least 1').max(50, 'Seats cannot exceed 50').optional(),
  doors: z.number().int().min(2, 'Doors must be at least 2').max(6, 'Doors cannot exceed 6').optional(),
  category: z.nativeEnum(VehicleCategory).optional(),
  
  // Pricing and Location
  pricePerDay: z.number().min(0, 'Price per day cannot be negative').optional(),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be 100 characters or less').optional(),
  
  // Optional Fields
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  features: z.array(z.string().max(50)).optional(),
  
  // Business Logic Fields
  availability: z.boolean().optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
  
  // Engine & Performance Specifications
  engine: z.string().max(100, 'Engine specification must be 100 characters or less').optional(),
  power: z.string().max(50, 'Power specification must be 50 characters or less').optional(),
  consumption: z.string().max(50, 'Consumption specification must be 50 characters or less').optional(),
  acceleration: z.string().max(50, 'Acceleration specification must be 50 characters or less').optional(),
  maxSpeed: z.string().max(50, 'Max speed specification must be 50 characters or less').optional(),
  trunkCapacity: z.string().max(50, 'Trunk capacity specification must be 50 characters or less').optional(),
  
  // Review System
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  
  // Rental Services
  rentalServices: z.array(z.nativeEnum(RentalServiceType)).optional(),
});

export const vehicleQuerySchema = z.object({
  // Pagination
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  
  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Filtering
  category: z.nativeEnum(VehicleCategory).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  location: z.string().optional(),
  seats: z.string().regex(/^\d+$/).transform(Number).optional(),
  available: z.string().transform(value => value === 'true').optional(),
  featured: z.string().transform(value => value === 'true').optional(),
  
  // Rental Services Filtering
  rentalServices: z.string().transform(value => value.split(',').filter(Boolean) as RentalServiceType[]).optional(),
  
  // Date Range (for availability checking)
  startDate: z.string().datetime().transform(date => new Date(date)).optional(),
  endDate: z.string().datetime().transform(date => new Date(date)).optional(),
  
  // Search
  search: z.string().optional(),
});

// Schema for adding/removing rental services
export const vehicleRentalServiceSchema = z.object({
  rentalServices: z.array(z.nativeEnum(RentalServiceType)).min(1, 'At least one rental service is required'),
});

// Availability update schema
export const updateVehicleAvailabilitySchema = z.object({
  availability: z.boolean(),
});

// Featured status update schema
export const updateVehicleFeaturedStatusSchema = z.object({
  featured: z.boolean(),
});

// Rating update schema
export const updateVehicleRatingSchema = z.object({
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0).optional(),
});

// Bulk operations schemas
export const bulkUpdateAvailabilitySchema = z.object({
  vehicleIds: z.array(z.string().uuid()),
  availability: z.boolean(),
});

export const bulkUpdateFeaturedSchema = z.object({
  vehicleIds: z.array(z.string().uuid()),
  featured: z.boolean(),
});

// Image upload validation schemas
export const uploadImageSchema = z.object({
  files: z.array(z.any()).min(1, 'At least one image file is required'),
});

export const updateImageSchema = z.object({
  alt: z.string().max(255, 'Alt text must be 255 characters or less').optional(),
  isPrimary: z.boolean().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
export type VehicleRentalServiceInput = z.infer<typeof vehicleRentalServiceSchema>;
export type UpdateVehicleAvailabilityInput = z.infer<typeof updateVehicleAvailabilitySchema>;
export type UpdateVehicleFeaturedStatusInput = z.infer<typeof updateVehicleFeaturedStatusSchema>;
export type UpdateVehicleRatingInput = z.infer<typeof updateVehicleRatingSchema>;
export type BulkUpdateAvailabilityInput = z.infer<typeof bulkUpdateAvailabilitySchema>;
export type BulkUpdateFeaturedInput = z.infer<typeof bulkUpdateFeaturedSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
