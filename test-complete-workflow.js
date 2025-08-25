import axios from 'axios';
import fs from 'fs';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Production environment variables (matching deploy.yml)
const PRODUCTION_ENV = {
  NODE_ENV: "production",
  MONGODB_URI: "mongodb://mongodb:27017/ideofuzion",
  BASE_URL: "https://hireninja.site",
  GOOGLE_CLIENT_ID: "test-client-id",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
  GOOGLE_CALLBACK_URL: "https://hireninja.site/auth/google/callback",
  OAUTH_SUCCESS_REDIRECT: "/login",
  SESSION_SECRET: "test-session-secret",
  JWT_SECRET: "test-jwt-secret"
};

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

async function testCompleteWorkflow() {
  console.log('🧪 Testing complete workflow creation process...\n');
  console.log('📋 Environment Configuration:');
  Object.entries(PRODUCTION_ENV).forEach(([key, value]) => {
    console.log(`  ${key}: ${key.includes('SECRET') ? '***' : value}`);
  });
  console.log('');

  const testUserId = 'test-user-' + Date.now();
  const testUserEmail = 'test@hireninja.site';
  
  console.log(`👤 Test User: ${testUserEmail} (ID: ${testUserId})\n`);
  
  const createdWorkflows = [];
  const testResults = {
    total: Object.keys(WORKFLOW_TEMPLATES).length,
    successful: 0,
    failed: 0,
    workflows: []
  };
  
  // Test creating each workflow
  for (const [workflowName, template] of Object.entries(WORKFLOW_TEMPLATES)) {
    try {
      console.log(`🔧 Creating ${workflowName}...`);
      
      // Customize template for test user (matching production logic)
      const customizedTemplate = {
        ...template,
        name: `${workflowName} - ${testUserEmail}`,
        nodes: template.nodes.map(node => ({
          ...node,
          id: `${node.id}-${testUserId}`,
          // Add credentials if needed (simulating production behavior)
          credentials: getCredentialsForNode(node.type, testUserId, testUserEmail)
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
      console.log(`🔗 Connections: ${Object.keys(response.data.connections).length}`);
      console.log(`🔄 Active: ${response.data.active}\n`);

      createdWorkflows.push({
        name: workflowName,
        id: response.data.id,
        active: response.data.active,
        nodes: response.data.nodes.length,
        connections: Object.keys(response.data.connections).length
      });

      testResults.successful++;
      testResults.workflows.push({
        name: workflowName,
        status: 'success',
        id: response.data.id
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
      
      testResults.failed++;
      testResults.workflows.push({
        name: workflowName,
        status: 'failed',
        error: error.response?.data || error.message
      });
    }
  }
  
  // Test Summary
  console.log(`\n📊 Test Results Summary:`);
  console.log(`=====================================`);
  console.log(`Total Workflows: ${testResults.total}`);
  console.log(`✅ Successful: ${testResults.successful}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.successful / testResults.total) * 100).toFixed(1)}%`);
  
  console.log(`\n🎯 Created Workflows:`);
  createdWorkflows.forEach(wf => {
    console.log(`  ✅ ${wf.name}`);
    console.log(`     ID: ${wf.id}`);
    console.log(`     Nodes: ${wf.nodes}`);
    console.log(`     Connections: ${wf.connections}`);
    console.log(`     Active: ${wf.active}`);
    console.log('');
  });
  
  if (testResults.failed > 0) {
    console.log(`❌ Failed Workflows:`);
    testResults.workflows
      .filter(wf => wf.status === 'failed')
      .forEach(wf => {
        console.log(`  ❌ ${wf.name}: ${wf.error}`);
      });
  }
  
  // Clean up test workflows
  if (createdWorkflows.length > 0) {
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
  
  // Final result
  console.log(`\n🎯 Final Result:`);
  if (testResults.successful === testResults.total) {
    console.log(`🎉 ALL WORKFLOWS CREATED SUCCESSFULLY!`);
    console.log(`✅ Ready for production deployment`);
  } else {
    console.log(`⚠️ ${testResults.failed} workflow(s) failed to create`);
    console.log(`❌ Review errors before production deployment`);
  }
  
  return testResults.successful === testResults.total;
}

function getCredentialsForNode(nodeType, userId, userEmail) {
  // Simulate credential assignment (matching production logic)
  switch (nodeType) {
    case "n8n-nodes-base.gmail":
      return {
        gmailOAuth2: {
          id: `gmail-${userId}`,
          name: `Gmail - ${userEmail}`
        }
      };
    case "n8n-nodes-base.googleCalendar":
      return {
        googleCalendarOAuth2Api: {
          id: `calendar-${userId}`,
          name: `Google Calendar - ${userEmail}`
        }
      };
    default:
      return undefined;
  }
}

// Run the complete test
testCompleteWorkflow()
  .then(success => {
    if (success) {
      console.log('\n🚀 Production deployment test PASSED!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Production deployment test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
