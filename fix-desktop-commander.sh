#!/bin/bash

echo "Fixing DesktopCommander NPM cache issues..."
echo "=========================================="

# Clear NPM cache
echo "🧹 Clearing NPM cache..."
npm cache clean --force

# Remove the problematic directory
PROBLEM_DIR="/Users/andersonwestfield/.npm/_npx/4b4c857f6efdfb61"
if [ -d "$PROBLEM_DIR" ]; then
    echo "🗑️  Removing problematic cache directory..."
    rm -rf "$PROBLEM_DIR"
fi

# Clear the entire npx cache for a fresh start
echo "🔄 Clearing entire npx cache..."
rm -rf ~/.npm/_npx/

echo "✅ NPM cache cleared!"
echo ""
echo "Next steps:"
echo "1. The NPM cache has been cleared"
echo "2. Try connecting to DesktopCommander again in the app"
echo "3. If it still fails, we'll need to fix the connection logic"