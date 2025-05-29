# MCP Tool JSON Parsing Fix

## Problem
The MCP tool execution was failing with a JSON parsing error:
```
SyntaxError: Expected double-quoted property name in JSON at position 31 (line 4 column 1)
```

This error occurred in the `parseToolCallsFromContent` function when trying to parse tool calls from AI responses.

## Root Cause
The `extractJsonObject` function was incorrectly handling escape sequences within JSON strings. It was manually converting control characters (like newlines) to escape sequences, which created double-escaped characters and resulted in invalid JSON.

For example:
- Original: `"query": "line1\nline2"`
- After extraction (incorrect): `"query": "line1\\nline2"` (double-escaped)
- Expected: `"query": "line1\nline2"` (properly escaped)

## Solution
Modified the `extractJsonObject` function to:
1. Remove manual escape sequence handling
2. Keep characters as-is when extracting JSON
3. Let JSON.parse handle the escape sequences naturally

## Additional Improvements
Enhanced error handling with:
1. Removal of invisible Unicode characters that might cause parsing issues
2. Better fallback parsing for extracting tool arguments
3. More detailed error logging for debugging

## Testing
Verified the fix handles:
- Simple JSON objects
- JSON with newlines in string values
- JSON with special characters (quotes, tabs)
- Malformed JSON with graceful fallback

## Files Modified
- `/hooks/use-chat-with-tools.ts` - Fixed the `extractJsonObject` function and improved error handling

The fix ensures that MCP tool calls are properly parsed from AI responses, allowing seamless tool execution in the chat interface.
