#!/usr/bin/env node

// Simulate exactly what the UI does when importing JSON

const incompleteJSON = `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",`;

async function simulateUIImport() {
  console.log('Simulating UI Import Process');
  console.log('============================\n');
  
  try {
    // Step 1: Call analyze endpoint (what happens when user clicks Import)
    console.log('Step 1: Calling /api/mcp/analyze...');
    const analyzeResponse = await fetch('http://localhost:3003/api/mcp/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: incompleteJSON, 
        type: 'json' 
      })
    });
    
    const result = await analyzeResponse.json();
    console.log('Analyze response:', JSON.stringify(result, null, 2));
    
    if (!result.success || !result.correctedJSON) {
      console.log('❌ Analysis failed');
      return;
    }
    
    // Step 2: Parse servers array (what settings-dialog.tsx does)
    console.log('\nStep 2: Parsing servers array...');
    let servers = [];
    
    if (Array.isArray(result.correctedJSON)) {
      servers = result.correctedJSON;
    } else if (result.correctedJSON.mcpServers) {
      servers = Object.entries(result.correctedJSON.mcpServers).map(([name, cfg]) => ({ name, ...cfg }));
    } else if (result.correctedJSON.servers) {
      servers = result.correctedJSON.servers;
    } else {
      servers = [result.correctedJSON];
    }
    
    console.log('Parsed servers:', JSON.stringify(servers, null, 2));
    
    // Step 3: Add ID and call addServer (what the loop does)
    console.log('\nStep 3: Adding servers...');
    for (const server of servers) {
      const serverWithId = {
        ...server,
        id: server.id || `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      console.log('\nAdding server:', JSON.stringify(serverWithId, null, 2));
      
      // Call the API
      const addResponse = await fetch('http://localhost:3003/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverWithId),
      });
      
      const addResult = await addResponse.json();
      
      if (!addResponse.ok) {
        console.log('❌ Failed to add server:', addResult);
      } else {
        console.log('✅ Server added successfully:', addResult);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the dev server is running on port 3003');
  }
}

// Run the simulation
simulateUIImport();