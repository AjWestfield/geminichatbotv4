# MCP Integration Guide - Settings Based

## Overview

The Model Context Protocol (MCP) is now integrated directly into the Gemini Chatbot settings. This allows the AI assistant to use external tools and capabilities through MCP servers, all managed through the familiar settings interface.

## Accessing MCP Settings

1. Click the **Settings** button (⚙️) in the chat header
2. Navigate to the **MCP Servers** tab
3. Here you can:
   - Import MCP server configurations
   - Add servers manually
   - Manage existing servers
   - Connect/disconnect servers

## Adding MCP Servers

### Method 1: Intelligent JSON Import ✨

The easiest way to add MCP servers is through our intelligent JSON import that auto-detects and handles multiple configuration formats:

**Key Features:**
- 🎯 Auto-detects configuration format
- 🚀 Automatically connects servers after import
- 📋 Supports all standard MCP formats
- 🔍 Shows real-time connection status
- 🔧 Displays available tools for each server

**Supported Formats:**
```json
// Claude Desktop format
{
  "mcpServers": {
    "calculator": {
      "command": "node",
      "args": ["example-servers/calculator/dist/index.js"]
    }
  }
}

// Array format
[
  {
    "name": "Calculator",
    "command": "node",
    "args": ["example-servers/calculator/dist/index.js"]
  }
]

// NPX shorthand
{
  "name": "GitHub",
  "package": "@modelcontextprotocol/server-github",
  "env": { "GITHUB_TOKEN": "your-token" }
}
```

The intelligent parser will automatically detect your format and import servers correctly. See [MCP_JSON_IMPORT_GUIDE.md](./MCP_JSON_IMPORT_GUIDE.md) for all supported formats and examples.

### Method 2: Load from File

1. Click "Load from File" button
2. Select a `.json` file containing server configuration
3. Review the configuration in the text area
4. Click "Import JSON"

### Method 3: Manual Entry

1. Enter the server name
2. Enter the command (e.g., `node`, `python`, `npx`)
3. Click "Add Server"

## Using MCP Tools with AI

Once servers are connected, the AI assistant automatically gains access to their tools. You can:

1. **Ask directly**: "Can you calculate 15 * 23 for me?"
   - The AI will automatically use the calculator tool if connected

2. **Request specific tools**: "Use the file system tool to list files in /tmp"
   - The AI will use the specific tool mentioned

3. **Complex workflows**: "Read the data.json file and calculate the sum of all values"
   - The AI can chain multiple tools together

## Example Interactions

### With Calculator Server Connected:
```
User: What's 123 * 456?
AI: I'll calculate that for you using the calculator tool.

[TOOL_CALL]
{
  "tool": "multiply",
  "server": "calculator-example",
  "arguments": {
    "a": 123,
    "b": 456
  }
}
[/TOOL_CALL]

The result is: 123 × 456 = 56,088
```

### With File System Server Connected:
```
User: What files are in my downloads folder?
AI: I'll check your downloads folder for you.

[TOOL_CALL]
{
  "tool": "list_directory",
  "server": "filesystem-example",
  "arguments": {
    "path": "/Users/you/Downloads"
  }
}
[/TOOL_CALL]

Here are the files in your downloads folder:
- document.pdf
- image.png
- data.csv
```

## Pre-configured Example Servers

### Calculator Server

Already included in the project:
```bash
# Setup
cd example-servers/calculator
npm install
npm run build

# Configuration
{
  "name": "Calculator",
  "command": "node",
  "args": ["example-servers/calculator/dist/index.js"]
}
```

### Official MCP Servers

You can use official MCP servers via npx:

1. **File System Access**
```json
{
  "name": "File System",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allow"]
}
```

2. **SQLite Database**
```json
{
  "name": "SQLite",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "path/to/database.db"]
}
```

3. **GitHub Integration**
```json
{
  "name": "GitHub",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
  }
}
```

## Server Management

### Connecting/Disconnecting

- **Green Play Button**: Connect to server
- **Red Square Button**: Disconnect from server
- **Trash Button**: Remove server (only when disconnected)

### Server Status & Visual Indicators

- **✅ Connected** (green checkmark + badge): Server is active and tools are available
- **🔄 Connecting** (yellow spinner): Server is starting up
- **❌ Error** (red alert): Server failed to start (error message shown)
- **⚫ Disconnected**: Server is configured but not running
- **🔧 Tool Count** (expandable badge): Shows number of available tools - click to view all tools

## Persistent Configuration

All MCP server configurations are automatically saved and will persist across sessions. The configurations are stored in:
- Browser: LocalStorage (`mcp-config`)
- Server: `mcp.config.json` file (when using server-side)

## Security Considerations

1. **Command Execution**: MCP servers run commands on your system. Only add trusted servers.
2. **File System Access**: Be careful with file system servers - limit access to specific directories.
3. **Environment Variables**: Sensitive data like API keys should be handled securely.
4. **Network Access**: Some servers may make network requests - ensure you trust the server.

## Troubleshooting

### Server Won't Connect
- Check the command path is correct
- Ensure Node.js/Python/required runtime is installed
- Look for error messages in browser console
- Verify the server file exists and is executable

### Tools Not Working
- Ensure server shows "Connected" status
- Check if the AI mentions the tool in its response
- Verify tool parameters are correct
- Look for error messages in the response

### Import Failing
- Validate JSON syntax
- Ensure required fields (name, command) are present
- Check for typos in configuration

## Advanced Usage

### Custom Environment Variables
```json
{
  "name": "My API Server",
  "command": "node",
  "args": ["api-server.js"],
  "env": {
    "API_KEY": "your-key",
    "PORT": "3000",
    "DEBUG": "true"
  }
}
```

### Complex Arguments
```json
{
  "name": "Python Script",
  "command": "python",
  "args": [
    "-u",
    "script.py",
    "--config",
    "config.json",
    "--verbose"
  ]
}
```

## Creating Your Own MCP Server

See the [MCP documentation](https://modelcontextprotocol.io) for details on creating custom servers. Basic structure:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'my-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Define tools...

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Best Practices

1. **Start Simple**: Begin with the calculator example to understand the flow
2. **Test Locally**: Ensure servers work before adding to production
3. **Limit Scope**: Give servers only necessary permissions
4. **Monitor Usage**: Check what tools the AI is using
5. **Regular Updates**: Keep MCP servers updated for security

The MCP integration transforms your AI assistant into a powerful tool that can interact with your local system, databases, APIs, and more - all while maintaining the familiar chat interface!