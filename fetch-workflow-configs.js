import axios from 'axios';
import fs from 'fs';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Target workflow IDs from the summary
const TARGET_WORKFLOW_IDS = [
  "QCxCZmYREkK0FODI", // Meeting Bot & Analysis
  "w7k9ejgAD16tskZl", // Busy Slots Working
  "qLVwvsZGpIOSBNYu", // Extending Meeting Time
  "gshw8NOB3t8ZH1cL"  // Cv Processing Workflow
];

async function fetchWorkflowConfig(workflowId) {
  try {
    console.log(`🔍 Fetching workflow configuration for ID: ${workflowId}`);
    
    const response = await axios.get(`${N8N_BASE_URL}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log(`✅ Successfully fetched workflow: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch workflow ${workflowId}:`, error.response?.data || error.message);
    return null;
  }
}

async function fetchAllWorkflowConfigs() {
  console.log('🚀 Starting to fetch all target workflow configurations...\n');
  
  const workflowConfigs = {};
  
  for (const workflowId of TARGET_WORKFLOW_IDS) {
    const config = await fetchWorkflowConfig(workflowId);
    if (config) {
      workflowConfigs[config.name] = {
        id: config.id,
        name: config.name,
        active: config.active,
        nodes: config.nodes,
        connections: config.connections,
        settings: config.settings,
        staticData: config.staticData || {}
      };
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Summary of fetched workflows:');
  Object.keys(workflowConfigs).forEach(name => {
    console.log(`✅ ${name} (${workflowConfigs[name].nodes.length} nodes)`);
  });
  
  // Save to file
  fs.writeFileSync('workflow-configs.json', JSON.stringify(workflowConfigs, null, 2));
  console.log('\n💾 Workflow configurations saved to workflow-configs.json');
  
  return workflowConfigs;
}

// Run the script
fetchAllWorkflowConfigs().catch(console.error);
