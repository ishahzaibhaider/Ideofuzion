// Test file for busy slot webhook integration
// This file can be used to test the busy slot webhook functionality

const testBusySlotData = {
  userId: "test_user_id",
  userEmail: "test@example.com",
  userName: "Test User",
  slotId: "test_slot_id",
  date: "2024-01-15",
  startTime: "2024-01-15T10:00:00.000Z",
  endTime: "2024-01-15T11:00:00.000Z",
  reason: "Busy",
  timestamp: new Date().toISOString(),
  action: "busy_slot_created",
  platform: "ideofuzion"
};

async function testBusySlotWebhook() {
  console.log('Testing busy slot webhook integration...');
  console.log('Webhook URL: https://n8n.hireninja.site/webhook/busyslot-ideofuzion');
  console.log('Test data:', JSON.stringify(testBusySlotData, null, 2));
  
  try {
    const response = await fetch("https://n8n.hireninja.site/webhook/busyslot-ideofuzion", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "HiringPlatform/1.0"
      },
      body: JSON.stringify(testBusySlotData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Busy slot webhook test successful!');
    } else {
      console.log('❌ Busy slot webhook test failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Busy slot webhook test error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBusySlotWebhook();
}

module.exports = { testBusySlotWebhook, testBusySlotData };
