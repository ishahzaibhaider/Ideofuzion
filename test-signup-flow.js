// Test script to simulate signup and trigger n8n credential creation
import axios from 'axios';

const BASE_URL = 'http://35.209.122.222:3000'; // Production URL

async function testSignupFlow() {
  console.log('🧪 Testing signup flow to trigger n8n credential creation...');
  
  try {
    // Test 1: Regular email/password signup
    console.log('\n1️⃣ Testing regular email/password signup...');
    const signupData = {
      name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    console.log(`📝 Attempting signup for: ${signupData.email}`);
    
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, signupData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Signup successful!');
    console.log('📄 Response:', JSON.stringify(signupResponse.data, null, 2));
    
    // Test 2: Try to login with the created user
    console.log('\n2️⃣ Testing login with created user...');
    const loginData = {
      email: signupData.email,
      password: signupData.password
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    
    console.log('\n🎉 Signup flow test completed successfully!');
    console.log('📋 Check your server logs for n8n credential creation messages.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('🚨 Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Cannot connect to server - make sure the app is running');
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

testSignupFlow().catch(console.error);
