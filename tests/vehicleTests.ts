import { TestRunner, waitForServer, generateRandomEmail, generateStrongPassword } from './testUtils';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

/**
 * Comprehensive    await runner.runTest('GET /api/v1/vehicles with filters', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles?category=MIDSIZE&available=true');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data.data, 'Should have vehicles array');icle Routes Test Suite
 * 
 * This test suite covers:
 * 1. Public vehicle endpoints (no auth required)
 * 2. Admin vehicle endpoints (auth required)
 * 3. Image upload functionality with actual file testing
 * 4. Error handling and validation
 * 5. Edge cases and boundary conditions
 */

interface TestVehicle {
  id?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  mileage?: number;
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  transmission: 'MANUAL' | 'AUTOMATIC';
  seats: number;
  doors: number;
  category: 'ECONOMY' | 'COMPACT' | 'MIDSIZE' | 'LUXURY' | 'SUV' | 'VAN';
  pricePerDay: number;
  location: string;
  description?: string;
  features?: string[];
  featured?: boolean;
  rentalServices: ('INDIVIDUAL' | 'EVENTS' | 'ENTERPRISE')[];
}

interface AdminLoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    admin: {
      adminId: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

class VehicleTestRunner extends TestRunner {
  public adminToken: string = '';
  public testVehicleId: string = '';
  public testImageIds: string[] = [];

  // Enhanced API call method that supports file uploads
  async apiCallWithFile(method: string, endpoint: string, options: {
    formData?: FormData;
    headers?: Record<string, string>;
    expectStatus?: number;
  } = {}): Promise<any> {
    const url = `http://localhost:5000${endpoint}`; // Use hardcoded baseUrl since it's private
    const { formData, headers = {}, expectStatus = 200 } = options;

    const fetchOptions: any = {
      method,
      headers: {
        ...headers
      }
    };

    if (formData) {
      fetchOptions.body = formData;
      // Don't set Content-Type for FormData, let fetch handle it
    }

    const response = await fetch(url, fetchOptions);
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (response.status !== expectStatus) {
      console.log(`API Call Failed: ${method} ${endpoint}`);
      console.log(`Expected Status: ${expectStatus}, Got: ${response.status}`);
      console.log(`Response:`, responseData);
      throw new Error(`Expected status ${expectStatus}, got ${response.status}`);
    }

    return responseData;
  }

  // Login as admin and store token
  async loginAsAdmin(): Promise<void> {
    console.log('🔑 Logging in as admin...');
    
    // For testing, we'll assume there's a default admin account
    // In a real test environment, you'd set up test data
    const loginData = {
      email: 'admin@k2a.com', // Adjust this to match your setup
      password: 'admin123' // Adjust this to match your setup
    };

    try {
      const response: AdminLoginResponse = await this.apiCall('POST', '/api/v1/auth/login', {
        body: loginData
      });

      this.adminToken = response.data.accessToken;
      console.log('✅ Admin login successful');
    } catch (error) {
      console.log('❌ Admin login failed. Please ensure admin account exists.');
      console.log('You may need to create an admin account first or adjust login credentials.');
      throw new Error('Cannot proceed with admin tests without authentication');
    }
  }

  // Create a test vehicle and return its ID
  async createTestVehicle(): Promise<string> {
    const timestamp = Date.now();
    const testVehicle: TestVehicle = {
      make: 'TestMake',
      model: 'TestModel',
      year: 2023,
      color: 'Red',
      licensePlate: `TEST${timestamp}`,
      // Remove VIN to avoid uniqueness conflicts
      mileage: 5000,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      seats: 5,
      doors: 4,
      category: 'MIDSIZE',
      pricePerDay: 50.99,
      location: 'Test Location',
      description: 'Test vehicle for automated testing',
      features: ['Air Conditioning', 'GPS', 'Bluetooth'],
      featured: false,
      rentalServices: ['INDIVIDUAL', 'EVENTS']
    };

    try {
      const response = await this.apiCall('POST', '/api/v1/vehicles', {
        body: testVehicle,
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        },
        expectStatus: 201
      });

      if (!response || !response.data || !response.data.id) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Vehicle creation failed - invalid response structure');
      }

