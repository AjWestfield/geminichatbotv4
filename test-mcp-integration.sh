#!/bin/bash

echo "Testing MCP Integration"
echo "======================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3003"

# Test server configuration
SERVER_ID="test-calc-$(date +%s)"
SERVER_CONFIG='{
  "id": "'$SERVER_ID'",
  "name": "Test Calculator",
  "command": "node",
  "args": ["'$(pwd)'/example-servers/calculator/dist/index.js"]
}'

echo -e "\n${YELLOW}1. Adding MCP Server${NC}"
echo "Server ID: $SERVER_ID"
ADD_RESPONSE=$(curl -s -X POST $BASE_URL/api/mcp/servers \
  -H "Content-Type: application/json" \
  -d "$SERVER_CONFIG")
echo "Response: $ADD_RESPONSE"

# Wait a moment
sleep 1

echo -e "\n${YELLOW}2. Listing all servers${NC}"
LIST_RESPONSE=$(curl -s -X GET $BASE_URL/api/mcp/servers)
echo "Response: $LIST_RESPONSE" | jq '.'

echo -e "\n${YELLOW}3. Connecting to server${NC}"
CONNECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/mcp/servers/$SERVER_ID/connect)
echo "Response: $CONNECT_RESPONSE"

# Wait for connection
sleep 2

echo -e "\n${YELLOW}4. Listing tools${NC}"
TOOLS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/mcp/tools?serverId=$SERVER_ID")
echo "Response: $TOOLS_RESPONSE" | jq '.'

echo -e "\n${YELLOW}5. Executing a tool (add 5 + 3)${NC}"
EXECUTE_RESPONSE=$(curl -s -X POST $BASE_URL/api/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "'$SERVER_ID'",
    "toolName": "add",
    "arguments": {
      "a": 5,
      "b": 3
    }
  }')
echo "Response: $EXECUTE_RESPONSE" | jq '.'

echo -e "\n${YELLOW}6. Disconnecting from server${NC}"
DISCONNECT_RESPONSE=$(curl -s -X DELETE $BASE_URL/api/mcp/servers/$SERVER_ID/connect)
echo "Response: $DISCONNECT_RESPONSE"

echo -e "\n${YELLOW}7. Removing server${NC}"
REMOVE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/mcp/servers?serverId=$SERVER_ID")
echo "Response: $REMOVE_RESPONSE"

echo -e "\n${GREEN}Test complete!${NC}"
echo -e "${BLUE}Check the server logs for any errors or stderr output.${NC}"