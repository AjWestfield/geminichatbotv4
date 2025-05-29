#!/bin/bash

# Test script for MCP Tool Enhancements

echo "🚀 Testing MCP Tool Enhancements"
echo "================================"
echo ""
echo "Starting development server..."
echo ""
echo "To test the new MCP tool UI:"
echo ""
echo "1. Ask a question that triggers MCP tools:"
echo "   - 'Use the exa tool to search for latest AI news'"
echo "   - 'Search for information about React hooks'"
echo "   - 'Get documentation about Next.js using context7'"
echo ""
echo "2. Watch for:"
echo "   ✓ Loading animation with tool and server name"
echo "   ✓ Collapsible result card after completion"
echo "   ✓ Summary in collapsed view"
echo "   ✓ Full results when expanded"
echo "   ✓ Copy button functionality"
echo "   ✓ AI analysis after the results"
echo ""
echo "3. Try interactions:"
echo "   - Click to expand/collapse results"
echo "   - Use copy button (check for toast)"
echo "   - Check timestamps update"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
npm run dev
