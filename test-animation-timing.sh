#\!/bin/bash

echo "Testing Image Generation Animation Timing"
echo "========================================"
echo ""

# Test WaveSpeed (standard quality) - should complete in ~5 seconds
echo "1. Testing WaveSpeed AI (standard quality)..."
curl -X POST http://localhost:3007/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024"
  }' &

WAVESPEED_PID=$\!

# Test GPT-Image-1 (HD quality) - should take 40-60 seconds
echo "2. Testing GPT-Image-1 (HD quality)..."
curl -X POST http://localhost:3007/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a detailed portrait of a robot",
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }' &

GPT_PID=$\!

echo ""
echo "Waiting for both requests to complete..."
wait $WAVESPEED_PID
echo "WaveSpeed completed"
wait $GPT_PID
echo "GPT-Image-1 completed"

echo ""
echo "Test complete. Check the UI to verify:"
echo "- No nested button errors in console"
echo "- WaveSpeed animation runs for ~30 seconds total"
echo "- GPT-Image-1 animation continues until image is ready (90s timeout)"
echo "- Both show progressive reveal effect once image URL is available"
