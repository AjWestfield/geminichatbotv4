# MCP Tool Display - Quick Fix Action Plan

## 🚨 Priority Fix Required

The MCP tool components are created but **not rendering**. Tool results still show as raw JSON.

## 🎯 Immediate Actions

### 1. Debug Current State (5 mins)
Add these console logs to `components/chat-interface.tsx`:
```tsx
console.log('Messages from useChatWithTools:', messages);
messages.forEach((msg, i) => {
  if (msg.toolCalls) {
    console.log(`Message ${i} has tool calls:`, msg.toolCalls);
  }
});
```

### 2. Fix Pattern Matching (10 mins)
In `hooks/use-chat-with-tools.ts`, the regex needs to match the EXACT format:

**Current AI Output Format:**
```
[TOOL_CALL]
{
  "tool": "web_search_exa",
  "server": "Exa",
  "arguments": {
    "query": "latest news in AI",
    "numResults": 5
  }
}
[/TOOL_CALL]

Executing tool: web_search_exa
Tool executed successfully.
Tool executed successfully.

{JSON_RESULTS}

[Tool execution completed...]
```

**Fix the regex patterns** to match this format exactly.

### 3. Verify Component Rendering (5 mins)
In `components/chat-message.tsx`, ensure this section exists and works:
```tsx
{/* Render MCP tool calls below the message */}
{message.toolCalls && message.toolCalls.length > 0 && (
  <div className={cn("mt-2", isUser ? "pr-4" : "pl-4")}>
    <AnimatePresence mode="wait">
      {message.toolCalls.map((toolCall) => (
        // Components should render here
      ))}
    </AnimatePresence>
  </div>
)}
```

## 🧪 Quick Test

1. Copy `debug-mcp-parsing.js` content to browser console
2. Run the test functions
3. Check if parsing works correctly

## ⚡ Most Likely Issue

The `stripToolCallsFromContent` regex doesn't match the actual format. The "Tool executed successfully." appears twice, and there might be extra whitespace.

## 📍 Focus Areas

1. **`hooks/use-chat-with-tools.ts`** - Fix regex patterns
2. **`components/chat-message.tsx`** - Verify rendering logic
3. **Browser Console** - Check for parsing errors

## ✅ Success Check

When fixed, you should see:
- No JSON in chat messages
- Collapsible cards for tool results  
- Clean AI analysis text only

The components are ready - they just need the data flow fixed!
