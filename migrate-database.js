#!/usr/bin/env node

/**
 * Automated database migration script for Supabase
 * This will create all necessary tables and views
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

async function runMigration() {
  log.header('🚀 Starting Database Migration');
  
  try {
    // Read the SQL schema
    const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    log.info('Read SQL schema file');
    
    // Split the schema into individual statements
    // This is a simple split - for production use a proper SQL parser
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    log.info(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const firstLine = statement.split('\n')[0].substring(0, 50);
      
      log.info(`Executing: ${firstLine}...`);
      
      try {
        // Use raw SQL execution via RPC
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        }).catch(async (rpcError) => {
          // If RPC doesn't exist, try direct execution
          // Note: This might not work depending on Supabase permissions
          return { error: new Error('RPC function not available') };
        });
        
        if (error) {
          // Try alternative approach - create tables via REST API
          if (statement.includes('CREATE TABLE')) {
            log.warn('Direct SQL execution not available, tables must be created manually');
            throw new Error('Manual intervention required');
          }
        } else {
          log.success(`Statement ${i + 1}/${statements.length} executed`);
        }
      } catch (err) {
        log.error(`Failed to execute statement ${i + 1}: ${err.message}`);
        throw err;
      }
    }
    
    log.success('All SQL statements executed successfully!');
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    
    log.header('📋 Manual Migration Required');
    log.info('Since automated migration is not available, please follow these steps:\n');
    
    console.log('1. Go to your Supabase dashboard:');
    console.log(`   ${colors.cyan}https://app.supabase.com/project/bsocqrwrikfmymklgart/sql/new${colors.reset}\n`);
    
    console.log('2. Copy the entire contents of:');
    console.log(`   ${colors.cyan}lib/database/schema.sql${colors.reset}\n`);
    
    console.log('3. Paste it into the SQL editor and click "Run"\n');
    
    console.log('4. After creating tables, run:');
    console.log(`   ${colors.cyan}node verify-persistence.js${colors.reset}\n`);
    
    // Create a one-click solution
    await createQuickMigrationFile();
  }
}

async function createQuickMigrationFile() {
  const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const quickMigration = `-- SUPABASE MIGRATION SCRIPT
-- Generated on ${new Date().toISOString()}
-- 
-- Instructions:
-- 1. Copy ALL of this content
-- 2. Go to: https://app.supabase.com/project/bsocqrwrikfmymklgart/sql/new
-- 3. Paste and click "Run"
-- 
-- This will create all necessary tables for chat persistence

${schema}

-- Migration complete!
-- You should see "Success. No rows returned" after running this.`;

  const outputPath = path.join(__dirname, 'MIGRATION_SCRIPT.sql');
  fs.writeFileSync(outputPath, quickMigration);
  
  log.success(`Created migration script: ${colors.cyan}MIGRATION_SCRIPT.sql${colors.reset}`);
  log.info('You can copy this file\'s contents to Supabase SQL editor');
}

// Alternative: Try to check if tables already exist
async function checkExistingTables() {
  log.header('Checking Existing Tables');
  
  const tables = ['chats', 'messages', 'images'];
  let existingTables = 0;
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!error) {
        log.success(`Table '${table}' already exists`);
        existingTables++;
      } else if (error.code === '42P01') {
        log.warn(`Table '${table}' does not exist`);
      } else {
        log.error(`Error checking table '${table}': ${error.message}`);
      }
    } catch (err) {
      log.error(`Failed to check table '${table}': ${err.message}`);
    }
  }
  
  if (existingTables === tables.length) {
    log.success('All tables already exist! Migration not needed.');
    return true;
  }
  
  return false;
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════╗
║      Supabase Database Migration          ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

  // Check if tables already exist
  const tablesExist = await checkExistingTables();
  
  if (tablesExist) {
    log.header('✅ Database is already set up!');
    log.info('You can start using persistence features.');
    process.exit(0);
  }
  
  // Run migration
  await runMigration();
}

main().catch(console.error);