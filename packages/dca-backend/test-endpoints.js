// Simple test script to check if endpoints are working
// Run this with: node test-endpoints.js

const https = require('https');
const http = require('http');

// Replace with your Railway backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoints() {
  console.log(`Testing endpoints for: ${BACKEND_URL}`);

  try {
    // Test health endpoint
    console.log('\n1. Testing /health endpoint...');
    const healthResponse = await makeRequest(`${BACKEND_URL}/health`);
    console.log('Health check:', healthResponse);

    // Test transfer-job endpoint (should fail without auth)
    console.log('\n2. Testing /transfer-job endpoint (should fail without auth)...');
    const transferResponse = await makeRequest(`${BACKEND_URL}/transfer-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        recipientAddress: '0x1234567890123456789012345678901234567890',
        tokenAddress: '0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089',
        amount: 1.0,
      },
    });
    console.log('Transfer job (no auth):', transferResponse);
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  }
}

testEndpoints();
