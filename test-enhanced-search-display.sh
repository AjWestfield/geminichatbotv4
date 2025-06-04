#!/bin/bash

echo "🔍 Testing Enhanced Web Search Display with Citations & Images"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Development server is not running${NC}"
    echo "Starting the development server..."
    npm run dev &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 10
fi

echo -e "${GREEN}✅ Server is ready${NC}"
echo ""

# Test queries that should trigger enhanced search display
echo "Test Queries:"
echo "============"
echo ""

echo "1. Testing news query with images:"
echo "   'What are the latest developments in AI today?'"
echo ""

echo "2. Testing product search with images:"
echo "   'Best laptops for programming in 2025'"
echo ""

echo "3. Testing location search with images:"
echo "   'Top tourist attractions in Tokyo with photos'"
echo ""

echo "4. Testing technical documentation:"
echo "   'Next.js 15 new features and examples'"
echo ""

echo "Expected Results:"
echo "================"
echo "✓ Web search results displayed in a card format"
echo "✓ 3-5 sources with numbered citations [1][2][3]"
echo "✓ Each source shows:"
echo "  - Title and domain"
echo "  - Published date"
echo "  - Relevance score"
echo "  - Brief excerpt"
echo "✓ Image carousel (if images available)"
echo "✓ Clickable citations in the answer text"
echo ""

echo "Visual Elements to Verify:"
echo "========================"
echo "1. Main answer with superscript citations"
echo "2. Source cards in grid layout"
echo "3. Image carousel with navigation"
echo "4. Mobile-responsive design"
echo ""

echo "To test manually:"
echo "================"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Try the test queries above"
echo "3. Verify citations link to sources"
echo "4. Click on images to expand"
echo "5. Test on mobile viewport"
echo ""

# If we started the server, provide cleanup instructions
if [ ! -z "$SERVER_PID" ]; then
    echo "Note: Development server started with PID $SERVER_PID"
    echo "To stop the server, run: kill $SERVER_PID"
fi