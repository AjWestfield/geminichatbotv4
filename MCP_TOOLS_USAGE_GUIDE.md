# MCP Tools Usage Guide

## Current Implementation Status ✅

The MCP tools integration is **fully implemented** in your chat application! Here's what's working:

### 1. **Tool Discovery** ✅
- Tools are automatically discovered from connected MCP servers
- The list updates when servers connect/disconnect
- Tools are cached in the MCPServerManager

### 2. **AI Awareness** ✅
- The AI receives a system prompt listing all available MCP tools
- Tools are grouped by server for clarity
- The prompt includes tool descriptions and usage instructions

### 3. **Tool Execution** ✅
- The chat API detects tool calls in the AI's responses
- Tools are executed automatically
- Results are streamed back to the chat interface

### 4. **Error Handling** ✅
- Graceful handling of disconnected servers
- Clear error messages for failed tool calls
- No crashes on invalid tool requests

## How It Works

### 1. System Prompt Generation
When you send a message, the system:
```typescript
// Gets available tools from all connected servers
const toolsContext = await MCPToolsContext.getAvailableTools()

// Prepends tool information to your message
finalMessageContent = toolsContext.systemPrompt + "\n\n" + messageContent
```

### 2. Tool Call Format
The AI will respond with tool calls in this format:
```
I'll help you find React documentation using context7.

[TOOL_CALL]
{
  "tool": "get-library-docs",
  "server": "context7",
  "arguments": {
    "library": "react",
    "topic": "hooks"
  }
}
[/TOOL_CALL]
```

### 3. Automatic Execution
The chat API automatically:
- Detects the tool call pattern
- Finds the correct server by name
- Executes the tool with provided arguments
- Streams the results back to the chat

## Testing MCP Tools

### Step 1: Connect Context7
1. Go to Settings → MCP Servers
2. Click on the disconnected Context7 server
3. Click "Connect" to establish connection
4. You should see "Connected" status

### Step 2: Test with AI
Try these prompts:
```
"What MCP tools do you have available?"
"Use context7 to get React hooks documentation"
"Find information about Next.js routing using available tools"
"Use any available tools to explain Tailwind CSS utilities"
```

### Step 3: Watch the Magic
- The AI will explain what it's doing
- You'll see the tool call in the response
- The tool result will appear automatically
- The AI will then explain the results

## Troubleshooting

### Context7 Not Connecting?
1. Check console for errors
2. Try removing and re-adding the server
3. Ensure no firewall blocks HTTPS to server.smithery.ai

### AI Not Using Tools?
1. Make sure the server shows "Connected" status
2. Be explicit: "Use context7 to..."
3. Check if tools are listed: "What MCP tools are available?"

### Tool Execution Failing?
- Check server connection status
- Verify tool arguments in the AI's response
- Look for error messages in the chat

## Advanced Usage

### Multiple Tool Calls
The AI can use multiple tools in one response:
```
"Use context7 to compare React hooks with Vue composition API"
```

### Tool Chaining
The AI can use results from one tool to inform another:
```
"Find the latest React version, then get documentation for its newest features"
```

## Implementation Details

### Files Involved:
- `/app/api/chat/route.ts` - Injects tool context, detects and executes tool calls
- `/lib/mcp/mcp-tools-context.ts` - Manages tool discovery and formatting
- `/lib/mcp/mcp-server-manager.ts` - Handles server connections and tool execution
- `/components/chat-message.tsx` - Displays tool results (already shows them as part of message)

### Key Features:
- **Streaming Support**: Tool results stream back in real-time
- **Server Name Resolution**: Uses friendly server names instead of IDs
- **Automatic Formatting**: Tool results are formatted for readability
- **Error Recovery**: Graceful handling of tool failures

## Next Steps

1. **Connect More MCP Servers**: Try adding filesystem, GitHub, or other MCP servers
2. **Create Custom Tools**: Build your own MCP server with specialized tools
3. **Enhance UI**: Add visual indicators for tool usage (optional)

The implementation is complete and ready to use! Just make sure your MCP servers are connected and start chatting. 🚀