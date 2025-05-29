#!/bin/bash

echo "Testing MCP Tools Integration..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test the MCP initialization endpoint
echo -e "\n${YELLOW}1. Testing MCP initialization...${NC}"
response=$(curl -s http://localhost:3003/api/mcp/init)
echo "$response" | jq '.' || echo "$response"

# Test getting server list
echo -e "\n${YELLOW}2. Testing server list...${NC}"
servers=$(curl -s http://localhost:3003/api/mcp/servers)
echo "$servers" | jq '.' || echo "$servers"

# Test a context7 documentation query
echo -e "\n${YELLOW}3. Testing context7 documentation query...${NC}"
echo "Sending request for React documentation..."

# Use a timeout and capture streaming response
timeout 15s curl -N -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Tell me about React library"}
    ]
  }' 2>/dev/null | while IFS= read -r line; do
    # Parse the streaming response
    if [[ $line =~ ^0:\"(.*)\"$ ]]; then
      # Extract the content from the data stream format
      content="${BASH_REMATCH[1]}"
      # Unescape the content
      content=$(echo -e "$content")
      echo -n "$content"
    elif [[ $line =~ ^d: ]]; then
      echo -e "\n${GREEN}[Stream completed]${NC}"
      break
    fi
done

echo -e "\n\n${YELLOW}4. Testing another context7 query...${NC}"
echo "Sending request for Express.js documentation..."

timeout 15s curl -N -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is Express.js?"}
    ]
  }' 2>/dev/null | while IFS= read -r line; do
    if [[ $line =~ ^0:\"(.*)\"$ ]]; then
      content="${BASH_REMATCH[1]}"
      content=$(echo -e "$content")
      echo -n "$content"
    elif [[ $line =~ ^d: ]]; then
      echo -e "\n${GREEN}[Stream completed]${NC}"
      break
    fi
done

echo -e "\n\n${GREEN}Test complete!${NC}"