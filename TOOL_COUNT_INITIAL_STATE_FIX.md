# Tool Count Initial State Fix

## Problem
The MCP Tools popup shows "0 enabled" even when servers are connected. The tool count only updates correctly after manually toggling servers off and on.

## Root Cause
When servers are already connected (e.g., from auto-connect or previous session), they weren't being marked as `enabled: true` in the global state. The tool count calculation requires both `server.enabled && server.connected` to be true.

## Solution
Updated the initialization logic to explicitly set `enabled: true` for any server that is already connected.

### Changes Made

#### `/hooks/use-mcp-initialization.ts`
Added logic to set servers as enabled when they're connected:
```typescript
// If server is connected, it should be enabled
if (server.status === 'connected') {
  mcpState.setServerEnabled(server.id, true)
}
```

This ensures that:
1. When servers auto-connect on startup, they're marked as enabled
2. When servers are already connected from a previous session, they're marked as enabled
3. The tool count displays correctly from the initial load

## Expected Behavior
- On app load, if servers are connected, the tool count badge should show immediately
- Context7 (2 tools) + Exa (1 tool) = 3 total tools when both connected
- No need to toggle servers to see the correct count

## Testing
1. Clear localStorage and reload - servers should auto-connect and show tool count
2. With servers already connected, reload - tool count should show immediately
3. Disconnect all servers, reload, then connect - tool count should update dynamically