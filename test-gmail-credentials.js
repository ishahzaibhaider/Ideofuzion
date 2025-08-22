// Test script to verify Gmail OAuth2 credentials are working correctly
import axios from 'axios';

const N8N_API_KEY = process.env.N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

async function testGmailCredentials() {
  console.log('🧪 Testing Gmail OAuth2 credentials...');
  
  try {
    // Test 1: Check if gmailOAuth2 credential type is available
    console.log('\n1️⃣ Checking Gmail OAuth2 credential type...');
    const schemaResponse = await axios.get(`${N8N_BASE_URL}/credentials/schema/gmailOAuth2`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Gmail OAuth2 credential type is available');
    console.log('📋 Schema properties:', Object.keys(schemaResponse.data.properties || {}));
    
    // Test 2: List existing Gmail credentials
    console.log('\n2️⃣ Listing existing Gmail credentials...');
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
      console.log('📋 Gmail credentials:');
      gmailCredentials.forEach((cred, index) => {
        console.log(`  ${index + 1}. ${cred.name} (ID: ${cred.id})`);
        console.log(`     Created: ${cred.createdAt}`);
        console.log(`     Updated: ${cred.updatedAt}`);
      });
    }
    
    // Test 3: Test workflow execution (if you have a workflow ID)
    const workflowId = process.env.TEST_WORKFLOW_ID;
    if (workflowId) {
      console.log(`\n3️⃣ Testing workflow execution with ID: ${workflowId}`);
      
      try {
        const workflowResponse = await axios.post(`${N8N_BASE_URL}/workflows/${workflowId}/trigger`, {}, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('✅ Workflow triggered successfully');
        console.log('📄 Execution ID:', workflowResponse.data.executionId);
        
        // Wait a moment and check execution status
        setTimeout(async () => {
          try {
            const executionResponse = await axios.get(`${N8N_BASE_URL}/executions/${workflowResponse.data.executionId}`, {
              headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'accept': 'application/json'
              }
            });
            
            console.log('📊 Execution status:', executionResponse.data.status);
            if (executionResponse.data.error) {
              console.log('❌ Execution error:', executionResponse.data.error);
            }
          } catch (error) {
            console.log('⚠️ Could not check execution status:', error.message);
          }
        }, 2000);
        
      } catch (error) {
        console.log('❌ Workflow execution failed:', error.response?.data || error.message);
      }
    } else {
      console.log('\n3️⃣ Skipping workflow test (set TEST_WORKFLOW_ID env var to test)');
    }
    
    console.log('\n🎉 Gmail credentials test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('🚨 API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

// Run the test
testGmailCredentials().catch(console.error);
