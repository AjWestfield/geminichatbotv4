# Infinite Update Loop - Complete Fix

## Problem
React was throwing "Maximum update depth exceeded" error due to circular state updates between components using MCP servers.

## Root Causes
1. **Multiple Initialization Points**: Both MCPToolsPopup and SettingsDialog were initializing server state
2. **Circular Dependencies**: State updates in useEffect triggered re-renders that caused more state updates
3. **Multiple Data Fetches**: Each component using `useMCPServers()` fetched data independently
4. **Unstable References**: Functions like `getServerTools` were recreated on each render

## Solution Applied

### 1. Centralized Initialization
Created `useMCPInitialization` hook that:
- Manages server state initialization in one place
- Prevents duplicate initialization with version tracking
- Only updates when server data actually changes

### 2. Single Initialization Point
- Added initialization to `app/page.tsx` (app root)
- Removed initialization from MCPToolsPopup
- Simplified initialization in SettingsDialog (only auto-connect logic)

### 3. Optimized State Updates
- Used `useMemo` for expensive calculations like tool counts
- Removed circular dependencies in useEffect hooks
- Made state updates more granular and controlled

## Changes Made

### New Files
- `/hooks/use-mcp-initialization.ts` - Centralized initialization logic

### Modified Files
1. **`/app/page.tsx`**
   - Added `useMCPInitialization()` at app root

2. **`/components/mcp/mcp-tools-popup.tsx`**
   - Removed initialization logic completely
   - Added `useMemo` for tool count calculation
   - Reordered state declarations for better performance

3. **`/components/settings-dialog.tsx`**
   - Removed server initialization logic
   - Kept only auto-connect functionality

## How It Works

1. **App Starts**: `useMCPInitialization` runs once at app root
2. **Server Data Fetched**: Hook detects changes and initializes state
3. **Components Render**: MCPToolsPopup and SettingsDialog only read state
4. **No Circular Updates**: State changes don't trigger initialization loops

## Key Principles

1. **Single Source of Truth**: One place for initialization
2. **Read vs Write Separation**: Components that display data shouldn't initialize it
3. **Stable Dependencies**: Use specific state properties, not entire objects
4. **Version Tracking**: Only update when data actually changes

## Testing

The fix ensures:
- No infinite loop errors on app load
- Server states initialize correctly
- Tool counts display properly
- State syncs between components
- No performance degradation