#!/usr/bin/env node

/**
 * Quick setup script that opens everything you need
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🚀 Quick Persistence Setup');
console.log('');

// Create a simple SQL file with clear instructions
const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const quickSetupSQL = `-- QUICK SETUP: COPY ALL AND RUN IN SUPABASE
-- =========================================
-- 1. SELECT ALL (Cmd+A or Ctrl+A)
-- 2. COPY (Cmd+C or Ctrl+C)  
-- 3. Go to Supabase SQL Editor
-- 4. PASTE (Cmd+V or Ctrl+V)
-- 5. Click "RUN" button
-- =========================================

${schema}

-- ✅ DONE! You should see "Success. No rows returned"`;

fs.writeFileSync('QUICK_SETUP.sql', quickSetupSQL);

// Copy to clipboard on macOS
if (process.platform === 'darwin') {
  exec('cat QUICK_SETUP.sql | pbcopy', (err) => {
    if (!err) {
      console.log('✅ SQL copied to clipboard!');
    }
  });
}

// Open the SQL editor
const sqlEditorUrl = `https://app.supabase.com/project/${projectRef}/sql/new`;

console.log('Opening Supabase SQL Editor...');
console.log('');

const openCmd = process.platform === 'darwin' ? 'open' : 
               process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${openCmd} "${sqlEditorUrl}"`, (err) => {
  if (!err) {
    console.log('📋 Instructions:');
    console.log('1. Log in to Supabase (if needed)');
    console.log('2. The SQL is already copied to your clipboard');
    console.log('3. Just PASTE (Cmd+V) in the SQL editor');
    console.log('4. Click the green "RUN" button');
    console.log('5. Wait for "Success. No rows returned"');
    console.log('');
    console.log('Then run: node check-tables.js');
  }
});

// Also create a verification script
setTimeout(() => {
  console.log('');
  console.log('After running the SQL, verify with:');
  console.log('npm run dev');
  console.log('');
  console.log('The yellow notification should disappear!');
}, 2000);