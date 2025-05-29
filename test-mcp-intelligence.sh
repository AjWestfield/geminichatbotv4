#!/bin/bash
# Test script for intelligent MCP context awareness

echo "Testing Intelligent MCP Context Awareness"
echo "========================================"

# Test 1: JSON correction
echo -e "\n1. Testing JSON Correction..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "{\"name\": \"filesystem\", \"command\": \"npx\"}",
    "type": "json"
  }' | jq '.'

# Test 2: Natural language processing
echo -e "\n2. Testing Natural Language Processing..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Add the github MCP server",
    "type": "natural_language"
  }' | jq '.'

# Test 3: Claude Desktop format
echo -e "\n3. Testing Claude Desktop Format..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "{\"mcpServers\": {\"filesystem\": {\"command\": \"npx\", \"args\": [\"-y\", \"@modelcontextprotocol/server-filesystem\"]}}}",
    "type": "json"
  }' | jq '.'

# Test 4: Malformed JSON correction
echo -e "\n4. Testing Malformed JSON Correction..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "name: context7, url: context7.ai/api/mcp/v1, apiKey: required",
    "type": "json"
  }' | jq '.'

echo -e "\nTests completed!"