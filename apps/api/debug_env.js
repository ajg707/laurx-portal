// Simple environment debug without dotenv
const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Debug:');
console.log('================================');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
let envVars = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  console.log('📄 .env file loaded successfully');
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}

const emailVars = [
  'EMAIL_PROVIDER',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'FROM_EMAIL',
  'FROM_NAME',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME'
];

console.log('\n📋 Environment Variables from .env file:');
emailVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    // Mask password for security
    const displayValue = varName.includes('PASS') ? '***MASKED***' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 SMTP Configuration Object (from .env):');
const smtpConfig = {
  host: envVars.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(envVars.SMTP_PORT || '587'),
  secure: envVars.SMTP_PORT === '465',
  auth: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS ? '***MASKED***' : undefined,
  },
};

console.log(JSON.stringify(smtpConfig, null, 2));

console.log('\n📧 Email From Configuration (from .env):');
console.log('FROM_EMAIL:', envVars.FROM_EMAIL || 'NOT SET');
console.log('EMAIL_FROM:', envVars.EMAIL_FROM || 'NOT SET');
console.log('FROM_NAME:', envVars.FROM_NAME || 'NOT SET');
console.log('EMAIL_FROM_NAME:', envVars.EMAIL_FROM_NAME || 'NOT SET');

// Check if credentials are properly set
console.log('\n🔍 Credential Check:');
const hasUser = !!envVars.SMTP_USER;
const hasPass = !!envVars.SMTP_PASS;
const hasFromEmail = !!(envVars.FROM_EMAIL || envVars.EMAIL_FROM);

console.log(`SMTP_USER set: ${hasUser ? '✅' : '❌'}`);
console.log(`SMTP_PASS set: ${hasPass ? '✅' : '❌'}`);
console.log(`FROM_EMAIL set: ${hasFromEmail ? '✅' : '❌'}`);

if (hasUser && hasPass && hasFromEmail) {
  console.log('\n🎉 All required credentials are set!');
} else {
  console.log('\n⚠️  Missing required credentials for email sending');
}
