import { TestRunner, waitForServer, generateRandomEmail, generateStrongPassword } from './testUtils';

async function runDebugAuthTests() {
  console.log('🔍 Debugging Authentication Tests...\n');

  const runner = new TestRunner();
  
  // Check if server is running
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('❌ Server is not running on http://localhost:5000');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ Server is ready\n');

  // Test data
  let adminData = {
    email: generateRandomEmail(),
    password: generateStrongPassword(),
    firstName: 'Test',
    lastName: 'Admin'
  };

  // Test 1: Health check
  await runner.runTest('Health check endpoint', async () => {
    const response = await runner.apiCall('GET', '/health');
    await runner.expectToExist(response.success, 'Response should have success property');
    await runner.expect(response.success, true, 'Health check should return success: true');
  });

  // Test 2: Setup admin account
  await runner.runTest('Create admin account via setup', async () => {
    console.log('Attempting to create admin with data:', { 
      email: adminData.email, 
      firstName: adminData.firstName, 
      lastName: adminData.lastName 
    });
    
    const response = await runner.apiCall('POST', '/api/v1/auth/setup', {
      body: adminData,
      expectStatus: 201
    });
    
    await runner.expect(response.success, true, 'Setup should be successful');
    await runner.expectToContain(response.data, 'id', 'Response should contain admin ID');
    await runner.expect(response.data.email, adminData.email, 'Email should match');
    await runner.expectToNotExist(response.data.password, 'Password should not be in response');
  });

  // Test 3: Login with correct credentials
  await runner.runTest('Login with valid credentials', async () => {
    console.log('Attempting to login with:', { email: adminData.email });
    
    const response = await runner.apiCall('POST', '/api/v1/auth/login', {
      body: {
        email: adminData.email,
        password: adminData.password
      }
    });

    await runner.expect(response.success, true, 'Login should be successful');
    await runner.expectToContain(response.data, 'accessToken', 'Response should contain access token');
    await runner.expectToContain(response.data, 'refreshToken', 'Response should contain refresh token');
    await runner.expectToContain(response.data, 'admin', 'Response should contain admin data');
  });

  // Print results
  runner.printSummary();
  
  if (runner.hasFailures()) {
    process.exit(1);
  }
}

// Run debug tests
runDebugAuthTests().catch((error) => {
  console.error('❌ Debug test runner failed:', error);
  process.exit(1);
});
