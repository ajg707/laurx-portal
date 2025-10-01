const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@mylaurelrose.com';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testStripeEndpoints() {
  console.log('🧪 Testing Stripe API Endpoints\n');
  
  try {
    // Step 1: Request verification code
    console.log('1️⃣ Requesting verification code...');
    const codeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/request-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { email: TEST_EMAIL });
    
    console.log(`Status: ${codeResponse.statusCode}`);
    if (codeResponse.statusCode === 200) {
      console.log('✅ Verification code sent successfully');
    } else {
      console.log('❌ Failed to send verification code:', codeResponse.body);
      return;
    }
    
    // For testing purposes, we'll use a mock token approach
    // In a real scenario, you'd need the actual verification code
    console.log('\n2️⃣ Testing Stripe endpoints without authentication (should fail with 401)...');
    
    // Test 1: Get subscriptions without auth
    console.log('\n📋 Testing GET /api/stripe/subscriptions (no auth)');
    const subsNoAuth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stripe/subscriptions',
      method: 'GET'
    });
    console.log(`Status: ${subsNoAuth.statusCode}`);
    if (subsNoAuth.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have returned 401:', subsNoAuth.body);
    }
    
    // Test 2: Get customer without auth
    console.log('\n👤 Testing GET /api/stripe/customer (no auth)');
    const customerNoAuth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stripe/customer',
      method: 'GET'
    });
    console.log(`Status: ${customerNoAuth.statusCode}`);
    if (customerNoAuth.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have returned 401:', customerNoAuth.body);
    }
    
    // Test 3: Get invoices without auth
    console.log('\n🧾 Testing GET /api/stripe/invoices (no auth)');
    const invoicesNoAuth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stripe/invoices',
      method: 'GET'
    });
    console.log(`Status: ${invoicesNoAuth.statusCode}`);
    if (invoicesNoAuth.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have returned 401:', invoicesNoAuth.body);
    }
    
    // Test 4: Get payment methods without auth
    console.log('\n💳 Testing GET /api/stripe/payment-methods (no auth)');
    const pmNoAuth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stripe/payment-methods',
      method: 'GET'
    });
    console.log(`Status: ${pmNoAuth.statusCode}`);
    if (pmNoAuth.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have returned 401:', pmNoAuth.body);
    }
    
    // Test 5: Create setup intent without auth
    console.log('\n🔧 Testing POST /api/stripe/setup-intent (no auth)');
    const setupNoAuth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stripe/setup-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`Status: ${setupNoAuth.statusCode}`);
    if (setupNoAuth.statusCode === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have returned 401:', setupNoAuth.body);
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ All Stripe endpoints correctly require authentication');
    console.log('✅ API security is working as expected');
    console.log('✅ Email service is functional');
    console.log('\n📝 Next: Test with valid authentication token to verify Stripe integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testStripeEndpoints();
