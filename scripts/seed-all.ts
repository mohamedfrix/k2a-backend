import { seedAdmin } from './seed-admin';
import { seedVehicles } from './seed-vehicles';

/**
 * Complete Database Seeding Script
 * Seeds all necessary data for development/testing
 */

async function seedDatabase() {
  console.log('🌱 Starting complete database seeding...\n');
  
  try {
    // Seed admin user
    console.log('👤 Seeding admin data...');
    await seedAdmin();
    console.log('');
    
    // Seed vehicles
    console.log('🚗 Seeding vehicle data...');
    await seedVehicles();
    console.log('');
    
    console.log('🎉 Complete database seeding finished successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✅ Admin user (admin@k2a.com / admin123)');
    console.log('   ✅ Sample vehicles with various categories');
    console.log('   ✅ Vehicle images for some vehicles');
    console.log('\n🚀 Your K2A backend is ready for development!');
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the complete seeding
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
