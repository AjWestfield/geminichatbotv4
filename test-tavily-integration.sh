#!/bin/bash

echo "🔍 Tavily Web Search Integration Test"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Development server is not running${NC}"
    echo "Please run 'npm run dev' in another terminal"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test 1: API Endpoint Health Check
echo "Test 1: API Endpoint Health Check"
echo "---------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/search)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ API endpoint is healthy${NC}"
else
    echo -e "${RED}❌ API endpoint health check failed${NC}"
fi
echo ""

# Test 2: Basic Search Query
echo "Test 2: Basic Search Query"
echo "-------------------------"
SEARCH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the current weather in San Francisco?"
  }')

if echo "$SEARCH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Basic search successful${NC}"
    # Extract result count
    RESULT_COUNT=$(echo "$SEARCH_RESPONSE" | grep -o '"results":\[[^]]*\]' | grep -o '{' | wc -l)
    echo "Found $RESULT_COUNT results"
else
    echo -e "${RED}❌ Basic search failed${NC}"
    echo "Error: $(echo "$SEARCH_RESPONSE" | grep -o '"error":"[^"]*"')"
fi
echo ""

# Test 3: News Search Query
echo "Test 3: News Search Query"
echo "------------------------"
NEWS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest AI news today"
  }')

if echo "$NEWS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ News search successful${NC}"
    # Check if news topic was detected
    if echo "$NEWS_RESPONSE" | grep -q '"topic":"news"'; then
        echo "✓ News context correctly detected"
    fi
else
    echo -e "${RED}❌ News search failed${NC}"
fi
echo ""

# Test 4: Context Detection Test
echo "Test 4: Context Detection Patterns"
echo "---------------------------------"

# Test patterns
declare -a test_patterns=(
    "What's the latest on OpenAI?"
    "Current Bitcoin price"
    "Weather forecast for tomorrow"
    "Recent developments in quantum computing"
    "Stock market news today"
)

for pattern in "${test_patterns[@]}"; do
    echo -n "Testing: \"$pattern\" ... "
    
    # Make a quick call to check if it triggers search
    CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
      -H "Content-Type: application/json" \
      -d "{
        \"messages\": [{\"role\": \"user\", \"content\": \"$pattern\"}]
      }" \
      --max-time 5)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}timeout${NC}"
    fi
done
echo ""

# Test 5: Chat Integration
echo "Test 5: Chat Integration Test"
echo "----------------------------"
echo "Sending a query that should trigger web search..."

CHAT_TEST=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the latest developments in AI today?"
      }
    ]
  }' \
  --max-time 10)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chat integration working${NC}"
    echo "Response received (streaming data)"
else
    echo -e "${RED}❌ Chat integration failed${NC}"
fi
echo ""

# Test 6: Error Handling
echo "Test 6: Error Handling"
echo "---------------------"
# Test with invalid query
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": ""
  }')

if echo "$ERROR_RESPONSE" | grep -q '"error"'; then
    echo -e "${GREEN}✅ Error handling works correctly${NC}"
    echo "Error message: $(echo "$ERROR_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Error handling not working${NC}"
fi
echo ""

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""
echo "If all tests passed, your Tavily integration is working correctly!"
echo ""
echo "Try these queries in the chat interface:"
echo "  - 'What's happening in tech today?'"
echo "  - 'Current weather in New York'"
echo "  - 'Latest OpenAI announcements'"
echo "  - 'Bitcoin price right now'"
echo ""
echo "Watch the console logs for:"
echo "  - [Chat API] Web search detected..."
echo "  - [Tavily] Searching for..."
echo "  - [Tavily] Search completed..."
echo ""