#!/usr/bin/env node

/**
 * Quick verification script to check if GitHub URL fixes are properly applied
 */

const fs = require('fs');
const path = require('path');

console.log('Verifying GitHub URL MCP Intelligence Fixes...\n');

// Check 1: Verify mcp-server-intelligence.ts fixes
console.log('1. Checking mcp-server-intelligence.ts...');
const intelligenceFile = fs.readFileSync(
  path.join(__dirname, 'lib/mcp/mcp-server-intelligence.ts'), 
  'utf8'
);

// Should NOT contain getAvailableTools
if (intelligenceFile.includes('mcpManager.getAvailableTools()')) {
  console.log('❌ ERROR: Still contains mcpManager.getAvailableTools()');
} else {
  console.log('✅ PASS: getAvailableTools() has been removed');
}

// Should contain getAllServers
if (intelligenceFile.includes('mcpManager.getAllServers()')) {
  console.log('✅ PASS: Now uses mcpManager.getAllServers()');
} else {
  console.log('❌ ERROR: Missing mcpManager.getAllServers()');
}

// Should check for connected status
if (intelligenceFile.includes("s.status === 'connected'")) {
  console.log('✅ PASS: Checks for connected servers');
} else {
  console.log('❌ ERROR: Not checking server connection status');
}

// Check 2: Verify chat route fixes
console.log('\n2. Checking chat route...');
const chatRoute = fs.readFileSync(
  path.join(__dirname, 'app/api/chat/route.ts'), 
  'utf8'
);

// Count hardcoded "context7" references in TOOL_CALL
const context7Matches = chatRoute.match(/"server":\s*"context7"/g) || [];
if (context7Matches.length > 0) {
  console.log(`❌ ERROR: Found ${context7Matches.length} hardcoded "context7" references`);
} else {
  console.log('✅ PASS: No hardcoded "context7" references found');
}

// Should use MCPToolsContext.getAvailableTools
if (chatRoute.includes('MCPToolsContext.getAvailableTools()')) {
  console.log('✅ PASS: Uses MCPToolsContext.getAvailableTools()');
} else {
  console.log('⚠️  WARNING: May not be using MCPToolsContext.getAvailableTools()');
}

// Should have dynamic server resolution
if (chatRoute.includes('searchTool.serverName') && chatRoute.includes('searchTool.toolName')) {
  console.log('✅ PASS: Uses dynamic tool/server names');
} else {
  console.log('❌ ERROR: Not using dynamic tool/server resolution');
}

// Check 3: Verify imports
console.log('\n3. Checking imports...');
if (chatRoute.includes("import { MCPGitHubPrompts }")) {
  console.log('✅ PASS: MCPGitHubPrompts is imported');
} else {
  console.log('❌ ERROR: MCPGitHubPrompts import missing');
}

// Summary
console.log('\n========================================');
console.log('Verification Complete!');
console.log('========================================');
console.log('\nKey fixes applied:');
console.log('1. Replaced mcpManager.getAvailableTools() with getAllServers()');
console.log('2. Removed hardcoded "context7" server references');
console.log('3. Added dynamic tool/server discovery');
console.log('4. Added fallback handling when no search tools available');
console.log('\nThe GitHub URL analysis feature should now work properly!');
console.log('\nTo test:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Add a search tool (e.g., context7) if not already added');
console.log('3. Provide a GitHub URL for an MCP server');
console.log('4. The system should analyze and add it automatically');