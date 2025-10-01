const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building and deploying LAURx Portals...\n');

// Step 1: Build the customer portal
console.log('📦 Building customer portal...');
try {
  execSync('npm run build', { cwd: 'apps/portal', stdio: 'inherit' });
  console.log('✅ Customer portal built successfully\n');
} catch (error) {
  console.error('❌ Failed to build customer portal:', error.message);
  process.exit(1);
}

// Step 2: Build the admin portal
console.log('📦 Building admin portal...');
try {
  execSync('npm run build', { cwd: 'apps/admin', stdio: 'inherit' });
  console.log('✅ Admin portal built successfully\n');
} catch (error) {
  console.error('❌ Failed to build admin portal:', error.message);
  process.exit(1);
}

// Step 3: Copy built files to deployment directories
console.log('📁 Preparing deployment files...');

// Create deployment directories
const deployDir = 'deploy';
const portalDeployDir = path.join(deployDir, 'portal');
const adminDeployDir = path.join(deployDir, 'admin');

// Clean and create directories
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });
fs.mkdirSync(portalDeployDir, { recursive: true });
fs.mkdirSync(adminDeployDir, { recursive: true });

// Copy portal build
const portalDistDir = path.join('apps', 'portal', 'dist');
if (fs.existsSync(portalDistDir)) {
  execSync(`xcopy "${portalDistDir}\\*" "${portalDeployDir}\\" /E /I /Y`, { stdio: 'inherit' });
  console.log('✅ Customer portal files copied');
} else {
  console.error('❌ Customer portal dist directory not found');
  process.exit(1);
}

// Copy admin build
const adminDistDir = path.join('apps', 'admin', 'dist');
if (fs.existsSync(adminDistDir)) {
  execSync(`xcopy "${adminDistDir}\\*" "${adminDeployDir}\\" /E /I /Y`, { stdio: 'inherit' });
  console.log('✅ Admin portal files copied');
} else {
  console.error('❌ Admin portal dist directory not found');
  process.exit(1);
}

console.log('\n🎉 Build complete! Ready for deployment.');
console.log('\nNext steps:');
console.log('1. Update firebase.json to use the deploy directories');
console.log('2. Run: firebase deploy');
console.log('\nOr use the simplified commands:');
console.log('- Deploy customer portal: firebase deploy --only hosting:portal');
console.log('- Deploy admin portal: firebase deploy --only hosting:admin');
