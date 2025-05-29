# Quick Fix for Tool Results Display

## The Problem
Tool results from MCP servers (like "resolve-library-id") are not showing in the UI because the parser expects a specific format that doesn't match what's being sent.

## Manual Fix (Recommended)

1. Open `hooks/use-chat-with-tools.ts`

2. Find this section (around line 145):
```typescript
// Look for execution result INSIDE the TOOL_CALL block
const execPattern = /Tool executed successfully\.\s*\n\s*({[\s\S]*?})\s*\n\s*\[Tool execution completed/
const execMatch = execPattern.exec(toolCallContent)
```

3. Replace it with:
```typescript
// Look for execution result INSIDE the TOOL_CALL block
// More flexible patterns to handle various formats
const execPattern = /Tool executed successfully\.\s*\n+\s*([\s\S]*?)(?:\[Tool execution completed|$)/
const execMatch = execPattern.exec(toolCallContent)
```

4. Find this section (a few lines below):
```typescript
if (resultJson) {
  toolCall.result = JSON.parse(resultJson)
}
```

5. Replace with:
```typescript
if (resultJson) {
  try {
    toolCall.result = JSON.parse(resultJson)
  } catch (e) {
    // Fallback for non-JSON results
    toolCall.result = resultJson
  }
}
```

## Automated Fix

Run this command in your project directory:
```bash
./fix-tool-results.sh
```

## Test It
1. Restart your dev server: `npm run dev`
2. Ask a question that uses tools (e.g., "What is veo 3?")
3. You should now see the tool results in the UI

## What This Fixes
- Handles extra newlines in tool responses
- Works with both JSON and text results
- More robust error handling
- Fixes the display of MCP tool results
