const fs = require('fs');
const path = require('path');

// Read the current .env file
const envPath = path.join(__dirname, 'apps', 'api', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if EMAIL_DRY_RUN already exists
if (envContent.includes('EMAIL_DRY_RUN=')) {
  // Replace existing value
  envContent = envContent.replace(/EMAIL_DRY_RUN=.*/g, 'EMAIL_DRY_RUN=true');
} else {
  // Add EMAIL_DRY_RUN to the end
  envContent += '\nEMAIL_DRY_RUN=true\n';
}

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ EMAIL_DRY_RUN=true has been added to .env file');
console.log('🔄 Please restart the API server to apply changes');
console.log('📧 Emails will now be logged instead of sent, allowing admin portal to work');
