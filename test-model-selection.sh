#!/bin/bash

echo "🧪 Testing Image Model Selection..."
echo "===================================="

# Test WaveSpeed (standard quality)
echo ""
echo "1. Testing WaveSpeed AI (Standard Quality)..."
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a simple test image for WaveSpeed",
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024"
  }' | jq '.metadata.model, .metadata.provider'

# Test GPT-Image-1 (HD quality)
echo ""
echo "2. Testing GPT-Image-1 (HD Quality)..."
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a simple test image for GPT-Image-1",
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }' | jq '.metadata.model, .metadata.provider'

echo ""
echo "===================================="
echo "✅ Test complete! Check the model names above."
echo ""
echo "Expected results:"
echo "- Standard quality → 'flux-dev-ultra-fast' (wavespeed)"
echo "- HD quality → 'gpt-image-1' (openai)"
