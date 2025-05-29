# MCP Integration Usage Guide

## Overview

The Model Context Protocol (MCP) integration allows you to extend your AI chatbot with custom tools and capabilities by connecting to MCP servers. This guide will help you get started with using MCP servers in your application.

## Quick Start

### 1. Setup the Example Calculator Server

First, let's set up the included calculator example:

```bash
# Run the setup script
npm run setup-mcp-example

# Or manually:
cd example-servers/calculator
npm install
npm run build
```

### 2. Start Your Application

```bash
npm run dev
```

### 3. Add the Calculator Server

1. Navigate to http://localhost:3000
2. Look for the **MCP Servers** panel on the left side
3. Click **"Add MCP Server"**
4. Fill in the form:
   - **Name**: Calculator
   - **Command**: `node`
   - **Arguments**: (paste the full path)
     ```
     /path/to/your/project/example-servers/calculator/dist/index.js
     ```
5. Click **"Add Server"**

### 4. Connect to the Server

1. In the MCP Servers list, find your Calculator server
2. Click the **Play** button to connect
3. Wait for the status to show **"Connected"**

### 5. Use the Tools

1. Switch to the **Tools** tab in the MCP panel
2. You'll see available calculator tools:
   - add, subtract, multiply, divide, sqrt, power
3. Click on any tool to expand it
4. Enter the required parameters
5. Click **Execute**
6. Results will appear in the chat interface

## Creating Your Own MCP Server

### Basic Server Structure

```typescript
// my-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define your tools
const TOOLS = [
  {
    name: 'my_tool',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'First parameter' },
      },
      required: ['param1'],
    },
  },
];

// Handle tool listing
server.setRequestHandler('tools/list', async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'my_tool') {
    // Your tool logic here
    return {
      content: [{
        type: 'text',
        text: `Result: ${args.param1}`,
      }],
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Package Configuration

```json
{
  "name": "my-mcp-server",
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

## Advanced Features

### Environment Variables

You can pass environment variables to your MCP server:

```
NODE_ENV=production
API_KEY=your-secret-key
DATABASE_URL=postgresql://...
```

### Server Arguments

Pass command-line arguments to your server:

```
--port
3000
--verbose
--config
/path/to/config.json
```

### Tool Input Validation

MCP servers automatically validate tool inputs based on your schema:

```typescript
inputSchema: {
  type: 'object',
  properties: {
    number: { 
      type: 'number', 
      minimum: 0,
      maximum: 100
    },
    choice: {
      type: 'string',
      enum: ['option1', 'option2', 'option3']
    }
  },
  required: ['number']
}
```

## Troubleshooting

### Server Won't Connect

1. Check that the command path is correct
2. Ensure the server file is executable
3. Check server logs in the browser console
4. Verify Node.js is installed and accessible

### Tools Not Showing

1. Ensure your server implements the `tools/list` handler
2. Check that the server status is "Connected"
3. Refresh the tools list by switching tabs

### Execution Errors

1. Check tool parameter validation
2. Look for error messages in the chat
3. Check browser console for detailed errors
4. Ensure server handles errors gracefully

## Best Practices

1. **Error Handling**: Always wrap tool execution in try-catch blocks
2. **Validation**: Use JSON Schema for robust input validation
3. **Documentation**: Provide clear descriptions for tools and parameters
4. **Security**: Never expose sensitive operations without authentication
5. **Performance**: Keep tool execution fast (< 30 seconds)

## Example Use Cases

### Database Query Tool
```typescript
{
  name: 'query_database',
  description: 'Execute a SQL query',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL query to execute' },
      database: { type: 'string', enum: ['users', 'products', 'orders'] }
    },
    required: ['query', 'database']
  }
}
```

### File System Tool
```typescript
{
  name: 'read_file',
  description: 'Read contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
      encoding: { type: 'string', default: 'utf8' }
    },
    required: ['path']
  }
}
```

### API Integration Tool
```typescript
{
  name: 'fetch_weather',
  description: 'Get weather for a location',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['metric', 'imperial'], default: 'metric' }
    },
    required: ['city']
  }
}
```

## Next Steps

1. Explore the [MCP Specification](https://modelcontextprotocol.io)
2. Browse [example MCP servers](https://github.com/modelcontextprotocol/servers)
3. Create custom tools for your specific needs
4. Share your MCP servers with the community

Happy building with MCP! 🚀