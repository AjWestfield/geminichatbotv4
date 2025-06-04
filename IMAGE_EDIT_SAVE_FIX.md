# Image Edit Save Fix

## Issue
Edited images were not being saved to the database when using the image edit feature.

## Root Cause
The CanvasView component was using `onImagesChange={setGeneratedImages}` which only updates the React state but doesn't trigger the database save functionality. 

The `handleGeneratedImagesChange` function is responsible for:
1. Updating state
2. Saving images to the database
3. Preventing duplicate saves

## Fix Applied
Changed in `app/page.tsx`:
```typescript
// Before:
<CanvasView
  onImagesChange={setGeneratedImages}
  onVideosChange={setGeneratedVideos}
  ...
/>

// After:
<CanvasView
  onImagesChange={handleGeneratedImagesChange}
  onVideosChange={handleGeneratedVideosChange}
  ...
/>
```

## Flow Overview

1. **Image Edit Modal** (`components/image-edit-modal.tsx`)
   - User edits an image
   - Calls `performImageEdit()` in background
   - On success, calls `onEditComplete(editedImage)`

2. **Image Gallery** (`components/image-gallery.tsx`)
   - `handleEditComplete` adds image to state
   - Calls `onImagesChange?.(updatedImages)`

3. **Canvas View** (`components/canvas-view.tsx`)
   - Passes `onImagesChange` prop to ImageGallery

4. **Page Component** (`app/page.tsx`)
   - `handleGeneratedImagesChange` receives updated images
   - Saves each new image to database via `saveImageToDB`
   - Tracks saved images to prevent duplicates

## Database Schema
The edited images are saved with:
- `original_image_id`: Reference to the source image
- All standard image fields (url, prompt, quality, etc.)
- Metadata including timestamp and local ID

## Testing Instructions

1. **Generate an Image**
   - Type "Generate an image of a sunset" in chat
   - Wait for image to appear in gallery

2. **Edit the Image**
   - Click on the generated image
   - Click "Edit" button
   - Enter edit prompt: "Add birds flying in the sky"
   - Click "Start Edit"
   - Wait for edit to complete

3. **Verify Save**
   - Check browser console for:
     ```
     [PAGE] Saving image to database: {id: "edited-...", ...}
     [SAVE IMAGE] Successfully saved to database: {...}
     ```
   - Refresh the page
   - Edited image should persist in the gallery

4. **Check Database** (if using Supabase)
   - Go to Supabase dashboard
   - Check `images` table
   - Verify edited image has `original_image_id` field pointing to source image

## Notes
- The fix also applies to video saving (changed to use `handleGeneratedVideosChange`)
- Images are saved to both database (if configured) and localStorage as backup
- The system tracks saved image IDs to prevent duplicate database entries