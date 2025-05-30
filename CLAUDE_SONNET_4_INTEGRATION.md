# Claude Sonnet 4 Integration

## Overview

This document describes the integration of Claude Sonnet 4 (Claude 3.5 Sonnet) as an additional AI model option in the chat interface, alongside the existing Gemini models. The integration maintains full MCP (Model Context Protocol) tool support.

## Changes Made

### 1. Installed Anthropic SDK
```bash
npm install @anthropic-ai/sdk --legacy-peer-deps
```
- Version: ^0.52.0
- Added to package.json dependencies

### 2. Updated Model Selection UI
**File**: `/components/ui/animated-ai-input.tsx`
- Added "Claude Sonnet 4" to the AI_MODELS array
- Claude icon already existed in MODEL_ICONS

```typescript
const AI_MODELS = ["gemini-2.5-pro-preview-05-06", "gemini-2.5-flash-preview-05-20", "gemini-2.0-flash-exp", "Claude Sonnet 4"]
```

### 3. Created Claude Client Library
**File**: `/lib/claude-client.ts`
- Initializes Anthropic client with API key
- Formats messages for Claude's expected format
- Converts MCP tools to Claude tool format
- Parses tool calls from Claude responses
- Formats tool results for Claude

Key functions:
- `getClaudeClient()` - Initializes the Anthropic SDK client
- `formatMessagesForClaude()` - Converts message format
- `convertMCPToolsToClaudeTools()` - Adapts MCP tools for Claude
- `parseClaudeToolCalls()` - Extracts tool calls from responses
- `formatToolResultsForClaude()` - Formats tool execution results

### 4. Created Claude Streaming Handler
**File**: `/lib/claude-streaming-handler.ts`
- Handles streaming responses from Claude API
- Processes tool calls during streaming
- Maintains same streaming format as Gemini for consistency
- Uses Server-Sent Events (SSE) format

Key features:
- Streaming text chunks as they arrive
- Tool call detection and processing
- Error handling and recovery
- Compatible with existing front-end

### 5. Created Claude Chat Handler
**File**: `/app/api/chat/claude-handler.ts`
- Main handler for Claude model requests
- Integrates with MCP tools context
- Uses the enhanced MCP system prompt
- Routes to streaming handler

### 6. Updated Main Chat Route
**File**: `/app/api/chat/route.ts`
- Added check for Claude model selection
- Routes Claude requests to dedicated handler
- Maintains backward compatibility with Gemini models

```typescript
// Check if it's a Claude model
if (model === "Claude Sonnet 4") {
  const { handleClaudeRequest } = await import('./claude-handler');
  return handleClaudeRequest(messages, model);
}
```

## Architecture

```
User selects "Claude Sonnet 4" in UI
           ↓
Chat request sent to /api/chat
           ↓
Route checks model type
           ↓
    ┌──────┴──────┐
    │             │
Claude?        Gemini?
    │             │
    ↓             ↓
claude-handler  existing handler
    │
    ↓
claude-streaming-handler
    │
    ↓
Stream response with MCP tools
```

## MCP Tool Support

Claude Sonnet 4 has full support for all MCP tools:
- Tool discovery from connected MCP servers
- Tool execution during conversation
- Tool result integration
- Same tool format as Gemini models

The implementation uses the same MCPToolsContext that Gemini uses, ensuring consistency.

## Environment Variables

Required environment variable:
```
ANTHROPIC_API_KEY=your-api-key-here
```

This should be added to `.env.local` alongside existing API keys.

## Usage

1. Select "Claude Sonnet 4" from the model dropdown in the chat interface
2. Claude will be used for all subsequent messages
3. MCP tools work automatically when enabled
4. Streaming responses appear in real-time
5. Tool executions show the same UI as with Gemini

## Technical Details

### Model Used
- Model ID: `claude-3-5-sonnet-20241022`
- Max tokens: 8192
- Temperature: 0.7
- Supports streaming
- Supports system prompts

### Tool Call Format
Claude uses the same [TOOL_CALL] format as the existing system:
```
[TOOL_CALL]
{
  "tool": "tool_name",
  "server": "server_name",
  "arguments": {}
}
[/TOOL_CALL]
```

### Streaming Format
Uses Server-Sent Events (SSE) with JSON chunks:
```
data: {"content": "text chunk", "isPartial": true}
data: {"toolResult": {...}, "toolCall": {...}}
data: {"done": true}
```

## Benefits

1. **Model Diversity**: Users can choose between Gemini and Claude models
2. **MCP Compatibility**: Full support for MCP tools with Claude
3. **Consistent UX**: Same interface and features regardless of model
4. **Agentic Workflows**: Claude can perform the same MCP-based workflows
5. **Streaming**: Real-time responses like Gemini

## Testing

To test the integration:
1. Ensure ANTHROPIC_API_KEY is set in .env.local
2. Start the development server
3. Select "Claude Sonnet 4" from the model dropdown
4. Send a message - should receive streaming response
5. Test MCP tools - should work identically to Gemini

## Future Enhancements

Potential improvements:
1. Add more Claude models (Opus, Haiku)
2. Model-specific settings (temperature, max tokens)
3. Fallback handling between models
4. Cost tracking per model
5. Model comparison features

## Conclusion

Claude Sonnet 4 is now fully integrated as an alternative AI model, maintaining all existing functionality including MCP tool support. Users can seamlessly switch between Gemini and Claude models based on their preferences and use cases.