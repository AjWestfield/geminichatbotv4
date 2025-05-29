# MCP Tool Display Implementation - Handoff Document

## 🎯 Objective
Fix the MCP tool display to show compact, collapsible components instead of raw JSON in chat messages.

## 📋 Current Issue
The implementation components have been created but are not being rendered properly. Tool results still appear as raw JSON in the chat instead of using the compact display components.

### What's Happening Now (❌ Wrong)
```
[TOOL_CALL]
{
  "tool": "web_search_exa",
  "server": "Exa",
  "arguments": {...}
}
[/TOOL_CALL]

Executing tool: web_search_exa
Tool executed successfully.
{
  "requestId": "...",
  "results": [...],
  // ... massive JSON blob
}
```

### What Should Happen (✅ Correct)
1. User message appears
2. AI response appears (clean, no JSON)
3. Loading animation shows during tool execution
4. Collapsible result card appears below message
5. AI analysis follows (no raw JSON visible)

## 🏗️ Architecture Overview

### Key Components Created
1. **`components/mcp-tool-result.tsx`** - Collapsible result display
2. **`components/mcp-tool-animation.tsx`** - Loading animation
3. **`hooks/use-chat-with-tools.ts`** - Parses and strips tool content
4. **`components/chat-message.tsx`** - Should render the components

### Data Flow
1. Message content → `parseToolCallsFromContent()` → Extract tool calls
2. Message content → `stripToolCallsFromContent()` → Remove JSON/tool text
3. Clean content + tool calls → `ChatMessage` component
4. `ChatMessage` renders text + tool components separately

## 🔍 Debugging Steps

### 1. Check Console Logs
Look for these debug messages:
- `[parseToolCallsFromContent]` - Should show tool parsing
- `[stripToolCallsFromContent]` - Should show content cleaning
- Tool call extraction logs

### 2. Verify Data Structure
In `chat-message.tsx`, add debugging:
```tsx
console.log('Message toolCalls:', message.toolCalls);
console.log('Message content:', message.content);
```

### 3. Key Issues to Fix

#### Issue 1: Tool Calls Not Being Extracted
**File**: `hooks/use-chat-with-tools.ts`
- The regex patterns may not match the actual format
- Check if `parseToolCallsFromContent` is finding tool calls
- Verify the tool call format matches what the AI is outputting

#### Issue 2: Content Not Being Stripped
**File**: `hooks/use-chat-with-tools.ts`
- `stripToolCallsFromContent` should remove ALL tool-related text
- The regex patterns need to match the exact format
- Should remove: `[TOOL_CALL]...`, `Executing tool:...`, JSON results

#### Issue 3: Components Not Rendering
**File**: `components/chat-message.tsx`
- Verify `message.toolCalls` is populated
- Check if components are being conditionally rendered
- Ensure proper import of components

## 🛠️ Fix Implementation Guide

### Step 1: Fix Tool Call Parsing
In `hooks/use-chat-with-tools.ts`, update the parsing logic:

```typescript
// The current format seems to be:
// [TOOL_CALL]
// {
//   "tool": "web_search_exa",
//   "server": "Exa",
//   "arguments": {...}
// }
// [/TOOL_CALL]
//
// Executing tool: web_search_exa
// Tool executed successfully.
// {JSON results}
```

Ensure the regex patterns match this exact format.

### Step 2: Fix Content Stripping
The `stripToolCallsFromContent` function needs to:
1. Remove `[TOOL_CALL]...[/TOOL_CALL]` blocks
2. Remove `Executing tool:` lines
3. Remove `Tool executed successfully.` lines
4. Remove the JSON results that follow
5. Remove `[Tool execution completed...]` markers

### Step 3: Verify Component Rendering
In `components/chat-message.tsx`:
1. Ensure `message.toolCalls` is being checked
2. Components should render OUTSIDE the message bubble
3. Use proper conditional rendering

### Step 4: Update Message Processing
The `processMessagesWithTools` function should:
1. Extract all tool calls from content
2. Strip all tool-related content
3. Return clean message + tool calls array

## 📝 Testing Instructions

1. **Start Dev Server**: `npm run dev`
2. **Open Console**: Watch for debug logs
3. **Test Query**: "what is the latest news in ai?"
4. **Expected Result**:
   - Clean AI message (no JSON)
   - Collapsible tool result card
   - AI analysis of results

## 🎨 Visual Reference

### Collapsed State
```
┌─────────────────────────────────────┐
│ ✓ Completed • web_search_exa • Exa │
│ 2 seconds ago (1.5s)                │
│ ─────────────────────────────────── │
│ Array with 5 items...               │
│                              [▼]    │
└─────────────────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────────┐
│ ✓ Completed • web_search_exa • Exa │
│ 2 seconds ago (1.5s)         [Copy] │
│ ─────────────────────────────────── │
│ {                                   │
│   "results": [                      │
│     ...                             │
│   ]                                 │
│ }                            [▲]    │
└─────────────────────────────────────┘
```

## 🚨 Common Pitfalls

1. **Regex Escaping**: Be careful with special characters in regex
2. **Async Timing**: Tool results may appear after initial render
3. **State Management**: Ensure tool states are properly tracked
4. **Type Safety**: Verify TypeScript types match

## 📁 Key Files to Modify

1. **`hooks/use-chat-with-tools.ts`**
   - Fix `parseToolCallsFromContent`
   - Fix `stripToolCallsFromContent`
   - Ensure proper message processing

2. **`components/chat-message.tsx`**
   - Verify tool component rendering
   - Add debugging logs
   - Check conditional logic

3. **`components/chat-interface.tsx`**
   - Ensure `useChatWithTools` is imported correctly
   - Verify message prop passing

## 🎯 Success Criteria

- [ ] No JSON visible in chat messages
- [ ] Tool results appear in collapsible cards
- [ ] Loading animation shows during execution
- [ ] Copy button works
- [ ] AI analysis appears without JSON
- [ ] Clean, professional appearance

## 💡 Quick Debug Commands

```bash
# Check for syntax errors
npx tsc --noEmit

# Search for tool-related code
grep -r "TOOL_CALL" .
grep -r "Executing tool:" .
grep -r "toolCalls" .

# Watch specific file changes
npx nodemon --watch hooks/use-chat-with-tools.ts
```

## 🤝 Additional Context

The implementation is 90% complete. The components exist and work, but the integration between parsing and rendering needs fixing. Focus on:
1. Ensuring tool calls are properly extracted
2. Content is properly cleaned
3. Components receive the right data

Good luck! The implementation is close - it just needs the final connections made properly.
