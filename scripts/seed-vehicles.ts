import { PrismaClient, FuelType, Transmission, VehicleCategory } from '@prisma/client';

/**
 * Seed Vehicles Script
 * Creates sample vehicles for development/testing
 */

const prisma = new PrismaClient();

const sampleVehicles = [
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    color: 'Silver',
    licensePlate: 'ABC-123-XY',
    vin: '1HGFA16526L081415',
    mileage: 25000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    doors: 4,
    category: VehicleCategory.MIDSIZE,
    pricePerDay: 45.00,
    availability: true,
    location: 'Main Office - Downtown',
    description: 'Reliable and comfortable sedan perfect for business trips and family outings.',
    features: ['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Cruise Control', 'Power Windows'],
  },
  {
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    color: 'Blue',
    licensePlate: 'DEF-456-ZT',
    vin: '2HGFB2F58CH123456',
    mileage: 18000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.MANUAL,
    seats: 5,
    doors: 4,
    category: VehicleCategory.COMPACT,
    pricePerDay: 35.00,
    availability: true,
    location: 'Airport Branch',
    description: 'Fuel-efficient compact car ideal for city driving and daily commutes.',
    features: ['Air Conditioning', 'Manual Transmission', 'AM/FM Radio', 'Power Steering'],
  },
  {
    make: 'Ford',
    model: 'Explorer',
    year: 2023,
    color: 'Black',
    licensePlate: 'GHI-789-WV',
    vin: '1FM5K8F84KGB12345',
    mileage: 15000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.AUTOMATIC,
    seats: 7,
    doors: 4,
    category: VehicleCategory.SUV,
    pricePerDay: 65.00,
    availability: true,
    location: 'Main Office - Downtown',
    description: 'Spacious SUV perfect for family trips and group adventures.',
    features: ['7-Seater', 'AWD', 'Navigation System', 'Heated Seats', 'Panoramic Sunroof', 'Apple CarPlay'],
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    color: 'White',
    licensePlate: 'JKL-012-US',
    vin: '5YJ3E1EA9KF123456',
    mileage: 8000,
    fuelType: FuelType.ELECTRIC,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    doors: 4,
    category: VehicleCategory.LUXURY,
    pricePerDay: 85.00,
    availability: true,
    location: 'Tech District Branch',
    description: 'Premium electric vehicle with cutting-edge technology and autopilot features.',
    features: ['Electric', 'Autopilot', 'Premium Sound System', 'Glass Roof', 'Supercharging', 'OTA Updates'],
  },
  {
    make: 'Chevrolet',
    model: 'Spark',
    year: 2021,
    color: 'Red',
    licensePlate: 'MNO-345-TR',
    vin: 'KL1TD66E8LB123456',
    mileage: 35000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.AUTOMATIC,
    seats: 4,
    doors: 4,
    category: VehicleCategory.ECONOMY,
    pricePerDay: 25.00,
    availability: true,
    location: 'Budget Lot - East Side',
    description: 'Affordable and economical car perfect for short trips and budget-conscious travelers.',
    features: ['Fuel Efficient', 'Compact Size', 'Easy Parking', 'Basic Audio System'],
  },
  {
    make: 'BMW',
    model: 'X5',
    year: 2023,
    color: 'Grey',
    licensePlate: 'PQR-678-SQ',
    vin: '5UXCR6C05N9L12345',
    mileage: 12000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    doors: 4,
    category: VehicleCategory.LUXURY,
    pricePerDay: 95.00,
    availability: true,
    location: 'Luxury Fleet - Premium Center',
    description: 'High-end luxury SUV with premium amenities and superior performance.',
    features: ['Luxury Interior', 'Premium Sound', 'Adaptive Cruise Control', 'Parking Assist', 'Heated/Cooled Seats'],
  },
  {
    make: 'Nissan',
    model: 'Sentra',
    year: 2022,
    color: 'Silver',
    licensePlate: 'STU-901-OP',
    vin: '3N1AB7AP8NY123456',
    mileage: 22000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.CVT,
    seats: 5,
    doors: 4,
    category: VehicleCategory.COMPACT,
    pricePerDay: 38.00,
    availability: false, // This one is not available for testing
    location: 'Service Center',
    description: 'Reliable compact sedan with CVT transmission for smooth driving experience.',
    features: ['CVT Transmission', 'Safety Shield 360', 'Apple CarPlay', 'Android Auto', 'Rear Camera'],
  },
  {
    make: 'Jeep',
    model: 'Wrangler',
    year: 2023,
    color: 'Green',
    licensePlate: 'VWX-234-NM',
    vin: '1C4HJXDG1PW123456',
    mileage: 10000,
    fuelType: FuelType.GASOLINE,
    transmission: Transmission.MANUAL,
    seats: 4,
    doors: 2,
    category: VehicleCategory.SPORTS,
    pricePerDay: 75.00,
    availability: true,
    location: 'Adventure Rentals - Mountain View',
    description: 'Rugged off-road vehicle perfect for outdoor adventures and trail exploration.',
    features: ['4WD', 'Removable Doors', 'Foldable Windshield', 'Rock Rails', 'Skid Plates', 'All-Terrain Tires'],
  }
];

async function seedVehicles() {
  try {
    console.log('🚗 Seeding vehicles...');

    // Check if vehicles already exist
    const existingVehicles = await prisma.vehicle.count();
    
    if (existingVehicles > 0) {
      console.log(`✅ Database already contains ${existingVehicles} vehicles!`);
      return;
    }

    // Create vehicles
    console.log(`📦 Creating ${sampleVehicles.length} sample vehicles...`);
    
    for (const vehicleData of sampleVehicles) {
      const vehicle = await prisma.vehicle.create({
        data: vehicleData,
      });
      
      console.log(`✅ Created: ${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${vehicle.licensePlate}`);
    }

    // Add some sample images for the first few vehicles
    console.log('🖼️  Adding sample vehicle images...');
    
    const vehicles = await prisma.vehicle.findMany({ take: 3 });
    
    for (const vehicle of vehicles) {
      await prisma.vehicleImage.createMany({
        data: [
          {
            vehicleId: vehicle.id,
            imageUrl: `/images/vehicles/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-1.jpg`,
            alt: `${vehicle.make} ${vehicle.model} front view`,
            isPrimary: true,
          },
          {
            vehicleId: vehicle.id,
            imageUrl: `/images/vehicles/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-2.jpg`,
            alt: `${vehicle.make} ${vehicle.model} side view`,
            isPrimary: false,
          },
          {
            vehicleId: vehicle.id,
            imageUrl: `/images/vehicles/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-3.jpg`,
            alt: `${vehicle.make} ${vehicle.model} interior view`,
            isPrimary: false,
          },
        ],
      });
      
      console.log(`🖼️  Added images for ${vehicle.make} ${vehicle.model}`);
    }

    console.log('✅ Vehicle seeding completed successfully!');
    
    // Print summary
    const totalVehicles = await prisma.vehicle.count();
    const availableVehicles = await prisma.vehicle.count({ where: { availability: true } });
    const categories = await prisma.vehicle.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    
    console.log('\n📊 Database Summary:');
    console.log(`📋 Total vehicles: ${totalVehicles}`);
    console.log(`✅ Available vehicles: ${availableVehicles}`);
    console.log(`❌ Unavailable vehicles: ${totalVehicles - availableVehicles}`);
    console.log('\n🏷️  Categories:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.category} vehicles`);
    });

  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedVehicles()
    .then(() => {
      console.log('🎉 Vehicle seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Vehicle seeding failed:', error);
      process.exit(1);
    });
}

export { seedVehicles };
