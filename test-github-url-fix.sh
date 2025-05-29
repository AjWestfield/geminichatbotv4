#!/bin/bash
# Test the GitHub URL MCP server intelligence fix

echo "Testing GitHub URL MCP Server Fix"
echo "================================="

# Test with sequential thinking server
echo -e "\n1. Testing Sequential Thinking Server from GitHub..."
curl -X POST http://localhost:3003/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
    "type": "natural_language"
  }' | jq '.'

# Test with filesystem server  
echo -e "\n2. Testing Filesystem Server from GitHub..."
curl -X POST http://localhost:3003/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Add the server from https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    "type": "natural_language"
  }' | jq '.'

echo -e "\nTests completed!"