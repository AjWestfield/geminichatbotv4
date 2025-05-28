#!/bin/bash

echo "🧪 Testing Image Model Selection Fix..."
echo "===================================="

# Clear localStorage to ensure fresh test
echo "Clearing localStorage..."
cat << 'EOF' > /tmp/clear-storage.js
localStorage.removeItem('imageGenerationQuality');
console.log('Cleared imageGenerationQuality from localStorage');
EOF

# Test with fresh state
echo ""
echo "1. Testing Default (should be HD/GPT-Image-1)..."
curl -s http://localhost:3005/ > /dev/null
sleep 1

# Now test model selection via API
echo ""
echo "2. Testing Model Selection via API..."
echo ""

# Test WaveSpeed (standard quality)
echo "Testing WaveSpeed AI (Standard Quality)..."
response1=$(curl -s -X POST http://localhost:3005/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test image for WaveSpeed",
    "quality": "standard",
    "style": "vivid",
    "size": "1024x1024"
  }')

model1=$(echo "$response1" | jq -r '.metadata.model // "Error"')
provider1=$(echo "$response1" | jq -r '.metadata.provider // "Error"')
echo "Result: Model=$model1, Provider=$provider1"

echo ""
# Test GPT-Image-1 (HD quality)
echo "Testing GPT-Image-1 (HD Quality)..."
response2=$(curl -s -X POST http://localhost:3005/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test image for GPT-Image-1",
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }')

model2=$(echo "$response2" | jq -r '.metadata.model // "Error"')
provider2=$(echo "$response2" | jq -r '.metadata.provider // "Error"')
echo "Result: Model=$model2, Provider=$provider2"

echo ""
echo "===================================="
echo "✅ Expected results:"
echo "   Standard quality → Model='flux-dev-ultra-fast', Provider='wavespeed'"
echo "   HD quality → Model='gpt-image-1', Provider='openai'"
echo ""
echo "⚠️  If you're still seeing the wrong model, try:"
echo "   1. Hard refresh the browser (Cmd+Shift+R)"
echo "   2. Open DevTools Console and check for state logs"
echo "   3. Clear localStorage completely and restart"
