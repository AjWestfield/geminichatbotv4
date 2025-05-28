# Image Model Selection Fix

## Problem

When switching from GPT-Image-1 to WaveSpeed AI in the settings, images were still being generated with GPT-Image-1. This was caused by stale closures in React callbacks.

## Root Cause

The `handleImageGeneration` callback was capturing the `imageQuality` state value at the time it was created, not when it was called. This is a common React pitfall with callbacks and state.

## Solution

1. **Fixed Stale Closures**: Added a ref (`imageQualityRef`) to always access the current quality value
2. **Added Toast Notifications**: Added visual feedback when switching between image models
3. **Verified API Integration**: Confirmed the quality parameter correctly determines which model to use

## Changes Made

### 1. Fixed Stale Closure Issue with Ref

```tsx
// components/chat-interface.tsx

// Added ref to track current quality
const imageQualityRef = useRef(imageQuality)

// Update ref when quality changes
useEffect(() => {
  imageQualityRef.current = imageQuality
  localStorage.setItem('imageGenerationQuality', imageQuality)
}, [imageQuality])

// Use ref in callbacks to avoid stale closures
const currentQuality = imageQualityRef.current
```

### 2. Added Toaster Component to Layout

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/toaster"

// Added inside body:
<Toaster />
```

### 3. Enhanced Image Generation Settings with Toast

```tsx
// components/image-generation-settings.tsx
import { useToast } from '@/hooks/use-toast'

const handleQualityChange = (newQuality: 'standard' | 'hd') => {
  onQualityChange(newQuality)
  
  const modelName = newQuality === 'hd' ? 'GPT-Image-1' : 'WaveSpeed AI'
  const modelDescription = newQuality === 'hd' 
    ? 'High quality generation with accurate text rendering' 
    : 'Fast image generation with good quality'
  
  toast({
    title: `Switched to ${modelName}`,
    description: modelDescription,
    duration: 3000,
  })
}
```

### 3. State Management Verification

- Default quality: 'hd' (uses GPT-Image-1)
- When changed to 'standard', uses WaveSpeed AI
- The quality parameter is correctly passed to the API endpoint

## How It Works

1. **HD Quality Selected** → `quality: 'hd'` → Uses GPT-Image-1
2. **Standard Quality Selected** → `quality: 'standard'` → Uses WaveSpeed AI

The API route (`/api/generate-image`) checks:

```typescript
const useGPTImage1 = quality === "hd"
```

## Testing

### Automated Test

Run the provided test script:

```bash
./test-quality-selection.sh
```

This will test both quality settings and verify the correct model is used.

### Manual Testing

1. Open settings (⚙️ icon)
2. Switch between models - you'll see a toast notification
3. Generate an image - it will use the selected model
4. Check the response message to verify the correct model was used:
   - Standard → "Model: flux-dev-ultra-fast"
   - HD → "Model: gpt-image-1" (or DALL-E fallback)

## Troubleshooting

If the wrong model is still being used:

1. Clear browser cache (Cmd+Shift+R)
2. Check browser console for logs showing quality parameter
3. Verify the ref is being updated: Look for "Current quality setting from ref:" in console
4. Ensure localStorage isn't overriding: Clear it with `localStorage.removeItem('imageGenerationQuality')`
