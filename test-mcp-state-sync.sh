#!/bin/bash

echo "Testing MCP State Synchronization"
echo "================================="
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
sleep 5

# Open the browser
echo "4. Opening browser at http://localhost:3000"
open http://localhost:3000

echo ""
echo "Test Instructions:"
echo "=================="
echo ""
echo "1. CHAT POPUP TEST:"
echo "   - Click the tools icon in the chat input"
echo "   - Toggle servers on/off"
echo "   - Note which servers are enabled"
echo ""
echo "2. SETTINGS DIALOG TEST:"
echo "   - Click 'Manage Servers' in the popup"
echo "   - Check that the same servers show as enabled/disabled"
echo "   - Toggle the switches in settings"
echo ""
echo "3. SYNCHRONIZATION TEST:"
echo "   - Go back to the chat popup"
echo "   - Verify the states match what you set in settings"
echo "   - Toggle in chat popup, check settings again"
echo ""
echo "4. AUTO-CONNECT TEST:"
echo "   - In settings, toggle 'Auto-connect servers by default'"
echo "   - Add a new server or toggle an existing one"
echo "   - Check if it auto-connects when enabled"
echo ""
echo "5. PERSISTENCE TEST:"
echo "   - Set some servers as enabled/disabled"
echo "   - Refresh the page"
echo "   - Check that states are preserved"
echo ""
echo "Expected Behavior:"
echo "- States should sync between chat popup and settings"
echo "- Auto-connect should work when enabled"
echo "- States should persist across page refreshes"
echo "- Tool counts should update correctly"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID