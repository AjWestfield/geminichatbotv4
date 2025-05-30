# MCP Manage Servers Dialog Integration

## Overview
Enhanced the MCP tools popup so that clicking "Manage Servers" opens the Settings dialog with the MCP Servers tab active, providing a seamless way to manage MCP servers.

## Changes Made

### 1. **SettingsDialog Component Enhancement**
- Added `initialTab` prop to control which tab is shown when dialog opens
- Added `useEffect` to update active tab when dialog opens with specific tab
- Maintains backward compatibility (defaults to 'image' tab)

### 2. **MCPToolsPopup Component Update**
- Added state for managing Settings dialog (`showSettings`)
- Added temporary image settings state (would normally come from parent)
- Imported and integrated SettingsDialog component
- Changed "Manage Servers" button behavior to open dialog instead of clicking tab

### 3. **User Flow**
1. User clicks tools icon in chat input
2. MCP tools popup appears
3. User clicks "Manage Servers" button
4. Settings dialog opens with "MCP Servers" tab active
5. User can manage servers (add, remove, connect, import)
6. Changes reflect in MCP tools popup after closing dialog

## Technical Implementation

### State Management
```typescript
const [showSettings, setShowSettings] = useState(false)
```

### Button Handler
```typescript
onClick={() => {
  setOpen(false)      // Close popup
  setShowSettings(true) // Open settings dialog
}}
```

### Dialog Integration
```typescript
<SettingsDialog
  open={showSettings}
  onOpenChange={setShowSettings}
  initialTab="mcp"    // Opens MCP tab directly
  // ... other props
/>
```

## Benefits
1. **Better UX**: Direct access to full MCP management interface
2. **Consistent Flow**: Uses existing Settings dialog infrastructure
3. **Feature Complete**: Access to import, manual add, and server management
4. **Visual Continuity**: Maintains app's design language

## Testing
Run `./test-mcp-manage-servers.sh` to test the integration.