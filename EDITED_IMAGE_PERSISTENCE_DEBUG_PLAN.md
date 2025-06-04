# Edited Image Persistence Debug Plan

## Problem Statement
Edited images are not appearing after browser refresh, despite fixes to save them to the database.

## Step-by-Step Debugging Plan

### Phase 1: Verify Save Process
1. **Check if edited images are being created correctly**
   - Log the complete edited image object in `performImageEdit`
   - Verify all required fields are present
   - Confirm `isGenerating: false` is set

2. **Trace database save call**
   - Add logging before and after `saveImageToDB` call
   - Check if the API endpoint is receiving the request
   - Verify the response from the API

3. **Inspect savedImageIdsRef behavior**
   - Log the contents of savedImageIdsRef before and after save
   - Check if edited image IDs are being added correctly
   - Verify the Set isn't preventing saves

### Phase 2: Verify Load Process
1. **Check database load on mount**
   - Log the result of `loadAllImages()` in page.tsx
   - Verify edited images are included in the response
   - Check if originalImageId is preserved

2. **Check localStorage load**
   - Log the result of `loadGeneratedImages()` 
   - Verify edited images have all required fields
   - Check if localStorage data is properly formatted

3. **Inspect state merge logic**
   - Check how database and localStorage images are combined
   - Verify no deduplication is removing edited images
   - Check if edited images maintain their properties

### Phase 3: API and Database Layer
1. **Verify API endpoint behavior**
   - Check `/api/images` POST endpoint logs
   - Verify database insert query for edited images
   - Check if blob storage upload is succeeding

2. **Verify API load endpoint**
   - Check `/api/images` GET endpoint response
   - Verify it includes images with original_image_id
   - Check field mapping from database to frontend

3. **Database query inspection**
   - Verify images table has edited images
   - Check if original_image_id is being saved
   - Verify all required fields are present

### Phase 4: Common Issues to Check
1. **Race Conditions**
   - Database save might not complete before refresh
   - localStorage might be overwriting database data
   - State updates might be out of sync

2. **Data Format Issues**
   - URL truncation breaking image display
   - Missing fields causing filter/display issues
   - Type mismatches between save and load

3. **Deduplication Logic**
   - Gallery might be filtering out edited images
   - Duplicate ID prevention might be too aggressive
   - State management might be removing images

## Implementation Steps

### Step 1: Add Comprehensive Logging
```typescript
// In app/page.tsx useEffect for loadAllImages
useEffect(() => {
  const loadPersistedImages = async () => {
    console.log('[PAGE] Starting to load persisted images...')
    const dbImages = await loadAllImages()
    console.log('[PAGE] Loaded from database:', {
      total: dbImages.length,
      edited: dbImages.filter(img => img.originalImageId).length,
      images: dbImages.map(img => ({
        id: img.id,
        originalImageId: img.originalImageId,
        model: img.model
      }))
    })
    if (dbImages.length > 0) {
      setGeneratedImages(dbImages)
    }
  }
  loadPersistedImages()
}, [loadAllImages])
```

### Step 2: Add Save Verification
```typescript
// In handleGeneratedImagesChange
const saved = await saveImageToDB(image)
if (saved) {
  console.log('[PAGE] Image saved successfully:', {
    localId: image.id,
    dbId: saved.id,
    hasOriginalImageId: !!saved.original_image_id
  })
}
```

### Step 3: Check Load Response
```typescript
// In hooks/use-chat-persistence.ts loadAllImages
const data = await response.json()
console.log('[PERSISTENCE] Raw API response:', data)
const mapped = data.images.map((img: any) => ({...}))
console.log('[PERSISTENCE] Mapped images:', mapped)
return mapped
```

### Step 4: Verify Gallery Display
```typescript
// In components/image-gallery.tsx
useEffect(() => {
  console.log('[GALLERY] Images updated:', {
    total: images.length,
    edited: images.filter(img => img.originalImageId).length,
    generating: images.filter(img => img.isGenerating).length
  })
}, [images])
```

## Quick Test Commands

```javascript
// 1. Check if edited images are in localStorage
const stored = JSON.parse(localStorage.getItem('generatedImages') || '[]');
console.table(stored.filter(img => img.originalImageId));

// 2. Check if edited images are in database
fetch('/api/images').then(r => r.json()).then(data => {
  const edited = data.images.filter(img => img.original_image_id);
  console.log('Edited images in DB:', edited);
});

// 3. Check current state
// Add this temporarily to page.tsx:
window.debugImages = generatedImages;
// Then check: window.debugImages.filter(img => img.originalImageId)

// 4. Force reload from database
fetch('/api/images').then(r => r.json()).then(data => {
  const images = data.images.map(img => ({
    id: img.metadata?.localId || img.id,
    url: img.url,
    prompt: img.prompt,
    originalImageId: img.original_image_id,
    // ... other fields
  }));
  console.log('Manually loaded images:', images);
});
```

## Potential Fixes

1. **Ensure edited images are loaded from database**
   - Check field mapping in loadAllImages
   - Verify original_image_id → originalImageId conversion

2. **Fix any race conditions**
   - Ensure saves complete before allowing refresh
   - Add loading states during save operations

3. **Verify localStorage isn't overwriting**
   - Check if localStorage load happens after database load
   - Ensure merge logic preserves edited images

4. **Check gallery filtering**
   - Verify edited images aren't filtered out
   - Check deduplication logic