# MCP Tool Awareness Fix

## Problem
The MCP servers were connecting successfully in one API call but appearing disconnected in subsequent calls. This was because Next.js API routes run in isolation, and the connection state wasn't persisting between different API endpoints.

## Solution Implemented

### 1. Just-In-Time Connection
Updated `/lib/mcp/mcp-tools-context.ts` to automatically connect to servers when needed:
- When getting available tools, disconnected servers are automatically connected
- Connection happens on-demand, ensuring tools are always available
- No need for pre-emptive connections that might be lost

### 2. Simplified Initialization
Modified `/api/mcp/init/route.ts` to only load configurations:
- Loads server configurations without connecting
- Returns server information for UI display
- Actual connections happen when tools are needed

### 3. Enhanced System Prompt
Improved the tool awareness prompt in `/lib/mcp/mcp-tools-context.ts`:
- More explicit instructions for the AI to use tools
- Shows parameter details for each tool
- Includes examples of when to use tools
- Emphasizes that tools MUST be used when relevant

## Testing

Run the test script to verify the integration:

```bash
./test-mcp-tools.sh
```

This script tests:
1. MCP initialization endpoint
2. Server connection status
3. Tool-triggering chat prompts
4. Context7 documentation queries

## How It Works

1. When the app starts or receives first chat request, all configured MCP servers auto-connect
2. The chat API fetches available tools from connected servers
3. Tool information is prepended to the user's message as a system prompt
4. The AI sees available tools and instructions on how to use them
5. When the AI includes `[TOOL_CALL]` markers, they are executed automatically

## Example Usage

With the context7 server connected, you can now ask questions like:
- "Tell me about the React library"
- "What is Express.js used for?"
- "Show me documentation for Vue.js"

The AI will automatically use the context7 tools to fetch relevant information.

## Troubleshooting

If tools aren't working:
1. Check server logs for connection errors
2. Verify the server is properly configured in `mcp.config.json`
3. Ensure the server process can be spawned (for stdio) or is accessible (for HTTP)
4. Run `npm run dev` and check console logs for MCP-related messages