#!/bin/bash
echo "🔧 Testing Claude Streaming Fix"
echo "================================"

# Check if environment is set up
if [ ! -f ".env.local" ]; then
  echo "❌ .env.local not found. Please set up your environment variables."
  exit 1
fi

# Start the dev server in the background
echo -e "\n📦 Starting development server..."
npm run dev > dev.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Test Claude streaming with a simple request
echo -e "\n🧪 Testing Claude streaming..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello and confirm you are Claude working properly"}
    ],
    "model": "Claude Sonnet 4"
  }' \
  --no-buffer 2>/dev/null | while IFS= read -r line; do
    if [[ $line == 0:* ]]; then
      # Extract and decode the text
      text=$(echo "$line" | sed 's/^0:"//' | sed 's/"$//' | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
      echo "📝 Response: $text"
    elif [[ $line == d:* ]]; then
      echo "✅ Stream completed successfully"
    elif [[ $line == 3:* ]]; then
      echo "❌ Error: $line"
    fi
  done

# Kill the server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo -e "\n✨ Test complete!"
echo "If you saw a response from Claude, the streaming fix is working."