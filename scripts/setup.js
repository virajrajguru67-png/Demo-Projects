#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Corporate MIS...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install client dependencies
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });

  // Install server dependencies
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });

  console.log('✅ All dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create environment file if it doesn't exist
const envPath = path.join(__dirname, '..', 'server', '.env');
const envExamplePath = path.join(__dirname, '..', 'server', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating environment file...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Environment file created');
    console.log('⚠️  Please update server/.env with your database credentials');
  } catch (error) {
    console.error('❌ Failed to create environment file:', error.message);
  }
} else {
  console.log('✅ Environment file already exists');
}

        // Create database setup instructions
        console.log('\n🗄️  Database Setup Instructions:');
        console.log('1. Create a MySQL database named "corporate_mis"');
        console.log('2. Import the schema: mysql -u root -p corporate_mis < server/database/schema.sql');
        console.log('3. Setup ticket management: cd server && node setup-tickets.js');
        console.log('4. Update server/.env with your database credentials');

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up your MySQL database');
console.log('2. Update server/.env with your database credentials');
console.log('3. Run: npm run dev');
console.log('4. Open http://localhost:3000');
console.log('\n🔐 Default login: admin / admin123');
