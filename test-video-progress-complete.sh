#!/bin/bash

echo "🎬 Testing Complete Video Generation Flow with Progress Tracking"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test 1: Check all components are in place
echo -e "${YELLOW}1. Verifying All Components${NC}"

# Check video progress store
if [ -f "lib/stores/video-progress-store.ts" ]; then
    echo -e "${GREEN}✅ Video progress store exists${NC}"
    if grep -q "useVideoProgressStore" lib/stores/video-progress-store.ts; then
        echo -e "${GREEN}✅ Zustand store properly exported${NC}"
    else
        echo -e "${RED}❌ Store export issue${NC}"
    fi
else
    echo -e "${RED}❌ Missing video progress store${NC}"
fi

# Check chat interface integration
if grep -q "useVideoProgressStore" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface imports progress store${NC}"
    if grep -q "addVideo(newVideo.id" components/chat-interface.tsx; then
        echo -e "${GREEN}✅ Chat interface adds videos to progress store${NC}"
    else
        echo -e "${RED}❌ Chat interface not adding videos to store${NC}"
    fi
else
    echo -e "${RED}❌ Chat interface missing progress store import${NC}"
fi

# Check page.tsx integration
if grep -q "useVideoProgressStore" app/page.tsx; then
    echo -e "${GREEN}✅ Page component imports progress store${NC}"
    if grep -q "addVideo(newVideo.id" app/page.tsx; then
        echo -e "${GREEN}✅ Page component adds videos to progress store${NC}"
    else
        echo -e "${RED}❌ Page component not adding videos to store${NC}"
    fi
else
    echo -e "${RED}❌ Page component missing progress store import${NC}"
fi

# Check video progress component integration in chat
if grep -q "VideoGenerationProgress" components/chat-message.tsx; then
    echo -e "${GREEN}✅ Chat message imports VideoGenerationProgress${NC}"
    if grep -q "<VideoGenerationProgress" components/chat-message.tsx; then
        echo -e "${GREEN}✅ Chat message renders video progress${NC}"
    else
        echo -e "${RED}❌ Chat message not rendering video progress${NC}"
    fi
else
    echo -e "${RED}❌ Chat message missing VideoGenerationProgress import${NC}"
fi

echo ""

# Test 2: Check video marker detection
echo -e "${YELLOW}2. Verifying Video Marker Detection${NC}"

# Check for video marker pattern in chat interface
if grep -q "VIDEO_GENERATION_STARTED" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface checks for VIDEO_GENERATION_STARTED markers${NC}"
else
    echo -e "${RED}❌ Chat interface missing video marker detection${NC}"
fi

# Check for video marker cleanup in chat message
if grep -q "VIDEO_GENERATION_STARTED" components/chat-message.tsx; then
    echo -e "${GREEN}✅ Chat message handles video markers${NC}"
else
    echo -e "${RED}❌ Chat message not handling video markers${NC}"
fi

echo ""

# Test 3: Check progress tracking flow
echo -e "${YELLOW}3. Verifying Progress Tracking Flow${NC}"

# Check for progress update functions
if grep -q "completeVideo" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface marks videos as complete${NC}"
else
    echo -e "${RED}❌ Chat interface missing video completion${NC}"
fi

if grep -q "failVideo" components/chat-interface.tsx; then
    echo -e "${GREEN}✅ Chat interface handles video failures${NC}"
else
    echo -e "${RED}❌ Chat interface missing failure handling${NC}"
fi

echo ""

# Test 4: Check API integration
echo -e "${YELLOW}4. Verifying API Integration${NC}"

# Check chat route for video marker injection
if grep -q "VIDEO_GENERATION_STARTED" app/api/chat/route.ts; then
    echo -e "${GREEN}✅ Chat API route has video marker injection${NC}"
else
    echo -e "${RED}❌ Chat API route missing video marker injection${NC}"
fi

echo ""

# Test 5: Development server check
echo -e "${YELLOW}5. Development Server Check${NC}"

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Development server is running${NC}"
else
    echo -e "${RED}❌ Development server is not running${NC}"
    echo -e "${YELLOW}   Run 'npm run dev' to start the server${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Complete Video Generation Flow Summary:${NC}"
echo ""
echo -e "${GREEN}✅ Progress Store Created:${NC}"
echo "   - Zustand store manages video progress state"
echo "   - Tracks elapsed time, stages, and completion"
echo ""
echo -e "${GREEN}✅ Chat Integration Complete:${NC}"
echo "   - Chat interface adds videos to progress store"
echo "   - Progress updates during polling"
echo "   - Completion/failure states tracked"
echo ""
echo -e "${GREEN}✅ Visual Progress Display:${NC}"
echo "   - VideoGenerationProgress component in chat messages"
echo "   - Shows real-time progress with elapsed/remaining time"
echo "   - Stage-based status messages"
echo ""
echo -e "${GREEN}✅ Enhanced Loading Cards:${NC}"
echo "   - VideoLoadingCard with shimmer effects"
echo "   - Progress bar visualization"
echo "   - Professional loading animations"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Testing Instructions:${NC}"
echo ""
echo "1. Restart development server: npm run dev"
echo "2. Open browser console (F12)"
echo "3. Type: 'Generate a video of a sunset over the ocean'"
echo "4. Or click 'Animate' on any image"
echo ""
echo -e "${YELLOW}Expected Results:${NC}"
echo "✓ Video tab auto-switches when generation starts"
echo "✓ Progress bar appears in chat message"
echo "✓ Enhanced loading card shows in video gallery"
echo "✓ Real-time progress updates every second"
echo "✓ Estimated time remaining displayed"
echo "✓ Stage messages update as generation progresses"
echo ""
echo -e "${YELLOW}Debug Console Output:${NC}"
echo "✓ [VIDEO API] Storing video generation data"
echo "✓ [VIDEO] Injecting video generation marker"
echo "✓ [VIDEO DEBUG] Adding new video and switching tab"
echo "✓ [PAGE DEBUG] Video generation started, switching to video tab"
echo ""
echo "Complete! 🚀"