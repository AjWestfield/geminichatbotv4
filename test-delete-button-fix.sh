#!/bin/bash

echo "🧪 Testing MCP Server Delete Button Fix"
echo "======================================"
echo ""
echo "This script will help verify that the delete buttons for MCP servers are now clickable."
echo ""

# Start the development server if not already running
if ! lsof -i:3000 > /dev/null 2>&1 && ! lsof -i:3001 > /dev/null 2>&1 && ! lsof -i:3002 > /dev/null 2>&1 && ! lsof -i:3003 > /dev/null 2>&1; then
    echo "📦 Starting development server..."
    npm run dev &
    sleep 5
else
    echo "✅ Development server is already running"
fi

# Get the port
PORT=3000
if lsof -i:3001 > /dev/null 2>&1; then
    PORT=3001
elif lsof -i:3002 > /dev/null 2>&1; then
    PORT=3002
elif lsof -i:3003 > /dev/null 2>&1; then
    PORT=3003
fi

echo ""
echo "🌐 Opening browser at http://localhost:$PORT"
echo ""

# Open the browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$PORT"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:$PORT"
fi

echo "📋 Test Instructions:"
echo "===================="
echo ""
echo "1. Click the Settings button (gear icon) in the chat interface"
echo ""
echo "2. Click on the 'MCP Servers' tab"
echo ""
echo "3. Verify the following:"
echo "   ✓ Delete buttons (trash icons) are visible for each server"
echo "   ✓ Delete buttons show a red hover effect when you hover over them"
echo "   ✓ Clicking a delete button shows a confirmation dialog"
echo "   ✓ Confirming deletion removes the server and shows a success toast"
echo "   ✓ The delete button is only disabled (grayed out) while connecting"
echo ""
echo "4. Expected behavior:"
echo "   - Connected servers CAN be deleted (with confirmation)"
echo "   - Connecting servers CANNOT be deleted (button disabled)"
echo "   - Disconnected servers CAN be deleted"
echo ""
echo "5. If you see 'Server removed successfully' toast, the fix is working! ✅"
echo ""
echo "Press Ctrl+C to stop the development server when done testing."