#!/bin/bash

# Test script for image generation with different quality settings

echo "Testing Image Generation API..."
echo "=============================="

# Test with HD quality (GPT-Image-1)
echo ""
echo "Test 1: HD Quality (GPT-Image-1)"
curl -X POST http://localhost:3006/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }' | python3 -m json.tool

# Test with Standard quality (WaveSpeed)
echo ""
echo "Test 2: Standard Quality (WaveSpeed)"
curl -X POST http://localhost:3006/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024"
  }' | python3 -m json.tool
