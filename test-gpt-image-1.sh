#!/bin/bash

# Test GPT-Image-1 API directly

echo "Testing GPT-Image-1 Image Generation"
echo "===================================="
echo ""
echo "Note: This will only work if your OpenAI organization is verified"
echo "To verify, visit: https://platform.openai.com/settings/organization/general"
echo ""

curl -X POST http://localhost:3010/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "quality": "hd",
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
        quality = data.get('metadata', {}).get('quality', 'Unknown')
        print(f'✅ Success!')
        print(f'   Model: {model}')
        print(f'   Provider: {provider}')
        print(f'   Quality: {quality}')
        if 'fallback' in model:
            print(f'   Note: Using fallback model (GPT-Image-1 may require organization verification)')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"
