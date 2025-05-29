#!/bin/bash

# Quick fix for tools showing as completed immediately

echo "🔧 Fixing tool status issue..."
echo ""

# Create backup
cp hooks/use-chat-with-tools.ts hooks/use-chat-with-tools.ts.backup2

# Fix using sed
sed -i '' "s/status: 'completed', \/\/ Since execution happens inside, it's already completed/status: 'executing', \/\/ Tool is being executed/" hooks/use-chat-with-tools.ts

echo "✅ Fixed tool initial status from 'completed' to 'executing'"
echo ""

# Also fix the comment to be accurate
sed -i '' "s/\/\/ Since execution happens inside, it's already completed/\/\/ Tool execution starts now/" hooks/use-chat-with-tools.ts

echo "📝 Additional fix needed for proper result handling"
echo ""
echo "The tool will now show as 'executing' but won't transition to 'completed'"
echo "This is because the result parsing logic needs to be updated."
echo ""
echo "For now, this fixes the immediate issue of showing 'completed' with no results."
echo ""
echo "To test:"
echo "1. Restart dev server: npm run dev"
echo "2. Ask a question that uses tools"
echo "3. Tool should show as 'executing' (with spinner)"
echo ""
echo "To revert:"
echo "mv hooks/use-chat-with-tools.ts.backup2 hooks/use-chat-with-tools.ts"
