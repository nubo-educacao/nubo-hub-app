
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.figma manually since we might not have dotenv cli
const envPath = path.resolve(__dirname, '../.env.figma');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const BASE_URL = 'https://api.figma.com/v1';

if (!TOKEN) {
  console.error('Error: FIGMA_ACCESS_TOKEN not found in .env.figma');
  process.exit(1);
}

const fileKey = process.argv[2];
const nodeId = process.argv[3];

if (!fileKey || !nodeId) {
  console.log('Usage: node scripts/figma-fetch.js <file_key> <node_id>');
  process.exit(1);
}

async function fetchFigmaNode(fileKey, nodeId) {
  console.log(`Fetching node ${nodeId} from file ${fileKey}...`);
  
  const options = {
    hostname: 'api.figma.com',
    path: `/v1/files/${fileKey}/nodes?ids=${nodeId}`,
    method: 'GET',
    headers: {
      'X-Figma-Token': TOKEN
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`API Request Failed: ${res.statusCode} ${res.statusMessage}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

fetchFigmaNode(fileKey, nodeId)
  .then(data => {
    // Basic extraction logic to verify we got something
    const nodes = data.nodes;
    if (!nodes || !nodes[nodeId]) {
      console.error('Node not found in response');
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    
    const node = nodes[nodeId].document;
    console.log(`Successfully fetched "${node.name}" (Type: ${node.type})`);
    
    // Save to a temp file for inspection
    const outputPath = path.resolve(__dirname, '../figma_node_dump.json');
    fs.writeFileSync(outputPath, JSON.stringify(node, null, 2));
    console.log(`Full node data saved to ${outputPath}`);
  })
  .catch(err => {
    console.error('Error fetching data:', err.message);
  });
