# Fix for localStorage Quota and Database UUID Errors

## Problems Identified

### 1. QuotaExceededError
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': 
Setting the value of 'generatedImages' exceeded the quota.
```

**Cause**: Data URLs from edited images were being saved to localStorage. Each edited image with a data URL can be 1-2MB+, quickly exceeding the 5-10MB browser limit.

### 2. Database UUID Error
```
invalid input syntax for type uuid: "img_1748976895957_5b516nlg2"
```

**Cause**: The `original_image_id` column was defined as UUID type but we store local IDs in format `img_[timestamp]_[random]`.

## Solutions Implemented

### 1. localStorage Optimization (`lib/image-utils.ts`)

**Before**: Stored full data URLs in localStorage
```typescript
url: img.url.startsWith('data:') ? img.url : img.url.substring(0, 500)
```

**After**: Never store data URLs
```typescript
url: img.url.startsWith('data:') ? '[DATA_URL_REMOVED]' : img.url.substring(0, 500)
```

**Also**:
- Filter out removed URLs when loading
- Only save blob/CDN URLs to localStorage
- Skip localStorage save for data URLs in gallery

### 2. Database Schema Fix

**Changed** `original_image_id` from UUID to TEXT type:
- Updated `schema.sql` for new installations
- Created migration `fix-original-image-id.sql` for existing databases

### 3. Smart Save Logic (`components/image-gallery.tsx`)

```typescript
// Only save to localStorage if we don't have data URLs
if (!editedImage.url.startsWith('data:')) {
  saveGeneratedImages(updatedImages)
} else {
  console.log('[ImageGallery] Skipping localStorage save for data URL')
}
```

## How to Apply the Fix

### Step 1: Update Your Code
The code changes are already applied if you pulled the latest changes.

### Step 2: Fix Your Database
Run ONE of these options:

**Option A - Automated (if you have Supabase CLI)**:
```bash
node run-image-id-fix.js
```

**Option B - Manual via Supabase Dashboard**:
1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:
```sql
ALTER TABLE images 
DROP CONSTRAINT IF EXISTS images_original_image_id_fkey;

ALTER TABLE images 
ALTER COLUMN original_image_id TYPE TEXT;
```

**Option C - Quick fix (if no foreign keys)**:
```sql
ALTER TABLE images ALTER COLUMN original_image_id TYPE TEXT;
```

### Step 3: Clean localStorage (if needed)
If you're already getting quota errors, run this in browser console:
```javascript
// Copy and paste the contents of fix-localstorage-quota.js
```

Or manually clear:
```javascript
localStorage.removeItem('generatedImages');
location.reload();
```

## Prevention

### Best Practices Going Forward:
1. **Edited images are saved to blob storage first** - The database stores blob URLs, not data URLs
2. **localStorage only stores external URLs** - Data URLs are marked as removed
3. **Database loads take priority** - localStorage is just a backup
4. **Size limits enforced** - Maximum 30 recent images in localStorage

### What Happens Now:
1. Edit an image → Creates data URL → Uploads to blob → Saves blob URL
2. localStorage skips data URLs entirely
3. Database accepts any text ID format
4. No more quota errors!

## Testing

### Quick Test:
1. Generate an image
2. Edit it multiple times
3. Check console - should see "Skipping localStorage save for data URL"
4. Refresh page - edited images load from database
5. No quota errors!

### Verify Database:
```sql
-- Check edited images
SELECT id, original_image_id, url 
FROM images 
WHERE original_image_id IS NOT NULL;
```

### Check localStorage:
```javascript
// Should not contain any data URLs
JSON.parse(localStorage.getItem('generatedImages')).filter(img => 
  img.url && img.url.startsWith('data:')
).length; // Should be 0
```

## Troubleshooting

### If quota errors persist:
1. Clear localStorage completely: `localStorage.clear()`
2. Refresh the page
3. Images will reload from database

### If database errors persist:
1. Check if migration was applied: 
   ```sql
   \d images -- Check column types
   ```
2. Ensure `original_image_id` is TEXT type
3. If not, run the migration SQL again

### If edited images don't persist:
1. Check browser console for save logs
2. Verify blob upload succeeds before database save
3. Ensure persistence is configured (Supabase credentials)

## Summary

This fix ensures:
- ✅ No more localStorage quota errors
- ✅ Database accepts local image IDs
- ✅ Edited images persist properly
- ✅ Efficient storage management
- ✅ Backward compatible with existing data