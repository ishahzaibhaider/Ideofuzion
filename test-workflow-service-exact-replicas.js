import { createUserWorkflows } from './server/workflowService.js';

console.log('🧪 Testing workflow service EXACT replica creation...\n');

async function testWorkflowServiceExactReplicas() {
  const testUserId = 'service-test-' + Date.now();
  const testUserEmail = 'service-test@hireninja.site';
  
  console.log(`👤 Test User: ${testUserEmail} (ID: ${testUserId})\n`);
  
  try {
    console.log('🔧 Calling createUserWorkflows...');
    const createdWorkflows = await createUserWorkflows(testUserId, testUserEmail);
    
    console.log('\n📊 WORKFLOW SERVICE RESULTS:');
    console.log('=====================================');
    console.log(`Total workflows created: ${createdWorkflows.length}`);
    
    createdWorkflows.forEach(workflow => {
      console.log(`\n✅ ${workflow.name}:`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Active: ${workflow.active}`);
      console.log(`   Nodes: ${workflow.nodes}`);
      console.log(`   Connections: ${workflow.connections}`);
    });
    
    // Verify the expected node counts
    const expectedNodes = {
      'Meeting Bot & Analysis': 41,
      'Busy Slots Working': 15,
      'Extending Meeting Time': 16,
      'Cv Processing Workflow': 27
    };
    
    console.log('\n🔍 VERIFICATION:');
    console.log('=====================================');
    
    let allCorrect = true;
    createdWorkflows.forEach(workflow => {
      const workflowName = workflow.name.split(' - ')[0]; // Remove user email suffix
      const expected = expectedNodes[workflowName];
      const actual = workflow.nodes;
      const isCorrect = expected === actual;
      
      console.log(`${workflowName}:`);
      console.log(`   Expected: ${expected} nodes`);
      console.log(`   Actual: ${actual} nodes`);
      console.log(`   Status: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (!isCorrect) {
        allCorrect = false;
      }
    });
    
    if (allCorrect) {
      console.log('\n🎉 ALL WORKFLOWS ARE EXACT REPLICAS!');
      console.log('✅ Workflow service is working correctly');
    } else {
      console.log('\n⚠️ Some workflows are not exact replicas');
      console.log('❌ Workflow service needs fixing');
    }
    
    return allCorrect;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testWorkflowServiceExactReplicas()
  .then(success => {
    if (success) {
      console.log('\n🚀 Workflow service test PASSED!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Workflow service test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
