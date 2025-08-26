const fetch = require('node-fetch');

async function debugVehicleCreate() {
  try {
    // Login first
    console.log('🔑 Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@k2a.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginData.data.accessToken;
    
    // Create vehicle with exact test data
    console.log('🚗 Creating vehicle...');
    const testVehicle = {
      make: 'TestMake',
      model: 'TestModel',
      year: 2023,
      color: 'Red',
      licensePlate: `TEST${Date.now()}`,
      vin: '1HGCM82633A123456',
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
    
    const createResponse = await fetch('http://localhost:5000/api/v1/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testVehicle)
    });
    
    const createData = await createResponse.json();
    console.log('📄 Create Response Status:', createResponse.status);
    console.log('📄 Create Response Data:', JSON.stringify(createData, null, 2));
    
    if (createData.success) {
      console.log('✅ Vehicle created successfully!');
      console.log('🆔 Vehicle ID:', createData.data.id);
    } else {
      console.error('❌ Vehicle creation failed');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugVehicleCreate();
