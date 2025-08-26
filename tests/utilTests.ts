import { TestRunner } from './testUtils';
import { hashPassword, comparePassword } from '../src/utils/password';
import { generateTokens, verifyAccessToken } from '../src/utils/jwt';

async function runUtilTests() {
  console.log('🔧 Running Utility Tests...\n');

  const runner = new TestRunner();

  // Password utility tests
  await runner.runTest('Hash password should work', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);
    
    await runner.expectToExist(hashedPassword, 'Hashed password should exist');
    if (hashedPassword === password) {
      throw new Error('Hashed password should not equal original password');
    }
    if (hashedPassword.length < 50) {
      throw new Error('Hashed password should be at least 50 characters');
    }
  });

  await runner.runTest('Compare password should work with correct password', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword(password, hashedPassword);
    
    await runner.expect(isMatch, true, 'Password comparison should return true for correct password');
  });

  await runner.runTest('Compare password should fail with wrong password', async () => {
    const correctPassword = 'TestPassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hashedPassword = await hashPassword(correctPassword);
    const isMatch = await comparePassword(wrongPassword, hashedPassword);
    
    await runner.expect(isMatch, false, 'Password comparison should return false for wrong password');
  });

  await runner.runTest('Hash should be different for same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    if (hash1 === hash2) {
      throw new Error('Two hashes of the same password should be different due to salt');
    }
  });

  // JWT utility tests
  await runner.runTest('Generate tokens should work', async () => {
    const admin = {
      id: 'test-admin-id',
      email: 'test@k2a.com'
    };
    
    const tokens = await generateTokens(admin);
    
    await runner.expectToContain(tokens, 'accessToken', 'Tokens should contain access token');
    await runner.expectToContain(tokens, 'refreshToken', 'Tokens should contain refresh token');
    
    if (typeof tokens.accessToken !== 'string') {
      throw new Error('Access token should be a string');
    }
    if (typeof tokens.refreshToken !== 'string') {
      throw new Error('Refresh token should be a string');
    }
    
    // JWT tokens should have 3 parts separated by dots
    if (tokens.accessToken.split('.').length !== 3) {
      throw new Error('Access token should have 3 parts (JWT format)');
    }
    if (tokens.refreshToken.split('.').length !== 3) {
      throw new Error('Refresh token should have 3 parts (JWT format)');
    }
  });

  await runner.runTest('Verify access token should work', async () => {
    const admin = {
      id: 'test-admin-id',
      email: 'test@k2a.com'
    };
    
    const tokens = await generateTokens(admin);
    const decoded = await verifyAccessToken(tokens.accessToken);
    
    await runner.expectToContain(decoded, 'adminId', 'Decoded token should contain adminId');
    await runner.expectToContain(decoded, 'email', 'Decoded token should contain email');
    await runner.expect(decoded.adminId, admin.id, 'Decoded adminId should match original');
    await runner.expect(decoded.email, admin.email, 'Decoded email should match original');
  });

  await runner.runTest('Verify invalid token should fail', async () => {
    try {
      await verifyAccessToken('invalid.token.here');
      throw new Error('Verification should have failed for invalid token');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Verification should have failed')) {
        throw error;
      }
      // Expected error - verification failed as it should
    }
  });

  await runner.runTest('Generate different tokens each time', async () => {
    const admin = {
      id: 'test-admin-id',
      email: 'test@k2a.com'
    };
    
    const tokens1 = await generateTokens(admin);
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));
    const tokens2 = await generateTokens(admin);
    
    if (tokens1.accessToken === tokens2.accessToken) {
      throw new Error('Access tokens should be different each time');
    }
    if (tokens1.refreshToken === tokens2.refreshToken) {
      throw new Error('Refresh tokens should be different each time');
    }
  });

  // Test password edge cases
  await runner.runTest('Handle empty password hashing', async () => {
    const hashedEmpty = await hashPassword('');
    await runner.expectToExist(hashedEmpty, 'Should be able to hash empty string');
  });

  await runner.runTest('Handle empty password comparison', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword('', hashedPassword);
    
    await runner.expect(isMatch, false, 'Empty password should not match non-empty hash');
  });

  // Test case sensitivity
  await runner.runTest('Password comparison is case sensitive', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword('testpassword123!', hashedPassword);
    
    await runner.expect(isMatch, false, 'Password comparison should be case sensitive');
  });

  // Print results
  runner.printSummary();
  
  if (runner.hasFailures()) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runUtilTests().catch((error) => {
    console.error('❌ Utility test runner failed:', error);
    process.exit(1);
  });
}

export { runUtilTests };
