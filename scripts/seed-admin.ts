import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

/**
 * Seed Admin Script
 * Creates an admin user from environment variables or uses defaults for development/testing
 */

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Checking/creating initial admin user...');

    // Get admin details from environment variables or use defaults
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@k2a.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
    const adminFirstName = process.env.INITIAL_ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.INITIAL_ADMIN_LAST_NAME || 'K2A';

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Initial admin user already exists!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🆔 ID: ${existingAdmin.id}`);
      console.log(`✨ Active: ${existingAdmin.isActive}`);
      return existingAdmin;
    }

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        isActive: true,
      },
    });

    console.log('✅ Initial admin user created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🆔 ID: ${admin.id}`);
    console.log(`📅 Created: ${admin.createdAt}`);
    
    return admin;

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
}

// If script is run directly (not imported)
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Admin seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedAdmin };
