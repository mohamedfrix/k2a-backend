import { TestRunner } from './testUtils';

async function testVehicleCreation() {
  console.log('🚗 Starting Vehicle Creation Test');
  
  const runner = new TestRunner('http://localhost:5000');
  
  try {
    // Test login
    console.log('🔑 Testing admin login...');
    const loginResponse = await runner.apiCall('POST', '/api/v1/auth/login', {
      body: {
        email: 'admin@k2a.com',
        password: 'admin123'
      },
      expectStatus: 200
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.accessToken;
    
    // Test vehicle creation
    console.log('🚗 Testing vehicle creation...');
    const timestamp = Date.now();
    const testVehicle = {
      make: 'TestMake',
      model: 'TestModel',
      year: 2023,
      color: 'Red',
      licensePlate: `TEST${timestamp}`,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      seats: 5,
      doors: 4,
      category: 'MIDSIZE',
      pricePerDay: 50.99,
      location: 'Test Location',
      rentalServices: ['INDIVIDUAL', 'EVENTS']
    };
    
    const vehicleResponse = await runner.apiCall('POST', '/api/v1/vehicles', {
      body: testVehicle,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      expectStatus: 201
    });
    
    console.log('✅ Vehicle created successfully!');
    console.log('🆔 Vehicle ID:', vehicleResponse.data.id);
    
    // Clean up
    console.log('🧹 Cleaning up...');
    await runner.apiCall('DELETE', `/api/v1/vehicles/${vehicleResponse.data.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      expectStatus: 200
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testVehicleCreation()
  .then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
