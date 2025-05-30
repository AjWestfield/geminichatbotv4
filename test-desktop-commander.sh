#!/bin/bash

echo "Testing DesktopCommanderMCP Integration..."
echo "=========================================="
echo ""

# Check if server is running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Development server is running on port 3000"
    echo ""
    echo "🔍 Test Steps:"
    echo "1. Open the app in your browser (http://localhost:3000)"
    echo "2. Click on the MCP Tools icon (⚙️) in the chat input"
    echo "3. You should see 'DesktopCommander' in the server list"
    echo "4. Toggle it ON to enable the server"
    echo "5. The server will connect and show available tools"
    echo ""
    echo "📋 Expected Tools from DesktopCommander:"
    echo "   - Terminal control"
    echo "   - File system operations"
    echo "   - Process management"
    echo "   - Configuration management"
    echo "   - Diff file editing"
    echo ""
    echo "⚡ Quick Test Commands:"
    echo "   - 'List files in current directory'"
    echo "   - 'Show current processes'"
    echo "   - 'Read package.json file'"
    echo ""
    echo "⚠️  Security Note:"
    echo "   DesktopCommander provides powerful system access."
    echo "   Be cautious with commands that modify files or system settings."
else
    echo "❌ Development server is not running"
    echo "Please start the server with: npm run dev"
fi

echo ""
echo "📝 What Was Added:"
echo "   - DesktopCommanderMCP server configuration"
echo "   - NPX command: @wonderwhy-er/desktop-commander@latest"
echo "   - Added to known servers for easy natural language installation"
echo "   - Can be added via: 'Add desktop commander server'"