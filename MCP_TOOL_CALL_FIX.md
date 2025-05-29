# MCP Tool Call Fix

## Problems Identified

1. **Server Name Mismatch**: The system prompt was appending " Server:" to server names (e.g., "Context7 Server:"), causing the AI to use incorrect server names in tool calls.

2. **Premature Tool Call Parsing**: Tool calls were being parsed and executed before the complete JSON was received during streaming, causing parsing errors.

## Solutions Implemented

### 1. Fixed System Prompt Generation
**File**: `/lib/mcp/mcp-tools-context.ts`

Changed from:
```typescript
prompt += `**${serverName} Server:**\n`
```

To:
```typescript
prompt += `**Server: ${serverName}**\n`
```

This ensures the AI understands that "Context7" is the server name, not "Context7 Server".

### 2. Fixed Streaming Tool Call Detection
**File**: `/app/api/chat/route.ts`

- Added complete tool call detection using regex that ensures both `[TOOL_CALL]` and `[/TOOL_CALL]` tags are present
- Added a Set to track processed tool calls to avoid duplicate executions
- Added proper error handling for tool execution failures
- Tool calls are now only parsed when complete

### 3. Added Debug Logging
**File**: `/lib/mcp/mcp-tools-context.ts`

Added logging to help debug tool call parsing issues:
- Logs the raw JSON being parsed
- Logs the parsed tool call object
- Logs parsing errors with the problematic content

## Testing

Run the test script to verify the fix:

```bash
./test-context7-fix.sh
```

This script will:
1. Check MCP server status
2. Test Next.js documentation query with Context7
3. Test React hooks query with Context7

## Expected Behavior

When you ask the AI to use Context7, it should:

1. Generate a proper tool call with the correct server name:
```json
{
  "tool": "resolve-library-id",
  "server": "Context7",
  "arguments": {
    "libraryName": "next.js"
  }
}
```

2. Wait for the complete tool call before executing
3. Execute the tool and show results
4. Continue with additional tool calls if needed (e.g., `get-library-docs`)

## Example Working Query

```
User: "Use the context7 MCP to get the latest docs on next.js"

AI: 
1. Calls resolve-library-id to find Next.js library ID
2. Calls get-library-docs with the resolved ID
3. Presents the documentation to the user
```