#!/usr/bin/env node

/**
 * Automated database setup using Supabase direct table creation
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');

// Get project reference from URL
const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

console.log('🚀 Automated Database Setup for Supabase');
console.log('Project:', projectRef);
console.log('');

// Read and prepare SQL
const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

// Create a direct link to execute SQL
const sqlEditorUrl = `https://app.supabase.com/project/${projectRef}/sql/new`;

// Create one-click migration file
const migrationContent = `-- AUTOMATED MIGRATION SCRIPT FOR GEMINI CHATBOT
-- Generated: ${new Date().toISOString()}
-- Project: ${projectRef}

-- ⚠️ IMPORTANT: Run this entire script at once in Supabase SQL Editor
-- Expected result: "Success. No rows returned"

${sqlContent}

-- ✅ Migration Complete!
-- Your database is now ready for chat persistence.`;

// Save migration file
fs.writeFileSync('QUICK_MIGRATION.sql', migrationContent);

console.log('✅ Created migration file: QUICK_MIGRATION.sql');
console.log('');
console.log('📋 To complete setup:');
console.log('');
console.log('1. I\'ll open the Supabase SQL editor for you');
console.log('2. Copy ALL contents from QUICK_MIGRATION.sql');
console.log('3. Paste into the SQL editor');
console.log('4. Click "Run" button');
console.log('');
console.log(`SQL Editor URL: ${sqlEditorUrl}`);
console.log('');

// Try to open the URL automatically
const { exec } = require('child_process');
const openCommand = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${openCommand} "${sqlEditorUrl}"`, (error) => {
  if (error) {
    console.log('Please open this URL manually:');
    console.log(sqlEditorUrl);
  } else {
    console.log('✅ Opened Supabase SQL editor in your browser');
  }
  
  console.log('');
  console.log('After running the SQL, verify with:');
  console.log('  node verify-persistence.js');
});