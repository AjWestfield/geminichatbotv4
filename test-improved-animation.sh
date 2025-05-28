#!/bin/bash

# Test Improved Image Generation Animation

echo "🎨 Testing Improved Image Generation Animation"
echo "============================================="
echo ""

# Check if API keys are set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$WAVESPEED_API_KEY" ]; then
    echo "⚠️  Warning: No API keys found for image generation"
    echo "   Set either OPENAI_API_KEY or WAVESPEED_API_KEY"
    echo ""
fi

# Test standard quality (WaveSpeed)
echo "1. Testing Standard Quality (WaveSpeed AI)..."
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a serene mountain landscape at sunset",
    "originalPrompt": "Generate an image of a serene mountain landscape at sunset", 
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024",
    "n": 1
  }' | jq '.'

echo ""
echo "2. Testing HD Quality (GPT-Image-1)..."
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a futuristic city with flying cars",
    "originalPrompt": "Generate an image of a futuristic city with flying cars",
    "quality": "hd",
    "style": "vivid", 
    "size": "1024x1024",
    "n": 1
  }' | jq '.'

echo ""
echo "✅ Test complete! Check the browser to see the animation."
echo ""
echo "Expected behavior:"
echo "- Smooth reveal animation from top to bottom"
echo "- No glitches or stuttering"
echo "- Proper status text updates"
echo "- Clean transition when image loads"