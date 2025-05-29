#!/bin/bash

# Test Smithery CLI HTTP transport integration

echo "Testing Smithery CLI HTTP Transport Integration"
echo "=============================================="

# Test configuration
cat > test-smithery-config.json << 'EOF'
{
  "name": "Smithery CLI Test",
  "transportType": "http",
  "url": "https://server.smithery.ai/cli",
  "apiKey": "test-api-key"
}
EOF

echo "Test configuration created:"
cat test-smithery-config.json
echo ""

# Test the MCP JSON parser
echo "Testing MCP JSON Parser with HTTP transport..."
node -e "
const { MCPJSONParser } = require('./lib/mcp/mcp-json-parser.ts');

try {
  const config = require('./test-smithery-config.json');
  const parsed = MCPJSONParser.parse(config);
  console.log('Parsed configuration:', JSON.stringify(parsed, null, 2));
  
  if (parsed[0].transportType === 'http' && parsed[0].url) {
    console.log('✓ HTTP transport correctly identified');
  } else {
    console.log('✗ HTTP transport not properly configured');
  }
} catch (error) {
  console.error('Error parsing configuration:', error.message);
}
"

# Clean up
rm -f test-smithery-config.json

echo ""
echo "Test complete!"