      return response.data.id;
    } catch (error: any) {
      console.error('❌ Vehicle creation error:', error.message);
      console.error('❌ Test vehicle data:', JSON.stringify(testVehicle, null, 2));
      console.error('❌ Admin token:', this.adminToken ? 'Present' : 'Missing');
      throw error;
    }
  }

  // Upload test image for vehicle
  async uploadTestImage(vehicleId: string): Promise<string[]> {
    const testImagePath = path.join(__dirname, '..', 'image', 'Screenshot from 2025-07-19 04-48-10.png');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image not found at ${testImagePath}`);
    }

    const formData = new FormData();
    formData.append('images', fs.createReadStream(testImagePath));

    const response = await this.apiCallWithFile('POST', `/api/v1/vehicles/${vehicleId}/images`, {
      formData,
      headers: {
        'Authorization': `Bearer ${this.adminToken}`
      },
      expectStatus: 201
    });

    return response.data.map((img: any) => img.id);
  }

  // Cleanup test data
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    if (this.testVehicleId && this.adminToken) {
      try {
        await this.apiCall('DELETE', `/api/v1/vehicles/${this.testVehicleId}/hard`, {
          headers: {
            'Authorization': `Bearer ${this.adminToken}`
          }
        });
        console.log('✅ Test vehicle deleted');
      } catch (error) {
        console.log('⚠️  Failed to delete test vehicle:', error);
      }
    }
  }
}

async function runVehicleTests() {
  console.log('🚗 Vehicle Routes Test Suite\n');

  const runner = new VehicleTestRunner();
  
  // Check if server is running
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('❌ Server is not running on http://localhost:5000');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ Server is ready\n');

  try {
    // ==============================================
    // SECTION 1: HEALTH CHECK
    // ==============================================
    console.log('📋 Section 1: Health Check\n');

    await runner.runTest('Health check endpoint', async () => {
      const response = await runner.apiCall('GET', '/health');
      await runner.expectToExist(response.success, 'Response should have success property');
      await runner.expect(response.success, true, 'Health check should return success: true');
    });

    // ==============================================
    // SECTION 2: PUBLIC VEHICLE ENDPOINTS
    // ==============================================
    console.log('\n📋 Section 2: Public Vehicle Endpoints\n');

    await runner.runTest('GET /api/v1/vehicles - Get all vehicles', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Response should have data property');
      await runner.expectToExist(response.data.data, 'Should have vehicles array');
      await runner.expectToExist(response.data.pagination, 'Should have pagination info');
    });

    await runner.runTest('GET /api/v1/vehicles with pagination', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles?page=1&limit=5');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data.pagination, 'Should have pagination info');
    });

    await runner.runTest('GET /api/v1/vehicles with filters', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles?category=COMPACT&fuelType=GASOLINE');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data.data, 'Should have vehicles array');
    });

    await runner.runTest('GET /api/v1/vehicles/search - Search vehicles', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/search?query=test&limit=10');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have search results');
    });

    await runner.runTest('GET /api/v1/vehicles/featured - Get featured vehicles', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/featured');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have featured vehicles');
    });

    await runner.runTest('GET /api/v1/vehicles/category/:category - Get vehicles by category', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/category/COMPACT');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have vehicles by category');
    });

    await runner.runTest('GET /api/v1/vehicles/rental-service/:serviceType - Get vehicles by rental service', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/rental-service/INDIVIDUAL');
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have vehicles by rental service');
    });

    // ==============================================
    // SECTION 3: AUTHENTICATION SETUP
    // ==============================================
    console.log('\n📋 Section 3: Admin Authentication\n');

    await runner.runTest('Admin login for protected routes', async () => {
      await runner.loginAsAdmin();
      await runner.expectToExist(runner.adminToken, 'Should have admin token after login');
    });

    // ==============================================
    // SECTION 4: ADMIN VEHICLE CRUD OPERATIONS
    // ==============================================
    console.log('\n📋 Section 4: Admin Vehicle CRUD Operations\n');

    await runner.runTest('POST /api/v1/vehicles - Create new vehicle', async () => {
      runner.testVehicleId = await runner.createTestVehicle();
      await runner.expectToExist(runner.testVehicleId, 'Should return vehicle ID after creation');
    });

    await runner.runTest('GET /api/v1/vehicles/:id - Get vehicle by ID', async () => {
      const response = await runner.apiCall('GET', `/api/v1/vehicles/${runner.testVehicleId}`);
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have vehicle data');
      await runner.expect(response.data.id, runner.testVehicleId, 'Should return correct vehicle');
    });

    await runner.runTest('PUT /api/v1/vehicles/:id - Update vehicle', async () => {
      const updateData = {
        make: 'UpdatedMake',
        model: 'UpdatedModel',
        color: 'Blue',
        pricePerDay: 75.99
      };

      const response = await runner.apiCall('PUT', `/api/v1/vehicles/${runner.testVehicleId}`, {
        body: updateData,
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expect(response.data.make, 'UpdatedMake', 'Should update vehicle make');
      await runner.expect(response.data.pricePerDay, 75.99, 'Should update vehicle price');
    });

    await runner.runTest('PATCH /api/v1/vehicles/:id/availability - Update vehicle availability', async () => {
      const response = await runner.apiCall('PATCH', `/api/v1/vehicles/${runner.testVehicleId}/availability`, {
        body: { availability: false },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expect(response.data.availability, false, 'Should update availability to false');
    });

    await runner.runTest('PATCH /api/v1/vehicles/:id/featured - Update vehicle featured status', async () => {
      const response = await runner.apiCall('PATCH', `/api/v1/vehicles/${runner.testVehicleId}/featured`, {
        body: { featured: true },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expect(response.data.featured, true, 'Should update featured status to true');
    });

    await runner.runTest('PATCH /api/v1/vehicles/:id/rental-services - Update rental services', async () => {
      const response = await runner.apiCall('PATCH', `/api/v1/vehicles/${runner.testVehicleId}/rental-services`, {
        body: { rentalServices: ['INDIVIDUAL', 'ENTERPRISE'] },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data.rentalServices, 'Should have updated rental services');
    });

    await runner.runTest('PATCH /api/v1/vehicles/:id/rating - Update vehicle rating', async () => {
      const response = await runner.apiCall('PATCH', `/api/v1/vehicles/${runner.testVehicleId}/rating`, {
        body: { rating: 4.5, reviewCount: 10 },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expect(response.data.rating, 4.5, 'Should update rating');
    });

    // ==============================================
    // SECTION 5: IMAGE MANAGEMENT
    // ==============================================
    console.log('\n📋 Section 5: Image Management\n');

    await runner.runTest('POST /api/v1/vehicles/:id/images - Upload vehicle images', async () => {
      runner.testImageIds = await runner.uploadTestImage(runner.testVehicleId);
      await runner.expectToExist(runner.testImageIds[0], 'Should return image ID after upload');
    });

    await runner.runTest('PUT /api/v1/vehicles/:id/images/:imageId/primary - Set primary image', async () => {
      const response = await runner.apiCall('PUT', `/api/v1/vehicles/${runner.testVehicleId}/images/${runner.testImageIds[0]}/primary`, {
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should return updated vehicle data');
    });

    await runner.runTest('DELETE /api/v1/vehicles/:id/images/:imageId - Delete vehicle image', async () => {
      const response = await runner.apiCall('DELETE', `/api/v1/vehicles/${runner.testVehicleId}/images/${runner.testImageIds[0]}`, {
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
    });

    // ==============================================
    // SECTION 6: BULK OPERATIONS
    // ==============================================
    console.log('\n📋 Section 6: Bulk Operations\n');

    await runner.runTest('PATCH /api/v1/vehicles/bulk/availability - Bulk update availability', async () => {
      const response = await runner.apiCall('PATCH', '/api/v1/vehicles/bulk/availability', {
        body: { 
          vehicleIds: [runner.testVehicleId], 
          availability: true 
        },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should return bulk update results');
    });

    await runner.runTest('PATCH /api/v1/vehicles/bulk/featured - Bulk update featured status', async () => {
      const response = await runner.apiCall('PATCH', '/api/v1/vehicles/bulk/featured', {
        body: { 
          vehicleIds: [runner.testVehicleId], 
          featured: false 
        },
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should return bulk update results');
    });

    // ==============================================
    // SECTION 7: ADMIN STATS AND ANALYTICS
    // ==============================================
    console.log('\n📋 Section 7: Admin Stats and Analytics\n');

    await runner.runTest('GET /api/v1/vehicles/admin/stats - Get vehicle statistics', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/admin/stats', {
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have statistics data');
    });

    await runner.runTest('GET /api/v1/vehicles/:id/recommendations - Get vehicle recommendations', async () => {
      const response = await runner.apiCall('GET', `/api/v1/vehicles/${runner.testVehicleId}/recommendations?limit=3`);
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have recommendations');
    });

    await runner.runTest('GET /api/v1/vehicles/:id/availability - Check vehicle availability', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const response = await runner.apiCall('GET', 
        `/api/v1/vehicles/${runner.testVehicleId}/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      await runner.expect(response.success, true, 'Should return success: true');
      await runner.expectToExist(response.data, 'Should have availability data');
    });

    // ==============================================
    // SECTION 8: ERROR HANDLING AND VALIDATION
    // ==============================================
    console.log('\n📋 Section 8: Error Handling and Validation\n');

    await runner.runTest('POST /api/v1/vehicles - Create vehicle with invalid data', async () => {
      const invalidVehicle = {
        make: '', // Invalid: empty string
        year: 1800, // Invalid: too old
        seats: 0 // Invalid: must be at least 1
      };

      const response = await runner.apiCall('POST', '/api/v1/vehicles', {
        body: invalidVehicle,
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        },
        expectStatus: 400
      });

      await runner.expect(response.success, false, 'Should return success: false for invalid data');
    });

    await runner.runTest('GET /api/v1/vehicles/nonexistent - Get non-existent vehicle', async () => {
      const response = await runner.apiCall('GET', '/api/v1/vehicles/550e8400-e29b-41d4-a716-446655440000', {
        expectStatus: 404
      });

      await runner.expect(response.success, false, 'Should return success: false for non-existent vehicle');
    });

    await runner.runTest('POST /api/v1/vehicles without auth - Unauthorized access', async () => {
      const validVehicle = {
        make: 'TestMake',
        model: 'TestModel',
        year: 2023
      };

      const response = await runner.apiCall('POST', '/api/v1/vehicles', {
        body: validVehicle,
        expectStatus: 401
      });

      await runner.expect(response.success, false, 'Should return success: false without authentication');
    });

    await runner.runTest('POST /api/v1/vehicles/:id/images with invalid file type', async () => {
      // Create a text file as invalid image
      const formData = new FormData();
      formData.append('images', Buffer.from('This is not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

      const response = await runner.apiCallWithFile('POST', `/api/v1/vehicles/${runner.testVehicleId}/images`, {
        formData,
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        },
        expectStatus: 400
      });

      await runner.expect(response.success, false, 'Should reject invalid file type');
    });

    // ==============================================
    // SECTION 9: CLEANUP
    // ==============================================
    console.log('\n📋 Section 9: Cleanup and Deletion\n');

    await runner.runTest('DELETE /api/v1/vehicles/:id - Soft delete vehicle', async () => {
      const response = await runner.apiCall('DELETE', `/api/v1/vehicles/${runner.testVehicleId}`, {
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
    });

    await runner.runTest('DELETE /api/v1/vehicles/:id/hard - Hard delete vehicle', async () => {
      const response = await runner.apiCall('DELETE', `/api/v1/vehicles/${runner.testVehicleId}/hard`, {
        headers: {
          'Authorization': `Bearer ${runner.adminToken}`
        }
      });

      await runner.expect(response.success, true, 'Should return success: true');
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Cleanup any remaining test data
    await runner.cleanup();
  }

  // Print results
  console.log('\n' + '='.repeat(50));
  runner.printSummary();
  
  if (runner.hasFailures()) {
    process.exit(1);
  }
}

// Run vehicle tests
runVehicleTests().catch((error) => {
  console.error('❌ Vehicle test runner failed:', error);
  process.exit(1);
});

export { runVehicleTests };
