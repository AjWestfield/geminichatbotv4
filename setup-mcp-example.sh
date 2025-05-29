#!/bin/bash

echo "Setting up MCP Calculator Example Server..."

# Navigate to calculator directory
cd example-servers/calculator

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the server
echo "Building server..."
npm run build

echo "✅ MCP Calculator server is ready!"
echo ""
echo "To use it in the app:"
echo "1. Start your Next.js app: npm run dev"
echo "2. Go to the MCP Servers panel"
echo "3. Click 'Add MCP Server'"
echo "4. Use these settings:"
echo "   - Name: Calculator"
echo "   - Command: node"
echo "   - Arguments: $(pwd)/dist/index.js"
echo ""
echo "The server will start automatically when you connect to it!"