const https = require('https');

const token = 'figd_7JuMZry3ZBS4nDwpEEh9clvjODKQJvjuGFIY-D2M';
// File: Nubo, Node: Header
const path = '/v1/files/gPVMwRMSmsdHAN6tTEcY85/nodes?ids=103:5007';

const options = {
  hostname: 'api.figma.com',
  path: path,
  method: 'GET',
  headers: {
    'X-Figma-Token': token
  }
};

console.log(`Testing Figma File API: ${path}`);

const req = https.request(options, (res) => {
  console.log(`Response Status: ${res.statusCode}`);
  console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Log first 200 chars to avoid spamming logic
    console.log('Body Preview:', data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error(`Network Error: ${e.message}`);
});

req.end();
