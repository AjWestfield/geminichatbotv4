# Fix: Tool Shows Completed Immediately with No Results

## Root Cause

The tool is showing as "completed" immediately because:

1. **Client-side parsing issue**: In `hooks/use-chat-with-tools.ts` line 126, tools are marked as `status: 'completed'` as soon as they're parsed from the AI's response
2. **Incorrect assumption**: The code assumes execution already happened, but it's just parsing the tool declaration
3. **No result capture**: The actual execution happens server-side later, but results aren't properly associated with the tool

## The Flow Problem

Current (broken) flow:
1. AI outputs `[TOOL_CALL]` → Client parses and marks as "completed" ❌
2. Server executes tool → Sends results
3. Client has already processed it, results are lost

Expected flow:
1. AI outputs `[TOOL_CALL]` → Client marks as "executing" ✓
2. Server executes tool → Sends results with tool ID
3. Client updates tool to "completed" with results ✓

## Complete Fix

### 1. Fix Initial Status in `hooks/use-chat-with-tools.ts`

Around line 126, change:
```typescript
const toolCall: MCPToolCall = {
  id: `tool-${Date.now()}-${Math.random()}`,
  tool: toolMatch[1],
  server: serverMatch[1],
  status: 'completed', // ❌ WRONG
  isExpanded: false,
  timestamp: Date.now()
}
```

To:
```typescript
const toolCall: MCPToolCall = {
  id: `tool-${Date.now()}-${Math.random()}`,
  tool: toolMatch[1],
  server: serverMatch[1],
  status: 'executing', // ✓ Start as executing
  isExpanded: false,
  timestamp: Date.now(),
  result: undefined // Explicitly no result yet
}
```

### 2. Update Parser to Handle Execution Results

In the same file, update the section that looks for execution results (around line 140-170):

```typescript
// Remove this entire section that tries to find results in the TOOL_CALL block
// because results come AFTER in a separate message

// Instead, just parse the tool declaration
toolCalls.push(toolCall)
console.log('[parseToolCallsFromContent] Found tool declaration:', {
  tool: toolCall.tool,
  server: toolCall.server,
  status: toolCall.status
})
```

### 3. Add New Function to Parse Execution Results

Add this new function in `hooks/use-chat-with-tools.ts`:

```typescript
// Parse tool execution results from content
function parseToolExecutionResults(content: string, existingToolCalls: MCPToolCall[]): MCPToolCall[] {
  // Pattern to find execution results
  const execPattern = /Executing tool:\s*([^\n]+)\nTool executed successfully\.\n([\s\S]*?)\n\[Tool execution completed/g
  
  const updatedCalls = [...existingToolCalls]
  let match
  
  while ((match = execPattern.exec(content)) !== null) {
    const toolName = match[1].trim()
    const result = match[2].trim()
    
    // Find the matching tool call
    const toolIndex = updatedCalls.findIndex(tc => 
      tc.tool === toolName && tc.status === 'executing'
    )
    
    if (toolIndex !== -1) {
      // Update to completed with results
      updatedCalls[toolIndex] = {
        ...updatedCalls[toolIndex],
        status: 'completed',
        result: result,
        duration: Date.now() - updatedCalls[toolIndex].timestamp
      }
      
      console.log('[parseToolExecutionResults] Updated tool to completed:', {
        tool: toolName,
        hasResult: true
      })
    }
  }
  
  return updatedCalls
}
```

### 4. Update Message Processing

In the `processMessagesWithTools` function, update to handle both declarations and results:

```typescript
function processMessagesWithTools(messages: Message[]): MessageWithTools[] {
  return messages.map((msg, index) => {
    // First, parse tool declarations
    let toolCalls = parseToolCallsFromContent(msg.content)
    
    // Then, look for execution results in this or previous messages
    if (index > 0) {
      // Check previous messages for execution results
      const previousContent = messages.slice(0, index + 1)
        .map(m => m.content)
        .join('\n')
      
      toolCalls = parseToolExecutionResults(previousContent, toolCalls)
    }
    
    // Clean content
    const cleanedContent = toolCalls.length > 0 
      ? stripToolCallsFromContent(msg.content)
      : msg.content
    
    return {
      ...msg,
      content: cleanedContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    }
  })
}
```

## Quick Test Fix

For a quick test, just change line 126 from `status: 'completed'` to `status: 'executing'` and add this console log after line 140:

```typescript
console.log('[DEBUG] Tool call parsed:', {
  tool: toolCall.tool,
  server: toolCall.server,
  status: toolCall.status,
  hasResult: !!toolCall.result
})
```

This will at least show the tool as "executing" instead of immediately completed.

## Summary

The main issue is that tools are marked as "completed" when they're just declared. The fix:
1. Mark tools as "executing" initially
2. Parse execution results separately
3. Update tools to "completed" when results arrive
4. Properly display the results

This requires restructuring how tool calls and their results are parsed from the message stream.
