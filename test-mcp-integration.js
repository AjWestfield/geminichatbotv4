#!/usr/bin/env node

import { MCPServerManager } from './lib/mcp/mcp-server-manager.js';
import { MCPToolsContext } from './lib/mcp/mcp-tools-context.js';

async function testMCPIntegration() {
  console.log('Testing MCP Integration...\n');
  
  try {
    // Get server manager instance
    const serverManager = MCPServerManager.getInstance();
    
    // Load configuration
    console.log('1. Loading configuration...');
    await serverManager.loadFromConfig();
    
    // Get all servers
    const servers = serverManager.getAllServers();
    console.log(`Found ${servers.length} servers:`, servers.map(s => ({
      id: s.config.id,
      name: s.config.name,
      status: s.status,
      transportType: s.config.transportType || 'stdio'
    })));
    
    // Connect to Context7 if not connected
    const context7 = servers.find(s => s.config.name === 'context7');
    if (context7 && context7.status !== 'connected') {
      console.log('\n2. Connecting to Context7...');
      await serverManager.connectServer(context7.config.id);
      console.log('Connected!');
    }
    
    // Get tools context
    console.log('\n3. Getting tools context...');
    const toolsContext = await MCPToolsContext.getAvailableTools();
    console.log(`Found ${toolsContext.tools.length} tools`);
    
    if (toolsContext.tools.length > 0) {
      console.log('\nAvailable tools:');
      toolsContext.tools.forEach(tool => {
        console.log(`  - ${tool.serverName}:${tool.toolName}`);
        if (tool.description) {
          console.log(`    ${tool.description.substring(0, 100)}...`);
        }
      });
    }
    
    console.log('\n4. System prompt preview:');
    console.log(toolsContext.systemPrompt.substring(0, 500) + '...');
    
    // Test tool execution
    if (toolsContext.tools.length > 0) {
      console.log('\n5. Testing tool execution...');
      const resolveToolCall = {
        tool: 'resolve-library-id',
        server: 'context7',
        arguments: { libraryName: 'react' }
      };
      
      console.log('Executing:', resolveToolCall);
      const result = await MCPToolsContext.executeToolCall(resolveToolCall);
      console.log('Result:', result.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMCPIntegration().catch(console.error);