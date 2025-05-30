#!/bin/bash

echo "Testing MCP Tools Popup Implementation"
echo "====================================="
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
echo "1. Look for the tools icon (Settings2/gear icon) in the chat input field"
echo "2. Click on it to open the MCP tools popup"
echo "3. The popup should appear above the input field"
echo "4. You should see:"
echo "   - List of MCP servers (if configured)"
echo "   - Toggle switches to enable/disable servers"
echo "   - Expandable list of tools for each server"
echo "   - Individual tool toggle switches"
echo "   - Total enabled tools count badge"
echo "5. Try toggling servers and tools"
echo "6. Check the console for toggle events"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID