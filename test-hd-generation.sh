#!/bin/bash

# Test script to verify image generation with HD quality uses OpenAI

echo "Testing HD Quality Image Generation (Should use OpenAI DALL-E)"
echo "============================================================="

curl -X POST http://localhost:3007/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }' | python3 -c "
import sys
import json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print(f'❌ Error: {data[\"error\"]}')
        print(f'   Details: {data.get(\"details\", \"No details\")}')
    else:
        model = data.get('metadata', {}).get('model', 'Unknown')
        provider = data.get('metadata', {}).get('provider', 'Unknown')
        print(f'✅ Success!')
        print(f'   Model: {model}')
        print(f'   Provider: {provider}')
        print(f'   Image URL: {data[\"images\"][0][\"url\"][:50]}...')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"
