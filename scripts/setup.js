const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Carbon Credits Backend...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    process.exit(1);
  }
}

function checkFile(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${name} (${filePath})`);
    console.log(`Please copy ${path.basename(filePath)}.example to ${path.basename(filePath)} and configure it.`);
    return false;
  }
  console.log(`✅ ${name} exists`);
  return true;
}

async function main() {
  // Check required files
  console.log('📁 Checking required files...');
  const envExists = checkFile('.env', 'Environment file');

  if (!envExists) {
    console.log('📝 Creating .env from .env.example...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created\n');
  }

  // Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // Test Sequelize configuration
  runCommand('npx sequelize-cli db:create --env development || echo "Database may already exist"', 'Setting up database');
  runCommand('npx sequelize-cli db:migrate --env development', 'Running database migrations');
  runCommand('npx sequelize-cli db:seed:all --env development', 'Seeding database with sample data');

  console.log('🎉 Setup completed successfully!\n');
  console.log('🐳 To run with Docker:');
  console.log('   docker-compose up -d\n');
  console.log('🖥️  To run locally (PostgreSQL already set up):');
  console.log('   npm run dev\n');
  console.log('📋 Available commands:');
  console.log('   npm run dev          - Start development server');
  console.log('   npm run db:migrate   - Run database migrations');
  console.log('   npm run db:seed      - Seed database with sample data');
  console.log('   npm run adminer      - Open Adminer (Docker only)');
  console.log('   npm run docker:up    - Start with Docker');
  console.log('   npm run docker:down  - Stop Docker containers');
}

main().catch(console.error);