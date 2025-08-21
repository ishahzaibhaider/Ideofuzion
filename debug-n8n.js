// Debug script to test n8n API directly
import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjA5MzQ2fQ.s1lzbCR_r4we_WjWIB8AZ1csI93PEpC4BCE--Ulwgxs";
const N8N_BASE_URL = "http://35.209.122.222:5678/api/v1";

async function testConnection() {
  console.log('🔍 Testing n8n API connection...');
  
  // Test different endpoints to see what works
  const endpointsToTest = [
    '/workflows',
    '/executions', 
    '/credentials/types',
    '/health'
  ];
  
  for (const endpoint of endpointsToTest) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${N8N_BASE_URL}${endpoint}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint} works! Status: ${response.status}`);
      if (endpoint === '/workflows' && response.data.data) {
        console.log(`📊 Found ${response.data.data.length} workflows`);
      }
      return true;
    } catch (error) {
      console.log(`❌ ${endpoint} failed: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('❌ All endpoints failed - checking if n8n server is accessible');
  return false;
}

async function checkCredentialTypes() {
  console.log('\n🔍 Checking available credential types...');
  
  // Common credential types to test
  const typesToTest = [
    'httpBasicAuth',
    'httpHeaderAuth', 
    'apiKey',
    'oauth2Api',
    'github',
    'httpDigestAuth'
  ];
  
  for (const type of typesToTest) {
    try {
      const response = await axios.get(`${N8N_BASE_URL}/credentials/schema/${type}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      });
      
      console.log(`✅ ${type} schema:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`❌ ${type} not available or error: ${error.response?.status || error.message}`);
    }
  }
}

async function testCredentialCreation() {
  console.log('\n🔍 Testing credential creation...');
  
  // Try with httpBasicAuth first (our current type)
  try {
    const credentialData = {
      name: "Debug Test Credential - " + Date.now(),
      type: "httpBasicAuth",
      data: {
        user: "test@example.com",
        password: "test_password"
      }
    };

    console.log('📤 Sending credential data:', JSON.stringify(credentialData, null, 2));

    const response = await axios.post(`${N8N_BASE_URL}/credentials`, credentialData, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    console.log('✅ Credential created successfully!');
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Credential creation failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function cleanupTestCredential(credentialId) {
  if (!credentialId) return;
  
  console.log(`\n🧹 Cleaning up test credential (${credentialId})...`);
  try {
    await axios.delete(`${N8N_BASE_URL}/credentials/${credentialId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    console.log('✅ Test credential cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function runDebug() {
  console.log('🧪 n8n API Debug Tool\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot continue - connection failed');
    return;
  }
  
  await checkCredentialTypes();
  
  const credentialId = await testCredentialCreation();
  
  if (credentialId) {
    await cleanupTestCredential(credentialId);
  }
  
  console.log('\n🏁 Debug complete!');
}

runDebug().catch(console.error);
