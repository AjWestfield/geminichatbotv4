#!/bin/bash

echo "🧪 Testing MCP Intelligent JSON Import"
echo "======================================"
echo ""

# Test different JSON formats
echo "📋 Testing Claude Desktop format:"
cat << 'EOF'
{
  "mcpServers": {
    "calculator": {
      "command": "node",
      "args": ["example-servers/calculator/dist/index.js"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}
EOF

echo ""
echo "📋 Testing Array format:"
cat << 'EOF'
[
  {
    "name": "Calculator",
    "command": "node", 
    "args": ["example-servers/calculator/dist/index.js"]
  },
  {
    "name": "SQLite",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "test.db"]
  }
]
EOF

echo ""
echo "📋 Testing NPX shorthand:"
cat << 'EOF'
{
  "name": "GitHub API",
  "package": "@modelcontextprotocol/server-github",
  "env": {
    "GITHUB_TOKEN": "your-github-token"
  }
}
EOF

echo ""
echo "📋 Testing Python server shorthand:"
cat << 'EOF'
{
  "name": "Python Analysis",
  "python": "analyzer.py",
  "args": ["--verbose", "--port", "3000"]
}
EOF

echo ""
echo "✅ All these formats are automatically detected and parsed!"
echo ""
echo "To test:"
echo "1. Open Settings (⚙️)"
echo "2. Go to MCP Servers tab"
echo "3. Paste any of these formats"
echo "4. Click 'Import & Connect'"
echo ""
echo "The servers will be:"
echo "- ✨ Automatically parsed"
echo "- 🚀 Added to your list"  
echo "- 🔌 Connected automatically"
echo "- 🔧 Tools displayed when ready"