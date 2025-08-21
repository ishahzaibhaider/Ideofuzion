// Test only the n8n integration without affecting live user data
import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjA5MzQ2fQ.s1lzbCR_r4we_WjWIB8AZ1csI93PEpC4BCE--Ulwgxs";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

async function testN8nIntegrationOnly() {
  console.log('🧪 Testing n8n integration (without affecting live users)...');
  console.log(`🌐 Testing n8n URL: ${N8N_BASE_URL}`);
  
  try {
    // Test 1: Check n8n API connectivity
    console.log('\n1️⃣ Testing n8n API connectivity...');
    const healthResponse = await axios.get(`${N8N_BASE_URL}/credentials`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ n8n API is reachable');
    console.log(`📄 Found ${healthResponse.data.length || 0} existing credentials`);
    
    // Test 2: Test Google OAuth2 credential creation (simulated)
    console.log('\n2️⃣ Testing Google OAuth2 credential creation...');
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
    
    console.log(`📝 Creating test credential for: ${testUser.email}`);
    
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
    
    console.log('✅ Google OAuth2 credential creation successful!');
    console.log('📄 Credential ID:', credentialResponse.data.id);
    console.log('📄 Credential name:', credentialResponse.data.name);
    
    // Test 3: Test basic HTTP auth credential creation (simulated)
    console.log('\n3️⃣ Testing basic HTTP auth credential creation...');
    const basicCredentialData = {
      name: `test-basic-user-${testUser.id}`,
      type: "httpBasicAuth",
      data: {
        user: testUser.email,
        password: "test_password"
      }
    };
    
    const basicCredentialResponse = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      basicCredentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Basic HTTP auth credential creation successful!');
    console.log('📄 Credential ID:', basicCredentialResponse.data.id);
    
    // Test 4: Clean up test credentials
    console.log('\n4️⃣ Cleaning up test credentials...');
    await axios.delete(`${N8N_BASE_URL}/credentials/${credentialResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    
    await axios.delete(`${N8N_BASE_URL}/credentials/${basicCredentialResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    
    console.log('✅ Test credentials cleaned up');
    
    // Test 5: Verify credential schemas are available
    console.log('\n5️⃣ Verifying credential schemas...');
    const credentialTypes = ['googleOAuth2Api', 'httpBasicAuth', 'httpHeaderAuth'];
    
    for (const type of credentialTypes) {
      try {
        const schemaResponse = await axios.get(`${N8N_BASE_URL}/credentials/schema/${type}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'accept': 'application/json'
          },
          timeout: 5000
        });
        console.log(`✅ ${type} schema available`);
      } catch (error) {
        console.log(`⚠️ ${type} schema not available (${error.response?.status || error.message})`);
      }
    }
    
    console.log('\n🎉 n8n integration test completed successfully!');
    console.log('📋 Your n8n integration is working perfectly.');
    console.log('💡 When real users sign up, their credentials will be created automatically.');
    
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

testN8nIntegrationOnly().catch(console.error);
