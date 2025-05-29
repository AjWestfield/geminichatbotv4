#!/bin/bash

echo "MCP Server Status Debug"
echo "======================"

# Check MCP initialization
echo -e "\n1. MCP Init Status:"
curl -s http://localhost:3003/api/mcp/init | jq '.'

# Check server list
echo -e "\n2. Server List:"
curl -s http://localhost:3003/api/mcp/servers | jq '.'

# Check MCP config file
echo -e "\n3. MCP Config File:"
if [ -f "mcp.config.json" ]; then
    cat mcp.config.json | jq '.'
else
    echo "No mcp.config.json found"
fi

echo -e "\nDebug complete!"