import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Original workflow IDs from the user's links
const ORIGINAL_WORKFLOW_IDS = [
  { id: "gshw8NOB3t8ZH1cL", name: "Cv Processing Workflow", url: "https://n8n.hireninja.site/workflow/gshw8NOB3t8ZH1cL" },
  { id: "qLVwvsZGpIOSBNYu", name: "Extending Meeting Time", url: "https://n8n.hireninja.site/workflow/qLVwvsZGpIOSBNYu" },
  { id: "w7k9ejgAD16tskZl", name: "Busy Slots Working", url: "https://n8n.hireninja.site/workflow/w7k9ejgAD16tskZl" },
  { id: "QCxCZmYREkK0FODI", name: "Meeting Bot & Analysis", url: "https://n8n.hireninja.site/workflow/QCxCZmYREkK0FODI" }
];

async function verifyOriginalWorkflows() {
  console.log('🔍 Verifying original workflows from n8n instance...\n');
  
  for (const workflow of ORIGINAL_WORKFLOW_IDS) {
    try {
      console.log(`📋 Checking ${workflow.name}...`);
      console.log(`🔗 URL: ${workflow.url}`);
      
      const response = await axios.get(`${N8N_BASE_URL}/workflows/${workflow.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      });
      
      const workflowData = response.data;
      console.log(`✅ ${workflow.name}:`);
      console.log(`   - ID: ${workflowData.id}`);
      console.log(`   - Active: ${workflowData.active}`);
      console.log(`   - Nodes: ${workflowData.nodes.length}`);
      console.log(`   - Connections: ${Object.keys(workflowData.connections).length}`);
      console.log(`   - Created: ${workflowData.createdAt}`);
      console.log(`   - Updated: ${workflowData.updatedAt}`);
      
      // Show first few node types
      const nodeTypes = workflowData.nodes.slice(0, 5).map(n => n.type);
      console.log(`   - Sample node types: ${nodeTypes.join(', ')}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${workflow.name}:`, error.response?.data || error.message);
    }
  }
  
  console.log('📊 Summary of original workflows:');
  console.log('=====================================');
  
  // Also check our stored configurations
  const fs = await import('fs');
  try {
    const configData = fs.readFileSync('workflow-configs.json', 'utf8');
    const configs = JSON.parse(configData);
    
    Object.keys(configs).forEach(name => {
      const config = configs[name];
      console.log(`✅ ${name}: ${config.nodes.length} nodes, ${Object.keys(config.connections).length} connections`);
    });
  } catch (error) {
    console.error('❌ Error reading stored configs:', error.message);
  }
}

// Run the verification
verifyOriginalWorkflows().catch(console.error);
