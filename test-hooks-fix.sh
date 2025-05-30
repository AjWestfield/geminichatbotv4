#!/bin/bash

echo "Testing React Hooks Fix"
echo "======================"
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
echo "1. Open the browser console (Cmd+Option+J)"
echo "2. Click on the Settings icon or tools icon"
echo "3. Navigate to the MCP Servers tab"
echo "4. Verify NO React hooks errors appear in console"
echo "5. Try toggling servers on/off"
echo "6. Close and reopen the dialog multiple times"
echo ""
echo "Expected: No 'change in the order of Hooks' errors"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID