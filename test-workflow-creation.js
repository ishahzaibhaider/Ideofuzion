import axios from 'axios';
import fs from 'fs';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Load workflow configurations
let WORKFLOW_TEMPLATES = {};

try {
  const configData = fs.readFileSync('workflow-configs.json', 'utf8');
  const configs = JSON.parse(configData);
  
  // Transform the fetched configurations into templates
  Object.keys(configs).forEach(workflowName => {
    const config = configs[workflowName];
    WORKFLOW_TEMPLATES[workflowName] = {
      name: config.name,
      nodes: config.nodes,
      connections: config.connections,
      settings: config.settings,
      staticData: config.staticData || {}
    };
  });
  
  console.log(`✅ Loaded ${Object.keys(WORKFLOW_TEMPLATES).length} workflow templates`);
} catch (error) {
  console.error(`❌ Error loading workflow configs:`, error);
  process.exit(1);
}

async function testWorkflowCreation() {
  console.log('🧪 Testing workflow creation with actual configurations...\n');
  
  const testUserId = 'test-user-' + Date.now();
  const testUserEmail = 'test@example.com';
  
  const createdWorkflows = [];
  
  // Test creating each workflow
  for (const [workflowName, template] of Object.entries(WORKFLOW_TEMPLATES)) {
    try {
      console.log(`🔧 Testing creation of ${workflowName}...`);
      
      // Customize template for test user
      const customizedTemplate = {
        ...template,
        name: `${workflowName} - ${testUserEmail}`,
        nodes: template.nodes.map(node => ({
          ...node,
          id: `${node.id}-${testUserId}`
        }))
      };

      const response = await axios.post(
        `${N8N_BASE_URL}/workflows`,
        customizedTemplate,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          }
        }
      );

      console.log(`✅ ${workflowName} created successfully`);
      console.log(`📄 Workflow ID: ${response.data.id}`);
      console.log(`📊 Nodes: ${response.data.nodes.length}`);
      console.log(`🔗 Connections: ${Object.keys(response.data.connections).length}\n`);

      createdWorkflows.push({
        name: workflowName,
        id: response.data.id,
        active: response.data.active
      });

    } catch (error) {
      console.error(`❌ Failed to create ${workflowName}:`, error.response?.data || error.message);
      
      if (axios.isAxiosError(error)) {
        console.error(`🚨 API Error Details:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
    }
  }
  
  console.log(`\n📋 Test Summary:`);
  console.log(`✅ Successfully created: ${createdWorkflows.length}/${Object.keys(WORKFLOW_TEMPLATES).length} workflows`);
  
  if (createdWorkflows.length > 0) {
    console.log(`\n🎯 Created workflows:`);
    createdWorkflows.forEach(wf => {
      console.log(`  - ${wf.name} (ID: ${wf.id}, Active: ${wf.active})`);
    });
    
    // Clean up test workflows
    console.log(`\n🧹 Cleaning up test workflows...`);
    for (const workflow of createdWorkflows) {
      try {
        await axios.delete(`${N8N_BASE_URL}/workflows/${workflow.id}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });
        console.log(`✅ Deleted ${workflow.name}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${workflow.name}:`, error.message);
      }
    }
  }
  
  return createdWorkflows.length === Object.keys(WORKFLOW_TEMPLATES).length;
}

// Run the test
testWorkflowCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 All workflows created successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some workflows failed to create');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
