#!/bin/bash
echo "🔍 Debugging MCP Tool Display"
echo "=============================="
echo ""
echo "This script will help debug the MCP tool display issue."
echo ""
echo "1. Check if MCP servers are connected:"
curl -s http://localhost:3003/api/mcp/servers | jq '.'
echo ""
echo "2. Starting dev server with debugging..."
echo ""
echo "When testing, look for:"
echo "- Console logs showing tool parsing"
echo "- Tool results being extracted"
echo "- Clean message content (no JSON)"
echo "- Collapsible tool result cards"
echo ""
echo "Test prompts:"
echo '- "Use the exa tool to search for latest AI news"'
echo '- "Search for React documentation with context7"'
echo ""

# Set debug environment variable
export DEBUG_MCP_TOOLS=true

# Start dev server
npm run dev
