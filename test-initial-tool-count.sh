#!/bin/bash

echo "Testing Initial Tool Count Display"
echo "=================================="
echo ""

# Kill any existing processes on port 3000
echo "1. Stopping existing dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start the dev server
echo "2. Starting development server..."
cd /Users/andersonwestfield/Desktop/geminichatbotv3
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "3. Waiting for server to start..."
sleep 8

# Open the browser
echo "4. Opening browser at http://localhost:3000"
open http://localhost:3000

echo ""
echo "Test Scenarios:"
echo "==============="
echo ""
echo "SCENARIO 1: Fresh Load with Auto-Connect"
echo "1. Clear localStorage (DevTools > Application > Clear site data)"
echo "2. Refresh the page"
echo "3. Wait for servers to auto-connect"
echo "4. CHECK: Tool count badge should appear on icon (likely showing '3')"
echo "5. CHECK: Opening popup should show '3 enabled' in header"
echo "6. CHECK: Each server should show its tool count (Context7: 2/2, Exa: 1/1)"
echo ""
echo "SCENARIO 2: Reload with Connected Servers"
echo "1. With servers already connected, refresh the page (Cmd+R)"
echo "2. CHECK: Tool count should appear IMMEDIATELY on page load"
echo "3. CHECK: No need to toggle servers - count should be correct"
echo ""
echo "SCENARIO 3: Manual Connect"
echo "1. Open Settings > MCP Servers"
echo "2. Disconnect all servers"
echo "3. Go back to chat"
echo "4. CHECK: Tool count should be 0 or badge hidden"
echo "5. Open MCP Tools popup"
echo "6. Toggle servers on one by one"
echo "7. CHECK: Tool count should update in real-time"
echo ""
echo "Expected Tool Counts:"
echo "- Context7 only: 2 tools"
echo "- Exa only: 1 tool"
echo "- Both enabled: 3 tools"
echo ""
echo "SUCCESS CRITERIA:"
echo "✅ Tool count shows correctly on initial load"
echo "✅ No need to toggle to see the count"
echo "✅ Count updates dynamically when toggling"
echo "✅ State persists across page refreshes"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID