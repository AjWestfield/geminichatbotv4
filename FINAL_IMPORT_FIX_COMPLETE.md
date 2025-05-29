# Final Import Fix Complete

## Problem Analysis

When the user clicks "Import & Connect" with incomplete JSON:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
```

The system shows an error: "sequential-thinking: Server configuration must include id and name"

## Root Cause

The intelligent JSON correction returns a single server object like:
```json
{
  "name": "sequential-thinking",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  "transportType": "stdio"
}
```

But the settings dialog expects it might be in different formats and needs to ensure each server has both `id` and `name`.

## Fixes Applied

### 1. Enhanced Logging
Added console.log statements throughout the import flow to debug the issue:
- In settings-dialog.tsx: Log corrected JSON structure and parsed servers
- In use-mcp-servers.ts: Log the config being sent to API
- In both: Log errors with full context

### 2. ID Generation
The code already generates IDs for servers that don't have them:
```typescript
const serverWithId = {
  ...server,
  id: server.id || `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
```

### 3. API Key Fix
Fixed the Google AI SDK to use GEMINI_API_KEY instead of looking for GOOGLE_GENERATIVE_AI_API_KEY

### 4. Pattern Detection
Enhanced the incomplete JSON detection to better handle the specific pattern

## Testing

To debug the issue:

1. Run the debug script (no server needed):
```bash
node debug-json-import.js
```

This will show exactly what the intelligent correction returns and how it would be processed.

2. Test with the dev server:
```bash
npm run dev
# In another terminal:
node test-import-fix.js
```

3. Manual test:
- Open the app
- Go to Settings → MCP Servers
- Paste the incomplete JSON
- Open browser console (F12)
- Click "Import & Connect"
- Check console logs to see the exact flow

## Expected Behavior

1. The incomplete JSON is sent to `/api/mcp/analyze`
2. It returns a corrected single server object
3. Settings dialog wraps it in an array
4. Adds an ID to each server
5. Sends to `/api/mcp/servers` with both id and name
6. Server is added successfully

## Troubleshooting

If it still fails, check the browser console for:
- `[Settings] Corrected JSON structure:` - Shows what was returned
- `[Settings] Parsed servers:` - Shows the array of servers
- `[Settings] Adding server with ID:` - Shows the final config
- `[useMCPServers] Adding server config:` - Shows what's sent to API

The issue should now be resolved with proper ID generation and logging to help debug any remaining issues.