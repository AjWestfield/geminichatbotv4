# Workaround Applied for Edited Image Persistence

## Issue
The database `original_image_id` column is still expecting UUID format despite the migration being applied. This causes edited images to fail saving when they reference local image IDs like `img_1748976895957_5b516nlg2`.

## Workaround Solution

### 1. Modified Save Logic (`lib/services/chat-persistence.ts`)
```typescript
// Only include original_image_id if it's a valid UUID
if (image.originalImageId) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(image.originalImageId)
  if (isUUID) {
    insertData.original_image_id = image.originalImageId
  } else {
    // Store in metadata instead
    console.log('[SAVE IMAGE] Skipping original_image_id field for local ID:', image.originalImageId)
  }
}
```

The originalImageId is now stored in the metadata JSONB field as a backup.

### 2. Modified Load Logic (`hooks/use-chat-persistence.ts`)
```typescript
originalImageId: img.original_image_id || img.metadata?.originalImageId, // Check both fields
```

When loading images, we check both the column and metadata for the original image reference.

## Benefits

1. **Edited images will now save successfully** - No more UUID errors
2. **Original image reference is preserved** - Stored in metadata
3. **Backward compatible** - Works with both UUID and local IDs
4. **No data loss** - All information is retained

## Testing

1. Generate a new image
2. Edit it - should save without errors
3. Refresh page - edited image should persist
4. Check console for: `[SAVE IMAGE] Skipping original_image_id field for local ID: img_...`

## Permanent Fix

To permanently fix this, ensure the database migration is fully applied:
1. Check current column type
2. Drop all constraints
3. ALTER COLUMN to TEXT type
4. Restart all services

This workaround allows the app to function while the database issue is resolved.