#!/bin/bash

# Quick fix to make tools clickable

echo "🔧 Making tools clickable..."
echo ""

# Revert to showing tools as completed so they're clickable
sed -i '' "s/status: 'executing', \/\/ Tool declaration found, execution pending/status: 'completed', \/\/ Show as completed for clickability/" hooks/use-chat-with-tools.ts

# Add a default result if not present
sed -i '' "/timestamp: Date.now()$/s/$/,/" hooks/use-chat-with-tools.ts
sed -i '' "/timestamp: Date.now(),$/a\\
      result: result || 'Click to expand...' // Ensure there's always something to show
" hooks/use-chat-with-tools.ts

echo "✅ Tools will now show as completed and be clickable"
echo ""
echo "⚠️  Note: This is a temporary fix. Tools will show as 'completed'"
echo "even while executing, but at least they'll be clickable."
echo ""
echo "Restart your dev server to see the changes!"
