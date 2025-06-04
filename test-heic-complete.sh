#!/bin/bash

echo "🧪 HEIC Complete Implementation Test"
echo "===================================="
echo ""

# Check if dev server is running
echo "1. Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Dev server is running"
else
    echo "   ❌ Dev server not running. Start with: npm run dev"
    exit 1
fi

echo ""
echo "2. Checking HEIC conversion endpoint..."
# Test with empty request
RESPONSE=$(curl -s -X POST http://localhost:3000/api/convert-heic)
if [[ $RESPONSE == *"No file provided"* ]]; then
    echo "   ✅ HEIC conversion endpoint is responding"
else
    echo "   ❌ HEIC conversion endpoint not working"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "3. Checking dependencies..."
if npm list heic-convert > /dev/null 2>&1; then
    echo "   ✅ heic-convert is installed"
else
    echo "   ❌ heic-convert not found"
fi

if npm list sharp > /dev/null 2>&1; then
    echo "   ✅ sharp is installed"
else
    echo "   ❌ sharp not found"
fi

echo ""
echo "4. Manual Test Steps:"
echo "   a) Open http://localhost:3000"
echo "   b) Click paperclip icon to upload"
echo "   c) Select a HEIC file from iPhone"
echo "   d) Verify:"
echo "      - 'Converting HEIC to JPEG...' message appears"
echo "      - Thumbnail shows actual image (not placeholder)"
echo "      - File info shows 'HEIC format'"
echo "   e) Type a message and send"
echo "   f) Verify:"
echo "      - Thumbnail persists in chat message"
echo "      - Can click to view full preview"
echo "      - Analyze/Edit/Animate options work"

echo ""
echo "5. Debug Console Commands:"
echo "   - Check conversion: localStorage.getItem('heic-conversion-test')"
echo "   - View logs: Filter console by '[HEIC'"
echo "   - Test endpoint: await fetch('/api/convert-heic', {method: 'POST', body: new FormData()})"

echo ""
echo "✨ Test setup complete! Follow manual steps above."