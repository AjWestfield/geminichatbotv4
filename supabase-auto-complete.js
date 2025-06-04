#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🤖 Supabase Automated Setup - Enhanced Version');
console.log('Project:', projectRef);
console.log('');

async function setupDatabase() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slower to ensure actions complete
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate directly to SQL editor
    console.log('📍 Opening Supabase SQL editor...');
    await page.goto(`https://app.supabase.com/project/${projectRef}/sql/new`, {
      waitUntil: 'networkidle'
    });
    
    // Check if logged in
    await page.waitForTimeout(3000);
    
    if (page.url().includes('sign-in') || page.url().includes('sign_in')) {
      console.log('🔐 Please log in to Supabase in the browser window');
      console.log('   The script will continue once you\'re logged in...\n');
      
      // Wait for successful login
      await page.waitForURL(`**/project/${projectRef}/**`, { 
        timeout: 300000 // 5 minutes to login
      });
      
      console.log('✅ Logged in successfully!\n');
      
      // Go back to SQL editor
      await page.goto(`https://app.supabase.com/project/${projectRef}/sql/new`, {
        waitUntil: 'networkidle'
      });
    }
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    console.log('📝 Looking for SQL editor...');
    
    // Look for the SQL editor more carefully
    // Supabase uses Monaco editor
    await page.waitForSelector('.monaco-editor, .cm-editor, textarea', { 
      timeout: 30000 
    });
    
    // Read SQL content
    const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Inserting SQL schema...');
    
    // Click on the editor area first
    const editorElement = await page.$('.monaco-editor, .cm-editor, textarea');
    if (editorElement) {
      await editorElement.click();
      await page.waitForTimeout(500);
    }
    
    // Clear existing content
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    
    // Also try Cmd+A for Mac
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(500);
    
    // Delete any selected text
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Type the SQL content in chunks to avoid issues
    console.log('   Typing SQL content...');
    const chunks = sqlContent.match(/.{1,1000}/g) || [];
    for (let i = 0; i < chunks.length; i++) {
      await page.keyboard.type(chunks[i], { delay: 10 });
      if (i % 5 === 0) {
        console.log(`   Progress: ${Math.round((i / chunks.length) * 100)}%`);
      }
    }
    
    console.log('✅ SQL content inserted!\n');
    
    // Find the Run button
    console.log('🏃 Looking for Run button...');
    
    // Supabase typically has a green Run button
    const runButton = await page.locator('button:has-text("Run")').first();
    
    if (await runButton.isVisible()) {
      console.log('🎯 Found Run button, clicking...');
      await runButton.click();
      
      console.log('⏳ Waiting for execution to complete...');
      
      // Wait for result
      await page.waitForTimeout(10000); // Give it 10 seconds to execute
      
      // Check for success indicators
      const success = await page.locator('text=/success|Success|succeeded|Succeeded|No rows returned/i').count() > 0;
      const error = await page.locator('text=/error|Error|failed|Failed/i').count() > 0;
      
      if (success && !error) {
        console.log('');
        console.log('🎉 SUCCESS! Database tables created successfully!');
        console.log('');
        console.log('✅ All tables have been created:');
        console.log('   • chats - Stores chat conversations');
        console.log('   • messages - Stores all messages');
        console.log('   • images - Stores image metadata');
        console.log('   • chat_summaries - View for efficient queries');
        console.log('');
        console.log('🚀 Next steps:');
        console.log('   1. Close this browser window');
        console.log('   2. Run: node check-tables.js (to verify)');
        console.log('   3. Restart your app: npm run dev');
        console.log('   4. Enjoy persistence! 🎊');
      } else if (error) {
        console.log('');
        console.log('❌ There was an error executing the SQL.');
        console.log('   Please check the error message in the browser.');
        console.log('   Common issues:');
        console.log('   - Tables might already exist');
        console.log('   - Syntax error in SQL');
      } else {
        console.log('');
        console.log('⚠️  Could not determine if execution was successful.');
        console.log('   Please check the browser for results.');
      }
    } else {
      console.log('');
      console.log('❌ Could not find the Run button.');
      console.log('   Please click the green "Run" button manually.');
    }
    
    console.log('');
    console.log('Browser will remain open for you to verify.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Please complete the setup manually in the browser.');
    console.log('The SQL content should be in the editor.');
    
    // Keep browser open on error
    await new Promise(() => {});
  }
}

// Run the setup
setupDatabase().catch(console.error);