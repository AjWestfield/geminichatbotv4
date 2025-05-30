# MCP Tool Count Fix

## Problem
The MCP Tools popup was showing "0 enabled" even when servers were connected with tools. The tool count badge on the tools icon was also not displaying.

## Root Causes
1. **Initialization Issue**: The `initializeServer` function was checking if a server already existed and skipping updates, preventing tool lists from being populated when servers connected
2. **Data Source Issue**: The popup was using `server.tools` directly instead of `getServerTools()` which returns the actual tools
3. **State Timing**: Tools were being counted from the global state before it was properly initialized with the server's tools

## Solutions Applied

### 1. Updated State Initialization
Changed `initializeServer` to always update the tools list while preserving existing enabled states:
```typescript
initializeServer: (serverId, name, toolNames = []) => set((state) => {
  const existingServer = state.servers[serverId]
  
  const tools: Record<string, boolean> = {}
  toolNames.forEach(toolName => {
    // Preserve existing tool state if available, otherwise default to true
    tools[toolName] = existingServer?.tools[toolName] ?? true
  })
  
  return {
    servers: {
      ...state.servers,
      [serverId]: {
        id: serverId,
        enabled: existingServer?.enabled ?? state.autoConnectByDefault,
        connected: existingServer?.connected ?? false,
        tools
      }
    }
  }
})
```

### 2. Fixed Data Source in Popup
- Added `getServerTools` to the hook destructuring
- Updated initialization to use `getServerTools(server.id)` instead of `server.tools`
- Updated tool display to use `getServerTools(server.id)` for consistency

### 3. Improved Tool Count Logic
- Changed tool count to use actual server tools length when connected
- Added default enabled state based on connection status
- Simplified the count calculation to be more reliable

## Key Changes

### MCPToolsPopup
1. Import `getServerTools` from the hook
2. Use `getServerTools(server.id)` instead of `server.tools`
3. Count tools directly from server tools array when connected
4. Default to enabled state if server is connected

### useMCPState
1. Always update tools list on initialization
2. Preserve existing enabled states for tools
3. Allow tool list updates even for existing servers

## Testing
Run the app and:
1. Check that the tools icon shows the correct badge count
2. Open the MCP Tools popup and verify the "X enabled" count
3. Toggle servers and verify counts update correctly
4. Expand servers to see individual tools