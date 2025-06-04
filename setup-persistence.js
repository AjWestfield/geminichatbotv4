#!/usr/bin/env node

/**
 * Setup script for chat persistence in Gemini Chatbot
 * 
 * This script will:
 * 1. Check for required environment variables
 * 2. Verify Supabase connection
 * 3. Create necessary database tables
 * 4. Test Vercel Blob storage access
 * 5. Provide a summary of the setup status
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions for colored output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Load environment variables from .env.local (Next.js convention)
require('dotenv').config({ path: '.env.local' });

async function checkEnvironmentVariables() {
  log.header('Checking Environment Variables');
  
  const required = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  };
  
  const optional = {
    REDIS_URL: process.env.REDIS_URL,
  };
  
  let allRequired = true;
  
  // Check required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      log.error(`Missing required: ${key}`);
      allRequired = false;
    } else {
      log.success(`Found ${key}: ${value.substring(0, 20)}...`);
    }
  }
  
  // Check optional variables
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      log.warn(`Missing optional: ${key} (Redis caching will be disabled)`);
    } else {
      log.success(`Found ${key}: ${value.substring(0, 20)}...`);
    }
  }
  
  if (!allRequired) {
    log.error('\nPlease add the missing environment variables to your .env file');
    log.info('Example .env configuration:');
    console.log(`
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-supabase-anon-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
REDIS_URL=redis://your-redis-url (optional)
`);
    return false;
  }
  
  return true;
}

async function testSupabaseConnection() {
  log.header('Testing Supabase Connection');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_API_KEY
    );
    
    // Test connection by trying to query a simple table
    const { error } = await supabase.from('chats').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      log.warn('Tables not found (this is expected for first setup)');
      return { connected: true, tablesExist: false, client: supabase };
    } else if (error) {
      throw error;
    }
    
    log.success('Successfully connected to Supabase');
    return { connected: true, tablesExist: true, client: supabase };
  } catch (error) {
    log.error(`Failed to connect to Supabase: ${error.message}`);
    return { connected: false, tablesExist: false, client: null };
  }
}

async function createDatabaseTables(supabase) {
  log.header('Creating Database Tables');
  
  const schema = fs.readFileSync(
    path.join(__dirname, 'lib', 'database', 'schema.sql'),
    'utf8'
  );
  
  try {
    // Execute the schema SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      log.warn('Could not execute schema via RPC, please run the following SQL manually in Supabase:');
      console.log('\n' + colors.cyan + '--- START SQL ---' + colors.reset);
      console.log(schema);
      console.log(colors.cyan + '--- END SQL ---' + colors.reset + '\n');
      return false;
    }
    
    log.success('Database tables created successfully');
    return true;
  } catch (error) {
    log.warn('Automated table creation not available. Please create tables manually.');
    log.info('You can find the schema at: lib/database/schema.sql');
    log.info('Copy and paste it into the Supabase SQL editor');
    return false;
  }
}

async function testVercelBlobStorage() {
  log.header('Testing Vercel Blob Storage');
  
  try {
    const { put, list } = require('@vercel/blob');
    
    // Try to list blobs (this will test the connection)
    const { blobs } = await list();
    
    log.success(`Connected to Vercel Blob Storage (${blobs.length} existing blobs)`);
    
    // Test upload capability
    const testBlob = await put('test-connection.txt', 'test', {
      access: 'public',
    });
    
    log.success('Successfully tested blob upload capability');
    
    // Clean up test blob
    const { del } = require('@vercel/blob');
    await del(testBlob.url);
    
    return true;
  } catch (error) {
    log.error(`Failed to connect to Vercel Blob Storage: ${error.message}`);
    log.info('Make sure your BLOB_READ_WRITE_TOKEN is valid');
    log.info('You can get a token from: https://vercel.com/dashboard/stores');
    return false;
  }
}

async function testRedisConnection() {
  if (!process.env.REDIS_URL) {
    log.warn('Redis URL not configured (caching will be disabled)');
    return null;
  }
  
  log.header('Testing Redis Connection');
  
  try {
    const Redis = require('redis');
    const client = Redis.createClient({ url: process.env.REDIS_URL });
    
    await client.connect();
    await client.ping();
    
    log.success('Successfully connected to Redis');
    
    await client.quit();
    return true;
  } catch (error) {
    log.error(`Failed to connect to Redis: ${error.message}`);
    log.warn('Chat persistence will work without Redis, but caching will be disabled');
    return false;
  }
}

async function installDependencies() {
  log.header('Checking Dependencies');
  
  const requiredPackages = [
    '@supabase/supabase-js',
    '@vercel/blob',
    'date-fns'
  ];
  
  const optionalPackages = [
    'redis'
  ];
  
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  const missing = [];
  const missingOptional = [];
  
  // Check required packages
  for (const pkg of requiredPackages) {
    if (!packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]) {
      missing.push(pkg);
    }
  }
  
  // Check optional packages
  for (const pkg of optionalPackages) {
    if (!packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]) {
      missingOptional.push(pkg);
    }
  }
  
  if (missing.length > 0) {
    log.warn(`Missing required packages: ${missing.join(', ')}`);
    log.info('Please install them with:');
    console.log(`\nnpm install ${missing.join(' ')}\n`);
    return false;
  }
  
  if (missingOptional.length > 0 && process.env.REDIS_URL) {
    log.warn(`Missing optional packages: ${missingOptional.join(', ')}`);
    log.info('To enable Redis caching, install:');
    console.log(`\nnpm install ${missingOptional.join(' ')}\n`);
  }
  
  log.success('All required dependencies are installed');
  return true;
}

async function main() {
  console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════╗
║     Gemini Chatbot Persistence Setup      ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

  // Step 1: Check dependencies
  const depsInstalled = await installDependencies();
  if (!depsInstalled) {
    log.error('\nPlease install missing dependencies first');
    process.exit(1);
  }

  // Step 2: Check environment variables
  const envValid = await checkEnvironmentVariables();
  if (!envValid) {
    process.exit(1);
  }

  // Step 3: Test Supabase connection
  const { connected, tablesExist, client } = await testSupabaseConnection();
  if (!connected) {
    log.error('\nPlease fix Supabase configuration and try again');
    process.exit(1);
  }

  // Step 4: Create tables if needed
  if (!tablesExist) {
    await createDatabaseTables(client);
  } else {
    log.info('Database tables already exist');
  }

  // Step 5: Test Vercel Blob Storage
  const blobWorking = await testVercelBlobStorage();
  if (!blobWorking) {
    log.warn('\nImage persistence will not work without Blob Storage');
  }

  // Step 6: Test Redis (optional)
  await testRedisConnection();

  // Summary
  log.header('Setup Summary');
  console.log(`
${colors.green}✓ Environment variables configured${colors.reset}
${colors.green}✓ Supabase connection working${colors.reset}
${tablesExist ? colors.green + '✓' : colors.yellow + '⚠'} Database tables ${tablesExist ? 'ready' : 'need manual creation'}${colors.reset}
${blobWorking ? colors.green + '✓' : colors.red + '✗'} Vercel Blob Storage ${blobWorking ? 'working' : 'not configured'}${colors.reset}
${process.env.REDIS_URL ? colors.green + '✓' : colors.yellow + '⚠'} Redis caching ${process.env.REDIS_URL ? 'enabled' : 'disabled'}${colors.reset}

${colors.bright}Next Steps:${colors.reset}
${!tablesExist ? '1. Create database tables in Supabase using the provided SQL\n' : ''}${!blobWorking ? '2. Configure Vercel Blob Storage for image persistence\n' : ''}
${colors.green}${colors.bright}Your persistence system is ${tablesExist && blobWorking ? 'ready to use!' : 'partially configured.'}${colors.reset}
`);
}

// Run the setup
main().catch(console.error);