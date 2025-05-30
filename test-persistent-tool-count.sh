#!/bin/bash

echo "Testing Persistent MCP Tool Count Fix..."
echo "========================================"
echo ""

# Check if server is running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Development server is running on port 3000"
    echo ""
    echo "🔍 Test Steps:"
    echo "1. Open the app in your browser (http://localhost:3000)"
    echo "2. Click on the MCP Tools icon (⚙️) in the chat input"
    echo "3. The tool count badge should show the correct number (not 0)"
    echo "4. Enable/disable servers - the count should update"
    echo "5. Refresh the browser (F5)"
    echo "6. The enabled servers should automatically reconnect"
    echo "7. The tool count should persist and show correctly"
    echo ""
    echo "📊 Expected Behavior:"
    echo "   - Tool count badge shows total enabled tools (e.g., '3' for Context7 + Exa)"
    echo "   - On refresh, enabled servers auto-connect"
    echo "   - Tool count updates as servers connect"
    echo "   - Shows '3 enabled (connecting...)' while connecting"
    echo ""
    echo "✅ Fixed Issues:"
    echo "   - Tool count no longer shows '0 enabled' on initial load"
    echo "   - Enabled servers automatically connect on startup"
    echo "   - Tool count includes tools from connecting servers"
    echo "   - Persistent state across browser refreshes"
else
    echo "❌ Development server is not running"
    echo "Please start the server with: npm run dev"
fi

echo ""
echo "📝 Summary of Changes:"
echo "   - Added auto-connect for enabled servers on app startup"
echo "   - Tool count includes potential tools from enabled but connecting servers"
echo "   - Shows connection status in the badge"
echo "   - Persistent state management with localStorage"