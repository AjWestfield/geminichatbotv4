# MCP Regex Pattern Fixes

## Current Output Format (from user's example)

```
[TOOL_CALL]
{
  "tool": "web_search_exa",
  "server": "Exa",


Executing tool: web_search_exa
Tool executed successfully.
Tool executed successfully.

{
  "requestId": "1ba503736a7d0e523e99309edf75e517",
  ...
}


[Tool execution completed. The results have been displayed to the user. Please analyze these results and provide relevant insights, recommendations, or answer the user's original question based on the information retrieved.]

  "arguments": {
    "query": "latest news in AI",
    "numResults": 5
  }
}
[/TOOL_CALL]
```

## Issues Found

1. **Tool call JSON is split** - The opening part is at the top, but "arguments" is at the bottom
2. **Double "Tool executed successfully"** lines
3. **Tool execution happens INSIDE the TOOL_CALL block**

## Required Regex Fixes

### 1. Fix Tool Call Extraction
The JSON is malformed/split. Need to handle this edge case:

```typescript
// In parseToolCallsFromContent
// Handle case where execution happens inside TOOL_CALL block
const toolCallPattern = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g;

// When extracting JSON, need to piece together the parts
// The "arguments" section appears to be at the bottom
```

### 2. Fix Content Stripping
Need to handle the nested execution:

```typescript
// Remove entire TOOL_CALL blocks (including nested executions)
cleanedContent = cleanedContent.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '');

// This should remove everything including the execution that happens inside
```

### 3. Handle Malformed JSON
The tool call JSON is split/malformed. Need special handling:

```typescript
// Extract tool and server from the top part
const toolMatch = toolCallContent.match(/"tool"\s*:\s*"([^"]+)"/);
const serverMatch = toolCallContent.match(/"server"\s*:\s*"([^"]+)"/);

// Extract arguments from the bottom part (after execution)
const argsMatch = toolCallContent.match(/"arguments"\s*:\s*(\{[^}]+\})/);

// Extract the execution result from the middle
const execPattern = /Tool executed successfully\.\s*\n\s*({[\s\S]*?})\s*\n\s*\[Tool execution completed/;
```

## Quick Fix Approach

Since the format is non-standard, use a more flexible approach:

1. **Extract what we can** from the malformed TOOL_CALL block
2. **Look for execution results** within the block
3. **Strip the entire block** from display
4. **Show results in the collapsible component**

The key insight: The execution is happening INSIDE the TOOL_CALL block, not after it!
