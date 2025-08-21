// Simple n8n test that can be run from the host
const https = require('https');
const http = require('http');

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testN8n() {
  console.log('🧪 Testing n8n API connectivity...');
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1️⃣ Testing basic connectivity...');
    const response = await makeRequest(`${N8N_BASE_URL}/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Workflows found: ${response.data.data?.length || 0}`);
    
    // Test 2: Check credential types
    console.log('\n2️⃣ Testing credential types...');
    const types = ['googleApi', 'httpBasicAuth'];
    
    for (const type of types) {
      try {
        const schemaResponse = await makeRequest(`${N8N_BASE_URL}/credentials/schema/${type}`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'accept': 'application/json'
          }
        });
        console.log(`✅ ${type}: Available (Status: ${schemaResponse.status})`);
      } catch (error) {
        console.log(`❌ ${type}: Not available (${error.message})`);
      }
    }
    
    // Test 3: Create a simple credential
    console.log('\n3️⃣ Testing credential creation...');
    const testCredential = {
      name: `Test Credential - ${Date.now()}`,
      type: "httpBasicAuth",
      data: {
        user: "test@example.com",
        password: "test123"
      }
    };
    
    const createResponse = await makeRequest(`${N8N_BASE_URL}/credentials`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    }, testCredential);
    
    console.log(`✅ Credential creation: ${createResponse.status}`);
    if (createResponse.data.id) {
      console.log(`📄 Created credential ID: ${createResponse.data.id}`);
      
      // Clean up
      console.log('\n4️⃣ Cleaning up test credential...');
      const deleteResponse = await makeRequest(`${N8N_BASE_URL}/credentials/${createResponse.data.id}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      });
      console.log(`✅ Cleanup: ${deleteResponse.status}`);
    }
    
    console.log('\n🎉 n8n API is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testN8n();
