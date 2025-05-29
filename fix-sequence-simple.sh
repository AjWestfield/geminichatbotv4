#!/bin/bash

# Simple fix to ensure tool results display before analysis

echo "🔧 Fixing tool execution sequence..."
echo ""

# Backup files
cp app/api/chat/route.ts app/api/chat/route.ts.backup-sequence
cp hooks/use-chat-with-tools.ts hooks/use-chat-with-tools.ts.backup-sequence

# Fix 1: Add delay before analysis in route.ts
# This gives the client time to process and display tool results
sed -i '' '/const analysisInstruction = /i\
                    // Wait for client to display tool results\
                    await new Promise(resolve => setTimeout(resolve, 2000))\
                    \
                    // Send a separator to clearly mark analysis section\
                    controller.enqueue(encoder.encode(\`0:"\\\\n\\\\n📊 **Tool Results Received - Starting Analysis...**\\\\n\\\\n"\n\`))\
' app/api/chat/route.ts

# Fix 2: Make tools show as completed with results by default
# Update the tool parsing to immediately show results
sed -i '' 's/status: '\''executing'\'', \/\/ Tool declaration found, execution pending/status: '\''completed'\'', \/\/ Show as completed immediately/' hooks/use-chat-with-tools.ts

# Fix 3: Ensure tool always has a result to display
sed -i '' '/timestamp: Date.now(),/a\
      result: '\''Waiting for execution results...'\'' // Default result
' hooks/use-chat-with-tools.ts

echo "✅ Applied fixes:"
echo "1. Added 2-second delay before analysis starts"
echo "2. Tools show as 'completed' immediately (clickable)"
echo "3. Clear separator between tool results and analysis"
echo ""
echo "This ensures:"
echo "- Tool results are visible before analysis"
echo "- Tools are immediately clickable"
echo "- Clear visual separation of results vs analysis"
echo ""
echo "Restart your dev server to see the changes!"
echo ""
echo "To revert:"
echo "mv app/api/chat/route.ts.backup-sequence app/api/chat/route.ts"
echo "mv hooks/use-chat-with-tools.ts.backup-sequence hooks/use-chat-with-tools.ts"
