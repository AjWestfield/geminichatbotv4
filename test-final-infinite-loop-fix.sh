#!/bin/bash

echo "Testing Final Infinite Update Loop Fix"
echo "======================================"
echo ""

# Kill any existing processes on port 3000
echo "1. Stopping existing dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Clear Next.js cache and localStorage
echo "2. Clearing caches..."
rm -rf .next
echo "   Note: Clear browser localStorage for fresh test"
echo "   DevTools > Application > Storage > Clear site data"
echo ""

# Start the dev server
echo "3. Starting development server..."
cd /Users/andersonwestfield/Desktop/geminichatbotv3
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "4. Waiting for server to start (10 seconds)..."
sleep 10

# Open the browser
echo "5. Opening browser at http://localhost:3000"
open http://localhost:3000

echo ""
echo "Critical Tests:"
echo "==============="
echo ""
echo "1. CONSOLE CHECK (MOST IMPORTANT):"
echo "   - Open browser console (Cmd+Option+J)"
echo "   - Should see NO 'Maximum update depth exceeded' errors"
echo "   - Should see NO React errors"
echo "   - Check terminal - should see clean server logs"
echo ""
echo "2. PAGE LOAD TEST:"
echo "   - Page should load without hanging"
echo "   - No infinite loading spinners"
echo "   - UI should be responsive immediately"
echo ""
echo "3. MCP TOOLS ICON:"
echo "   - Look for tools icon in chat input"
echo "   - Should show correct badge count (3 if both servers connected)"
echo "   - Click to open popup - should work smoothly"
echo ""
echo "4. POPUP FUNCTIONALITY:"
echo "   - Toggle servers on/off"
echo "   - Tool count should update correctly"
echo "   - No lag or freezing"
echo ""
echo "5. SETTINGS DIALOG:"
echo "   - Click 'Manage Servers' in popup"
echo "   - Settings should open without errors"
echo "   - Toggle states should match popup"
echo ""
echo "6. REFRESH TEST:"
echo "   - Refresh the page (Cmd+R)"
echo "   - Should load without errors again"
echo "   - States should persist"
echo ""
echo "Server Logs to Watch:"
echo "- Should see 'GET /api/mcp/servers' only a few times, not continuously"
echo "- Should see servers connect once, not repeatedly"
echo "- No error messages or warnings"
echo ""
echo "✅ SUCCESS CRITERIA:"
echo "- No infinite loop errors"
echo "- Page loads and works normally"
echo "- Tool counts display correctly"
echo "- All MCP features functional"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID