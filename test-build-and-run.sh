#!/bin/bash

echo "Testing Build and Sequential Thinking Fix"
echo "========================================="
echo ""

# Kill any existing processes on ports
echo "Killing any existing processes on ports 3000-3003..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:3003 | xargs kill -9 2>/dev/null

echo ""
echo "Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "Starting the development server..."
echo "The server will start on an available port (3000-3003)"
echo ""
echo "Once started:"
echo "1. Open browser console (F12)"
echo "2. Send a test message: 'Think step by step about how to build an MCP server'"
echo "3. Watch for:"
echo "   - Tool execution in terminal"
echo "   - Tool results in UI"
echo "   - AI analysis after results"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev