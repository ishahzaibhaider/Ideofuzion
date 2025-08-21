// Simple test to check if signup endpoint is accessible
import axios from 'axios';

const BASE_URL = 'https://n8n.hireninja.site'; // Updated to new n8n hosted instance

async function testSignupEndpoint() {
  console.log('🧪 Testing signup endpoint accessibility...');
  console.log(`🌐 Testing URL: ${BASE_URL}/api/auth/register`);
  
  try {
    // Test 1: Check if server is reachable (use a public endpoint)
    console.log('\n1️⃣ Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/dashboard/metrics`, {
        timeout: 5000
      });
      console.log('✅ Server is reachable');
    } catch (error) {
      if (error.response && error.response.status === 304) {
        console.log('✅ Server is reachable (304 Not Modified is expected)');
      } else {
        throw error;
      }
    }
    
    // Test 2: Test signup endpoint with invalid data (should return 400)
    console.log('\n2️⃣ Testing signup endpoint with invalid data...');
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        // Missing required fields
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log('❌ Unexpected success with invalid data');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Signup endpoint is working (correctly rejected invalid data)');
        console.log('📄 Error response:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Test with valid data
    console.log('\n3️⃣ Testing signup endpoint with valid data...');
    const validData = {
      name: `Test User ${Date.now()}`,
      email: `maxpace94@gmail.com`,
      password: 'testpassword123'
    };
    
    console.log(`📝 Attempting signup for: ${validData.email}`);
    
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, validData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Signup successful!');
    console.log('📄 Response status:', signupResponse.status);
    console.log('📄 User created:', signupResponse.data.user ? 'Yes' : 'No');
    console.log('📄 Token received:', signupResponse.data.token ? 'Yes' : 'No');
    
    console.log('\n🎉 Signup endpoint test completed successfully!');
    console.log('📋 Check your server logs for n8n credential creation messages.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Cannot connect to server - check if the app is running on port 3000');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🚨 Connection timeout - server might be overloaded');
    } else if (error.response) {
      console.error('🚨 HTTP Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('🚨 Unknown error:', error);
    }
  }
}

testSignupEndpoint().catch(console.error);
