# React Hooks Order Fix

## Problem
React detected a change in the order of Hooks between renders in the SettingsDialog component. This error occurred because `React.useEffect` was being called inside the `servers.map()` function, violating React's Rules of Hooks.

## Root Cause
```typescript
// INCORRECT - useEffect inside map function
servers.map((server) => {
  // ...
  React.useEffect(() => {
    const toolNames = tools.map(t => t.name)
    mcpState.initializeServer(server.id, server.name, toolNames)
  }, [server.id, server.name, tools])
  // ...
})
```

## Solution
Moved the server initialization logic to a component-level `useEffect` that handles all servers at once:

```typescript
// CORRECT - useEffect at component level
useEffect(() => {
  servers.forEach(server => {
    // Initialize server state if not exists
    const tools = getServerTools(server.id)
    const toolNames = tools.map(t => t.name)
    mcpState.initializeServer(server.id, server.name, toolNames)
    
    // Auto-connect if enabled
    if (mcpState.autoConnectByDefault) {
      const serverState = mcpState.servers[server.id]
      if (serverState?.enabled && server.status === 'disconnected') {
        connectServer(server.id).catch(console.error)
      }
    }
  })
}, [servers, mcpState, mcpState.autoConnectByDefault, getServerTools, connectServer])
```

## Key Changes
1. Removed `React.useEffect` from inside the `servers.map()` function
2. Added server initialization to the existing auto-connect `useEffect`
3. Ensured all hooks are called at the top level of the component

## Testing
Run `./test-hooks-fix.sh` to verify:
- No React hooks errors in console
- Server states initialize correctly
- Auto-connect functionality works
- Dialog can be opened/closed without errors

## React Rules of Hooks
Remember:
- ✅ Call hooks at the top level of your function
- ❌ Don't call hooks inside loops, conditions, or nested functions
- ❌ Don't call hooks from regular JavaScript functions

This fix ensures the SettingsDialog component follows these rules correctly.