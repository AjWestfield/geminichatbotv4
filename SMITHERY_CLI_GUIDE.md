# Smithery CLI MCP Integration Guide

This guide explains how to use Smithery CLI MCP servers with the Gemini Chatbot v2 application, which now supports both stdio and HTTP-based MCP transports.

## What is Smithery CLI?

Smithery CLI is a hosted MCP server that provides various tools and capabilities over HTTP. Unlike traditional MCP servers that run locally and communicate via standard I/O, Smithery servers are hosted remotely and accessed via HTTP endpoints.

## Adding a Smithery CLI Server

### Method 1: Using the UI

1. Click "Add MCP Server" in the MCP panel
2. Enter a server name (e.g., "Smithery CLI")
3. Select "HTTP (Remote)" as the Transport Type
4. Enter the server URL: `https://server.smithery.ai/cli`
5. Enter your API key (if required)
6. Click "Add Server"

### Method 2: JSON Import

You can import Smithery CLI configurations using these formats:

#### Simple HTTP Server Format
```json
{
  "name": "Smithery CLI",
  "transportType": "http",
  "url": "https://server.smithery.ai/cli",
  "apiKey": "your-api-key-here"
}
```

#### Multiple Servers with Mixed Transports
```json
{
  "servers": [
    {
      "name": "Local Calculator",
      "command": "node",
      "args": ["calculator.js"]
    },
    {
      "name": "Smithery CLI",
      "transportType": "http",
      "url": "https://server.smithery.ai/cli",
      "apiKey": "your-api-key"
    }
  ]
}
```

## Troubleshooting

### "Fetch Failed" Error

If you encounter a "fetch failed" error when connecting to Smithery CLI:

1. **Check your API key**: Ensure your API key is correct and properly formatted
2. **Verify the URL**: Make sure the server URL is correct (https://server.smithery.ai/cli)
3. **Network issues**: Check if you can access the URL directly in your browser
4. **CORS/Proxy settings**: The server might have CORS restrictions. Try using a different network

### Connection Timeout

Smithery servers have a 2-minute inactivity timeout. The client will automatically attempt to reconnect if the connection is lost.

## How It Works

The updated MCP client now supports two transport types:

1. **stdio (Standard I/O)**: Traditional local MCP servers that communicate via stdin/stdout
2. **http (HTTP)**: Remote MCP servers like Smithery that communicate over HTTP with Server-Sent Events (SSE)

When you add a Smithery server, the client:
1. Creates a StreamableHTTPClientTransport instead of StdioClientTransport
2. Connects to the server URL with your API key
3. Sends commands via HTTP POST
4. Receives responses via Server-Sent Events (SSE)

## Example: Using Smithery CLI Tools

Once connected, you can use Smithery CLI tools in your chat:

```
User: "Use the Smithery CLI to help me with [task]"
```

The AI assistant will then have access to all tools provided by the Smithery CLI server.

## Security Notes

- API keys are stored locally in your browser's localStorage
- Never share your API key publicly
- Consider using environment variables for API keys in production

## Technical Details

The implementation uses the MCP SDK's `StreamableHTTPClientTransport` class, which implements the MCP Streamable HTTP transport specification. This allows for:

- Stateless HTTP connections
- Server-Sent Events for real-time updates
- Automatic reconnection with exponential backoff
- Session management with optional session IDs

For more information about the Model Context Protocol, visit the [official MCP documentation](https://modelcontextprotocol.io).