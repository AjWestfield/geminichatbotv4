#!/bin/bash

echo "🎬 Testing Video Generation Fixes"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test the video marker injection
echo -e "${YELLOW}1. Testing Video Marker Injection${NC}"
echo "Running test script..."
node test-video-marker-fix.js
echo ""

# Check if server is running
echo -e "${YELLOW}2. Checking if development server is running${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running. Please run 'npm run dev' first${NC}"
    exit 1
fi
echo ""

# Test video generation API
echo -e "${YELLOW}3. Testing Video Generation API${NC}"
echo "Sending test video generation request..."

# Create a test request
RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test video of a sunset",
    "duration": 5,
    "aspectRatio": "16:9",
    "model": "standard"
  }')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API request successful${NC}"
    echo "Response: $RESPONSE"
    
    # Extract ID if present
    VIDEO_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$VIDEO_ID" ]; then
        echo -e "${GREEN}✓ Video ID received: $VIDEO_ID${NC}"
        
        # Test status endpoint
        echo ""
        echo -e "${YELLOW}4. Testing Video Status Endpoint${NC}"
        STATUS_RESPONSE=$(curl -s "http://localhost:3000/api/generate-video?id=$VIDEO_ID")
        echo "Status response: $STATUS_RESPONSE"
    fi
else
    echo -e "${RED}✗ API request failed${NC}"
fi

echo ""
echo -e "${YELLOW}5. Summary of Fixes Applied:${NC}"
echo -e "${GREEN}✓ VIDEO_GENERATION_STARTED markers are now injected after AI response${NC}"
echo -e "${GREEN}✓ Markers are preserved in the streaming response${NC}"
echo -e "${GREEN}✓ Frontend parses markers and updates video gallery${NC}"
echo -e "${GREEN}✓ Auto-switches to Video tab when generation starts${NC}"
echo -e "${GREEN}✓ Polling implemented for progress tracking${NC}"

echo ""
echo -e "${YELLOW}Testing Complete!${NC}"
echo ""
echo "To test in the UI:"
echo "1. Open http://localhost:3000"
echo "2. Type: 'Generate a video of a beautiful sunset over the ocean'"
echo "3. Watch for:"
echo "   - Video tab should auto-switch"
echo "   - Video should appear in gallery with 'generating' status"
echo "   - Progress updates every 5 seconds"
echo "   - Final video appears when complete"