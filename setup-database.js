#!/usr/bin/env node

/**
 * Complete Database Setup for Gemini Chatbot Persistence
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════╗
║     🚀 Database Setup for Persistence     ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log(`Project: ${colors.cyan}${projectRef}${colors.reset}\n`);

// Step 1: Check current status
async function checkTables() {
  console.log('📊 Checking current database status...\n');
  
  const tables = ['chats', 'messages', 'images'];
  let existingCount = 0;
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
      if (response.ok) {
        console.log(`  ${colors.green}✓${colors.reset} Table '${table}' exists`);
        existingCount++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Table '${table}' not found`);
      }
    } catch (error) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Could not check '${table}'`);
    }
  }
  
  return existingCount === tables.length;
}

// Step 2: Create migration file
function createMigrationFile() {
  const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const header = `-- =====================================================
-- GEMINI CHATBOT DATABASE SETUP
-- =====================================================
-- Project: ${projectRef}
-- Generated: ${new Date().toLocaleString()}
-- 
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file content
-- 2. Paste in Supabase SQL Editor
-- 3. Click "Run" button
-- 4. You should see: "Success. No rows returned"
-- =====================================================

`;

  const footer = `

-- =====================================================
-- ✅ SETUP COMPLETE!
-- =====================================================
-- Your database is now ready for:
-- • Chat history persistence
-- • Message storage
-- • Image gallery in the cloud
-- • Full search capabilities
-- =====================================================`;

  const fullScript = header + schema + footer;
  
  fs.writeFileSync('DATABASE_SETUP.sql', fullScript);
  
  return fullScript;
}

// Step 3: Main setup flow
async function main() {
  // Check if tables already exist
  const tablesExist = await checkTables();
  
  if (tablesExist) {
    console.log(`\n${colors.green}✅ All tables already exist!${colors.reset}`);
    console.log('Your persistence is ready to use.\n');
    
    console.log('Next steps:');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. The yellow notification should be gone');
    console.log('3. Your chats will now be saved!\n');
    
    process.exit(0);
  }
  
  // Create migration file
  console.log(`\n${colors.yellow}📋 Creating migration script...${colors.reset}`);
  const sqlContent = createMigrationFile();
  console.log(`${colors.green}✓${colors.reset} Created: DATABASE_SETUP.sql\n`);
  
  // Prepare URLs
  const sqlEditorUrl = `https://app.supabase.com/project/${projectRef}/sql/new`;
  
  console.log(`${colors.bright}${colors.cyan}SETUP INSTRUCTIONS:${colors.reset}\n`);
  
  console.log(`1. ${colors.bright}Open Supabase SQL Editor:${colors.reset}`);
  console.log(`   ${colors.cyan}${sqlEditorUrl}${colors.reset}\n`);
  
  console.log(`2. ${colors.bright}Copy the migration script:${colors.reset}`);
  console.log(`   • Open ${colors.cyan}DATABASE_SETUP.sql${colors.reset}`);
  console.log(`   • Select ALL content (Cmd/Ctrl + A)`);
  console.log(`   • Copy (Cmd/Ctrl + C)\n`);
  
  console.log(`3. ${colors.bright}Run in SQL Editor:${colors.reset}`);
  console.log(`   • Paste the script`);
  console.log(`   • Click the ${colors.green}"Run"${colors.reset} button`);
  console.log(`   • Wait for: ${colors.green}"Success. No rows returned"${colors.reset}\n`);
  
  console.log(`4. ${colors.bright}Verify setup:${colors.reset}`);
  console.log(`   • Run: ${colors.cyan}node verify-persistence.js${colors.reset}\n`);
  
  // Try to open SQL editor
  console.log(`${colors.yellow}Opening Supabase SQL Editor...${colors.reset}`);
  
  const openCommand = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${openCommand} "${sqlEditorUrl}"`, (error) => {
    if (!error) {
      console.log(`${colors.green}✓${colors.reset} Opened in your browser\n`);
    }
    
    // Try to copy to clipboard (macOS only)
    if (process.platform === 'darwin') {
      exec(`cat DATABASE_SETUP.sql | pbcopy`, (error) => {
        if (!error) {
          console.log(`${colors.green}✓ BONUS:${colors.reset} Migration script copied to clipboard!`);
          console.log('  Just paste it in the SQL editor.\n');
        }
      });
    }
    
    console.log(`${colors.bright}Ready to complete setup!${colors.reset}`);
  });
}

main().catch(console.error);