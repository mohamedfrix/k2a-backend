import { TestRunner, waitForServer, generateRandomEmail, generateStrongPassword } from './testUtils';


async function runAuthTests() {
  console.log('🔐 Running Authentication Tests...\n');

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

  let accessToken = '';
  let refreshToken = '';

  // Test 1: Health check
  await runner.runTest('Health check endpoint', async () => {
    const response = await runner.apiCall('GET', '/health');
    await runner.expectToExist(response.success, 'Response should have success property');
    await runner.expect(response.success, true, 'Health check should return success: true');
  });

  // Test 2: Setup admin account
  await runner.runTest('Create admin account via setup', async () => {
    const response = await runner.apiCall('POST', '/api/v1/auth/setup', {
      body: adminData,
      expectStatus: 201
    });
    
    await runner.expect(response.success, true, 'Setup should be successful');
    await runner.expectToContain(response.data, 'id', 'Response should contain admin ID');
    await runner.expect(response.data.email, adminData.email, 'Email should match');
    await runner.expectToNotExist(response.data.password, 'Password should not be in response');
  });

  // Test 3: Try setup again (should fail)
  await runner.runTest('Setup should fail when admin exists', async () => {
    const newAdminData = {
      email: generateRandomEmail(),
      password: generateStrongPassword(),
      firstName: 'Another',
      lastName: 'Admin'
    };

    await runner.apiCall('POST', '/api/v1/auth/setup', {
      body: newAdminData,
      expectStatus: 403
    });
  });

  // Test 4: Login with correct credentials
  await runner.runTest('Login with valid credentials', async () => {
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
    
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
  });

  // Test 5: Login with wrong password
  await runner.runTest('Login with invalid password', async () => {
    await runner.apiCall('POST', '/api/v1/auth/login', {
      body: {
        email: adminData.email,
        password: 'WrongPassword123!'
      },
      expectStatus: 401
    });
  });

  // Test 6: Login with non-existent email
  await runner.runTest('Login with non-existent email', async () => {
    await runner.apiCall('POST', '/api/v1/auth/login', {
      body: {
        email: 'nonexistent@k2a.com',
        password: adminData.password
      },
      expectStatus: 401
    });
  });

  // Test 7: Get profile with valid token
  await runner.runTest('Get profile with valid token', async () => {
    const response = await runner.apiCall('GET', '/api/v1/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    await runner.expect(response.success, true, 'Profile request should be successful');
    await runner.expectToContain(response.data, 'id', 'Profile should contain ID');
    await runner.expect(response.data.email, adminData.email, 'Profile email should match');
    await runner.expectToNotExist(response.data.password, 'Profile should not contain password');
  });

  // Test 8: Get profile without token
  await runner.runTest('Get profile without token', async () => {
    await runner.apiCall('GET', '/api/v1/auth/profile', {
      expectStatus: 401
    });
  });

  // Test 9: Get profile with invalid token
  await runner.runTest('Get profile with invalid token', async () => {
    await runner.apiCall('GET', '/api/v1/auth/profile', {
      headers: {
        'Authorization': `Bearer invalid.token.here`
      },
      expectStatus: 401
    });
  });

  // Test 10: Refresh token with valid refresh token
  await runner.runTest('Refresh token with valid refresh token', async () => {
    const response = await runner.apiCall('POST', '/api/v1/auth/refresh', {
      body: {
        refreshToken: refreshToken
      }
    });

    await runner.expect(response.success, true, 'Token refresh should be successful');
    await runner.expectToContain(response.data, 'accessToken', 'Response should contain new access token');
    await runner.expectToContain(response.data, 'refreshToken', 'Response should contain new refresh token');
    
    // Update tokens for subsequent tests
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
  });

  // Test 11: Refresh token with invalid token
  await runner.runTest('Refresh token with invalid token', async () => {
    await runner.apiCall('POST', '/api/v1/auth/refresh', {
      body: {
        refreshToken: 'invalid.refresh.token'
      },
      expectStatus: 401
    });
  });

  // Test 12: Clean up expired tokens
  await runner.runTest('Clean up expired tokens', async () => {
    const response = await runner.apiCall('POST', '/api/v1/auth/cleanup', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    await runner.expect(response.success, true, 'Token cleanup should be successful');
  });

  // Test 13: Logout
  await runner.runTest('Logout with valid token', async () => {
    const response = await runner.apiCall('POST', '/api/v1/auth/logout', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        refreshToken: refreshToken
      }
    });

    await runner.expect(response.success, true, 'Logout should be successful');
  });

  // Test 14: Try to use token after logout (should fail)
  await runner.runTest('Use token after logout should fail', async () => {
    await runner.apiCall('GET', '/api/v1/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      expectStatus: 401
    });
  });

  // Test 15: Validation tests
  await runner.runTest('Setup with invalid email should fail', async () => {
    await runner.apiCall('POST', '/api/v1/auth/setup', {
      body: {
        email: 'invalid-email',
        password: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'Admin'
      },
      expectStatus: 400
    });
  });

  await runner.runTest('Setup with weak password should fail', async () => {
    await runner.apiCall('POST', '/api/v1/auth/setup', {
      body: {
        email: generateRandomEmail(),
        password: 'weak',
        firstName: 'Test',
        lastName: 'Admin'
      },
      expectStatus: 400
    });
  });

  await runner.runTest('Login with missing password should fail', async () => {
    await runner.apiCall('POST', '/api/v1/auth/login', {
      body: {
        email: adminData.email
      },
      expectStatus: 400
    });
  });

  // Print results
  runner.printSummary();
  
  if (runner.hasFailures()) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAuthTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAuthTests };
