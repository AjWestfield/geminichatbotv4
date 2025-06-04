# MCP Server Delete Button Fix

## Problem
The delete buttons for MCP servers in the Settings dialog were not clickable when servers were connected. This prevented users from removing servers they no longer needed.

## Root Cause
The delete button had a `disabled` prop that was set to `true` when the server was either connecting OR connected:
```tsx
disabled={isConnecting || isConnected}
```

This was overly restrictive since the backend `removeServer` function already handles disconnecting servers before removal.

## Solution
1. **Removed the connected state restriction**: Now the button is only disabled while actively connecting
   ```tsx
   disabled={isConnecting}
   ```

2. **Added confirmation dialog**: When deleting a connected server, users now see a confirmation dialog
   ```tsx
   if (isConnected) {
     const confirmDelete = window.confirm(
       `Server "${server.name}" is currently connected. Are you sure you want to remove it?`
     );
     if (!confirmDelete) return;
   }
   ```

3. **Enhanced user feedback**:
   - Success toast when server is removed
   - Error toast if removal fails
   - Hover effects for better visual feedback
   - Tooltip explaining why button is disabled during connection

## Files Modified
- `/components/settings-dialog.tsx` - Updated the delete button implementation

## Testing
1. Open Settings → MCP Servers tab
2. Delete button should be clickable for disconnected servers (immediate deletion)
3. Delete button should be clickable for connected servers (shows confirmation)
4. Delete button should be disabled only while a server is connecting
5. Proper toast notifications appear for success/failure

The fix ensures users can manage their MCP servers effectively while preventing accidental deletion of active servers through the confirmation dialog.