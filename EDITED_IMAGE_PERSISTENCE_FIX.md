# Edited Image Persistence Fix

## Problem
Edited images were not persisting after page refresh. While they would show in the gallery immediately after editing, they would disappear when the page was refreshed.

## Root Causes Identified

### 1. LocalStorage Field Stripping
The `saveGeneratedImages` function in `lib/image-utils.ts` was not saving essential fields for edited images:
- `originalImageId` - Critical for identifying edited images
- `isUploaded` - Important for upload status
- `geminiUri` - Needed for uploaded images

### 2. URL Truncation
The function was truncating ALL URLs to 200 characters, which could break:
- Data URLs (which are often much longer)
- Some external URLs from image generation services

## Fixes Applied

### 1. Added Essential Fields to LocalStorage (lib/image-utils.ts)
```typescript
const prepareForStorage = (imgs: GeneratedImage[]) => imgs.map(img => ({
  id: img.id,
  url: img.url.startsWith('data:') ? img.url : img.url.substring(0, 500),
  prompt: img.prompt.substring(0, 200),
  timestamp: img.timestamp.toISOString(),
  quality: img.quality,
  model: img.model,
  // Save essential fields for edited images
  originalImageId: img.originalImageId,
  isUploaded: img.isUploaded,
  geminiUri: img.geminiUri,
}))
```

### 2. Smart URL Handling
- Data URLs: Kept full length (needed for base64 encoded images)
- External URLs: Limited to 500 characters (more than enough for typical URLs)

## Flow Summary

1. **Image Edit Modal** → User edits image
2. **performImageEdit** → API call to GPT-Image-1
3. **onEditComplete** → Edited image added to gallery state
4. **handleGeneratedImagesChange** → Database persistence triggered
5. **saveGeneratedImages** → LocalStorage backup with all fields preserved

## Testing Instructions

1. **Generate an Image**
   ```
   "Generate an image of a mountain landscape"
   ```

2. **Edit the Image**
   - Click on the image
   - Click "Edit" button
   - Enter: "Add a sunset with orange and pink sky"
   - Click "Start Edit"

3. **Verify Immediate Persistence**
   - Check browser console for save logs
   - Open DevTools → Application → Local Storage
   - Find "generatedImages" and verify edited image has `originalImageId`

4. **Test Page Refresh**
   - Refresh the page (F5)
   - Edited image should still appear in gallery
   - Should maintain connection to original image

5. **Verify Database Persistence** (if configured)
   ```javascript
   // In browser console
   fetch("/api/images").then(r => r.json()).then(data => {
     console.log("Edited images:", data.images.filter(img => img.original_image_id))
   })
   ```

## Additional Improvements

1. **Progress Tracking**: Image edits now show loading cards with progress
2. **Error Handling**: Better error messages for failed edits
3. **Background Processing**: Modal closes immediately, edit continues in background
4. **Deduplication**: Prevents saving the same image multiple times

## Verification Checklist

- [x] LocalStorage saves `originalImageId` field
- [x] URLs are properly preserved (not truncated for data URLs)
- [x] Edited images persist after page refresh
- [x] Database saves edited images with proper fields
- [x] No duplicate saves in database
- [x] Progress tracking works for edited images
- [x] Error handling for failed edits

## Notes

- The fix ensures both localStorage and database persistence work correctly
- Data URLs are preserved in full to prevent image corruption
- The savedImageIdsRef prevents duplicate database saves
- Background processing improves UX by not blocking the modal