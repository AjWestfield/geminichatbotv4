# MCP State Synchronization Implementation

## Overview
Implemented a global state management system that synchronizes MCP server and tool states between the chat popup and settings dialog. This ensures consistency across the UI and adds support for auto-connect functionality.

## Key Features

### 1. **Global State Management**
- Uses Zustand for persistent state management
- States persist across page refreshes
- Synchronizes between all UI components

### 2. **Synchronized States**
- **Server Enabled/Disabled**: Toggle servers on/off in either location
- **Server Connected Status**: Shows real-time connection status
- **Tool Enabled/Disabled**: Individual tool toggles (preserved per server)
- **Auto-Connect Setting**: Global default for new servers

### 3. **Auto-Connect Functionality**
- New setting: "Auto-connect servers by default"
- When enabled, servers automatically connect when toggled on
- Applies to newly added servers
- Can be overridden per server

## Implementation Details

### State Store (`hooks/use-mcp-state.ts`)
```typescript
interface MCPStateStore {
  servers: Record<string, MCPServerState>
  autoConnectByDefault: boolean
  
  // Actions
  setServerEnabled: (serverId: string, enabled: boolean) => void
  setServerConnected: (serverId: string, connected: boolean) => void
  setToolEnabled: (serverId: string, toolName: string, enabled: boolean) => void
  setAutoConnectByDefault: (enabled: boolean) => void
  initializeServer: (serverId: string, name: string, toolNames?: string[]) => void
  getEnabledToolsCount: () => number
}
```

### UI Components Updated

#### 1. **MCP Tools Popup** (`components/mcp/mcp-tools-popup.tsx`)
- Uses global state for server/tool enabled status
- Updates tool count badge from global state
- Syncs with settings dialog in real-time

#### 2. **Settings Dialog** (`components/settings-dialog.tsx`)
- Added "Auto-connect servers by default" toggle
- Shows enabled/disabled state with switches
- Connect/disconnect respects enabled state
- Auto-connects when server is enabled (if auto-connect is on)

## User Experience

### Chat Popup View
- Toggle servers on/off with visual feedback
- See total enabled tools count
- Expand to toggle individual tools
- States persist and sync with settings

### Settings Dialog View
- Master toggle for auto-connect behavior
- Individual server enable/disable switches
- Visual indicators for status:
  - **Disabled**: Gray badge
  - **Connected**: Green badge
  - **Connecting**: Yellow spinner
  - **Error**: Red badge

### State Synchronization
1. Enable a server in chat popup → Shows as enabled in settings
2. Disable a server in settings → Shows as disabled in chat popup
3. Auto-connect triggers when enabling (if setting is on)
4. States persist across page refreshes

## Configuration

### Default Behavior
- Auto-connect is **enabled** by default
- New servers inherit the auto-connect setting
- Individual servers can be toggled independently

### Persistence
- States saved to localStorage
- Survives browser restarts
- Per-domain storage

## Testing

Run `./test-mcp-state-sync.sh` to test:
1. State synchronization between UI components
2. Auto-connect functionality
3. Persistence across refreshes
4. Tool count updates

## Benefits

1. **Consistency**: No more mismatched states between UI components
2. **Convenience**: Auto-connect saves manual connection steps
3. **Flexibility**: Global default with per-server overrides
4. **Persistence**: Settings remembered between sessions
5. **Performance**: Efficient state updates with Zustand

## Technical Notes

- Uses Zustand v5 for state management
- localStorage for persistence
- React hooks for component integration
- Optimistic UI updates with error rollback