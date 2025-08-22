// Local test script to verify Gmail OAuth2 credentials fix
// Run this locally to test the fix without SSH access to your server

import axios from 'axios';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Test user data (you can modify these values)
const TEST_USER_EMAIL = "test@example.com"; // Replace with actual test user email
const TEST_USER_ID = "test-user-id"; // Replace with actual test user ID

async function testGmailCredentialsFix() {
  console.log('🧪 Testing Gmail OAuth2 credentials fix locally...');
  console.log('📅 Test started at:', new Date().toISOString());
  
  try {
    // Test 1: Check n8n connectivity
    console.log('\n1️⃣ Testing n8n connectivity...');
    const connectivityResponse = await axios.get(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ n8n connectivity successful');
    console.log(`📊 Found ${connectivityResponse.data.data?.length || 0} workflows`);
    
    // Test 2: Check Gmail OAuth2 credential schema
    console.log('\n2️⃣ Checking Gmail OAuth2 credential schema...');
    const schemaResponse = await axios.get(`${N8N_BASE_URL}/credentials/schema/gmailOAuth2`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Gmail OAuth2 credential type is available');
    const schemaProperties = Object.keys(schemaResponse.data.properties || {});
    console.log('📋 Schema properties:', schemaProperties);
    
    // Check if oauthTokenData is expected in the schema
    const hasOAuthTokenData = schemaProperties.some(prop => 
      prop.includes('oauth') || prop.includes('token')
    );
    console.log(`🔍 Schema includes OAuth token properties: ${hasOAuthTokenData ? 'YES' : 'NO'}`);
    
    // Test 3: List existing Gmail credentials
    console.log('\n3️⃣ Listing existing Gmail credentials...');
    const credentialsResponse = await axios.get(`${N8N_BASE_URL}/credentials`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 5000
    });
    
    const gmailCredentials = credentialsResponse.data.data?.filter(cred => 
      cred.type === 'gmailOAuth2'
    ) || [];
    
    console.log(`📊 Found ${gmailCredentials.length} Gmail OAuth2 credentials`);
    
    if (gmailCredentials.length > 0) {
      console.log('📋 Existing Gmail credentials:');
      gmailCredentials.forEach((cred, index) => {
        console.log(`  ${index + 1}. ${cred.name} (ID: ${cred.id})`);
        console.log(`     Created: ${cred.createdAt}`);
        console.log(`     Updated: ${cred.updatedAt}`);
        
        // Check if credential has oauthTokenData (this would indicate the fix is working)
        if (cred.data && cred.data.oauthTokenData) {
          console.log(`     ✅ Has oauthTokenData: YES`);
          console.log(`     🔑 Token type: ${cred.data.oauthTokenData.token_type || 'N/A'}`);
          console.log(`     📅 Expiry: ${cred.data.oauthTokenData.expiry_date ? new Date(cred.data.oauthTokenData.expiry_date).toISOString() : 'N/A'}`);
        } else {
          console.log(`     ❌ Has oauthTokenData: NO (this indicates the old implementation)`);
        }
      });
    }
    
    // Test 4: Test credential creation with mock data (to verify the fix structure)
    console.log('\n4️⃣ Testing credential creation structure...');
    
    // Mock credential data that matches the fix
    const mockCredentialData = {
      name: `Test Gmail - ${TEST_USER_EMAIL} (${Date.now()})`,
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
          expiry_date: Date.now() + (3600 * 1000) // 1 hour from now
        }
      }
    };
    
    console.log('🔧 Testing credential creation with oauthTokenData structure...');
    console.log('📋 Mock credential structure:', JSON.stringify({
      ...mockCredentialData,
      data: {
        ...mockCredentialData.data,
        oauthTokenData: {
          ...mockCredentialData.data.oauthTokenData,
          access_token: '[REDACTED]',
          refresh_token: '[REDACTED]'
        }
      }
    }, null, 2));
    
    try {
      const createResponse = await axios.post(`${N8N_BASE_URL}/credentials`, mockCredentialData, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Test credential created successfully');
      console.log('📄 Test credential ID:', createResponse.data.id);
      
      // Clean up test credential
      console.log('🧹 Cleaning up test credential...');
      await axios.delete(`${N8N_BASE_URL}/credentials/${createResponse.data.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      });
      console.log('✅ Test credential cleaned up');
      
    } catch (error) {
      console.log('❌ Test credential creation failed:', error.response?.data || error.message);
      console.log('⚠️ This might be expected if using mock data');
    }
    
    // Test 5: Check if your server has the fix deployed
    console.log('\n5️⃣ Checking if your server has the fix deployed...');
    
    // Try to call your server's refresh endpoint (if accessible)
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const testUserId = process.env.TEST_USER_ID || TEST_USER_ID;
    
    try {
      console.log(`🔍 Testing server endpoint: ${serverUrl}/api/auth/refresh-tokens/${testUserId}`);
      const serverResponse = await axios.post(`${serverUrl}/api/auth/refresh-tokens/${testUserId}`, {}, {
        timeout: 10000
      });
      
      console.log('✅ Server refresh endpoint is accessible');
      console.log('📄 Response:', serverResponse.data);
      
    } catch (error) {
      console.log('⚠️ Server refresh endpoint not accessible (this is normal if server is not running locally)');
      console.log('📝 Error:', error.message);
    }
    
    // Test 6: Summary and recommendations
    console.log('\n6️⃣ Summary and Recommendations...');
    
    const hasExistingCredentials = gmailCredentials.length > 0;
    const hasOAuthTokenData = gmailCredentials.some(cred => cred.data?.oauthTokenData);
    
    console.log('📊 Test Results Summary:');
    console.log(`   • n8n connectivity: ✅ Working`);
    console.log(`   • Gmail OAuth2 schema: ✅ Available`);
    console.log(`   • Existing credentials: ${hasExistingCredentials ? 'Found' : 'None'}`);
    console.log(`   • Credentials with oauthTokenData: ${hasOAuthTokenData ? 'YES' : 'NO'}`);
    
    if (!hasOAuthTokenData && hasExistingCredentials) {
      console.log('\n🚨 ISSUE DETECTED: Existing credentials do not have oauthTokenData');
      console.log('💡 RECOMMENDATION: You need to refresh and recreate the credentials');
      console.log('📋 Steps to fix:');
      console.log('   1. Deploy the updated n8nService.ts code to your server');
      console.log('   2. Call the refresh endpoint for each user:');
      console.log(`      POST ${serverUrl}/api/auth/refresh-tokens/{userId}`);
      console.log('   3. Or manually recreate credentials through your application');
    } else if (hasOAuthTokenData) {
      console.log('\n✅ FIX VERIFIED: Credentials have oauthTokenData');
      console.log('🎉 Your Gmail workflows should now work correctly!');
    } else {
      console.log('\n📝 No existing credentials found - this is normal for a fresh setup');
      console.log('💡 When you create new credentials, they should include oauthTokenData');
    }
    
    console.log('\n🎉 Local test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Cannot connect to n8n server - check if n8n is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🚨 Connection timeout - network issue or firewall blocking');
    } else if (error.response) {
      console.error('🚨 API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

// Helper function to check if the fix is in the code
function checkCodeForFix() {
  console.log('\n🔍 Checking if the fix is in your local code...');
  
  try {
    const n8nServicePath = join(process.cwd(), 'server', 'n8nService.ts');
    
    if (!existsSync(n8nServicePath)) {
      console.log('❌ n8nService.ts not found in server directory');
      return false;
    }
    
    const fileContent = readFileSync(n8nServicePath, 'utf8');
    
    // Check for the oauthTokenData structure
    const hasOAuthTokenData = fileContent.includes('oauthTokenData: {');
    const hasAccessToken = fileContent.includes('access_token: freshToken.accessToken');
    const hasRefreshToken = fileContent.includes('refresh_token: accessInfo.refreshToken');
    
    console.log('📋 Code Analysis:');
    console.log(`   • oauthTokenData structure: ${hasOAuthTokenData ? '✅ Found' : '❌ Missing'}`);
    console.log(`   • access_token mapping: ${hasAccessToken ? '✅ Found' : '❌ Missing'}`);
    console.log(`   • refresh_token mapping: ${hasRefreshToken ? '✅ Found' : '❌ Missing'}`);
    
    if (hasOAuthTokenData && hasAccessToken && hasRefreshToken) {
      console.log('✅ The fix is present in your local code!');
      return true;
    } else {
      console.log('❌ The fix is NOT present in your local code');
      console.log('💡 You need to apply the changes to n8nService.ts');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Could not check local code:', error.message);
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive Gmail credentials fix test...\n');
  
  // First check the code
  const codeHasFix = checkCodeForFix();
  
  if (!codeHasFix) {
    console.log('\n⚠️ WARNING: The fix is not in your local code yet!');
    console.log('📝 Please apply the changes to n8nService.ts before testing');
    console.log('💡 The fix adds oauthTokenData to the credential creation');
  }
  
  // Then test the actual functionality
  await testGmailCredentialsFix();
  
  console.log('\n🏁 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
