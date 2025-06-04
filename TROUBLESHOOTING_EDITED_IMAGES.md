# Troubleshooting Edited Image Persistence

## Current Status

Based on the screenshots and logs:
1. ✅ Edited images are being generated successfully
2. ✅ Aspect ratio detection has been implemented
3. ❌ Edited images disappear after page refresh
4. ⚠️ Database save shows UUID error (but migration was applied)

## Diagnostic Steps

### 1. Verify Database Schema
Run this in Supabase SQL Editor:
```sql
-- Check column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name = 'original_image_id';
```

Expected result: `data_type` should be `text` not `uuid`

### 2. Monitor Save Process
Run this in browser console before editing:
```javascript
// Copy contents of debug-edited-image-save.js
```

### 3. Check Current State
After editing an image, run:
```javascript
// Check localStorage
const stored = JSON.parse(localStorage.getItem('generatedImages') || '[]');
const edited = stored.filter(img => img.originalImageId);
console.log('Edited in localStorage:', edited);

// Check what's being sent to API
// Watch Network tab for /api/images POST request
```

### 4. Verify API Response
Check the response from `/api/images` POST:
- Should return `{ image: { ... } }` with saved image data
- If it returns with a `local-` ID, the database save failed

## Possible Issues

### Issue 1: Migration Not Fully Applied
Even though you ran the ALTER TABLE command, there might be:
- Cached schema information
- Pending constraints
- Connection pool using old schema

**Fix**: 
1. Restart your Next.js server
2. Clear any connection pools
3. Try the insert again

### Issue 2: Different UUID Column
The error might be from a different column (like `id` or `chat_id`)

**Fix**: Check the full insert statement in logs

### Issue 3: Timing Issue
The image might be saved but not loaded properly on refresh

**Fix**: Check if images are in database:
```sql
SELECT id, original_image_id, url, created_at 
FROM images 
WHERE original_image_id IS NOT NULL 
ORDER BY created_at DESC;
```

## Quick Solutions

### Solution 1: Force Text Type
If the column is still UUID, run:
```sql
-- Force column to text without constraints
ALTER TABLE images 
ALTER COLUMN original_image_id TYPE TEXT USING original_image_id::TEXT;
```

### Solution 2: Debug Save Flow
Add more logging to understand exactly where it fails:
1. Check if blob upload succeeds
2. Check if database insert is attempted
3. Check if response is handled correctly

### Solution 3: Workaround
Temporarily save edited images without original_image_id:
```javascript
// In saveImage function, remove original_image_id if it's causing issues
if (insertData.original_image_id && !insertData.original_image_id.match(/^[0-9a-f]{8}-/)) {
  delete insertData.original_image_id;
}
```

## Next Steps

1. **Run verification SQL** to confirm schema
2. **Monitor one complete edit cycle** with debug script
3. **Check Supabase logs** for detailed error
4. **Restart services** if needed

The issue is likely that the database schema change hasn't fully propagated or there's a constraint we missed.