#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script validates that all required environment variables are set correctly
 */

require('dotenv').config();

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'API_VERSION',
  'DATABASE_URL',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_TOKEN_EXPIRES_IN',
  'JWT_REFRESH_TOKEN_EXPIRES_IN',
  'FRONTEND_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'AUTH_RATE_LIMIT_MAX_REQUESTS',
  'LOG_LEVEL',
];

const optionalVars = [
  'PGADMIN_DEFAULT_EMAIL',
  'PGADMIN_DEFAULT_PASSWORD',
  'PGADMIN_PORT',
];

console.log('🔍 K2A Backend Environment Validation\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'POSTGRES_PASSWORD'].includes(varName) 
      ? '*'.repeat(Math.min(value.length, 20)) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  } else {
    const displayValue = varName.includes('PASSWORD') 
      ? '*'.repeat(Math.min(value.length, 20)) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

// Validate JWT secrets length
console.log('\n🔐 Security Validation:');
const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (jwtSecret && jwtSecret.length >= 32) {
  console.log('✅ JWT_SECRET: Adequate length (32+ characters)');
} else {
  console.log('❌ JWT_SECRET: Too short (should be 32+ characters)');
  hasErrors = true;
}

if (refreshSecret && refreshSecret.length >= 32) {
  console.log('✅ JWT_REFRESH_SECRET: Adequate length (32+ characters)');
} else {
  console.log('❌ JWT_REFRESH_SECRET: Too short (should be 32+ characters)');
  hasErrors = true;
}

// Validate DATABASE_URL format
console.log('\n🗄️  Database Validation:');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('postgresql://') && dbUrl.includes('@')) {
  console.log('✅ DATABASE_URL: Valid PostgreSQL connection string format');
} else {
  console.log('❌ DATABASE_URL: Invalid format');
  hasErrors = true;
}

// Summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log('❌ Environment validation FAILED! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('✅ All environment variables are properly configured!');
  console.log('🚀 Your backend is ready to run.');
}
