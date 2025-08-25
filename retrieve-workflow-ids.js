import axios from 'axios';
import fs from 'fs';

// n8n API configuration from n8nService.ts
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Target workflow names
const TARGET_WORKFLOW_NAMES = [
  "CV Processing Workflow",
  "Meeting Bot & Analysis", 
  "Busy Slots Working",
  "Extending Meeting Time"
];

/**
 * Retrieves all workflows from n8n
 */
async function getAllWorkflows() {
  try {
    console.log('🔍 Fetching all workflows from n8n...');
    
    const response = await axios.get(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log('📄 Raw API response:', JSON.stringify(response.data, null, 2));
    
    // Check if response.data is an array or has a data property
    let workflows = response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      workflows = response.data.data;
    } else if (!Array.isArray(response.data)) {
      console.error('❌ Unexpected response format:', typeof response.data);
      console.error('Response keys:', Object.keys(response.data || {}));
      throw new Error('API response is not an array');
    }

    console.log(`✅ Found ${workflows.length} workflows`);
    return workflows;
  } catch (error) {
    console.error('❌ Failed to fetch workflows:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Retrieves a specific workflow by ID
 */
async function getWorkflowById(workflowId) {
  try {
    console.log(`🔍 Fetching workflow with ID: ${workflowId}`);
    
    const response = await axios.get(`${N8N_BASE_URL}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log(`✅ Retrieved workflow: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch workflow ${workflowId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Main function to find and retrieve workflow IDs
 */
async function retrieveWorkflowIds() {
  try {
    console.log('🚀 Starting workflow ID retrieval...');
    console.log('📋 Target workflows:', TARGET_WORKFLOW_NAMES);
    
    // Get all workflows
    const allWorkflows = await getAllWorkflows();
    
    // Filter workflows by name
    const foundWorkflows = [];
    const notFoundWorkflows = [];
    
    for (const targetName of TARGET_WORKFLOW_NAMES) {
      const workflow = allWorkflows.find(w => w.name === targetName);
      if (workflow) {
        foundWorkflows.push({
          name: workflow.name,
          id: workflow.id,
          active: workflow.active,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        });
        console.log(`✅ Found: ${targetName} (ID: ${workflow.id})`);
      } else {
        notFoundWorkflows.push(targetName);
        console.log(`❌ Not found: ${targetName}`);
      }
    }
    
    // Create result object
    const result = {
      timestamp: new Date().toISOString(),
      totalWorkflowsFound: allWorkflows.length,
      targetWorkflowsFound: foundWorkflows.length,
      targetWorkflowsNotFound: notFoundWorkflows.length,
      foundWorkflows: foundWorkflows,
      notFoundWorkflows: notFoundWorkflows,
      allWorkflows: allWorkflows.map(w => ({
        name: w.name,
        id: w.id,
        active: w.active
      }))
    };
    
    // Save to file
    const filename = 'workflow-ids.json';
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    
    console.log('\n📊 Summary:');
    console.log(`Total workflows in n8n: ${result.totalWorkflowsFound}`);
    console.log(`Target workflows found: ${result.targetWorkflowsFound}`);
    console.log(`Target workflows not found: ${result.targetWorkflowsNotFound}`);
    
    if (foundWorkflows.length > 0) {
      console.log('\n✅ Found Workflows:');
      foundWorkflows.forEach(wf => {
        console.log(`  - ${wf.name}: ${wf.id} (${wf.active ? 'Active' : 'Inactive'})`);
      });
    }
    
    if (notFoundWorkflows.length > 0) {
      console.log('\n❌ Not Found Workflows:');
      notFoundWorkflows.forEach(name => {
        console.log(`  - ${name}`);
      });
    }
    
    console.log(`\n💾 Results saved to: ${filename}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in workflow ID retrieval:', error.message);
    throw error;
  }
}

// Run the script
retrieveWorkflowIds()
  .then(result => {
    console.log('\n🎉 Workflow ID retrieval completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Workflow ID retrieval failed:', error.message);
    process.exit(1);
  });

export {
  retrieveWorkflowIds,
  getAllWorkflows,
  getWorkflowById
};
