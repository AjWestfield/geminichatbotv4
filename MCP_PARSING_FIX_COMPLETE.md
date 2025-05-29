# MCP Tool Display Fix - Complete

## Summary
Fixed the MCP tool display issue where tool results were showing as raw JSON in chat messages instead of using the collapsible card components.

## Problem
The AI was outputting a malformed format where:
1. Tool execution happened INSIDE the `[TOOL_CALL]` block
2. The JSON was split with arguments appearing after the execution
3. Raw JSON and execution details were visible in chat

## Solution
Updated the `parseToolCallsFromContent()` function in `hooks/use-chat-with-tools.ts` to:
1. Handle the malformed format where execution happens inside TOOL_CALL blocks
2. Extract tool/server info using regex instead of JSON parsing
3. Find and extract execution results from within the TOOL_CALL block
4. Set tool status to 'completed' since execution already happened

## Key Changes
- Modified parsing logic to handle non-standard tool call format
- Tool calls are now properly extracted and attached to messages
- The existing `stripToolCallsFromContent()` already correctly removes entire TOOL_CALL blocks
- Tool results now render in collapsible `MCPToolResult` components

## Testing
1. The dev server is running on port 3009
2. Test by asking questions that trigger tool usage (e.g., "what is the latest news in AI?")
3. Verify that:
   - No JSON appears in chat messages
   - Tool results show in collapsible cards
   - AI analysis text is clean

## Result
✅ Tool results now display in professional, collapsible cards below messages
✅ No raw JSON or execution details visible to users
✅ Clean separation between AI responses and tool execution results