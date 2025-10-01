require('dotenv').config({ path: './apps/api/.env' });

console.log('🔍 Environment Variables Debug:');
console.log('================================');

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

emailVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask password for security
    const displayValue = varName.includes('PASS') ? '***MASKED***' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 SMTP Configuration Object:');
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***MASKED***' : undefined,
  },
};

console.log(JSON.stringify(smtpConfig, null, 2));

console.log('\n📧 Email From Configuration:');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
console.log('FROM_NAME:', process.env.FROM_NAME || 'NOT SET');
console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'NOT SET');
