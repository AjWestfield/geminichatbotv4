#!/usr/bin/env node

/**
 * Direct SQL execution for Supabase using fetch
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_API_KEY;

console.log('🚀 Running Database Migration...\n');

// Function to execute SQL via Supabase REST API
async function executeSQLViaAPI(sql) {
  try {
    // First, let's try using the direct SQL execution endpoint
    // Note: This requires service role key, but let's try with anon key
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Alternative: Create tables using REST API
async function createTablesViaREST() {
  console.log('Attempting to create tables via REST API...\n');
  
  // Test if tables exist by trying to query them
  const tables = ['chats', 'messages', 'images'];
  const results = {};
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (response.status === 404 || response.status === 400) {
        results[table] = 'not exists';
        console.log(`❌ Table '${table}' does not exist`);
      } else if (response.ok) {
        results[table] = 'exists';
        console.log(`✅ Table '${table}' already exists`);
      } else {
        results[table] = 'error';
        console.log(`⚠️  Cannot check table '${table}': ${response.status}`);
      }
    } catch (error) {
      results[table] = 'error';
      console.log(`❌ Error checking table '${table}': ${error.message}`);
    }
  }
  
  return results;
}

async function main() {
  // First check what tables exist
  const tableStatus = await createTablesViaREST();
  
  const allTablesExist = Object.values(tableStatus).every(status => status === 'exists');
  
  if (allTablesExist) {
    console.log('\n✅ All tables already exist! No migration needed.');
    console.log('\nYour persistence is ready to use!');
    return;
  }
  
  console.log('\n📋 Tables need to be created manually.\n');
  
  // Create the migration file
  const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const migrationScript = `-- COPY AND RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- Project: ${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}
-- Generated: ${new Date().toISOString()}

${schema}

-- After running this script, you should see: "Success. No rows returned"`;
  
  fs.writeFileSync('RUN_THIS_MIGRATION.sql', migrationScript);
  
  console.log('I\'ve created a migration file: RUN_THIS_MIGRATION.sql\n');
  console.log('Follow these steps:\n');
  console.log('1. Go to your Supabase SQL Editor:');
  console.log(`   ${SUPABASE_URL.replace('.supabase.co', '.supabase.com/project/' + SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] + '/sql/new')}\n`);
  console.log('2. Copy ALL contents from RUN_THIS_MIGRATION.sql');
  console.log('3. Paste into the SQL editor');
  console.log('4. Click the green "Run" button\n');
  console.log('5. You should see: "Success. No rows returned"\n');
  console.log('6. Then run: node verify-persistence.js');
  
  // Try to copy to clipboard
  try {
    const { exec } = require('child_process');
    const content = fs.readFileSync('RUN_THIS_MIGRATION.sql', 'utf8');
    
    if (process.platform === 'darwin') {
      exec(`echo "${content.replace(/"/g, '\\"')}" | pbcopy`, (err) => {
        if (!err) {
          console.log('\n✅ Migration SQL copied to clipboard!');
          console.log('Just paste it in the SQL editor.');
        }
      });
    }
  } catch (e) {
    // Ignore clipboard errors
  }
}

main().catch(console.error);