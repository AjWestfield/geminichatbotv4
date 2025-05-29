#!/bin/bash

echo "Testing Final MCP Fixes"
echo "======================="
echo ""

# Kill any existing process on port 3003
echo "Stopping any existing dev server..."
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
sleep 2

# Start the development server in the background
echo "Starting development server..."
npm run dev > dev.log 2>&1 &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3003 > /dev/null; then
    echo "Server is ready!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo ""
echo "Test 1: Incomplete JSON Correction"
echo "---------------------------------"

# The exact JSON from the user's screenshot
INCOMPLETE_JSON='{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",'

# Test the analyze endpoint
RESPONSE=$(curl -s -X POST http://localhost:3003/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg json "$INCOMPLETE_JSON" '{input: $json, type: "json"}')")

echo "Response:"
echo "$RESPONSE" | jq .

# Check if it was corrected
if echo "$RESPONSE" | grep -q "correctedJSON"; then
  echo "✅ JSON correction successful!"
  echo "Corrected configuration:"
  echo "$RESPONSE" | jq .correctedJSON
else
  echo "❌ JSON correction failed"
fi

echo ""
echo "Test 2: GitHub URL Analysis"
echo "---------------------------"

# Test GitHub URL processing
GITHUB_RESPONSE=$(curl -s -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "id": "test-1",
      "role": "user",
      "content": "Please analyze this GitHub repository and add the MCP server: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking"
    }],
    "model": "gemini-2.5-flash-preview-05-20"
  }')

echo "GitHub analysis response preview:"
echo "$GITHUB_RESPONSE" | head -100

# Check for errors
if echo "$GITHUB_RESPONSE" | grep -q "GOOGLE_GENERATIVE_AI_API_KEY"; then
  echo "❌ Still has API key error!"
elif echo "$GITHUB_RESPONSE" | grep -q "Successfully analyzed"; then
  echo "✅ GitHub analysis successful!"
elif echo "$GITHUB_RESPONSE" | grep -q "TOOL_CALL"; then
  echo "✅ Tool call generated for search"
else
  echo "⚠️ Check response manually"
fi

echo ""
echo "Test 3: Check Logs for Errors"
echo "-----------------------------"
echo "Recent error logs:"
tail -50 dev.log | grep -E "ERROR|error|AI_LoadAPIKeyError|GOOGLE_GENERATIVE_AI" || echo "No errors found"

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo ""
echo "1. Incomplete JSON should now auto-complete successfully"
echo "2. API key errors should be resolved (using GEMINI_API_KEY)"
echo "3. GitHub URL analysis should work properly"
echo ""

# Cleanup
echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null || true

echo "Test complete!"