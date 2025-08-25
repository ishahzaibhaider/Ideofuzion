import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 Starting test script...');

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test basic imports
try {
  console.log('Testing imports...');
  console.log('✅ Basic imports successful');
  
  // Test file reading
  const workflowIdsPath = path.join(__dirname, 'workflow-ids.json');
  console.log('Looking for file:', workflowIdsPath);
  
  if (fs.existsSync(workflowIdsPath)) {
    console.log('✅ workflow-ids.json found');
    const data = JSON.parse(fs.readFileSync(workflowIdsPath, 'utf8'));
    console.log('✅ File parsed successfully');
    console.log('Total workflows found:', data.allWorkflows?.length || 0);
    
    // Show first few workflows
    if (data.allWorkflows && data.allWorkflows.length > 0) {
      console.log('\nFirst 3 workflows:');
      data.allWorkflows.slice(0, 3).forEach((wf, index) => {
        console.log(`${index + 1}. ${wf.name} (${wf.id}) - Active: ${wf.active}`);
      });
    }
  } else {
    console.log('❌ workflow-ids.json not found');
  }
  
} catch (error) {
  console.error('❌ Error in test script:', error);
}

console.log('✅ Test script completed');
