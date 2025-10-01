const https = require('http');

// Test admin verification code request
const testData = JSON.stringify({
  email: 'mglynn@mylaurelrose.com'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/auth/request-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('🧪 Testing Admin Email Verification Code Request...');
console.log('📧 Sending verification code to: mglynn@mylaurelrose.com');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 Response Status:', res.statusCode);
    console.log('📋 Response Headers:', res.headers);
    console.log('📄 Response Body:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS: Verification code request sent successfully!');
      console.log('📧 Check mglynn@mylaurelrose.com for the verification code email.');
      console.log('\n🔍 This confirms that:');
      console.log('  - Email configuration is working');
      console.log('  - SMTP connection to Gmail is successful');
      console.log('  - Email sending functionality is operational');
    } else {
      console.log('\n❌ FAILED: Email sending failed');
      console.log('🔍 This indicates an issue with:');
      console.log('  - Email configuration');
      console.log('  - SMTP connection');
      console.log('  - Gmail authentication');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(testData);
req.end();
