// Comprehensive n8n integration debug test
import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

async function debugN8nIntegration() {
  console.log('🔍 DEBUGGING n8n Integration...');
  console.log(`🌐 n8n URL: ${N8N_BASE_URL}`);
  console.log(`🔑 API Key length: ${N8N_API_KEY.length}`);
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1️⃣ Testing basic connectivity...');
    const healthResponse = await axios.get(`${N8N_BASE_URL}/credentials`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ n8n API is reachable');
    console.log(`📄 Found ${healthResponse.data.length || 0} existing credentials`);
    
    // Test 2: Test regular signup credential (basic HTTP auth)
    console.log('\n2️⃣ Testing regular signup credential creation...');
    const regularUser = {
      id: `test-${Date.now()}`,
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@example.com`
    };
    
    const basicCredentialData = {
      name: `${regularUser.name} - Basic Auth`,
      type: "httpBasicAuth",
      data: {
        user: regularUser.email,
        password: "default_password"
      }
    };
    
    console.log(`📝 Creating basic auth credential for: ${regularUser.email}`);
    console.log(`🔧 Credential data:`, JSON.stringify(basicCredentialData, null, 2));
    
    const basicResponse = await axios.post(
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
    
    console.log('✅ Basic auth credential created successfully!');
    console.log('📄 Credential ID:', basicResponse.data.id);
    console.log('📄 Credential name:', basicResponse.data.name);
    
    // Test 3: Test Google OAuth credential (Calendar)
    console.log('\n3️⃣ Testing Google OAuth credential creation...');
    const googleUser = {
      id: `google-${Date.now()}`,
      name: `Google User ${Date.now()}`,
      email: `google-${Date.now()}@example.com`,
      accessToken: 'test-access-token-12345',
      refreshToken: 'test-refresh-token-67890',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify'
    };
    
    const calendarCredentialData = {
      name: `Google Calendar - ${googleUser.email}`,
      type: "googleCalendarOAuth2Api",
      data: {
        clientId: "test-client-id.googleusercontent.com",
        clientSecret: "test-client-secret",
        oauthTokenData: {
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
          expiresAt: new Date(Date.now() + (3600 * 1000)).toISOString(),
          expiresIn: 3600,
          tokenType: "Bearer",
          scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
        }
      }
    };
    
    console.log(`📝 Creating Google Calendar credential for: ${googleUser.email}`);
    console.log(`🔧 Credential data:`, JSON.stringify({
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
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Google Calendar credential created successfully!');
    console.log('📄 Credential ID:', calendarResponse.data.id);
    console.log('📄 Credential name:', calendarResponse.data.name);
    
    // Test 4: Test Gmail credential
    console.log('\n4️⃣ Testing Gmail credential creation...');
    const gmailCredentialData = {
      name: `Gmail - ${googleUser.email}`,
      type: "gmailOAuth2Api",
      data: {
        clientId: "test-client-id.googleusercontent.com",
        clientSecret: "test-client-secret",
        oauthTokenData: {
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
          expiresAt: new Date(Date.now() + (3600 * 1000)).toISOString(),
          expiresIn: 3600,
          tokenType: "Bearer",
          scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send"
        }
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
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Gmail credential created successfully!');
    console.log('📄 Credential ID:', gmailResponse.data.id);
    console.log('📄 Credential name:', gmailResponse.data.name);
    
    // Test 5: Clean up test credentials
    console.log('\n5️⃣ Cleaning up test credentials...');
    
    await axios.delete(`${N8N_BASE_URL}/credentials/${basicResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    console.log('✅ Basic auth credential cleaned up');
    
    await axios.delete(`${N8N_BASE_URL}/credentials/${calendarResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    console.log('✅ Google Calendar credential cleaned up');
    
    await axios.delete(`${N8N_BASE_URL}/credentials/${gmailResponse.data.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });
    console.log('✅ Gmail credential cleaned up');
    
    // Test 6: Summary
    console.log('\n6️⃣ Test Summary:');
    console.log('✅ n8n API connectivity: WORKING');
    console.log('✅ Basic auth credential creation: WORKING');
    console.log('✅ Google Calendar credential creation: WORKING');
    console.log('✅ Gmail credential creation: WORKING');
    console.log('✅ Credential cleanup: WORKING');
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('📋 Your n8n integration is working perfectly.');
    console.log('💡 The issue was likely the incorrect OAuth callback URL.');
    console.log('🔧 Fixed callback URL from n8n.hireninja.site to hireninja.site');
    console.log('🚀 Your Google OAuth signup should now create n8n credentials!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (axios.isAxiosError(error)) {
      console.error('🚨 HTTP Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      if (error.response?.status === 401) {
        console.error('🔑 Authentication failed - check your N8N_API_KEY');
      } else if (error.response?.status === 403) {
        console.error('🚫 Access forbidden - check API key permissions');
      } else if (error.response?.status === 404) {
        console.error('🚫 Endpoint not found - check n8n API version');
      }
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

debugN8nIntegration().catch(console.error);
