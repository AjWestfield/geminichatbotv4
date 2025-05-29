# Fix: Ensure Tool Results Display Before Analysis

## Current Problem

The tool execution and analysis happen too quickly in sequence:
1. Tool executes on server
2. Results and analysis are streamed together
3. Client doesn't have time to properly display tool results
4. Analysis appears before tool shows as completed

## Solution: Restructure the Flow

We need to modify `/app/api/chat/route.ts` to ensure proper sequencing:

### 1. First, send the original AI response with tool declaration

```typescript
// In the streaming section, first stream the AI's original response
for await (const chunk of result.stream) {
  const text = chunk.text()
  responseBuffer += text
  
  // Stream the original response including [TOOL_CALL] blocks
  const escapedText = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  
  controller.enqueue(encoder.encode(`0:"${escapedText}"\n`))
}
```

### 2. After streaming completes, process tool calls

```typescript
// After the AI response is complete, check for tool calls
const hasToolCalls = responseBuffer.includes('[TOOL_CALL]')

if (hasToolCalls) {
  // Add a delay to ensure client has processed the tool declaration
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const toolCallRegex = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g
  let match
  
  while ((match = toolCallRegex.exec(responseBuffer)) !== null) {
    const toolCall = MCPToolsContext.parseToolCall(match[0])
    
    if (toolCall) {
      try {
        // Send tool execution start message
        const startMessage = `\n\n[TOOL_EXECUTION_START:${toolCall.tool}:${toolCall.server}]\n`
        controller.enqueue(encoder.encode(`0:"${startMessage.replace(/\n/g, '\\n')}"\n`))
        
        // Execute the tool
        const toolResult = await MCPToolsContext.executeToolCall(toolCall)
        
        // Send tool execution complete message with results
        const completeMessage = `\n[TOOL_EXECUTION_COMPLETE:${toolCall.tool}:${toolCall.server}]\n${toolResult}\n[/TOOL_EXECUTION_COMPLETE]\n\n`
        controller.enqueue(encoder.encode(`0:"${completeMessage.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"\n`))
        
        // Add delay to ensure client displays results
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Now send analysis instruction
        const analysisPrompt = createAnalysisPrompt(toolCall, lastMessage.content)
        
        // Stream analysis header
        controller.enqueue(encoder.encode(`0:"\\n\\n🔍 **Analysis of Results**\\n\\n"\n`))
        
        // Get analysis from AI
        const analysisMessages = [{ text: `${toolResult}\n\n${analysisPrompt}` }]
        const analysisResult = await chat.sendMessageStream(analysisMessages)
        
        // Stream the analysis
        for await (const chunk of analysisResult.stream) {
          const text = chunk.text()
          const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
          controller.enqueue(encoder.encode(`0:"${escaped}"\n`))
        }
      } catch (error) {
        // Handle errors...
      }
    }
  }
}
```

### 3. Update Client-Side Parsing

In `hooks/use-chat-with-tools.ts`, add handlers for the new execution markers:

```typescript
function parseToolCallsFromContent(content: string): MCPToolCall[] {
  const toolCalls: MCPToolCall[] = []
  
  // First, parse tool declarations
  const declarationPattern = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g
  let match
  
  while ((match = declarationPattern.exec(content)) !== null) {
    const toolCallContent = match[1].trim()
    const toolMatch = toolCallContent.match(/"tool"\s*:\s*"([^"]+)"/)
    const serverMatch = toolCallContent.match(/"server"\s*:\s*"([^"]+)"/)
    
    if (toolMatch && serverMatch) {
      toolCalls.push({
        id: `tool-${Date.now()}-${Math.random()}`,
        tool: toolMatch[1],
        server: serverMatch[1],
        status: 'executing', // Start as executing
        isExpanded: false,
        timestamp: Date.now()
      })
    }
  }
  
  // Then, look for execution completions
  const completionPattern = /\[TOOL_EXECUTION_COMPLETE:([^:]+):([^\]]+)\]([\s\S]*?)\[\/TOOL_EXECUTION_COMPLETE\]/g
  
  while ((match = completionPattern.exec(content)) !== null) {
    const [, toolName, serverName, result] = match
    
    // Find matching tool call and update it
    const toolIndex = toolCalls.findIndex(
      tc => tc.tool === toolName.trim() && tc.server === serverName.trim() && tc.status === 'executing'
    )
    
    if (toolIndex !== -1) {
      toolCalls[toolIndex] = {
        ...toolCalls[toolIndex],
        status: 'completed',
        result: result.trim(),
        duration: Date.now() - toolCalls[toolIndex].timestamp
      }
    }
  }
  
  return toolCalls
}
```

### 4. Clean Content Properly

Update `stripToolCallsFromContent` to remove the new markers:

```typescript
function stripToolCallsFromContent(content: string): string {
  let cleaned = content
  
  // Remove tool declarations
  cleaned = cleaned.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '')
  
  // Remove execution markers
  cleaned = cleaned.replace(/\[TOOL_EXECUTION_START:[^\]]+\]/g, '')
  cleaned = cleaned.replace(/\[TOOL_EXECUTION_COMPLETE:[\s\S]*?\[\/TOOL_EXECUTION_COMPLETE\]/g, '')
  
  // Remove analysis header if needed
  cleaned = cleaned.replace(/🔍 \*\*Analysis of Results\*\*\n\n/g, '')
  
  return cleaned.trim()
}
```

## Benefits

1. **Clear sequence**: Declaration → Execution → Results → Analysis
2. **Proper UI updates**: Tool shows as executing, then completed with results
3. **User can see results**: Results are displayed before analysis begins
4. **Better UX**: Clear separation between tool output and AI analysis

## Implementation Steps

1. Update `/app/api/chat/route.ts` with the new flow
2. Update parsing in `hooks/use-chat-with-tools.ts`
3. Add timing delays to ensure smooth UI updates
4. Test with a tool-using query

This ensures that tool results are fully displayed in the UI before any analysis begins.
