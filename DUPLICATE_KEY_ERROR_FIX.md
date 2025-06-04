# Duplicate Key Error Fix

## Problem
When uploading an image and clicking "Edit", the application was throwing a duplicate key error:
```
Error: Encountered two children with the same key, `edited-1748975920292`.
```

## Root Causes

### 1. Duplicate Image Saves
The uploaded image was being saved to the database twice:
- Both saves were happening almost simultaneously
- This created two database records with the same `localId`
- The logs showed two parallel save operations for the same image

### 2. Non-Unique ID Generation for Edited Images
The edited image ID was generated using only `Date.now()`:
```typescript
id: `edited-${Date.now()}`
```
This could produce duplicate IDs if operations happened within the same millisecond.

## Solutions

### 1. Fixed Duplicate Saves
Added duplicate detection in `app/page.tsx`:
```typescript
// Track saved image IDs to prevent duplicates
const savedImageIdsRef = useRef<Set<string>>(new Set())

// In handleGeneratedImagesChange:
if (savedImageIdsRef.current.has(lastImage.id)) {
  console.log('[PAGE] Image already saved, skipping:', lastImage.id)
  return
}

// Mark as saved before async operation to prevent race conditions
savedImageIdsRef.current.add(lastImage.id)
```

### 2. Enhanced ID Generation

#### For Edited Images (`components/image-edit-modal.tsx`):
```typescript
// Before: id: `edited-${Date.now()}`
// After:
id: `edited-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

#### For All Images (`lib/image-utils.ts`):
```typescript
export function generateImageId(): string {
  const timestamp = Date.now()
  const random1 = Math.random().toString(36).substring(2, 11)
  const random2 = Math.random().toString(36).substring(2, 6)
  const performance = typeof window !== 'undefined' && window.performance 
    ? Math.floor(window.performance.now() * 1000).toString(36)
    : Math.random().toString(36).substring(2, 6)
  return `img_${timestamp}_${random1}${random2}${performance}`
}
```

## Benefits
1. **No Duplicate Saves**: Images are only saved once to the database
2. **Unique IDs**: Image IDs are now virtually guaranteed to be unique
3. **Better Performance**: Eliminates redundant database operations
4. **No UI Errors**: React no longer encounters duplicate keys

## Testing
1. Upload an image
2. Click the Edit button
3. Apply an edit
4. Verify no duplicate key errors in console
5. Check that only one database save occurs per image