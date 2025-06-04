# Image Delete Persistence Fix

## Problem
When users clicked the delete button on an image, the image would disappear temporarily but reappear after refreshing the browser. Images were only being deleted from local state and localStorage, not from the database.

## Solution Implemented

### 1. Created DELETE API Endpoint (`app/api/images/[imageId]/route.ts`)
```typescript
export async function DELETE(req, { params }) {
  const { imageId } = params
  const success = await deleteImage(imageId)
  return NextResponse.json({ success })
}
```

### 2. Updated Delete Handler (`components/image-gallery.tsx`)
```typescript
const handleDelete = async (imageId: string, e?: React.MouseEvent) => {
  // 1. Optimistically update UI
  const updatedImages = images.filter(img => img.id !== imageId)
  setImages(updatedImages)
  
  // 2. Delete from database
  const response = await fetch(`/api/images/${imageId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    console.error('Failed to delete from database')
  }
}
```

### 3. Enhanced Delete Function (`lib/services/chat-persistence.ts`)
The deleteImage function now handles both:
- **UUID lookups**: For images saved with database-generated IDs
- **Local ID lookups**: For images using local IDs stored in metadata

```typescript
// First try by UUID
let { data: image } = await supabase
  .from('images')
  .select('id, url')
  .eq('id', imageId)
  .single()

// If not found, try by local ID in metadata
if (!found) {
  const { data: images } = await supabase
    .from('images')
    .select('id, url, metadata')
    .eq('metadata->>localId', imageId)
}
```

### 4. Cleanup Tracking (`app/page.tsx`)
Added cleanup logic to remove deleted image IDs from the saved tracking set:
```typescript
const currentImageIds = new Set(images.map(img => img.id))
savedImageIdsRef.current.forEach(savedId => {
  if (!currentImageIds.has(savedId)) {
    savedImageIdsRef.current.delete(savedId)
  }
})
```

## How It Works

1. **User clicks delete button** → UI updates immediately
2. **API call to DELETE endpoint** → Triggers database deletion
3. **Database deletion** → Removes record by UUID or local ID
4. **Blob storage cleanup** → Deletes associated file (async)
5. **Tracking cleanup** → Removes ID from saved set

## Testing

1. Generate or upload an image
2. Click the delete button (trash icon)
3. Check console for deletion logs:
   ```
   [ImageGallery] Deleting image: img_...
   [DELETE IMAGE] Attempting to delete image: img_...
   [DELETE IMAGE] Successfully deleted from database: ...
   [ImageGallery] Successfully deleted from database: img_...
   ```
4. Refresh the page
5. Deleted image should NOT reappear

## Benefits

- ✅ Images are permanently deleted from database
- ✅ Blob storage is cleaned up automatically
- ✅ Works with both UUID and local ID formats
- ✅ Optimistic UI updates for better UX
- ✅ Proper error handling and logging

## Error Handling

If deletion fails:
- UI changes are preserved (image stays deleted from view)
- Error is logged to console
- Optional: Could restore image to UI if needed

## Notes

- Deletion is permanent - no undo functionality
- Blob storage deletion is async and may take a moment
- If persistence is not configured, deletion only affects local state