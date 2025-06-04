#!/usr/bin/env node

/**
 * Automated Supabase database setup using Playwright
 * This will automatically create all tables for you
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Get project info
const SUPABASE_URL = process.env.SUPABASE_URL;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🤖 Automated Supabase Database Setup');
console.log('Project:', projectRef);
console.log('');

async function setupDatabase() {
  const browser = await chromium.launch({ 
    headless: false, // Show browser so you can see what's happening
    slowMo: 500 // Slow down actions so they're visible
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Go to Supabase SQL editor
    const sqlEditorUrl = `https://app.supabase.com/project/${projectRef}/sql/new`;
    console.log('📍 Navigating to SQL editor...');
    await page.goto(sqlEditorUrl);
    
    // Wait for login page or SQL editor
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const isLoginPage = await page.url().includes('supabase.com/dashboard/sign-in') || 
                       await page.url().includes('app.supabase.com/sign-in');
    
    if (isLoginPage) {
      console.log('🔐 Login required. Please login manually.');
      console.log('');
      console.log('Steps:');
      console.log('1. Login to Supabase in the browser window');
      console.log('2. The script will continue automatically');
      console.log('');
      console.log('Waiting for login...');
      
      // Wait for navigation away from login page
      await page.waitForURL(`**/project/${projectRef}/**`, { timeout: 120000 });
      console.log('✅ Login successful!');
      
      // Navigate to SQL editor again
      await page.goto(sqlEditorUrl);
    }
    
    // Wait for SQL editor to load
    console.log('⏳ Waiting for SQL editor to load...');
    await page.waitForSelector('[data-state="closed"] >> text="New query"', { timeout: 30000 }).catch(() => {});
    
    // Look for CodeMirror editor or Monaco editor
    const editorSelector = '.cm-content, .monaco-editor, textarea[placeholder*="-- Enter your SQL"], .view-lines';
    await page.waitForSelector(editorSelector, { timeout: 30000 });
    
    console.log('📝 SQL editor loaded!');
    
    // Read the SQL schema
    const schemaPath = path.join(__dirname, 'lib', 'database', 'schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Clear any existing content and paste our SQL
    console.log('📋 Inserting SQL schema...');
    
    // Try different methods to insert SQL
    try {
      // Method 1: Click on editor and paste
      await page.click(editorSelector);
      await page.keyboard.press('Control+A'); // or Meta+A on Mac
      await page.keyboard.press('Meta+A'); // Try both
      await page.waitForTimeout(500);
      
      // Type the SQL content
      await page.keyboard.type(sqlContent, { delay: 0 });
      
    } catch (e) {
      console.log('Trying alternative paste method...');
      
      // Method 2: Use fill if it's a textarea
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.fill(sqlContent);
      } else {
        // Method 3: Use evaluate to set content directly
        await page.evaluate((sql) => {
          const editor = document.querySelector('.cm-content, .monaco-editor, textarea');
          if (editor) {
            if (editor.CodeMirror) {
              editor.CodeMirror.setValue(sql);
            } else if (window.monaco) {
              const monacoEditor = monaco.editor.getModels()[0];
              if (monacoEditor) monacoEditor.setValue(sql);
            } else if (editor.value !== undefined) {
              editor.value = sql;
            }
          }
        }, sqlContent);
      }
    }
    
    console.log('✅ SQL schema inserted!');
    
    // Find and click the Run button
    console.log('🏃 Looking for Run button...');
    
    // Try different selectors for the Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      'button:has-text("Execute")',
      'button[type="submit"]',
      '[data-testid="run-sql-button"]',
      'button.bg-brand-500',
      'button.bg-green-500'
    ];
    
    let runButton = null;
    for (const selector of runButtonSelectors) {
      try {
        runButton = await page.waitForSelector(selector, { timeout: 5000 });
        if (runButton) break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (runButton) {
      console.log('🎯 Found Run button, clicking...');
      await runButton.click();
      
      // Wait for execution
      console.log('⏳ Executing SQL...');
      await page.waitForTimeout(5000);
      
      // Check for success message
      const successSelectors = [
        'text="Success"',
        'text="No rows returned"',
        'text="Query returned successfully"',
        '.text-green-500',
        '[role="alert"]'
      ];
      
      let success = false;
      for (const selector of successSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          success = true;
          break;
        } catch (e) {
          // Try next
        }
      }
      
      if (success) {
        console.log('');
        console.log('🎉 SUCCESS! Database tables created!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Run: node verify-persistence.js');
        console.log('2. Restart your app: npm run dev');
        console.log('3. The yellow notification should be gone!');
      } else {
        console.log('⚠️  Could not confirm success. Please check the browser window.');
      }
      
    } else {
      console.log('');
      console.log('⚠️  Could not find Run button automatically.');
      console.log('');
      console.log('Please manually:');
      console.log('1. Click the green "Run" button in the SQL editor');
      console.log('2. Wait for "Success. No rows returned"');
      console.log('3. Close this browser window when done');
    }
    
    // Keep browser open for user to see results
    console.log('');
    console.log('Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('The browser window will stay open.');
    console.log('Please complete the setup manually.');
    await new Promise(() => {}); // Keep browser open
  } finally {
    await browser.close();
  }
}

// Check if Playwright is installed
try {
  require('playwright');
  setupDatabase();
} catch (error) {
  console.log('📦 Playwright not installed. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install playwright', { stdio: 'inherit' });
    console.log('✅ Playwright installed!');
    console.log('🌐 Installing Chromium browser...');
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log('✅ Browser installed!');
    console.log('');
    console.log('🚀 Starting automated setup...');
    console.log('');
    setupDatabase();
  } catch (installError) {
    console.error('❌ Failed to install Playwright:', installError.message);
    console.log('');
    console.log('Please install manually:');
    console.log('npm install playwright');
    console.log('npx playwright install chromium');
  }
}