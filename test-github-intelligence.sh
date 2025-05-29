#!/bin/bash
# Test script for GitHub-based MCP server intelligence

echo "Testing GitHub MCP Server Intelligence"
echo "====================================="

# Test 1: Direct GitHub analysis (official MCP server)
echo -e "\n1. Testing Official MCP Server GitHub Analysis..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    "type": "natural_language"
  }' | jq '.'

# Test 2: Complex path analysis (sequential thinking)
echo -e "\n2. Testing Sequential Thinking Server..."
curl -X POST http://localhost:3000/api/mcp/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Add the server from https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
    "type": "natural_language"
  }' | jq '.'

# Test 3: GitHub analysis API directly
echo -e "\n3. Testing GitHub Analysis API..."
curl -X POST http://localhost:3000/api/mcp/github-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/modelcontextprotocol/servers/tree/main/src/memory"
  }' | jq '.'

# Test 4: With search results
echo -e "\n4. Testing with Search Results..."
curl -X POST http://localhost:3000/api/mcp/github-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    "searchResults": {
      "results": [
        {
          "title": "MCP Puppeteer Server",
          "snippet": "Install with: npx -y @modelcontextprotocol/server-puppeteer",
          "url": "https://example.com"
        }
      ]
    }
  }' | jq '.'

echo -e "\nTests completed!"