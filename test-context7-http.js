#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function testContext7HTTP() {
  console.log('Testing Context7 MCP server via HTTP...\n');
  
  const url = new URL('https://mcp.context7.com/mcp');
  
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: {
      headers: {
        'User-Agent': 'gemini-chatbot-v2/1.0.0'
      }
    }
  });
  
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
    console.log('1. Connecting to Context7 HTTP endpoint...');
    await client.connect(transport);
    console.log('✓ Connected successfully\n');
    
    console.log('2. Getting server info...');
    try {
      const serverInfo = await client.getServerInfo();
      console.log('Server info:', JSON.stringify(serverInfo, null, 2), '\n');
    } catch (e) {
      console.log('Server info not available:', e.message);
    }
    
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
    }
    
    console.log('\n4. Listing resources...');
    try {
      const resourcesResponse = await client.listResources();
      console.log('Resources response:', JSON.stringify(resourcesResponse, null, 2));
    } catch (resourcesError) {
      console.error('✗ Error listing resources:', resourcesError.message);
    }
    
    console.log('\n5. Testing search operation...');
    try {
      const searchResult = await client.callTool({
        name: 'search',
        arguments: { query: 'React' }
      });
      console.log('Search result:', JSON.stringify(searchResult, null, 2).substring(0, 500) + '...');
    } catch (searchError) {
      console.error('Search failed:', searchError.message);
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

testContext7HTTP().catch(console.error);