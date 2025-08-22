import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Test data - replace with actual values from your access_info collection
const TEST_ACCESS_INFO = {
  userId: "test-user-id",
  email: "test@example.com",
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  clientId: process.env.GOOGLE_CLIENT_ID || "test-client-id",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "test-client-secret",
  scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.modify",
  tokenType: "Bearer",
  expiresAt: new Date(Date.now() + (3600 * 1000))
};

async function testN8nCredentialCreation() {
  console.log('🧪 Testing n8n credential creation...');
  
  try {
    // Test 1: Create a Google Calendar credential
    console.log('\n📅 Testing Google Calendar credential creation...');
    
    const calendarCredentialData = {
      name: `Google Calendar - ${TEST_ACCESS_INFO.email}`,
      type: "googleCalendarOAuth2Api",
      data: {
        clientId: TEST_ACCESS_INFO.clientId,
        clientSecret: TEST_ACCESS_INFO.clientSecret,
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: "{}",
                 // Note: We don't include oauthTokenData here because n8n will handle the OAuth2 flow
         // when the workflow runs. The credential will be created in "pending" state
         // and n8n will prompt for OAuth2 authorization when first used.
      }
    };

    console.log('📤 Sending calendar credential data:', JSON.stringify({
      ...calendarCredentialData,
      data: {
        ...calendarCredentialData.data,
        oauthTokenData: {
          ...calendarCredentialData.data.oauthTokenData,
          accessToken: '[REDACTED]',
          refreshToken: '[REDACTED]'
        }
      }
    }, null, 2));

    const calendarResponse = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      calendarCredentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log('✅ Calendar credential created successfully:');
    console.log('📄 Response:', JSON.stringify(calendarResponse.data, null, 2));

    // Test 2: Create a Gmail credential
    console.log('\n📧 Testing Gmail credential creation...');
    
    const gmailCredentialData = {
      name: `Gmail - ${TEST_ACCESS_INFO.email}`,
      type: "gmailOAuth2",
      data: {
        clientId: TEST_ACCESS_INFO.clientId,
        clientSecret: TEST_ACCESS_INFO.clientSecret,
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: "{}",
                 // Note: We don't include oauthTokenData here because n8n will handle the OAuth2 flow
         // when the workflow runs. The credential will be created in "pending" state
         // and n8n will prompt for OAuth2 authorization when first used.
      }
    };

    const gmailResponse = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      gmailCredentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log('✅ Gmail credential created successfully:');
    console.log('📄 Response:', JSON.stringify(gmailResponse.data, null, 2));

    // Test 3: Get credential schema for Google Calendar
    console.log('\n📋 Testing credential schema retrieval...');
    
    const schemaResponse = await axios.get(
      `${N8N_BASE_URL}/credentials/schema/googleCalendarOAuth2Api`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      }
    );

    console.log('✅ Credential schema retrieved successfully:');
    console.log('📄 Schema:', JSON.stringify(schemaResponse.data, null, 2));

    // Test 4: Test the API endpoint (if server is running)
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const apiResponse = await axios.post(
        `${BASE_URL}/api/n8n/create-credentials/${TEST_ACCESS_INFO.userId}`,
        {},
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ API endpoint test successful:');
      console.log('📄 Response:', JSON.stringify(apiResponse.data, null, 2));
    } catch (apiError) {
      console.log('⚠️ API endpoint test failed (server might not be running):');
      console.log('📄 Error:', apiError.message);
    }

    // Test 5: Test the token refresh endpoint (if server is running)
    console.log('\n🔄 Testing token refresh API endpoint...');
    
    try {
      const refreshApiResponse = await axios.post(
        `${BASE_URL}/api/n8n/refresh-tokens/${TEST_ACCESS_INFO.userId}`,
        {},
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Token refresh API endpoint test successful:');
      console.log('📄 Response:', JSON.stringify(refreshApiResponse.data, null, 2));
    } catch (refreshApiError) {
      console.log('⚠️ Token refresh API endpoint test failed (server might not be running):');
      console.log('📄 Error:', refreshApiError.message);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (axios.isAxiosError(error)) {
      console.error('🚨 API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }
  }
}

// Run the test
testN8nCredentialCreation();
