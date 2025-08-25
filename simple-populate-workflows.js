import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const N8N_BASE_URL = 'https://n8n.hireninja.site/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4';

// Mock user ID for testing
const TEST_USER_ID = 'test-user-123';

/**
 * Fetch complete workflow data from n8n
 */
async function fetchWorkflowData(workflowId) {
  try {
    console.log(`🔄 Fetching workflow: ${workflowId}`);
    const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow ${workflowId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched workflow: ${data.name}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching workflow ${workflowId}:`, error.message);
    return null;
  }
}

/**
 * Store workflow data in JSON format
 */
function storeWorkflowInJSON(workflowData, storedWorkflows) {
  const workflowDoc = {
    userId: TEST_USER_ID,
    n8nId: workflowData.id,
    name: workflowData.name,
    active: workflowData.active,
    workflowData: workflowData, // Store complete workflow data
    metadata: {
      version: workflowData.versionId || '1.0.0',
      tags: workflowData.tags?.map(tag => tag.name) || [],
      category: 'automation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    status: workflowData.active ? 'active' : 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Check if workflow already exists
  const existingIndex = storedWorkflows.findIndex(wf => wf.n8nId === workflowData.id);
  
  if (existingIndex !== -1) {
    // Update existing workflow
    storedWorkflows[existingIndex] = {
      ...storedWorkflows[existingIndex],
      ...workflowDoc,
      updatedAt: new Date().toISOString(),
      'metadata.updatedAt': new Date().toISOString()
    };
    console.log(`✅ Updated workflow: ${workflowData.name} (${workflowData.id})`);
  } else {
    // Add new workflow
    storedWorkflows.push(workflowDoc);
    console.log(`✅ Created workflow: ${workflowData.name} (${workflowData.id})`);
  }
  
  return storedWorkflows;
}

/**
 * Main function to populate workflows
 */
async function populateWorkflows() {
  try {
    console.log('🚀 Starting n8n workflow population...');
    
    // Read existing workflow IDs
    const workflowIdsPath = path.join(__dirname, 'workflow-ids.json');
    if (!fs.existsSync(workflowIdsPath)) {
      console.error('❌ workflow-ids.json not found');
      return;
    }

    const workflowIdsData = JSON.parse(fs.readFileSync(workflowIdsPath, 'utf8'));
    const allWorkflows = workflowIdsData.allWorkflows || [];

    console.log(`📋 Found ${allWorkflows.length} workflows to process`);

    // Load existing stored workflows or create new array
    const storedWorkflowsPath = path.join(__dirname, 'stored-n8n-workflows.json');
    let storedWorkflows = [];
    
    if (fs.existsSync(storedWorkflowsPath)) {
      storedWorkflows = JSON.parse(fs.readFileSync(storedWorkflowsPath, 'utf8'));
      console.log(`📂 Loaded ${storedWorkflows.length} existing stored workflows`);
    }

    const results = {
      processed: 0,
      stored: 0,
      errors: []
    };

    // Process each workflow
    for (const workflow of allWorkflows) {
      try {
        console.log(`\n🔄 Processing workflow: ${workflow.name} (${workflow.id})`);
        
        // Fetch complete workflow data from n8n
        const workflowData = await fetchWorkflowData(workflow.id);
        
        if (!workflowData) {
          const errorMsg = `Failed to fetch workflow data for ${workflow.name}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
          continue;
        }

        // Store workflow in JSON
        storedWorkflows = storeWorkflowInJSON(workflowData, storedWorkflows);
        results.stored++;
        
        // Save after each workflow to avoid losing progress
        fs.writeFileSync(storedWorkflowsPath, JSON.stringify(storedWorkflows, null, 2));
        
      } catch (error) {
        const errorMsg = `Error processing workflow ${workflow.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
      
      results.processed++;
    }

    // Print summary
    console.log('\n📊 Population Summary:');
    console.log(`Total workflows processed: ${results.processed}`);
    console.log(`Successfully stored: ${results.stored}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Total workflows in storage: ${storedWorkflows.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Create a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      totalWorkflows: storedWorkflows.length,
      activeWorkflows: storedWorkflows.filter(wf => wf.active).length,
      inactiveWorkflows: storedWorkflows.filter(wf => !wf.active).length,
      processed: results.processed,
      stored: results.stored,
      errors: results.errors,
      workflows: storedWorkflows.map(wf => ({
        name: wf.name,
        n8nId: wf.n8nId,
        active: wf.active,
        status: wf.status
      }))
    };

    const summaryPath = path.join(__dirname, 'n8n-workflows-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Summary saved to: n8n-workflows-summary.json`);

    console.log('\n✅ Workflow population completed!');
    console.log(`📁 Workflows stored in: stored-n8n-workflows.json`);
    
  } catch (error) {
    console.error('❌ Error during workflow population:', error);
  }
}

// Run the population script
populateWorkflows();
