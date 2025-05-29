#!/usr/bin/env node

/**
 * Test the intelligent MCP JSON correction feature
 */

const { MCPServerIntelligence } = require('./lib/mcp/mcp-server-intelligence');

// Test case 1: The exact incomplete JSON from the user's screenshot
const incompleteJSON1 = `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",`;

// Test case 2: Another incomplete pattern
const incompleteJSON2 = `{
  "sequential-thinking": {
    "command": "npx"`;

// Test case 3: Just the server name
const incompleteJSON3 = `{
  "mcpServers": {
    "sequential-thinking":`;

async function testJSONCorrection(testName, jsonInput) {
  console.log(`\n${testName}`);
  console.log('Input:', jsonInput.replace(/\n/g, '\\n'));
  console.log('---');
  
  try {
    const result = await MCPServerIntelligence.analyzeAndCorrectJSON(jsonInput);
    
    if (result.correctedJSON) {
      console.log('✅ Successfully corrected!');
      console.log('Corrected JSON:', JSON.stringify(result.correctedJSON, null, 2));
      if (result.suggestions) {
        console.log('Suggestions:', result.suggestions.join(', '));
      }
    } else {
      console.log('❌ Failed to correct');
      if (result.errors) {
        console.log('Errors:', result.errors.join(', '));
      }
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

// Make a simple test request
async function testViaAPI() {
  console.log('\n\nTesting via API endpoint...');
  
  const response = await fetch('http://localhost:3000/api/mcp/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      input: incompleteJSON1, 
      type: 'json' 
    })
  });
  
  const result = await response.json();
  console.log('API Response:', JSON.stringify(result, null, 2));
}

// Run tests
async function runTests() {
  console.log('Testing Intelligent MCP JSON Correction');
  console.log('=====================================');
  
  await testJSONCorrection('Test 1: User\'s exact incomplete JSON', incompleteJSON1);
  await testJSONCorrection('Test 2: Incomplete with command only', incompleteJSON2);
  await testJSONCorrection('Test 3: Just server name', incompleteJSON3);
  
  // Test via API if server is running
  if (process.argv.includes('--api')) {
    await testViaAPI();
  }
  
  console.log('\n\nTest complete!');
  console.log('\nThe intelligent JSON correction should now:');
  console.log('1. Detect "sequential-thinking" server from incomplete JSON');
  console.log('2. Auto-complete with the correct npx command');
  console.log('3. Provide helpful suggestions');
  console.log('4. Return proper error messages (not "undefined")');
}

// Check if running directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testJSONCorrection };