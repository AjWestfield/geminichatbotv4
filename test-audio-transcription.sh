#!/bin/bash

echo "Audio Transcription Test Script"
echo "==============================="
echo ""
echo "This script tests the audio transcription functionality"
echo ""

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is not set in environment"
    echo "   Please add it to your .env.local file"
    exit 1
fi

echo "✅ OPENAI_API_KEY is configured"
echo ""

# Test OpenAI API connectivity
echo "Testing OpenAI API connectivity..."
curl -s -o /dev/null -w "%{http_code}" \
  https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" | {
    read http_code
    if [ "$http_code" = "200" ]; then
        echo "✅ OpenAI API is reachable and API key is valid"
    elif [ "$http_code" = "401" ]; then
        echo "❌ OpenAI API key is invalid or expired"
        exit 1
    else
        echo "❌ Unable to reach OpenAI API (HTTP $http_code)"
        echo "   Check your internet connection or firewall settings"
        exit 1
    fi
}

echo ""
echo "To test audio transcription in the app:"
echo "1. Start the dev server: npm run dev"
echo "2. Open the app in your browser"
echo "3. Upload an audio file (MP3, WAV, etc.)"
echo "4. Watch for toast notifications"
echo ""
echo "Common issues:"
echo "- Connection reset: Check firewall/VPN settings"
echo "- API key error: Verify OPENAI_API_KEY in .env.local"
echo "- Large files: Keep files under 25MB"
echo ""
echo "Debug tips:"
echo "- Open browser console (F12) for detailed logs"
echo "- Check Network tab for API calls"
echo "- Look for toast notifications with error details"