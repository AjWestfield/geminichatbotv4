#!/bin/bash

echo "Testing GitHub URL MCP Intelligence Feature Fix - v2"
echo "=================================================="
echo ""

# Kill any existing process on port 3000
echo "Stopping any existing dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start the development server in the background
echo "Starting development server..."
npm run dev > dev.log 2>&1 &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null; then
    echo "Server is ready!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# Function to test GitHub URL processing
test_github_url() {
  local test_name=$1
  local github_url=$2
  
  echo ""
  echo "Test: $test_name"
  echo "GitHub URL: $github_url"
  echo "-------------------"
  
  # Send request to chat API
  RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [
        {
          "id": "test-1",
          "role": "user",
          "content": "Please analyze this GitHub repository and add the MCP server: '"$github_url"'"
        }
      ],
      "model": "gemini-2.5-flash-preview-05-20"
    }')
  
  echo "Response preview:"
  echo "$RESPONSE" | head -n 50
  echo ""
  
  # Check for errors
  if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error detected in response"
    echo "$RESPONSE" | grep -i "error" | head -n 5
  elif echo "$RESPONSE" | grep -q "Successfully analyzed"; then
    echo "✅ GitHub analysis successful!"
  elif echo "$RESPONSE" | grep -q "TOOL_CALL"; then
    echo "✅ Tool call initiated for search"
  else
    echo "⚠️ Unexpected response format"
  fi
}

# Test 1: Sequential Thinking Server
test_github_url "Sequential Thinking Server" \
  "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking"

# Test 2: Filesystem Server
test_github_url "Filesystem Server" \
  "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem"

# Test 3: GitHub Server
test_github_url "GitHub Server" \
  "https://github.com/modelcontextprotocol/servers/tree/main/src/github"

echo ""
echo "=================================================="
echo "Testing direct MCP analyze endpoint..."
echo ""

# Test the analyze endpoint directly
ANALYZE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Please add the filesystem MCP server",
    "type": "natural_language"
  }')

echo "Analyze endpoint response:"
echo "$ANALYZE_RESPONSE" | jq . 2>/dev/null || echo "$ANALYZE_RESPONSE"

echo ""
echo "=================================================="
echo "Checking server logs for errors..."
echo ""
tail -n 50 dev.log | grep -E "(ERROR|error|TypeError|ReferenceError)" || echo "No errors found in logs"

echo ""
echo "=================================================="
echo "Test Summary"
echo "=================================================="
echo ""
echo "1. Check if 'mcpManager.getAvailableTools' error is fixed"
echo "2. Check if Google API key error is resolved"
echo "3. Check if [TOOL_CALL] blocks are properly generated"
echo "4. Check if GitHub URL analysis works end-to-end"
echo ""

# Cleanup
echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null || true

echo "Test complete!"