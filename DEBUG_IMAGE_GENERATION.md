# Image Generation Debug Guide

## Issue Summary

The backend API successfully generates images (as shown in logs), but there might be issues with:
1. State updates in the frontend
2. Image display after generation
3. Animation component interaction

## Fixed Issues

### 1. Stale Closure Problem in State Updates

**Issue**: When updating the placeholder with the actual image, we were using `generatedImages` from the closure, which could be stale in the async callback.

**Fix**: Used functional state updates to ensure we always work with the latest state:

```typescript
// Before (could use stale state)
const updatedImages = generatedImages.map(img => 
  img.id === placeholderId ? newImages[0] : img
)
setGeneratedImages(updatedImages)

// After (always uses current state)
setGeneratedImages(prevImages => {
  const updatedImages = prevImages.map(img => 
    img.id === placeholderId ? newImages[0] : img
  )
  return updatedImages
})
```

### 2. Added Debug Logging

Added console.log statements to track:
- When placeholder is added
- When placeholder is replaced with actual image
- State before and after updates

## How to Debug

1. **Open Browser Console** (F12)
2. **Generate an image** and watch for these logs:
   - "Adding placeholder image:"
   - "Image generation response:"
   - "Updating placeholder with actual image:"
   - "Previous images:" / "Updated images:"

3. **Check for Issues**:
   - Is the placeholder being added?
   - Is the API response successful?
   - Is the image URL present in the response?
   - Is the state being updated correctly?

## Common Issues & Solutions

### Image Not Displaying
- Check if `image.url` is present in the response
- Verify the URL is accessible (try opening it in a new tab)
- Check if `isGenerating` is properly set to `false`

### Animation Stuck
- Check if the animation duration matches actual generation time
- Verify `isGenerating` flag is updated
- Look for console errors

### State Not Updating
- Check the console logs for state updates
- Verify the placeholder ID matches
- Ensure functional updates are working

## Test Commands

```bash
# Test image generation
./test-image-animation.sh

# Check browser console for:
# - Network tab: /api/generate-image response
# - Console tab: Debug logs
# - React DevTools: Component state
```

## Next Steps if Issue Persists

1. Check Network tab for API response structure
2. Verify image URL format from WaveSpeed
3. Test with different prompts
4. Check React DevTools for component state
5. Look for any CORS or security issues with image URLs