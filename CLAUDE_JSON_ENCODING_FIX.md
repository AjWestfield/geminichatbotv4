# Claude Streaming JSON Encoding Fix

## Problem
The AI SDK was throwing JSON parsing errors like:
```
SyntaxError: Unexpected non-whitespace character after JSON at position 6522 (line 1 column 6523)
```

This was occurring when the frontend tried to parse the streaming data using `parseDataStreamPart` from `@ai-sdk/ui-utils`.

## Root Cause
The claude-streaming-handler.ts was manually escaping quotes and newlines instead of using proper JSON encoding:
```typescript
// Old (incorrect) approach:
controller.enqueue(encoder.encode(`0:"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`));
```

This manual escaping missed other special characters that need to be escaped in JSON strings.

## Solution
Updated all streaming data to use proper JSON.stringify() encoding:
```typescript
// New (correct) approach:
controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
```

## AI SDK Data Stream Protocol
The AI SDK expects data in the format: `TYPE_ID:CONTENT_JSON\n`

Where:
- `0:` = Text parts (content must be JSON-encoded string)
- `2:` = Data parts (parsed as JSON array/object)
- `3:` = Error parts (content must be JSON-encoded string)
- `9:` = Tool call parts
- `a:` = Tool result parts
- `d:` = Finish parts (contains metadata)
- `e:` = Message parts

## Changes Made
Updated `/lib/claude-streaming-handler.ts`:
1. Text streaming: `0:${JSON.stringify(text)}\n`
2. Tool results: `0:${JSON.stringify(formattedResult)}\n`
3. Analysis instructions: `0:${JSON.stringify(analysisInstruction)}\n`
4. Error messages: `0:${JSON.stringify(errorMessage)}\n` and `3:${JSON.stringify(errorMessage)}\n`

## Testing
The fix ensures that all special characters (quotes, newlines, control characters, unicode, etc.) are properly escaped according to JSON specification, preventing parsing errors on the frontend.