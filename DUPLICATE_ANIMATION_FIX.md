# Fix for Duplicate Image Reveal Animations

## Problem
When generating a second image, the reveal animation was running for both the new image AND the previously generated image.

## Root Cause
The issue was in the `ImageGallery` component's prop synchronization. When a new image was added:

1. The parent component would pass a new `propImages` array
2. The `useEffect` in ImageGallery would overwrite the entire state with `setImages(propImages)`
3. This would reset the `isGenerating` state of completed images back to `true`
4. Both images would then show the reveal animation

## Solution

### 1. Preserve Local State
Modified the prop sync logic to preserve the `isGenerating` state of existing images:

```typescript
useEffect(() => {
  setImages(prevImages => {
    // Create a map of existing images with their isGenerating state
    const existingStates = new Map(
      prevImages.map(img => [img.id, img.isGenerating])
    )
    
    // Update with new images but preserve isGenerating state for existing ones
    return propImages.map(img => ({
      ...img,
      isGenerating: existingStates.has(img.id) 
        ? (existingStates.get(img.id) ?? img.isGenerating)
        : img.isGenerating
    }))
  })
}, [propImages])
```

### 2. Prevent Double Animation Start
Added a `hasStartedRef` to the ImageGeneration component to ensure animations only start once:

```typescript
const hasStartedRef = React.useRef(false)

// Only start if not already started
if (hasImage && !isRevealing && !isCompleted && !hasStartedRef.current) {
  hasStartedRef.current = true
  // Start animation...
}
```

### 3. Enhanced Debug Logging
Added console logs to track:
- When images sync from props
- Existing vs new `isGenerating` states
- When animations complete

## Testing
1. Generate an image and wait for it to complete
2. Generate a second image
3. Only the new image should show the reveal animation
4. Check console logs for state tracking

## Expected Behavior
- First image: Shows animation once, then stays revealed
- Second image: Shows its own animation independently
- No re-animation of completed images
