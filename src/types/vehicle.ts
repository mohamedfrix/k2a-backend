import { VehicleCategory, FuelType, Transmission, RentalServiceType } from '@prisma/client';
import { BaseQuery } from './index';

export interface VehicleQuery extends BaseQuery {
  category?: VehicleCategory;
  fuelType?: FuelType;
  transmission?: Transmission;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  seats?: number;
  available?: boolean;
  featured?: boolean;
  rentalServices?: RentalServiceType[];
}

export interface VehicleAccessoryRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive?: boolean;
}

export interface VehicleAccessoryResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  mileage?: number;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  doors: number;
  category: VehicleCategory;
  pricePerDay: number;
  location: string;
  description?: string;
  features?: string[];
  
  // Business Logic Fields
  featured?: boolean;
  
  // Engine & Performance Specifications (all optional for flexibility)
  engine?: string;
  power?: string;
  consumption?: string;
  acceleration?: string;
  maxSpeed?: string;
  trunkCapacity?: string;
  
  // Rental Services (at least one required)
  rentalServices: RentalServiceType[];
  
  // Accessories with pricing
  accessories?: VehicleAccessoryRequest[];
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  availability?: boolean;
  isActive?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface VehicleRentalService {
  id: string;
  rentalServiceType: RentalServiceType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleWithImages {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  mileage?: number;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  doors: number;
  category: VehicleCategory;
  pricePerDay: number;
  availability: boolean;
  location: string;
  description?: string;
  features: string[];
  
  // Business Logic Fields
  featured: boolean;
  
  // Engine & Performance Specifications
  engine?: string;
  power?: string;
  consumption?: string;
  acceleration?: string;
  maxSpeed?: string;
  trunkCapacity?: string;
  
  // Review System
  rating: number;
  reviewCount: number;
  
  // Relations
  images: VehicleImageResponse[];
  rentalServices: VehicleRentalService[];
  accessories: VehicleAccessoryResponse[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleImageResponse {
  id: string;
  imageUrl: string;
  alt?: string;
  isPrimary: boolean;
  createdAt: Date;
}

// For image upload requests
export interface UploadImageRequest {
  alt?: string;
  isPrimary?: boolean;
}

export interface VehicleStats {
  totalVehicles: number;
  availableVehicles: number;
  bookedVehicles: number;
  maintenanceVehicles: number;
  categoryBreakdown: {
    category: VehicleCategory;
    count: number;
  }[];
  rentalServiceBreakdown: {
    serviceType: RentalServiceType;
    count: number;
  }[];
  featuredVehicles: number;
}
