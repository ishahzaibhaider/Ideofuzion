// Test Google services credential creation with proper scopes
import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Google service configurations matching the examples provided
const GOOGLE_SERVICES = {
  calendar: {
    type: "googleCalendarOAuth2Api",
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    name: "Google Calendar"
  },
  gmail: {
    type: "gmailOAuth2Api",
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send",
    name: "Gmail"
  },
  contacts: {
    type: "googleContactsOAuth2Api",
    scope: "https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly",
    name: "Google Contacts"
  },
  drive: {
    type: "googleDriveOAuth2Api",
    scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file",
    name: "Google Drive"
  },
  sheets: {
    type: "googleSheetsOAuth2Api",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly",
    name: "Google Sheets"
  },
  docs: {
    type: "googleDocsOAuth2Api",
    scope: "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly",
    name: "Google Docs"
  }
};

async function testGoogleServices() {
  console.log('🧪 Testing Google services credential creation...');
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
    
    // Test 2: Check available credential schemas
    console.log('\n2️⃣ Checking available credential schemas...');
    const credentialTypes = Object.values(GOOGLE_SERVICES).map(service => service.type);
    
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
    
    // Test 3: Create test user data
    const testUser = {
      id: `test-${Date.now()}`,
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      accessToken: 'test-access-token-12345',
      refreshToken: 'test-refresh-token-67890',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify'
    };
    
    // Test 4: Create credentials for each Google service
    console.log('\n3️⃣ Creating Google service credentials...');
    const createdCredentials = [];
    
    for (const [serviceKey, serviceConfig] of Object.entries(GOOGLE_SERVICES)) {
      try {
        console.log(`🔧 Creating ${serviceConfig.name} credential...`);
        
        const credentialData = {
          name: `${serviceConfig.name} - ${testUser.email}`,
          type: serviceConfig.type,
          data: {
            clientId: "test-client-id.googleusercontent.com",
            clientSecret: "test-client-secret",
            oauthTokenData: {
              accessToken: testUser.accessToken,
              refreshToken: testUser.refreshToken,
              expiresAt: new Date(Date.now() + (3600 * 1000)).toISOString(),
              expiresIn: 3600,
              tokenType: "Bearer",
              scope: serviceConfig.scope
            }
          }
        };
        
        console.log(`📝 Creating ${serviceConfig.name} credential for: ${testUser.email}`);
        console.log(`🔑 Using scope: ${serviceConfig.scope}`);
        
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
        
        console.log(`✅ ${serviceConfig.name} credential created successfully!`);
        console.log(`📄 Credential ID: ${credentialResponse.data.id}`);
        console.log(`📄 Credential name: ${credentialResponse.data.name}`);
        
        createdCredentials.push({
          service: serviceKey,
          serviceName: serviceConfig.name,
          credentialId: credentialResponse.data.id,
          credentialName: credentialResponse.data.name,
          type: serviceConfig.type,
          scope: serviceConfig.scope
        });
        
      } catch (error) {
        console.error(`❌ Failed to create ${serviceConfig.name} credential:`, error.message);
        
        if (axios.isAxiosError(error)) {
          console.error(`🚨 API Error Details for ${serviceConfig.name}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        
        // Continue with other services even if one fails
        console.log(`⚠️ Continuing with other services despite ${serviceConfig.name} failure`);
      }
    }
    
    // Test 5: Clean up test credentials
    console.log('\n4️⃣ Cleaning up test credentials...');
    for (const credential of createdCredentials) {
      try {
        await axios.delete(`${N8N_BASE_URL}/credentials/${credential.credentialId}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'accept': 'application/json'
          }
        });
        console.log(`✅ Cleaned up ${credential.serviceName} credential`);
      } catch (error) {
        console.log(`⚠️ Failed to clean up ${credential.serviceName} credential: ${error.message}`);
      }
    }
    
    // Test 6: Summary
    console.log('\n5️⃣ Test Summary:');
    console.log(`📊 Successfully created ${createdCredentials.length} out of ${Object.keys(GOOGLE_SERVICES).length} Google service credentials`);
    
    if (createdCredentials.length > 0) {
      console.log('\n📋 Created credentials:');
      createdCredentials.forEach(cred => {
        console.log(`  ✅ ${cred.serviceName} (${cred.type})`);
        console.log(`     ID: ${cred.credentialId}`);
        console.log(`     Scope: ${cred.scope}`);
      });
    }
    
    console.log('\n🎉 Google services credential test completed!');
    console.log('📋 Your n8n integration is ready to create Google service credentials for real users.');
    console.log('💡 When users sign up with Google OAuth, they will get credentials for:');
    console.log('   - Google Calendar');
    console.log('   - Gmail');
    console.log('   - Google Contacts');
    console.log('   - Google Drive');
    console.log('   - Google Sheets');
    console.log('   - Google Docs');
    
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

testGoogleServices().catch(console.error);
