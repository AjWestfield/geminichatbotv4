#!/bin/bash

echo "Testing MCP Manage Servers Dialog Integration"
echo "============================================"
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
echo "1. Click the tools icon (Settings2/gear icon) in the chat input field"
echo "2. In the MCP tools popup, click 'Manage Servers' button"
echo "3. The Settings dialog should open with the 'MCP Servers' tab active"
echo "4. You can:"
echo "   - Import MCP configuration (JSON)"
echo "   - Add servers manually"
echo "   - Connect/disconnect servers"
echo "   - Remove servers"
echo "   - View available tools"
echo "5. Close the dialog with 'Done' button"
echo "6. The MCP tools popup should reflect any changes"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID