// Test file for extend meeting webhook integration
// This file can be used to test the extend meeting webhook functionality

const testExtendMeetingData = {
  userId: "test_user_id",
  userEmail: "test@example.com",
  userName: "Test User",
  candidateId: "test_candidate_id",
  candidateName: "Test Candidate",
  candidateEmail: "candidate@example.com",
  jobTitle: "Software Engineer",
  calendarEventId: "test_calendar_event_id",
  originalEndTime: "2024-01-15T11:00:00.000Z",
  newEndTime: "2024-01-15T11:30:00.000Z",
  reason: "Candidate had excellent questions and discussion going well",
  timestamp: new Date().toISOString(),
  action: "meeting_extended",
  platform: "ideofuzion"
};

async function testExtendMeetingWebhook() {
  console.log('Testing extend meeting webhook integration...');
  console.log('Webhook URL: https://n8n.hireninja.site/webhook/Extendmeeting-ideofuzion');
  console.log('Test data:', JSON.stringify(testExtendMeetingData, null, 2));
  
  try {
    const response = await fetch("https://n8n.hireninja.site/webhook/Extendmeeting-ideofuzion", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "HiringPlatform/1.0"
      },
      body: JSON.stringify(testExtendMeetingData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Extend meeting webhook test successful!');
    } else {
      console.log('❌ Extend meeting webhook test failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Extend meeting webhook test error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testExtendMeetingWebhook();
}

module.exports = { testExtendMeetingWebhook, testExtendMeetingData };
