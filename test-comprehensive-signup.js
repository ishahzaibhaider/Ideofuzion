import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Template workflow IDs that need to be duplicated
const TEMPLATE_WORKFLOW_IDS = [
  "gshw8NOB3t8ZH1cL",
  "qLVwvsZGpIOSBNYu", 
  "w7k9ejgAD16tskZl",
  "QCxCZmYREkK0FODI"
];

/**
 * Test Step 1: Verify template workflows exist
 */
async function testTemplateWorkflows() {
  console.log('🔍 [TEST] Step 1: Verifying template workflows exist...');
  
  for (const templateId of TEMPLATE_WORKFLOW_IDS) {
    try {
      const response = await axios.get(`${N8N_BASE_URL}/workflows/${templateId}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.id) {
        console.log(`✅ [TEST] Template workflow ${templateId} exists: ${response.data.name}`);
        console.log(`   📊 Nodes: ${response.data.nodes?.length || 0}`);
        console.log(`   🔗 Connections: ${Object.keys(response.data.connections || {}).length}`);
      } else {
        console.log(`❌ [TEST] Template workflow ${templateId} returned no data`);
      }
    } catch (error) {
      console.error(`❌ [TEST] Failed to fetch template workflow ${templateId}:`, error.message);
    }
  }
}

/**
 * Test Step 2: Test credential creation
 */
async function testCredentialCreation() {
  console.log('\n🔑 [TEST] Step 2: Testing credential creation...');
  
  const testUser = {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com'
  };
  
  try {
    // Test basic HTTP auth credential
    const credentialData = {
      name: `Creds_User_${testUser.id}_BasicAuth`,
      type: "httpBasicAuth",
      data: {
        user: testUser.email,
        password: "test_password"
      }
    };
    
    const response = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.id) {
      console.log(`✅ [TEST] Successfully created test credential: ${response.data.id}`);
      
      // Clean up the test credential
      await axios.delete(`${N8N_BASE_URL}/credentials/${response.data.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      console.log(`🗑️ [TEST] Cleaned up test credential: ${response.data.id}`);
    }
  } catch (error) {
    console.error(`❌ [TEST] Failed to create test credential:`, error.message);
  }
}

/**
 * Test Step 3: Test workflow duplication process
 */
async function testWorkflowDuplication() {
  console.log('\n📋 [TEST] Step 3: Testing workflow duplication process...');
  
  const testUser = {
    id: 'test-user-456',
    name: 'Test User',
    email: 'test2@example.com'
  };
  
  // Test with the first template workflow
  const templateId = TEMPLATE_WORKFLOW_IDS[0];
  
  try {
    // Step 1: Fetch template
    console.log(`📋 [TEST] Fetching template workflow: ${templateId}`);
    const templateResponse = await axios.get(`${N8N_BASE_URL}/workflows/${templateId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!templateResponse.data) {
      throw new Error('No template data received');
    }
    
    const templateWorkflow = templateResponse.data;
    console.log(`✅ [TEST] Fetched template: ${templateWorkflow.name}`);
    
    // Step 2: Create test credential
    console.log(`🔑 [TEST] Creating test credential for duplication`);
    const credentialData = {
      name: `Creds_User_${testUser.id}_TestAuth`,
      type: "httpBasicAuth",
      data: {
        user: testUser.email,
        password: "test_password"
      }
    };
    
    const credentialResponse = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const credentialId = credentialResponse.data.id;
    console.log(`✅ [TEST] Created test credential: ${credentialId}`);
    
    // Step 3: Modify workflow for user
    console.log(`🔧 [TEST] Modifying workflow for user`);
    const modifiedWorkflow = {
      name: `Workflow for User ${testUser.id} - ${templateWorkflow.name}`,
      nodes: JSON.parse(JSON.stringify(templateWorkflow.nodes)),
      connections: JSON.parse(JSON.stringify(templateWorkflow.connections)),
      settings: templateWorkflow.settings ? JSON.parse(JSON.stringify(templateWorkflow.settings)) : undefined,
      staticData: templateWorkflow.staticData ? JSON.parse(JSON.stringify(templateWorkflow.staticData)) : undefined
    };
    
    // Update node IDs and credentials
    if (modifiedWorkflow.nodes && Array.isArray(modifiedWorkflow.nodes)) {
      modifiedWorkflow.nodes.forEach((node) => {
        node.id = `${node.id}-${testUser.id}`;
        
        if (node.credentials && typeof node.credentials === 'object') {
          const credKeys = Object.keys(node.credentials);
          credKeys.forEach((credKey) => {
            node.credentials[credKey].id = credentialId;
            node.credentials[credKey].name = `Creds_User_${testUser.id}`;
          });
        }
      });
    }
    
    console.log(`✅ [TEST] Modified workflow for user`);
    
    // Step 4: Create new workflow
    console.log(`🚀 [TEST] Creating new workflow in n8n`);
    const newWorkflowResponse = await axios.post(
      `${N8N_BASE_URL}/workflows`,
      modifiedWorkflow,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const newWorkflowId = newWorkflowResponse.data.id;
    console.log(`✅ [TEST] Successfully created new workflow: ${newWorkflowId}`);
    console.log(`📊 [TEST] New workflow name: ${newWorkflowResponse.data.name}`);
    console.log(`📊 [TEST] New workflow nodes: ${newWorkflowResponse.data.nodes?.length || 0}`);
    
    // Step 5: Clean up test resources
    console.log(`🧹 [TEST] Cleaning up test resources`);
    
    // Delete the new workflow
    await axios.delete(`${N8N_BASE_URL}/workflows/${newWorkflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    console.log(`🗑️ [TEST] Deleted test workflow: ${newWorkflowId}`);
    
    // Delete the test credential
    await axios.delete(`${N8N_BASE_URL}/credentials/${credentialId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    console.log(`🗑️ [TEST] Deleted test credential: ${credentialId}`);
    
    console.log(`🎉 [TEST] Workflow duplication test completed successfully!`);
    
  } catch (error) {
    console.error(`❌ [TEST] Workflow duplication test failed:`, error.message);
    
    if (axios.isAxiosError(error)) {
      console.error(`🚨 [TEST] API Error Details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 [TEST] Starting comprehensive signup service tests...\n');
  
  try {
    await testTemplateWorkflows();
    await testCredentialCreation();
    await testWorkflowDuplication();
    
    console.log('\n🎉 [TEST] All tests completed!');
  } catch (error) {
    console.error('\n❌ [TEST] Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
