#!/bin/bash

# Test Fixed Image Reveal Animation

echo "🎨 Testing Fixed Image Reveal Animation"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting test...${NC}"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Development server is not running!${NC}"
    echo "   Please run: npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Development server is running${NC}"
echo ""

# Test with a simple prompt
echo "Testing image generation with fixed reveal animation..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cute robot waving hello",
    "originalPrompt": "Generate an image of a cute robot waving hello",
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024",
    "n": 1
  }')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Image generation API responded successfully${NC}"
    echo ""
    echo "Response details:"
    echo "$RESPONSE" | jq '{
      success: .success,
      model: .metadata.model,
      provider: .metadata.provider,
      imageUrl: .images[0].url | split("/") | last
    }'
else
    echo -e "${RED}❌ Image generation failed${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo "Expected behavior in the browser:"
echo "1. ✓ Status shows 'Getting started...' briefly"
echo "2. ✓ Status changes to 'Creating image. May take a moment...'"
echo "3. ✓ When image is ready, status shows 'Image ready! Revealing...'"
echo "4. ✓ Black overlay slides down smoothly from top to bottom (2 seconds)"
echo "5. ✓ Status changes to 'Image created.' when complete"
echo "6. ✓ Image is fully visible with no overlay"
echo ""
echo "Check the browser console for debug logs:"
echo "- '[ImageGeneration] Starting reveal animation'"
echo "- '[ImageGeneration] Reveal animation completed'"
echo "- '[ImageGeneration] Calling onComplete'"