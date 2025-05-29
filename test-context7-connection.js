#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testContext7() {
  console.log('Testing Context7 MCP server...\n');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@context-labs/context7'],
    env: {
      ...process.env,
    },
    stderr: 'pipe',
  });
  
  // Monitor stderr
  if (transport.stderr) {
    transport.stderr.on('data', (data) => {
      console.error('Context7 stderr:', data.toString());
    });
  }
  
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );
  
  try {
    console.log('1. Connecting to Context7...');
    await client.connect(transport);
    console.log('✓ Connected successfully\n');
    
    console.log('2. Getting server info...');
    const serverInfo = await client.getServerInfo();
    console.log('Server info:', JSON.stringify(serverInfo, null, 2), '\n');
    
    console.log('3. Listing tools...');
    try {
      const toolsResponse = await client.listTools();
      console.log('Tools response:', JSON.stringify(toolsResponse, null, 2));
      
      if (toolsResponse.tools && toolsResponse.tools.length > 0) {
        console.log(`\n✓ Found ${toolsResponse.tools.length} tools:`);
        toolsResponse.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
        });
      } else {
        console.log('✗ No tools found');
      }
    } catch (toolsError) {
      console.error('✗ Error listing tools:', toolsError.message);
      if (toolsError.message.includes('Method not found')) {
        console.log('  → Server does not support tool listing');
      }
    }
    
    console.log('\n4. Listing resources...');
    try {
      const resourcesResponse = await client.listResources();
      console.log('Resources response:', JSON.stringify(resourcesResponse, null, 2));
      
      if (resourcesResponse.resources && resourcesResponse.resources.length > 0) {
        console.log(`\n✓ Found ${resourcesResponse.resources.length} resources`);
      } else {
        console.log('✗ No resources found');
      }
    } catch (resourcesError) {
      console.error('✗ Error listing resources:', resourcesError.message);
      if (resourcesError.message.includes('Method not found')) {
        console.log('  → Server does not support resource listing');
      }
    }
    
    console.log('\n5. Testing known Context7 operations...');
    
    // Try searching for React
    console.log('\nTrying to search for "React"...');
    try {
      const searchResult = await client.callTool({
        name: 'search',
        arguments: { query: 'React' }
      });
      console.log('Search result:', JSON.stringify(searchResult, null, 2));
    } catch (searchError) {
      console.error('Search failed:', searchError.message);
    }
    
    // Try getting docs for React
    console.log('\nTrying to get React documentation...');
    try {
      const docsResult = await client.callTool({
        name: 'docs',
        arguments: { library: 'react' }
      });
      console.log('Docs result:', JSON.stringify(docsResult, null, 2));
    } catch (docsError) {
      console.error('Docs failed:', docsError.message);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    console.log('\nClosing connection...');
    await client.close();
    await transport.close();
    console.log('✓ Connection closed');
  }
}

testContext7().catch(console.error);