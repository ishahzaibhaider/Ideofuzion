import axios from 'axios';
import fs from 'fs';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

console.log('🧪 Testing EXACT workflow replication...\n');

// Load the actual workflow configurations
let workflowConfigs;
try {
  const configData = fs.readFileSync('workflow-configs.json', 'utf8');
  workflowConfigs = JSON.parse(configData);
  console.log(`✅ Loaded ${Object.keys(workflowConfigs).length} workflow configurations`);
} catch (error) {
  console.error('❌ Failed to load workflow configs:', error);
  process.exit(1);
}

async function createExactWorkflowReplica(workflowName, config, userId, userEmail) {
  console.log(`🔧 Creating EXACT replica of ${workflowName}...`);
  
  // Create exact replica with user customization
  const exactReplica = {
    name: `${workflowName} - ${userEmail}`,
    nodes: config.nodes.map(node => ({
      ...node,
      id: `${node.id}-${userId}` // Make node IDs unique per user
    })),
    connections: config.connections,
    settings: config.settings,
    staticData: config.staticData || {}
  };

  console.log(`📊 Original nodes: ${config.nodes.length}`);
  console.log(`📊 Replica nodes: ${exactReplica.nodes.length}`);
  console.log(`🔗 Connections: ${Object.keys(config.connections).length}`);

  try {
    const response = await axios.post(
      `${N8N_BASE_URL}/workflows`,
      exactReplica,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log(`✅ EXACT replica created successfully!`);
    console.log(`📄 Workflow ID: ${response.data.id}`);
    console.log(`📊 Created nodes: ${response.data.nodes.length}`);
    console.log(`🔗 Created connections: ${Object.keys(response.data.connections).length}`);
    console.log(`🔄 Active: ${response.data.active}\n`);

    return {
      name: workflowName,
      id: response.data.id,
      active: response.data.active,
      originalNodes: config.nodes.length,
      createdNodes: response.data.nodes.length,
      connections: Object.keys(response.data.connections).length
    };

  } catch (error) {
    console.error(`❌ Failed to create exact replica of ${workflowName}:`, error.response?.data || error.message);
    return null;
  }
}

async function testExactReplication() {
  const testUserId = 'exact-test-' + Date.now();
  const testUserEmail = 'exact-test@hireninja.site';
  
  console.log(`👤 Test User: ${testUserEmail} (ID: ${testUserId})\n`);
  
  const results = [];
  
  // Create exact replicas of all workflows
  for (const [workflowName, config] of Object.entries(workflowConfigs)) {
    const result = await createExactWorkflowReplica(workflowName, config, testUserId, testUserEmail);
    if (result) {
      results.push(result);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n📊 EXACT REPLICATION RESULTS:`);
  console.log(`=====================================`);
  console.log(`Total workflows tested: ${Object.keys(workflowConfigs).length}`);
  console.log(`Successfully replicated: ${results.length}`);
  
  results.forEach(result => {
    console.log(`\n✅ ${result.name}:`);
    console.log(`   Original nodes: ${result.originalNodes}`);
    console.log(`   Created nodes: ${result.createdNodes}`);
    console.log(`   Connections: ${result.connections}`);
    console.log(`   Match: ${result.originalNodes === result.createdNodes ? '✅ PERFECT' : '❌ MISMATCH'}`);
  });
  
  // Cleanup
  if (results.length > 0) {
    console.log(`\n🧹 Cleaning up test workflows...`);
    for (const result of results) {
      try {
        await axios.delete(`${N8N_BASE_URL}/workflows/${result.id}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });
        console.log(`✅ Deleted ${result.name}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${result.name}:`, error.message);
      }
    }
  }
  
  return results.length === Object.keys(workflowConfigs).length;
}

// Run the test
testExactReplication()
  .then(success => {
    if (success) {
      console.log('\n🎉 ALL EXACT REPLICAS CREATED SUCCESSFULLY!');
      console.log('✅ Ready to update workflow service');
    } else {
      console.log('\n⚠️ Some exact replicas failed');
    }
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
  });
