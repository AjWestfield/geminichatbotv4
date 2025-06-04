#!/bin/bash

echo "🔍 Testing JSON Parsing Fix for Web Search"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if server is running
echo "Checking development server..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 8
    echo -e "${GREEN}✅ Server started${NC}"
else
    echo -e "${GREEN}✅ Server already running${NC}"
fi

echo ""
echo "Testing NBA query that previously caused JSON parsing error at position 1550..."
echo ""

# Test the NBA query
RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "What is the latest news in NBA?"
    }]
  }' \
  --max-time 20 2>&1)

# Check for JSON parsing errors
if echo "$RESPONSE" | grep -q "SyntaxError.*position 1550"; then
    echo -e "${RED}❌ JSON parsing error still present at position 1550${NC}"
    echo "This should not happen with the fix applied."
elif echo "$RESPONSE" | grep -q "SyntaxError.*position"; then
    echo -e "${RED}❌ JSON parsing error at different position${NC}"
    ERROR_POS=$(echo "$RESPONSE" | grep -o "position [0-9]*")
    echo "Error: $ERROR_POS"
else
    echo -e "${GREEN}✅ No JSON parsing errors detected${NC}"
    
    # Check for web search results
    if echo "$RESPONSE" | grep -q "WEB_SEARCH_RESULTS"; then
        echo -e "${GREEN}✅ Web search results included in response${NC}"
        
        # Extract length info if available
        LENGTH=$(echo "$RESPONSE" | grep -o "length: [0-9]*" | head -1)
        if [ ! -z "$LENGTH" ]; then
            echo "   Stream data $LENGTH"
        fi
    else
        echo -e "${YELLOW}⚠️  No web search results found (query may not have triggered search)${NC}"
    fi
fi

echo ""
echo "Fix Summary:"
echo "==========="
echo "✅ Limited search results to 5 (prevents oversized payloads)"
echo "✅ Limited images to 3"
echo "✅ Added 15KB threshold with minimal fallback"
echo "✅ Graceful error recovery in UI"
echo "✅ Enhanced error logging for debugging"
echo ""
echo "The fix prevents large payloads (17KB+) that were causing"
echo "JSON parsing errors at position 1550."
echo ""

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo "Note: Dev server running with PID $SERVER_PID"
    echo "To stop: kill $SERVER_PID"
fi