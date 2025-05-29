#!/bin/bash

echo "Testing MCP JSON Import Fix"
echo "==========================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test different JSON formats
echo -e "\n${YELLOW}Test 1: Claude Desktop format${NC}"
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-claude-desktop",
    "name": "Test Claude Desktop",
    "command": "node",
    "args": ["test-server.js"]
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n${YELLOW}Test 2: Simple server config${NC}"
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-simple",
    "name": "Simple Server",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n${YELLOW}Test 3: Server with environment variables${NC}"
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-env",
    "name": "Server with Env",
    "command": "node",
    "args": ["server.js"],
    "env": {
      "API_KEY": "test-key",
      "PORT": "3000"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n${YELLOW}Test 4: List all servers${NC}"
curl -X GET http://localhost:3000/api/mcp/servers \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n${GREEN}Test complete!${NC}"
echo "Check the browser console and server logs for any localStorage errors."