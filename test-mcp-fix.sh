#!/bin/bash

echo "Testing MCP Fix for Streaming Error"
echo "==================================="

# Test Context7 query
echo -e "\nTesting Context7 tool call..."
curl -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Use the context7 MCP to tell me about shadcn/ui"
      }
    ]
  }' \
  --max-time 30 \
  -N 2>/dev/null | while IFS= read -r line; do
    # Parse streaming response
    if [[ $line =~ ^0:\"(.*)\"$ ]]; then
      content="${BASH_REMATCH[1]}"
      # Unescape content
      content=$(echo -e "$content")
      echo -n "$content"
    elif [[ $line =~ ^d: ]]; then
      echo -e "\n\n[Stream completed successfully]"
      break
    elif [[ $line =~ ^3: ]]; then
      echo -e "\n\n[Error in stream]"
      echo "$line"
      break
    fi
  done

echo -e "\n\nTest complete!"