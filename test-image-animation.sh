#!/bin/bash

# Test script to verify image generation animation
# This simulates an image generation request and monitors the response

echo "🎨 Testing Image Generation Animation"
echo "===================================="
echo ""

# Check if server is running
echo "Checking if development server is running..."
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please run 'npm run dev' first."
    exit 1
fi

echo ""
echo "📸 Triggering image generation with animation..."
echo ""

# Test with a simple prompt
PROMPT="a beautiful sunset over mountains with vibrant colors"

# Make the API request
echo "Sending request for: '$PROMPT'"
echo ""

response=$(curl -s -X POST http://localhost:3000/api/generate-image \
    -H "Content-Type: application/json" \
    -d "{
        \"prompt\": \"$PROMPT\",
        \"quality\": \"standard\",
        \"style\": \"vivid\",
        \"size\": \"1024x1024\"
    }")

# Check response
if [ $? -eq 0 ]; then
    success=$(echo "$response" | grep -o '"success":true')
    if [ -n "$success" ]; then
        echo "✅ Image generation triggered successfully!"
        echo ""
        echo "Animation should now be visible in the Images tab:"
        echo "1. ⏳ 'Getting started...' (3 seconds)"
        echo "2. 🎨 'Creating image. May take a moment...' (with blur reveal)"
        echo "3. ✅ 'Image created.' (when complete)"
        echo ""
        echo "Check the browser to see the animation in action!"
        
        # Extract image URL if available
        url=$(echo "$response" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$url" ]; then
            echo ""
            echo "Generated image URL: $url"
        fi
    else
        echo "❌ Generation failed"
        echo "Response: $response"
    fi
else
    echo "❌ Failed to connect to API"
fi

echo ""
echo "💡 Tips:"
echo "- The animation lasts up to 30 seconds"
echo "- The blur effect reveals from top to bottom"
echo "- Text animates with a gradient effect"
echo "- Check the browser console for animation logs"