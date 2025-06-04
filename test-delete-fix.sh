#!/bin/bash

echo "🔧 Testing Image Delete Fix"
echo "=========================="
echo ""
echo "This script tests the fixed delete functionality."
echo ""
echo "Prerequisites:"
echo "- Dev server running on port 3000"
echo "- At least one image in the gallery to delete"
echo ""
echo "The fix addresses two issues:"
echo "1. Next.js 15 params awaiting requirement"
echo "2. UUID validation to prevent database errors"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 1: Test Delete with Local ID"
echo "---------------------------------"
echo "Testing deletion of image with local ID format..."
echo ""

# Test with a local ID (non-UUID format)
LOCAL_ID="edited-1748971236572"
echo "Attempting to delete image: $LOCAL_ID"
curl -X DELETE "http://localhost:3000/api/images/$LOCAL_ID" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 2: Test Delete with UUID"
echo "-----------------------------"
echo "Testing deletion with UUID format..."
echo ""

# Test with a UUID format
UUID="123e4567-e89b-12d3-a456-426614174000"
echo "Attempting to delete image: $UUID"
curl -X DELETE "http://localhost:3000/api/images/$UUID" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "EXPECTED RESULTS:"
echo "- No more 'params.imageId should be awaited' error"
echo "- No more 'invalid input syntax for type uuid' error"
echo "- Successful deletion or 'not found' response"
echo ""
echo "MANUAL TEST:"
echo "1. Go to your app at http://localhost:3000"
echo "2. Navigate to the Images tab"
echo "3. Click the trash icon on any image"
echo "4. Check browser console for errors"
echo "5. Refresh the page - image should stay deleted"
echo ""
echo "✅ The fix validates UUID format before querying"
echo "✅ Non-UUID IDs are searched in metadata.localId"
echo "✅ Params are properly awaited in Next.js 15"