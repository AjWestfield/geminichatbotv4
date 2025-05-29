#!/bin/bash

# Fix tool format mismatch in geminichatbotv2

echo "🔧 Fixing tool call format mismatch..."
echo ""

# Option 1: Fix the system prompt (recommended)
echo "Applying fix to system prompt format..."

# Update mcp-tools-context.ts system prompt
sed -i.backup 's/TOOL_CALL$/[TOOL_CALL]/g' lib/mcp/mcp-tools-context.ts
sed -i 's/^TOOL_CALL$/[\/TOOL_CALL]/g' lib/mcp/mcp-tools-context.ts

# Also fix the line 139 that seems to be a mistake
sed -i 's/^TOOL_CALL$/[\/TOOL_CALL]/g' lib/mcp/mcp-tools-context.ts

echo "✅ System prompt updated to use [TOOL_CALL] format"
echo ""
echo "📝 Created backup: lib/mcp/mcp-tools-context.ts.backup"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Test with: 'What is the latest news about AI?'"
echo "3. Tool results should now display properly!"
echo ""
echo "To revert if needed:"
echo "mv lib/mcp/mcp-tools-context.ts.backup lib/mcp/mcp-tools-context.ts"
