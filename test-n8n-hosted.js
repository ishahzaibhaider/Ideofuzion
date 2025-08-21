// Test n8n integration with new hosted instance
import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjA5MzQ2fQ.s1lzbCR_r4we_WjWIB8AZ1csI93PEpC4BCE--Ulwgxs";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

async function testN8nHostedInstance() {
  console.log('🧪 Testing n8n hosted instance at n8n.hireninja.site...');
  console.log(`🌐 Testing URL: ${N8N_BASE_URL}`);
  
  try {
    // Test 1: Check if n8n API is reachable
    console.log('\n1️⃣ Testing n8n API connectivity...');
    try {
      const healthResponse = await axios.get(`${N8N_BASE_URL}/credentials`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ n8n API is reachable');
      console.log(`📄 Found ${healthResponse.data.length || 0} existing credentials`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ n8n API is reachable (401 Unauthorized is expected without proper auth)');
      } else {
        throw error;
      }
    }
    
    // Test 2: Test credential creation with test data
    console.log('\n2️⃣ Testing credential creation...');
    const testUser = {
      id: `test-${Date.now()}`,
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      scope: 'https://www.googleapis.com/auth/gmail.modify'
    };
    
    const credentialData = {
      name: `test-google-user-${testUser.id}`,
      type: "googleOAuth2Api",
      data: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: "",
        oauthTokenData: {
          access_token: testUser.accessToken,
          refresh_token: testUser.refreshToken,
          scope: testUser.scope,
          token_type: 'Bearer',
          expiry_date: Date.now() + (3600 * 1000)
        }
      }
    };
    
    console.log(`📝 Attempting to create credential for: ${testUser.email}`);
    
    const credentialResponse = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Credential creation successful!');
    console.log('📄 Response status:', credentialResponse.status);
    console.log('📄 Credential ID:', credentialResponse.data.id);
    console.log('📄 Credential name:', credentialResponse.data.name);
    
    // Test 3: Test getting credential schemas
    console.log('\n3️⃣ Testing credential schema retrieval...');
    try {
      const schemaResponse = await axios.get(
        `${N8N_BASE_URL}/credentials/schema/googleOAuth2Api`,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'accept': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ Credential schema retrieved successfully');
      console.log('📄 Schema properties:', Object.keys(schemaResponse.data.properties || {}));
    } catch (error) {
      console.log('⚠️ Could not retrieve credential schema (this is optional):', error.message);
    }
    
    console.log('\n🎉 n8n hosted instance test completed successfully!');
    console.log('📋 Your n8n integration is working with the new hosted instance.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Cannot connect to n8n - check if the hosted instance is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🚨 Connection timeout - n8n instance might be overloaded');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🚨 DNS resolution failed - check the domain n8n.hireninja.site');
    } else if (error.response) {
      console.error('🚨 HTTP Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        console.error('🔑 Authentication failed - check your N8N_API_KEY');
      } else if (error.response.status === 403) {
        console.error('🚫 Access forbidden - check API key permissions');
      }
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

testN8nHostedInstance().catch(console.error);
