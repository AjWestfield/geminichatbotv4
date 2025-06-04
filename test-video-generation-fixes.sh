#!/bin/bash

echo "🎬 Testing Video Generation Fixes - Complete Suite"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check all file modifications
echo -e "${YELLOW}1. Verifying File Modifications${NC}"

# Check chat route modifications
if grep -q "console.log.*VIDEO API.*Storing video generation data" app/api/chat/route.ts; then
    echo -e "${GREEN}✅ Chat route: Video data storage logging added${NC}"
else
    echo -e "${RED}❌ Chat route: Missing video data storage logging${NC}"
fi

if grep -q "if (videoGenerationData)" app/api/chat/route.ts; then
    echo -e "${GREEN}✅ Chat route: Video marker injection code present${NC}"
else
    echo -e "${RED}❌ Chat route: Missing video marker injection${NC}"
fi

# Check chat interface modifications
if grep -q "console.log.*VIDEO DEBUG.*Checking last message" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface: Debug logging added${NC}"
else
    echo -e "${RED}❌ Chat interface: Missing debug logging${NC}"
fi

if grep -q "onVideoGenerationStart\?" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface: Video generation callback added${NC}"
else
    echo -e "${RED}❌ Chat interface: Missing video generation callback${NC}"
fi

# Check page.tsx modifications
if grep -q "console.log.*PAGE DEBUG.*Video generation started" app/page.tsx; then
    echo -e "${GREEN}✅ Page: Tab switch logging added${NC}"
else
    echo -e "${RED}❌ Page: Missing tab switch logging${NC}"
fi

echo ""

# Test 2: Check new files
echo -e "${YELLOW}2. Verifying New Components${NC}"

if [ -f "lib/video-progress-tracker.ts" ]; then
    echo -e "${GREEN}✅ Video progress tracker created${NC}"
else
    echo -e "${RED}❌ Missing video progress tracker${NC}"
fi

if [ -f "hooks/use-video-progress.ts" ]; then
    echo -e "${GREEN}✅ useVideoProgress hook created${NC}"
else
    echo -e "${RED}❌ Missing useVideoProgress hook${NC}"
fi

if [ -f "components/video-generation-progress.tsx" ]; then
    echo -e "${GREEN}✅ Video generation progress component created${NC}"
else
    echo -e "${RED}❌ Missing video generation progress component${NC}"
fi

if [ -f "components/video-loading-card.tsx" ]; then
    echo -e "${GREEN}✅ Video loading card component created${NC}"
else
    echo -e "${RED}❌ Missing video loading card component${NC}"
fi

echo ""

# Test 3: Check shimmer animation
echo -e "${YELLOW}3. Verifying CSS Animations${NC}"

if grep -q "@keyframes shimmer" app/globals.css; then
    echo -e "${GREEN}✅ Shimmer animation added to CSS${NC}"
else
    echo -e "${RED}❌ Missing shimmer animation in CSS${NC}"
fi

echo ""

# Test 4: Server check
echo -e "${YELLOW}4. Development Server Check${NC}"

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Development server is running${NC}"
else
    echo -e "${RED}❌ Development server is not running${NC}"
    echo -e "${YELLOW}   Run 'npm run dev' to start the server${NC}"
fi

echo ""

# Test 5: API key check
echo -e "${YELLOW}5. Environment Configuration${NC}"

if [ -f ".env.local" ]; then
    if grep -q "REPLICATE_API_KEY" .env.local; then
        echo -e "${GREEN}✅ REPLICATE_API_KEY is configured${NC}"
    else
        echo -e "${RED}❌ REPLICATE_API_KEY is missing in .env.local${NC}"
    fi
else
    echo -e "${RED}❌ .env.local file not found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Summary of Fixes Applied:${NC}"
echo ""
echo -e "${GREEN}✅ Auto-Tab Switching:${NC}"
echo "   - Added debug logging to track flow"
echo "   - Fixed callback implementation"
echo "   - Tab should switch when video generation starts"
echo ""
echo -e "${GREEN}✅ Progress Tracking:${NC}"
echo "   - Created VideoProgressTracker class"
echo "   - Estimates progress based on elapsed time"
echo "   - Shows stage-based status messages"
echo ""
echo -e "${GREEN}✅ Visual Enhancements:${NC}"
echo "   - Enhanced loading card with progress bar"
echo "   - Shimmer effects on loading states"
echo "   - Real-time progress updates"
echo ""
echo -e "${GREEN}✅ Chat Integration:${NC}"
echo "   - Video progress component for chat messages"
echo "   - Can be added to show inline progress"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Testing Instructions:${NC}"
echo ""
echo "1. Restart your development server: npm run dev"
echo "2. Open browser console (F12)"
echo "3. Type: 'Generate a video of a beautiful sunset over the ocean'"
echo ""
echo -e "${YELLOW}Expected Behavior:${NC}"
echo "✓ Console shows: [VIDEO API] Storing video generation data"
echo "✓ Console shows: [VIDEO] Injecting video generation marker"
echo "✓ Console shows: [VIDEO DEBUG] Checking last message"
echo "✓ Console shows: [PAGE DEBUG] Video generation started"
echo "✓ Video tab auto-switches"
echo "✓ Video appears with enhanced loading card"
echo "✓ Progress bar shows estimated completion"
echo ""
echo -e "${YELLOW}If auto-switch still doesn't work:${NC}"
echo "1. Check if VIDEO_GENERATION_STARTED marker appears in console"
echo "2. Check for any JavaScript errors"
echo "3. Verify the marker is being parsed correctly"
echo ""
echo "Complete! 🚀"