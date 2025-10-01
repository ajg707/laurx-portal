const fs = require('fs');
const path = require('path');

console.log('🔧 Gmail App Password Updater');
console.log('================================');
console.log('');
console.log('This script will help you update the Gmail app password in the .env file.');
console.log('');
console.log('📋 Instructions:');
console.log('1. Go to your Google Account settings');
console.log('2. Navigate to Security > 2-Step Verification > App passwords');
console.log('3. Generate a new app password for "Mail"');
console.log('4. Copy the 16-character password (without spaces)');
console.log('5. Run this script with the new password as an argument');
console.log('');
console.log('💡 Usage: node update_gmail_password.js YOUR_NEW_APP_PASSWORD');
console.log('');

const newPassword = process.argv[2];

if (!newPassword) {
  console.log('❌ Error: Please provide the new Gmail app password as an argument');
  console.log('   Example: node update_gmail_password.js abcdabcdabcdabcd');
  process.exit(1);
}

// Validate password format (should be 16 characters, letters and numbers)
if (!/^[a-zA-Z0-9]{16}$/.test(newPassword)) {
  console.log('⚠️  Warning: Gmail app passwords are usually 16 characters (letters and numbers only)');
  console.log('   Your password:', newPassword);
  console.log('   Length:', newPassword.length);
  console.log('   Continuing anyway...');
}

const envPath = path.join(__dirname, 'apps', 'api', '.env');

try {
  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update SMTP_PASS
  if (envContent.includes('SMTP_PASS=')) {
    envContent = envContent.replace(/SMTP_PASS=.*$/m, `SMTP_PASS=${newPassword}`);
  } else {
    envContent += `\nSMTP_PASS=${newPassword}\n`;
  }
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Gmail app password updated successfully!');
  console.log('🔄 Please restart the API server to apply changes');
  console.log('');
  console.log('🧪 Test the new password with:');
  console.log('   cd apps/api && node test_email_direct.js');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}
