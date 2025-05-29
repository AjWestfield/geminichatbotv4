# Fix for Tool Results Not Displaying

## Problem Summary
Tool results are not displaying in the UI because of a mismatch between how results are formatted on the server and parsed on the client.

## Quick Fix

### 1. Update the Tool Result Parser in `hooks/use-chat-with-tools.ts`

Find the section around line 140-170 where it looks for execution results and replace it with this more flexible parsing:

```typescript
// Look for execution result INSIDE the TOOL_CALL block
// Updated pattern to handle extra newlines and various formats
const execPatterns = [
  // Pattern 1: With completion marker
  /Tool executed successfully\.\s*\n+\s*({[\s\S]*?})\s*\n*\s*\[Tool execution completed/,
  // Pattern 2: Without completion marker
  /Tool executed successfully\.\s*\n+\s*({[\s\S]*?})/,
  // Pattern 3: With any content after success message
  /Tool executed successfully\.\s*\n+\s*([\s\S]*?)(?:\[Tool execution completed|$)/,
  // Pattern 4: Simple format
  /Tool executed successfully\.\s*\n\s*(.+)/
]

let resultFound = false
for (const pattern of execPatterns) {
  const execMatch = pattern.exec(toolCallContent)
  
  if (execMatch) {
    try {
      const capturedContent = execMatch[1].trim()
      
      // Try to parse as JSON first
      if (capturedContent.startsWith('{') || capturedContent.startsWith('[')) {
        const resultJson = extractJsonObject(capturedContent)
        if (resultJson) {
          toolCall.result = JSON.parse(resultJson)
          resultFound = true
          break
        }
      }
      
      // If not JSON or JSON parsing failed, check if it's formatted content
      // Look for MCP response format (array of content items)
      if (capturedContent.includes('"type"') && capturedContent.includes('"text"')) {
        // Try to extract just the array part
        const arrayMatch = capturedContent.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          try {
            toolCall.result = JSON.parse(arrayMatch[0])
            resultFound = true
            break
          } catch (e) {
            // Continue to next attempt
          }
        }
      }
      
      // Otherwise, use as plain text
      toolCall.result = capturedContent
      resultFound = true
      break
    } catch (e) {
      console.warn('Could not parse execution result:', e)
      // Try next pattern
    }
  }
}

if (!resultFound) {
  console.log('[parseToolCallsFromContent] No result found in TOOL_CALL block')
  // Set a default result to indicate execution completed
  toolCall.result = { message: "Tool executed but no result was captured" }
}
```

### 2. Alternative: Simplify Server-Side Formatting

If you prefer to fix it on the server side, update `lib/mcp/mcp-tools-context.ts` around line 230:

```typescript
static async executeToolCall(toolCall: {
  tool: string
  server: string
  arguments: any
}): Promise<string> {
  const serverManager = MCPServerManager.getInstance()
  
  try {
    // Find server by name instead of ID
    const servers = serverManager.getAllServers()
    const server = servers.find(s => s.config.name === toolCall.server)
    
    if (!server) {
      return `Error: Server '${toolCall.server}' not found or not connected`
    }
    
    const result = await serverManager.executeTool(
      server.config.id,
      toolCall.tool,
      toolCall.arguments
    )
    
    // Return a more consistent format
    // Change this line to use single newline for consistency
    return `Tool executed successfully.\n${JSON.stringify(result, null, 2)}`
  } catch (error) {
    return `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
```

### 3. Debug Logging (Optional)

Add this debug logging to see what's actually being received:

In `hooks/use-chat-with-tools.ts`, add after finding a TOOL_CALL block:

```typescript
console.log('[DEBUG] TOOL_CALL content:', {
  fullContent: toolCallContent,
  length: toolCallContent.length,
  hasSuccessMessage: toolCallContent.includes('Tool executed successfully'),
  contentAfterSuccess: toolCallContent.split('Tool executed successfully.')[1]?.substring(0, 200)
})
```

## Testing the Fix

1. Apply the changes above
2. Restart your development server
3. Try asking a question that triggers a tool call
4. Check the browser console for debug logs
5. The tool results should now appear in the UI

## Additional Improvements

For a more robust solution, consider:

1. **Standardize the communication format** between server and client
2. **Use a proper protocol** for tool results (e.g., structured JSON messages)
3. **Add error recovery** for malformed results
4. **Include result type information** to handle different result formats better

## Quick Test

After applying the fix, try this query:
"What is veo 3?"

You should see:
- The tool call animation
- The completed tool call with results
- The AI's analysis of the results
