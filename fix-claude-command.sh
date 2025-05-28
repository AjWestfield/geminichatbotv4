#!/bin/bash

# Script to fix Claude Code command not found issue

echo "🔧 Fixing Claude Code command..."
echo ""

# Check current Node version
current_node=$(node --version)
echo "Current Node version: $current_node"

# Check if Claude is installed in any nvm Node version
echo ""
echo "🔍 Looking for Claude Code installations..."
find ~/.nvm/versions/node -name "claude" -type f 2>/dev/null | while read -r claude_path; do
    echo "Found: $claude_path"
done

echo ""
echo "📋 To fix this issue, you have several options:"
echo ""
echo "Option 1: Switch to Node v18.20.5 (where Claude is installed)"
echo "  nvm use 18.20.5"
echo "  claude"
echo ""
echo "Option 2: Use the full path directly"
echo "  /Users/andersonwestfield/.nvm/versions/node/v18.20.5/bin/claude"
echo ""
echo "Option 3: Install Claude Code globally in your current Node version"
echo "  npm install -g @anthropic-ai/claude-code"
echo ""
echo "Option 4: Create an alias in your shell"
echo "  echo 'alias claude=\"/Users/andersonwestfield/.nvm/versions/node/v18.20.5/bin/claude\"' >> ~/.zshrc"
echo "  source ~/.zshrc"
echo ""
echo "🚀 Recommended: Use Option 1 for immediate access"
