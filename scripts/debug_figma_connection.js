const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.figma');
let token = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/FIGMA_ACCESS_TOKEN=(.*)/);
  if (match && match[1]) {
    token = match[1].trim();
  }
} catch (e) {
  console.error('Error reading .env.figma:', e.message);
  process.exit(1);
}

if (!token) {
  console.error('FIGMA_ACCESS_TOKEN not found');
  process.exit(1);
}

const fileKey = 'gPVMwRMSmsdHAN6tTEcY85';
const nodeId = '61:1996';
const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`;

console.log(`Fetching from Figma...`);

const options = {
  headers: { 'X-Figma-Token': token }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Success! Saving to figma_node_dump.json');
      fs.writeFileSync(path.resolve(__dirname, '../figma_node_dump.json'), data);
    } else {
      console.error(`Error ${res.statusCode}:`, data);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Request Error:', err.message);
  process.exit(1);
});
