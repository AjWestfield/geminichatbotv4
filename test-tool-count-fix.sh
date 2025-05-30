#!/bin/bash

echo "Testing MCP Tool Count Fix"
echo "=========================="
echo ""

# Kill any existing processes on port 3000
echo "1. Stopping existing dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Clear localStorage to test fresh state
echo "2. Note: Clear browser localStorage if testing fresh state"
echo "   - Open DevTools > Application > Storage > Clear site data"
echo ""

# Start the dev server
echo "3. Starting development server..."
cd /Users/andersonwestfield/Desktop/geminichatbotv3
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "4. Waiting for server to start..."
sleep 8

# Open the browser
echo "5. Opening browser at http://localhost:3000"
open http://localhost:3000

echo ""
echo "Test Instructions:"
echo "=================="
echo ""
echo "1. INITIAL STATE:"
echo "   - Look at the tools icon in the chat input"
echo "   - If servers are connected, you should see a blue badge with tool count"
echo "   - Context7 has 2 tools, Exa has 1 tool = 3 total when both connected"
echo ""
echo "2. OPEN MCP TOOLS POPUP:"
echo "   - Click the tools icon"
echo "   - Check the header shows correct 'X enabled' count"
echo "   - Verify each server shows its tool count (e.g., '2/2' for Context7)"
echo ""
echo "3. TOGGLE SERVERS:"
echo "   - Click the toggle switches to disable/enable servers"
echo "   - Watch the total count update in real-time"
echo "   - Badge on icon should update too"
echo ""
echo "4. EXPAND SERVERS:"
echo "   - Click the arrow next to a server name"
echo "   - See individual tools listed"
echo "   - Toggle individual tools on/off"
echo "   - Verify counts update correctly"
echo ""
echo "5. SETTINGS SYNC:"
echo "   - Click 'Manage Servers'"
echo "   - Verify same enabled/disabled states"
echo "   - Toggle in settings and go back to popup"
echo "   - States should be synchronized"
echo ""
echo "Expected Tool Counts:"
echo "- Context7: 2 tools (resolve-library-id, get-library-docs)"
echo "- Exa: 1 tool (web_search_exa)"
echo "- Total when both enabled: 3 tools"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID