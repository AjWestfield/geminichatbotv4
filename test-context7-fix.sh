#!/bin/bash

echo "Testing Context7 MCP Tool Fix"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test the MCP initialization
echo -e "\n${YELLOW}1. Checking MCP server status...${NC}"
curl -s http://localhost:3000/api/mcp/servers | jq '.'

# Test Context7 documentation query with explicit tool request
echo -e "\n${YELLOW}2. Testing Next.js documentation query with Context7...${NC}"
echo "Sending request..."

# Function to parse streaming response
parse_stream() {
    local buffer=""
    local in_tool_call=false
    
    while IFS= read -r line; do
        if [[ $line =~ ^0:\"(.*)\"$ ]]; then
            content="${BASH_REMATCH[1]}"
            # Unescape the content
            content=$(echo -e "$content")
            
            # Check for tool call markers
            if [[ $content == *"[TOOL_CALL]"* ]]; then
                in_tool_call=true
                echo -e "${GREEN}[Tool call detected]${NC}"
            fi
            
            if [[ $content == *"[/TOOL_CALL]"* ]]; then
                in_tool_call=false
                echo -e "${GREEN}[Tool call complete]${NC}"
            fi
            
            # Print the content
            echo -n "$content"
            
        elif [[ $line =~ ^d: ]]; then
            echo -e "\n${GREEN}[Stream completed]${NC}"
            break
        elif [[ $line =~ ^3: ]]; then
            echo -e "\n${RED}[Error in stream]${NC}"
            echo "$line"
            break
        fi
    done
}

# Test with proper Context7 request
timeout 20s curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "Use the context7 MCP to get the latest documentation for Next.js"
      }
    ]
  }' 2>/dev/null | parse_stream

echo -e "\n\n${YELLOW}3. Testing simple library query...${NC}"

timeout 20s curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "Tell me about React hooks using context7"
      }
    ]
  }' 2>/dev/null | parse_stream

echo -e "\n\n${GREEN}Test complete!${NC}"