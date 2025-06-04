# SetState Error Fix

## Problem
React error: "Cannot update a component (`Home`) while rendering a different component (`ChatInterface`)"

This occurred when clicking the edit button on an uploaded image.

## Root Cause
The `onGeneratedImagesChange` callback was being called inside a `setState` callback, which updates the parent component's state while the child component is still rendering. This violates React's rules.

## Solution
Wrapped the `onGeneratedImagesChange` calls in `setTimeout` to defer the parent state update until after the current render cycle completes.

### Code Changes
```typescript
// Before:
setGeneratedImages(prev => {
  const newImages = [...prev, uploadedImage]
  saveGeneratedImages(newImages)
  onGeneratedImagesChange?.(newImages)  // ❌ Updates parent during render
  return newImages
})

// After:
setGeneratedImages(prev => {
  const newImages = [...prev, uploadedImage]
  saveGeneratedImages(newImages)
  // Defer parent state update to avoid setState during render
  setTimeout(() => {
    onGeneratedImagesChange?.(newImages)  // ✅ Updates parent after render
    // Also handle auto-open edit modal request
    onEditImageRequested?.(uploadedImage.id)
  }, 0)
  return newImages
})
```

## Locations Fixed
1. `handleInlineImageOptionSelect` - Line ~808
2. `handleImageOptionSelect` - Line ~974

Both instances where the edit button adds an uploaded image to the gallery.

## Why This Works
- `setTimeout(..., 0)` schedules the callback to run after the current JavaScript execution stack completes
- This ensures React finishes rendering the current component before updating the parent
- The same pattern is already used in `handleImageGeneration` for the same reason
- Also allows for additional callbacks (like auto-opening edit modal) to be called safely

## Additional Enhancement
The fix was extended to support auto-opening the edit modal by also calling `onEditImageRequested` in the deferred callback, maintaining proper React update timing.

## Testing
The error should no longer appear when:
1. Uploading an image
2. Clicking the edit button
3. Image gets added to gallery
4. Edit modal opens automatically (new feature)

The functionality remains the same - the image still gets added to the gallery and the parent component still updates, just in the correct order.