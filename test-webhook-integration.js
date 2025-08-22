// Test file for webhook integration
// This file can be used to test the webhook functionality

const testWebhookData = {
  userId: "test_user_id",
  userEmail: "test@example.com",
  userName: "Test User",
  candidateId: "test_candidate_id",
  candidateName: "Test Candidate",
  candidateEmail: "candidate@example.com",
  jobTitle: "Software Engineer",
  googleMeetId: "test-meet-id",
  interviewStart: "2024-01-15T10:00:00Z",
  interviewEnd: "2024-01-15T11:00:00Z",
  calendarEventId: "test-calendar-event-id",
  timestamp: new Date().toISOString(),
  action: "interview_session_started",
  sessionId: "test_session_id",
  platform: "ideofuzion"
};

async function testWebhook() {
  console.log('Testing webhook integration...');
  console.log('Webhook URL: https://n8n.hireninja.site/webhook/meetbot-ideofuzion');
  console.log('Test data:', JSON.stringify(testWebhookData, null, 2));
  
  try {
    const response = await fetch("https://n8n.hireninja.site/webhook/meetbot-ideofuzion", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "HiringPlatform/1.0"
      },
      body: JSON.stringify(testWebhookData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Webhook test error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook, testWebhookData };
