# Infinite Update Loop Fix

## Problem
React threw a "Maximum update depth exceeded" error when loading the application. This was caused by infinite re-rendering loops in components using Zustand state management.

## Root Cause
The issue occurred in two components:
1. `MCPToolsPopup` 
2. `SettingsDialog`

Both had `useEffect` hooks with the entire `mcpState` store object in their dependency arrays while also updating that same store inside the effect:

```typescript
// INCORRECT - causes infinite loop
useEffect(() => {
  servers.forEach(server => {
    mcpState.initializeServer(...) // Updates mcpState
    mcpState.setServerConnected(...) // Updates mcpState
  })
}, [servers, mcpState]) // mcpState changes trigger effect again!
```

## Solution
Instead of including the entire store object, include only the specific methods and properties being used:

```typescript
// CORRECT - no infinite loop
useEffect(() => {
  servers.forEach(server => {
    mcpState.initializeServer(...)
    mcpState.setServerConnected(...)
  })
}, [servers, mcpState.initializeServer, mcpState.setServerConnected])
```

## Key Changes

### MCPToolsPopup
- Changed: `[servers, mcpState]`
- To: `[servers, mcpState.initializeServer, mcpState.setServerConnected]`

### SettingsDialog  
- Changed: `[servers, mcpState, mcpState.autoConnectByDefault, ...]`
- To: `[servers, mcpState.autoConnectByDefault, mcpState.initializeServer, mcpState.servers, ...]`

## Why This Works
- Zustand store methods are stable references that don't change between renders
- Only including specific properties/methods prevents the entire store object from triggering re-renders
- The effect only runs when the actual dependencies change, not when unrelated store properties update

## Testing
Run `./test-infinite-loop-fix.sh` to verify:
- App loads without errors
- No "Maximum update depth exceeded" errors
- MCP servers initialize correctly
- State synchronization still works