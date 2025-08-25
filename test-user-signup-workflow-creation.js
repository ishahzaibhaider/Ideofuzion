import { createUserWorkflows, ensureUserWorkflows } from './dist/server/workflowService.js';

console.log('🧪 Testing workflow creation for new user signup...\n');

async function testNewUserSignup() {
  const testUserId = 'new-user-' + Date.now();
  const testUserEmail = 'newuser@hireninja.site';
  
  console.log(`👤 Simulating new user signup:`);
  console.log(`   User ID: ${testUserId}`);
  console.log(`   Email: ${testUserEmail}\n`);
  
  try {
    console.log('🔧 Step 1: Creating workflows for new user...');
    const createdWorkflows = await createUserWorkflows(testUserId, testUserEmail);
    
    console.log('\n📊 RESULTS:');
    console.log('=====================================');
    console.log(`Total workflows created: ${createdWorkflows.length}`);
    
    if (createdWorkflows.length === 0) {
      console.log('❌ No workflows were created!');
      return false;
    }
    
    // Expected workflow details
    const expectedWorkflows = {
      'Meeting Bot & Analysis': { nodes: 41, connections: 38 },
      'Busy Slots Working': { nodes: 15, connections: 14 },
      'Extending Meeting Time': { nodes: 16, connections: 12 },
      'Cv Processing Workflow': { nodes: 27, connections: 26 }
    };
    
    let allCorrect = true;
    
    createdWorkflows.forEach(workflow => {
      const workflowName = workflow.name.split(' - ')[0]; // Remove user email suffix
      const expected = expectedWorkflows[workflowName];
      
      console.log(`\n✅ ${workflowName}:`);
      console.log(`   - ID: ${workflow.id}`);
      console.log(`   - Active: ${workflow.active}`);
      console.log(`   - Nodes: ${workflow.nodes} (Expected: ${expected.nodes})`);
      console.log(`   - Connections: ${workflow.connections} (Expected: ${expected.connections})`);
      
      const nodesMatch = workflow.nodes === expected.nodes;
      const connectionsMatch = workflow.connections === expected.connections;
      
      if (nodesMatch && connectionsMatch) {
        console.log(`   - Status: ✅ PERFECT MATCH`);
      } else {
        console.log(`   - Status: ❌ MISMATCH`);
        allCorrect = false;
      }
    });
    
    console.log('\n🔍 Step 2: Testing ensureUserWorkflows (should return existing workflows)...');
    const ensuredWorkflows = await ensureUserWorkflows(testUserId, testUserEmail);
    
    console.log(`\n📊 ENSURE RESULTS:`);
    console.log(`Workflows returned: ${ensuredWorkflows.length}`);
    
    if (ensuredWorkflows.length === createdWorkflows.length) {
      console.log('✅ ensureUserWorkflows correctly returned existing workflows');
    } else {
      console.log('❌ ensureUserWorkflows did not return correct number of workflows');
      allCorrect = false;
    }
    
    // Final summary
    console.log('\n🎯 FINAL VERIFICATION:');
    console.log('=====================================');
    
    if (allCorrect && createdWorkflows.length === 4) {
      console.log('🎉 SUCCESS: All workflows created with exact node counts!');
      console.log('✅ New user signup workflow creation is working perfectly');
      console.log('✅ Ready for production deployment');
    } else {
      console.log('⚠️ ISSUES DETECTED:');
      console.log(`   - Workflows created: ${createdWorkflows.length}/4`);
      console.log(`   - All correct: ${allCorrect ? 'Yes' : 'No'}`);
      console.log('❌ Workflow creation needs fixing');
    }
    
    return allCorrect && createdWorkflows.length === 4;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testNewUserSignup()
  .then(success => {
    if (success) {
      console.log('\n🚀 New user signup test PASSED!');
      process.exit(0);
    } else {
      console.log('\n⚠️ New user signup test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
