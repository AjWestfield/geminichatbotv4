#!/usr/bin/env node

// Debug the JSON import issue
const { MCPServerIntelligence } = require('./lib/mcp/mcp-server-intelligence');

const incompleteJSON = `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",`;

async function debugImport() {
  console.log('Debugging JSON Import Issue');
  console.log('===========================\n');
  
  console.log('Input JSON:');
  console.log(incompleteJSON);
  console.log('\n---\n');
  
  try {
    // Call the intelligence system directly
    const result = await MCPServerIntelligence.analyzeAndCorrectJSON(incompleteJSON);
    
    console.log('Analysis Result:');
    console.log('- isValid:', result.isValid);
    console.log('- errors:', result.errors);
    console.log('- suggestions:', result.suggestions);
    console.log('\nCorrected JSON:');
    console.log(JSON.stringify(result.correctedJSON, null, 2));
    
    if (result.correctedJSON) {
      const config = result.correctedJSON;
      console.log('\nChecking corrected config structure:');
      console.log('- Type:', Array.isArray(config) ? 'Array' : typeof config);
      console.log('- Has name?', !!config.name);
      console.log('- Has command?', !!config.command);
      console.log('- Has args?', !!config.args);
      console.log('- Has transportType?', !!config.transportType);
      
      // What the UI would do
      console.log('\n\nWhat settings-dialog.tsx would parse:');
      let servers = [];
      if (Array.isArray(config)) {
        servers = config;
      } else if (config.mcpServers) {
        servers = Object.entries(config.mcpServers).map(([name, cfg]) => ({ name, ...cfg }));
      } else if (config.servers) {
        servers = config.servers;
      } else {
        servers = [config];
      }
      
      console.log('Parsed servers array:');
      console.log(JSON.stringify(servers, null, 2));
      
      // Check what would be sent to API
      if (servers.length > 0) {
        const serverToAdd = {
          ...servers[0],
          id: servers[0].id || `server-${Date.now()}-test`
        };
        
        console.log('\n\nServer that would be sent to API:');
        console.log(JSON.stringify(serverToAdd, null, 2));
        
        console.log('\nValidation check:');
        console.log('- Has id?', !!serverToAdd.id);
        console.log('- Has name?', !!serverToAdd.name);
        console.log('- Has command?', !!serverToAdd.command);
        console.log('✓ Would pass API validation:', !!(serverToAdd.id && serverToAdd.name));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug
debugImport();