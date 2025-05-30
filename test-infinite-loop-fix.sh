#!/bin/bash

echo "Testing Infinite Update Loop Fix"
echo "================================"
echo ""

# Kill any existing processes on port 3000
echo "1. Stopping existing dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Clear Next.js cache
echo "2. Clearing Next.js cache..."
rm -rf .next

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
echo "1. CHECK CONSOLE:"
echo "   - Open browser console (Cmd+Option+J)"
echo "   - Verify NO 'Maximum update depth exceeded' errors"
echo "   - Check terminal for clean server logs"
echo ""
echo "2. TEST MCP FUNCTIONALITY:"
echo "   - Click the tools icon in chat input"
echo "   - Verify popup opens without errors"
echo "   - Toggle servers on/off"
echo "   - Click 'Manage Servers'"
echo "   - Verify settings dialog opens"
echo ""
echo "3. EXPECTED RESULTS:"
echo "   ✅ No infinite loop errors"
echo "   ✅ App loads successfully"
echo "   ✅ MCP servers connect normally"
echo "   ✅ UI interactions work smoothly"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID