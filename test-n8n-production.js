// Quick test script to verify n8n API works from production environment
import axios from 'axios';

const N8N_API_KEY = process.env.N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjA5MzQ2fQ.s1lzbCR_r4we_WjWIB8AZ1csI93PEpC4BCE--Ulwgxs";
const N8N_BASE_URL = "http://35.209.122.222:5678/api/v1";

async function testFromProduction() {
  console.log('🧪 Testing n8n API from production environment...');
  console.log('🔑 API Key length:', N8N_API_KEY.length);
  console.log('🌐 n8n URL:', N8N_BASE_URL);
  
  try {
 
    console.log('\n1️⃣ Testing basic connectivity...');
    const response = await axios.get(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ n8n API connection successful!');
    console.log(`📊 Found ${response.data.data?.length || 0} workflows`);
    
    // Check available credential types
    console.log('\n1️⃣5️⃣ Checking available credential types...');
    const credentialTypes = ['googleApi', 'googleOAuth2Api', 'httpBasicAuth', 'httpHeaderAuth'];
    
    for (const type of credentialTypes) {
      try {
        const schemaResponse = await axios.get(`${N8N_BASE_URL}/credentials/schema/${type}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'accept': 'application/json'
          },
          timeout: 5000
        });
        console.log(`✅ ${type} credential type is available`);
      } catch (error) {
        console.log(`❌ ${type} credential type not available (${error.response?.status || error.message})`);
      }
    }
    
    // Test credential creation with Google OAuth2 structure
    console.log('\n2️⃣ Testing credential creation...');
    const testCredential = {
      name: `Production Test - ${Date.now()}`,
      type: "googleOAuth2Api",
      data: {
        clientId: process.env.GOOGLE_CLIENT_ID || "test-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "test-client-secret",
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: ""
      }
    };
    
    const createResponse = await axios.post(`${N8N_BASE_URL}/credentials`, testCredential, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Credential creation successful!');
    console.log('📄 Created credential ID:', createResponse.data.id);
    
    // Clean up test credential
    console.log('\n3️⃣ Cleaning up test credential...');
    await axios.delete(`${N8N_BASE_URL}/credentials/${createResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    
    console.log('✅ Test credential cleaned up');
    console.log('\n🎉 All tests passed! n8n integration should work.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Cannot connect to n8n server - check if n8n is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🚨 Connection timeout - network issue or firewall blocking');
    } else if (error.response) {
      console.error('🚨 n8n API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

testFromProduction().catch(console.error);
