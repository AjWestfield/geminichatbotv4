#!/bin/bash

echo "Testing Claude streaming format fix..."

# Test the Claude streaming response
curl -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello Claude, can you help me understand something?", "id": "test-1"}
    ],
    "model": "Claude Sonnet 4"
  }' \
  --no-buffer 2>/dev/null | while IFS= read -r line; do
    if [ -n "$line" ]; then
      echo "Stream line: $line"
    fi
  done

echo -e "\n\nDone testing Claude streaming format"