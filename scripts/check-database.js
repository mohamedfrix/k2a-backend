#!/usr/bin/env node

/**
 * Database Status Check Script
 * Verifies that the database is properly set up with all required data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 K2A Database Status Check\n');

    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check migrations
    console.log('\n📋 Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name);
    const expectedTables = ['_prisma_migrations', 'admins', 'refresh_tokens', 'vehicles', 'vehicle_images'];
    
    console.log(`📊 Found ${tableNames.length} tables:`);
    expectedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
      }
    });

    // Check admin users
    console.log('\n👤 Checking admin users...');
    const adminCount = await prisma.admin.count();
    const activeAdmins = await prisma.admin.count({ where: { isActive: true } });
    
    if (adminCount > 0) {
      console.log(`✅ Found ${adminCount} admin user(s) (${activeAdmins} active)`);
      
      const sampleAdmin = await prisma.admin.findFirst({
        select: { email: true, firstName: true, lastName: true, createdAt: true }
      });
      console.log(`   📧 Sample admin: ${sampleAdmin.firstName} ${sampleAdmin.lastName} (${sampleAdmin.email})`);
    } else {
      console.log('❌ No admin users found - run npm run db:seed:admin');
    }

    // Check vehicles
    console.log('\n🚗 Checking vehicles...');
    const vehicleCount = await prisma.vehicle.count();
    const availableVehicles = await prisma.vehicle.count({ where: { availability: true } });
    
    if (vehicleCount > 0) {
      console.log(`✅ Found ${vehicleCount} vehicle(s) (${availableVehicles} available)`);
      
      // Vehicle categories breakdown
      const categories = await prisma.vehicle.groupBy({
        by: ['category'],
        _count: { category: true },
      });
      
      console.log('   🏷️  Categories:');
      categories.forEach(cat => {
        console.log(`      ${cat.category}: ${cat._count.category} vehicles`);
      });
      
      // Price range
      const priceStats = await prisma.vehicle.aggregate({
        _min: { pricePerDay: true },
        _max: { pricePerDay: true },
        _avg: { pricePerDay: true },
      });
      
      console.log(`   💰 Price range: $${priceStats._min.pricePerDay} - $${priceStats._max.pricePerDay} (avg: $${parseFloat(priceStats._avg.pricePerDay).toFixed(2)})`);
    } else {
      console.log('⚠️  No vehicles found - run npm run db:seed:vehicles');
    }

    // Check vehicle images
    console.log('\n🖼️  Checking vehicle images...');
    const imageCount = await prisma.vehicleImage.count();
    const primaryImages = await prisma.vehicleImage.count({ where: { isPrimary: true } });
    
    if (imageCount > 0) {
      console.log(`✅ Found ${imageCount} vehicle image(s) (${primaryImages} primary)`);
    } else {
      console.log('⚠️  No vehicle images found');
    }

    // Summary
    console.log('\n📊 Database Summary:');
    console.log(`   📋 Total tables: ${tableNames.length}`);
    console.log(`   👤 Admin users: ${adminCount}`);
    console.log(`   🚗 Vehicles: ${vehicleCount}`);
    console.log(`   🖼️  Vehicle images: ${imageCount}`);

    console.log('\n✅ Database check completed successfully!');
    
    if (adminCount === 0 || vehicleCount === 0) {
      console.log('\n💡 Quick setup commands:');
      console.log('   npm run db:seed:admin    # Create admin user');
      console.log('   npm run db:seed:vehicles # Create sample vehicles');
      console.log('   npm run db:seed          # Create all sample data');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Ensure PostgreSQL is running: docker compose ps');
    console.log('   2. Check environment variables: npm run validate-env');
    console.log('   3. Run migrations: npm run db:migrate');
    console.log('   4. Seed database: npm run db:seed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabase();
