// Simple test to debug bulk operation
const { spawn } = require('child_process');

console.log('Testing bulk availability update...');

// Test with curl
const token_cmd = spawn('curl', [
  '-s', '-X', 'POST', 
  'http://127.0.0.1:5000/api/v1/auth/login',
  '-H', 'Content-Type: application/json',
  '-d', '{"email":"admin@k2a.com","password":"admin123"}'
]);

let token = '';
token_cmd.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    token = response.data.accessToken;
    console.log('Token obtained:', token ? 'YES' : 'NO');
    
    if (token) {
      // Test bulk operation
      const bulk_cmd = spawn('curl', [
        '-s', '-X', 'PATCH',
        'http://127.0.0.1:5000/api/v1/vehicles/bulk/availability',
        '-H', `Authorization: Bearer ${token}`,
        '-H', 'Content-Type: application/json',
        '-d', '{"vehicleIds":["cme4piisg0001hitvvuvxlnss"],"availability":true}'
      ]);
      
      bulk_cmd.stdout.on('data', (data) => {
        console.log('Bulk operation response:', data.toString());
      });
      
      bulk_cmd.stderr.on('data', (data) => {
        console.error('Bulk operation error:', data.toString());
      });
    }
  } catch (error) {
    console.error('Error parsing token response:', error);
  }
});

token_cmd.stderr.on('data', (data) => {
  console.error('Token error:', data.toString());
});
