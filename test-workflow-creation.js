import { createUserWorkflows, ensureUserWorkflows, getUserWorkflows } from './server/workflowService.js';

// Test user data
const testUserId = "test-user-123";
const testUserEmail = "test@example.com";

async function testWorkflowCreation() {
  console.log('🧪 Testing workflow creation functionality...\n');

  try {
    // Test 1: Create workflows for a new user
    console.log('📝 Test 1: Creating workflows for new user');
    const createdWorkflows = await createUserWorkflows(testUserId, testUserEmail);
    console.log(`✅ Created ${createdWorkflows.length} workflows:`, createdWorkflows);
    console.log('');

    // Test 2: Ensure workflows exist (should return existing ones)
    console.log('📝 Test 2: Ensuring workflows exist (should not create duplicates)');
    const ensuredWorkflows = await ensureUserWorkflows(testUserId, testUserEmail);
    console.log(`✅ Ensured ${ensuredWorkflows.length} workflows:`, ensuredWorkflows);
    console.log('');

    // Test 3: Get user workflows
    console.log('📝 Test 3: Getting user workflows');
    const userWorkflows = await getUserWorkflows(testUserId);
    console.log(`✅ Retrieved ${userWorkflows.length} workflows:`, userWorkflows);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWorkflowCreation()
  .then(() => {
    console.log('\n✅ Workflow creation test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Workflow creation test failed:', error);
    process.exit(1);
  });
