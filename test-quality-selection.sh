#!/bin/bash

# Test script to verify image generation quality selection
# This script tests both WaveSpeed (standard) and GPT-Image-1 (hd) quality settings

echo "🧪 Testing Image Generation Quality Selection"
echo "==========================================="

# Function to test image generation with specific quality
test_generation() {
    local quality=$1
    local model_name=$2
    
    echo ""
    echo "Testing $model_name (quality: $quality)..."
    echo "-------------------------------------------"
    
    # Make API request
    response=$(curl -s -X POST http://localhost:3000/api/generate-image \
        -H "Content-Type: application/json" \
        -d "{
            \"prompt\": \"Test image for $model_name\",
            \"quality\": \"$quality\",
            \"style\": \"vivid\",
            \"size\": \"1024x1024\"
        }")
    
    # Check if request was successful
    if [ $? -eq 0 ]; then
        # Extract model info from response
        model=$(echo "$response" | grep -o '"model":"[^"]*"' | cut -d'"' -f4)
        provider=$(echo "$response" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
        actual_quality=$(echo "$response" | grep -o '"quality":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$model" ]; then
            echo "✅ Success!"
            echo "   Model: $model"
            echo "   Provider: $provider"
            echo "   Quality: $actual_quality"
            
            # Verify correct model was used
            if [ "$quality" = "hd" ] && [[ "$model" == *"gpt-image-1"* || "$model" == *"dall-e"* ]]; then
                echo "   ✓ Correctly used OpenAI model for HD quality"
            elif [ "$quality" = "standard" ] && [[ "$model" == *"flux"* ]]; then
                echo "   ✓ Correctly used WaveSpeed model for standard quality"
            else
                echo "   ❌ Warning: Unexpected model for quality setting!"
            fi
        else
            echo "❌ Failed: $(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        fi
    else
        echo "❌ Failed to connect to API"
    fi
}

# Check if server is running
echo "Checking if development server is running..."
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please run 'npm run dev' first."
    exit 1
fi

# Test both quality settings
test_generation "standard" "WaveSpeed AI"
test_generation "hd" "GPT-Image-1"

echo ""
echo "🏁 Test complete!"
echo ""
echo "Tips for manual testing:"
echo "1. Open the app and click the settings icon in the chat interface"
echo "2. Select 'Standard (WaveSpeed AI)' and generate an image"
echo "3. The response should show 'Model: flux-dev-ultra-fast'"
echo "4. Switch to 'High Quality (GPT-Image-1)' and generate another image"
echo "5. The response should show 'Model: gpt-image-1' (or dall-e if fallback)"