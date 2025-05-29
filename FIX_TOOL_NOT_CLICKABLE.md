# Fix: Tool Not Clickable/Expandable

## Root Cause

The tool stays in "executing" state forever because:
1. Tool status is set once during parsing and never updated
2. When results arrive, there's no mechanism to update the tool from 'executing' to 'completed'
3. Only 'completed' tools show the clickable MCPToolResult component
4. 'Executing' tools show MCPToolAnimation which has no click handling

## The Fix

We need to update the message processing to check for execution results and update tool status accordingly.

### 1. Update `processMessagesWithTools` in `hooks/use-chat-with-tools.ts`

Replace the current function with this enhanced version that tracks execution results:

```typescript
// Process messages to extract tool calls and update their status
function processMessagesWithTools(messages: Message[]): MessageWithTools[] {
  const processedMessages: MessageWithTools[] = []
  const toolExecutions = new Map<string, { messageIndex: number, toolIndex: number }>()
  
  // First pass: parse tool declarations and track them
  messages.forEach((msg, msgIndex) => {
    const toolCalls = parseToolCallsFromContent(msg.content)
    
    // Track executing tools
    toolCalls.forEach((tool, toolIndex) => {
      if (tool.status === 'executing') {
        const key = `${tool.tool}:${tool.server}`
        toolExecutions.set(key, { messageIndex: msgIndex, toolIndex })
      }
    })
    
    const cleanedContent = toolCalls.length > 0 
      ? stripToolCallsFromContent(msg.content)
      : msg.content
    
    processedMessages.push({
      ...msg,
      content: cleanedContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    })
  })
  
  // Second pass: look for execution results and update tool status
  messages.forEach((msg, msgIndex) => {
    // Look for execution results in the message
    const execPattern = /Executing tool:\s*([^\n]+)\s+on\s+([^\n]+)\nTool executed successfully\.([\s\S]*?)\[Tool execution completed/g
    let match
    
    while ((match = execPattern.exec(msg.content)) !== null) {
      const [, toolName, serverName, resultContent] = match
      const key = `${toolName.trim()}:${serverName.trim()}`
      
      // Find the corresponding executing tool
      const toolLocation = toolExecutions.get(key)
      if (toolLocation && toolLocation.messageIndex <= msgIndex) {
        const targetMsg = processedMessages[toolLocation.messageIndex]
        if (targetMsg.toolCalls && targetMsg.toolCalls[toolLocation.toolIndex]) {
          // Update the tool status to completed
          targetMsg.toolCalls[toolLocation.toolIndex] = {
            ...targetMsg.toolCalls[toolLocation.toolIndex],
            status: 'completed',
            result: resultContent.trim(),
            duration: Date.now() - targetMsg.toolCalls[toolLocation.toolIndex].timestamp
          }
          
          // Remove from tracking
          toolExecutions.delete(key)
        }
      }
    }
  })
  
  return processedMessages
}
```

### 2. Add Fallback Click Handler for Executing Tools

As a temporary measure, make the MCPToolAnimation clickable to show partial results. In `components/mcp-tool-animation.tsx`:

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'

interface MCPToolAnimationProps {
  tool: string
  server: string
}

export function MCPToolAnimation({ tool, server }: MCPToolAnimationProps) {
  const handleClick = () => {
    toast.info(`${tool} is currently executing on ${server}. Results will appear when complete.`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mb-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
      onClick={handleClick}
    >
      {/* Rest of the component remains the same */}
    </motion.div>
  )
}
```

### 3. Quick Alternative: Force Tools to Show as Completed

If you need a quick fix to make tools clickable immediately, in `hooks/use-chat-with-tools.ts` around line 126:

Change:
```typescript
status: 'executing', // Tool declaration found, execution pending
```

Back to:
```typescript
status: 'completed', // Show as completed to enable clicking
```

And ensure the tool has some default result:
```typescript
result: 'Waiting for results...', // Default result
```

This will make tools immediately clickable but may show incomplete results.

## Testing

1. Apply the fix
2. Restart dev server
3. Ask "What is the latest news about AI?"
4. The tool should:
   - Start as "executing" with animation
   - Update to "completed" when results arrive
   - Be clickable to expand/collapse results

## Summary

The main issue is that tool status is never updated from 'executing' to 'completed'. The fix adds logic to:
1. Track executing tools
2. Find execution results in subsequent messages
3. Update tool status to 'completed' with results
4. This triggers UI to show clickable MCPToolResult component
