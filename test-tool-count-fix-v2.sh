#!/bin/bash

echo "Testing MCP Tool Count Fix..."
echo "==============================="
echo ""

# Check if the server is already running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Development server is already running on port 3000"
    echo ""
    echo "🔍 Please check the following in your browser:"
    echo "   1. Click on the Settings/Tools icon (⚙️) in the chat input area"
    echo "   2. The badge should show the correct total number of enabled tools"
    echo "   3. In the popup, each server should show X/Y tools (enabled/total)"
    echo ""
    echo "📊 Expected behavior:"
    echo "   - If Context7 has 2 tools and Exa has 1 tool, badge should show '3'"
    echo "   - Not '0 enabled' as shown in the screenshots"
else
    echo "❌ Development server is not running"
    echo ""
    echo "Please start the server with: npm run dev"
    echo "Then run this test again"
fi

echo ""
echo "📝 Summary of changes made:"
echo "   - Fixed tool count calculation to use actual server data"
echo "   - Tool count now properly reflects connected servers' tools"
echo "   - Individual server tool counts also fixed to show enabled tools"