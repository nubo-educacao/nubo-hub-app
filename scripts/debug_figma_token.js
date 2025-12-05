const https = require('https');

const token = 'figd_7JuMZry3ZBS4nDwpEEh9clvjODKQJvjuGFIY-D2M';

const options = {
  hostname: 'api.figma.com',
  path: '/v1/me',
  method: 'GET',
  headers: {
    'X-Figma-Token': token
  }
};

console.log('Testing Figma Token...');

const req = https.request(options, (res) => {
  console.log(`Response Status: ${res.statusCode}`);
  console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`Network Error: ${e.message}`);
});

req.end();
