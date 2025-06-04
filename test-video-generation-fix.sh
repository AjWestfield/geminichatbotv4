#!/bin/bash

echo "Testing Video Generation Fix..."
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Start the dev server
echo -e "${YELLOW}Starting development server...${NC}"
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}Server failed to start${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}Server started successfully${NC}"

# Instructions for manual testing
echo ""
echo -e "${YELLOW}Manual Testing Instructions:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open the browser console (F12)"
echo "3. Try generating a video with a prompt like:"
echo "   'Generate a 5 second video of a cat playing with a ball'"
echo ""
echo "4. Look for these console logs:"
echo "   - [VIDEO] Video generation API response"
echo "   - [VIDEO] Direct video generation succeeded"
echo "   - [VIDEO] Cleaned response contains VIDEO_GENERATION_STARTED"
echo "   - [Chat Interface] Message contains VIDEO_GENERATION"
echo "   - [Chat Interface] Successfully parsed video generation data"
echo ""
echo "5. Check if the video appears in the Video tab"
echo ""
echo "Press Ctrl+C to stop the server when done testing..."

# Wait for user to stop
wait $SERVER_PID