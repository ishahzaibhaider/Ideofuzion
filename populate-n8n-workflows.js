import { connectToDatabase } from './server/db.js';
import { N8nWorkflowModel } from './shared/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const N8N_BASE_URL = 'https://n8n.hireninja.site/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4';

// Mock user ID for testing (replace with actual user ID)
const TEST_USER_ID = 'test-user-123';

/**
 * Fetch complete workflow data from n8n
 */
async function fetchWorkflowData(workflowId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow ${workflowId}: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching workflow ${workflowId}:`, error);
    return null;
  }
}

/**
 * Store workflow in database
 */
async function storeWorkflow(userId, workflowData) {
  try {
    const workflowDoc = {
      userId,
      n8nId: workflowData.id,
      name: workflowData.name,
      active: workflowData.active,
      workflowData: workflowData, // Store complete workflow data
      metadata: {
        version: workflowData.versionId || '1.0.0',
        tags: workflowData.tags?.map(tag => tag.name) || [],
        category: 'automation'
      },
      status: workflowData.active ? 'active' : 'inactive'
    };

    // Check if workflow already exists
    const existingWorkflow = await N8nWorkflowModel.findOne({
      userId,
      n8nId: workflowData.id
    });

    if (existingWorkflow) {
      // Update existing workflow
      const updatedWorkflow = await N8nWorkflowModel.findOneAndUpdate(
        { userId, n8nId: workflowData.id },
        {
          ...workflowDoc,
          updatedAt: new Date(),
          'metadata.updatedAt': new Date()
        },
        { new: true }
      );
      console.log(`✅ Updated workflow: ${workflowData.name} (${workflowData.id})`);
      return updatedWorkflow;
    } else {
      // Create new workflow
      const newWorkflow = new N8nWorkflowModel(workflowDoc);
      const savedWorkflow = await newWorkflow.save();
      console.log(`✅ Created workflow: ${workflowData.name} (${workflowData.id})`);
      return savedWorkflow;
    }
  } catch (error) {
    console.error(`❌ Error storing workflow ${workflowData.name}:`, error);
    throw error;
  }
}

/**
 * Main function to populate workflows
 */
async function populateWorkflows() {
  try {
    console.log('🚀 Starting n8n workflow population...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Read existing workflow IDs
    const workflowIdsPath = path.join(__dirname, 'workflow-ids.json');
    if (!fs.existsSync(workflowIdsPath)) {
      console.error('❌ workflow-ids.json not found');
      return;
    }

    const workflowIdsData = JSON.parse(fs.readFileSync(workflowIdsPath, 'utf8'));
    const allWorkflows = workflowIdsData.allWorkflows || [];

    console.log(`📋 Found ${allWorkflows.length} workflows to process`);

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

        // Store workflow in database
        await storeWorkflow(TEST_USER_ID, workflowData);
        results.stored++;
        
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
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Get final stats
    const totalStored = await N8nWorkflowModel.countDocuments({ userId: TEST_USER_ID });
    console.log(`\n📈 Total workflows in database: ${totalStored}`);

    console.log('\n✅ Workflow population completed!');
    
  } catch (error) {
    console.error('❌ Error during workflow population:', error);
  } finally {
    // Disconnect from database
    process.exit(0);
  }
}

// Run the population script
populateWorkflows();
