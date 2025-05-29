#!/usr/bin/env node

// Quick test for the JSON fix
const incompleteJSON = `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",`;

async function testJSONFix() {
  try {
    const response = await fetch('http://localhost:3003/api/mcp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: incompleteJSON, 
        type: 'json' 
      })
    });
    
    const result = await response.json();
    
    console.log('Test Result:');
    console.log('============');
    
    if (result.correctedJSON) {
      console.log('✅ SUCCESS! JSON was corrected:');
      console.log(JSON.stringify(result.correctedJSON, null, 2));
      
      if (result.suggestions) {
        console.log('\nSuggestions:', result.suggestions.join(', '));
      }
    } else {
      console.log('❌ FAILED! No corrected JSON returned');
      if (result.errors) {
        console.log('Errors:', result.errors.join(', '));
      }
    }
    
    console.log('\nFull response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
console.log('Testing incomplete JSON correction...');
console.log('Make sure the dev server is running on port 3003');
console.log('');

testJSONFix();