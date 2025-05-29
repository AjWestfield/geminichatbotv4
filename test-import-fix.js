#!/usr/bin/env node

// Test the import fix directly
const fetch = require('node-fetch');

const incompleteJSON = `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",`;

async function testImportFix() {
  console.log('Testing MCP Import Fix');
  console.log('=====================\n');
  
  // First, test the analyze endpoint
  console.log('1. Testing /api/mcp/analyze endpoint...');
  
  try {
    const analyzeResponse = await fetch('http://localhost:3003/api/mcp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: incompleteJSON, 
        type: 'json' 
      })
    });
    
    const analyzeResult = await analyzeResponse.json();
    
    console.log('Analyze result:', JSON.stringify(analyzeResult, null, 2));
    
    if (analyzeResult.correctedJSON) {
      console.log('\n✅ Step 1 passed: JSON was corrected');
      console.log('Corrected config:', analyzeResult.correctedJSON);
      
      // Check if the corrected config has required fields
      const config = analyzeResult.correctedJSON;
      console.log('\nChecking corrected config:');
      console.log('- Has name?', !!config.name);
      console.log('- Has command?', !!config.command);
      console.log('- Has args?', !!config.args);
      console.log('- Has id?', !!config.id, '(not required from analyze)');
      
      // Now simulate what the UI does
      console.log('\n2. Simulating UI import process...');
      
      // The UI should add an ID before calling addServer
      const serverWithId = {
        ...config,
        id: `server-${Date.now()}-test`
      };
      
      console.log('Server config with ID:', serverWithId);
      
      // Test if this would work with addServer
      console.log('\n3. Testing server configuration validity...');
      
      if (serverWithId.id && serverWithId.name && serverWithId.command) {
        console.log('✅ Server configuration is valid for import');
      } else {
        console.log('❌ Server configuration is missing required fields');
      }
      
    } else {
      console.log('\n❌ Step 1 failed: No corrected JSON returned');
      console.log('Errors:', analyzeResult.errors);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nMake sure the dev server is running on port 3003');
  }
}

// Run the test
testImportFix();