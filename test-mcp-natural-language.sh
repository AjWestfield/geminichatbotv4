#!/bin/bash

echo "Testing Natural Language MCP Management"
echo "====================================="
echo ""
echo "This test demonstrates how users can manage MCP servers through natural language."
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
echo "Natural Language MCP Management Examples:"
echo "========================================"
echo ""
echo "Try these prompts in the chat:"
echo ""
echo "1. INSTALL SERVERS:"
echo "   - 'Install the GitHub MCP server'"
echo "   - 'Add the filesystem MCP'"
echo "   - 'Set up the calculator server'"
echo "   - 'I need to search the web, what MCP should I use?'"
echo ""
echo "2. INSTALL FROM GITHUB:"
echo "   - 'Install https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite'"
echo "   - 'Add the MCP from https://github.com/anthropics/mcp-servers/calculator'"
echo ""
echo "3. INSTALL FROM JSON:"
echo "   Paste this in chat:"
echo '   Add this server:'
echo '   {'
echo '     "calculator": {'
echo '       "command": "npx",'
echo '       "args": ["@modelcontextprotocol/server-calculator"]'
echo '     }'
echo '   }'
echo ""
echo "4. LIST SERVERS:"
echo "   - 'Show me my MCP servers'"
echo "   - 'What servers are installed?'"
echo ""
echo "5. REMOVE SERVERS:"
echo "   - 'Remove the calculator server'"
echo "   - 'Uninstall GitHub MCP'"
echo ""
echo "IMPORTANT:"
echo "- The AI will use Exa or Context7 to search for configurations"
echo "- Make sure you have at least one search tool connected"
echo "- The AI will show progress steps as it installs servers"
echo "- After installation, it will test the connection and show available tools"
echo ""
echo "Watch the AI perform the agentic workflow:"
echo "1. Parse your request"
echo "2. Search for configuration (if needed)"
echo "3. Validate the configuration"
echo "4. Backup current config"
echo "5. Add to configuration file"
echo "6. Connect to server"
echo "7. Test functionality"
echo "8. Report results"
echo ""
echo "Press Ctrl+C to stop the server when done testing."

# Wait for user to stop
wait $DEV_PID