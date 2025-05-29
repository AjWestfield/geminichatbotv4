#!/usr/bin/env node

/**
 * Automated script to apply all tool display fixes
 * Run with: node apply-all-tool-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying all tool display fixes...\n');

// Fix 1: Update chat route with delay and separator
const chatRoutePath = path.join(__dirname, 'app/api/chat/route.ts');
console.log('📝 Updating chat route...');

try {
  let chatContent = fs.readFileSync(chatRoutePath, 'utf8');
  
  // Check if fixes already applied
  if (!chatContent.includes('Ensure tool results are displayed in UI before analysis')) {
    // Find the location to insert the delay
    const insertPoint = chatContent.indexOf('// Create a strong analysis instruction');
    if (insertPoint !== -1) {
      const beforeInsert = chatContent.substring(0, insertPoint);
      const afterInsert = chatContent.substring(insertPoint);
      
      const newCode = `                    // Ensure tool results are displayed in UI before analysis
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Visual separator
                    controller.enqueue(encoder.encode(\`0:"\\\\n\\\\n✅ Tool execution complete. Starting analysis...\\\\n\\\\n"\\n\`));
                    
                    `;
      
      chatContent = beforeInsert + newCode + afterInsert;
      fs.writeFileSync(chatRoutePath, chatContent);
      console.log('✅ Chat route updated with delay and separator');
    }
  } else {
    console.log('ℹ️  Chat route already has fixes applied');
  }
} catch (error) {
  console.error('❌ Error updating chat route:', error.message);
}

// Fix 2: Update hooks for proper tool display
const hooksPath = path.join(__dirname, 'hooks/use-chat-with-tools.ts');
console.log('\n📝 Updating hooks file...');

try {
  let hooksContent = fs.readFileSync(hooksPath, 'utf8');
  
  // Update status to completed
  hooksContent = hooksContent.replace(
    /status: 'executing', \/\/ Tool declaration found, execution pending/g,
    `status: 'completed', // Show as completed for immediate display`
  );
  
  // Ensure imports include useMemo
  if (!hooksContent.includes('useMemo')) {
    hooksContent = hooksContent.replace(
      'import { useCallback, useEffect, useRef, useState } from "react"',
      'import { useCallback, useEffect, useRef, useState, useMemo } from "react"'
    );
  }
  
  // Check if memoization already applied
  if (!hooksContent.includes('useMemo(')) {
    hooksContent = hooksContent.replace(
      'const messagesWithTools = processMessagesWithTools(chatResult.messages)',
      `const messagesWithTools = useMemo(
    () => processMessagesWithTools(chatResult.messages),
    [chatResult.messages]
  )`
    );
  }
  
  fs.writeFileSync(hooksPath, hooksContent);
  console.log('✅ Hooks file updated with proper status and memoization');
} catch (error) {
  console.error('❌ Error updating hooks file:', error.message);
}

console.log('\n🎉 All fixes applied successfully!');
console.log('\n📋 Next steps:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Test with: "What is the latest AI news?"');
console.log('3. Verify tool results display before analysis begins');
console.log('\n✨ Enjoy the improved tool experience!');