# Critical Fix: Tool Call Format Mismatch

## The Problem

There's a format mismatch causing tool results to not display:

1. **System Prompt** (in `lib/mcp/mcp-tools-context.ts` lines 122-131) tells the AI to output:
   ```
   TOOL_CALL
   {
     "tool": "tool_name",
     "server": "server_name",
     "arguments": { ... }
   }
   TOOL_CALL
   ```

2. **Parsers** expect:
   - `lib/mcp/mcp-tools-context.ts` line 190: `[TOOL_CALL]...[/TOOL_CALL]`
   - `hooks/use-chat-with-tools.ts` line 95: `[TOOL_CALL]...[/TOOL_CALL]`

The AI outputs without brackets, but parsers look for brackets = **No tool calls are recognized!**

## Quick Fix

### Option 1: Fix the System Prompt (Recommended)

In `lib/mcp/mcp-tools-context.ts`, change lines 122-131 from:
```typescript
prompt += `To use a tool, include a tool call in your response using this EXACT format:
TOOL_CALL
{
  "tool": "tool_name",
  "server": "server_name",
  "arguments": {
    "param": "value"
  }
}
TOOL_CALL
```

To:
```typescript
prompt += `To use a tool, include a tool call in your response using this EXACT format:
[TOOL_CALL]
{
  "tool": "tool_name",
  "server": "server_name",
  "arguments": {
    "param": "value"
  }
}
[/TOOL_CALL]
```

### Option 2: Fix the Parsers

Update both parsers to accept the format without brackets:

1. In `lib/mcp/mcp-tools-context.ts` line 190:
   ```typescript
   const toolCallRegex = /TOOL_CALL\s*([\s\S]*?)\s*TOOL_CALL/
   ```

2. In `hooks/use-chat-with-tools.ts` line 95:
   ```typescript
   const toolCallPattern = /TOOL_CALL\s*([\s\S]*?)\s*TOOL_CALL/g
   ```

## Test After Fix

1. Restart the dev server
2. Ask "What is the latest news about AI?"
3. The tool should execute AND display results

## Why This Fixes It

The AI has been correctly following instructions but outputting in a format the parsers can't read. By aligning the formats, the tool calls will be recognized, parsed, and their results will display properly in the UI.
