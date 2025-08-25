import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

async function testCredentialCreation() {
  console.log('🧪 Testing credential creation fix...');
  
  try {
    // Test 1: Check if n8n API is accessible
    console.log('\n1️⃣ Testing n8n API connectivity...');
    const response = await axios.get(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Workflows found: ${response.data.data?.length || 0}`);
    
    // Test 2: Check credential types
    console.log('\n2️⃣ Testing credential types...');
    const credentialTypes = ['gmailOAuth2', 'googleDriveOAuth2Api', 'googleCalendarOAuth2Api'];
    
    for (const type of credentialTypes) {
      try {
        const schemaResponse = await axios.get(`${N8N_BASE_URL}/credentials/schema/${type}`, {
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
    
    // Test 3: Create a test Gmail credential
    console.log('\n3️⃣ Testing Gmail credential creation...');
    const testCredential = {
      name: `Test Gmail - ${Date.now()}`,
      type: "gmailOAuth2",
      data: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: "{}",
        oauthTokenData: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send",
          token_type: "Bearer",
          expiry_date: Date.now() + (3600 * 1000)
        }
      }
    };
    
    const createResponse = await axios.post(`${N8N_BASE_URL}/credentials`, testCredential, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    console.log(`✅ Credential creation: ${createResponse.status}`);
    if (createResponse.data.id) {
      console.log(`📄 Created credential ID: ${createResponse.data.id}`);
      console.log(`📄 Created credential name: ${createResponse.data.name}`);
      
      // Clean up - delete the test credential
      console.log('\n4️⃣ Cleaning up test credential...');
      await axios.delete(`${N8N_BASE_URL}/credentials/${createResponse.data.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      console.log(`✅ Test credential deleted`);
    }
    
    console.log('\n🎉 All tests passed! Credential creation should now work properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCredentialCreation();
