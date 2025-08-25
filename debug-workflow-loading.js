import fs from 'fs';
import path from 'path';

console.log('🔍 Debugging workflow configuration loading...\n');

// Check current working directory
console.log('📁 Current working directory:', process.cwd());

// Check if workflow-configs.json exists
const configPath = path.join(process.cwd(), 'workflow-configs.json');
console.log('📄 Config file path:', configPath);
console.log('📄 File exists:', fs.existsSync(configPath));

if (fs.existsSync(configPath)) {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const configs = JSON.parse(configData);
    
    console.log('\n📋 Loaded workflow configurations:');
    Object.keys(configs).forEach(workflowName => {
      const config = configs[workflowName];
      console.log(`  ✅ ${workflowName}:`);
      console.log(`     - ID: ${config.id}`);
      console.log(`     - Active: ${config.active}`);
      console.log(`     - Nodes: ${config.nodes.length}`);
      console.log(`     - Connections: ${Object.keys(config.connections).length}`);
      console.log('');
    });
    
    // Check the first workflow's nodes in detail
    const firstWorkflowName = Object.keys(configs)[0];
    const firstWorkflow = configs[firstWorkflowName];
    
    console.log(`🔍 Detailed analysis of "${firstWorkflowName}":`);
    console.log(`   Total nodes: ${firstWorkflow.nodes.length}`);
    console.log(`   Node types:`, firstWorkflow.nodes.map(n => n.type).slice(0, 5));
    console.log(`   Node names:`, firstWorkflow.nodes.map(n => n.name).slice(0, 5));
    
  } catch (error) {
    console.error('❌ Error reading config file:', error);
  }
} else {
  console.log('❌ workflow-configs.json not found!');
  
  // List files in current directory
  console.log('\n📁 Files in current directory:');
  const files = fs.readdirSync('.');
  files.forEach(file => {
    if (file.includes('workflow') || file.includes('config')) {
      console.log(`  - ${file}`);
    }
  });
}
