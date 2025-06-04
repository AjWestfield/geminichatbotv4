# GPT-Image-1 Editing Fix

## Problem
When users uploaded an image and tried to edit it, the system was using WaveSpeed AI (standard quality) generation instead of GPT-Image-1's advanced inpainting/editing capabilities. This resulted in:
- New images being generated from scratch instead of edited
- Loss of the original image's composition and details
- "Powered by WaveSpeed AI" shown instead of using GPT-Image-1

## Root Cause
The `handleUploadedImageEdit` function was simply triggering a generation prompt, which would use whatever quality setting was active (often standard/WaveSpeed).

## Solution
Enhanced `handleUploadedImageEdit` to:
1. Check the image quality setting
2. If HD quality is selected AND the image has a data URL:
   - Use the `/api/edit-image` endpoint directly
   - Leverage GPT-Image-1's inpainting capabilities
   - Apply changes to the existing image
3. If standard quality is selected:
   - Inform user that editing requires HD quality
   - Fall back to generation with clear messaging

## Implementation Details

### Updated Handler
```typescript
const handleUploadedImageEdit = useCallback(async (image: GeneratedImage, editPrompt: string) => {
  const currentQuality = image.quality || 'standard'
  
  if (currentQuality === 'hd' && image.url && image.url.startsWith('data:')) {
    // HD quality - use edit API with GPT-Image-1
    const response = await fetch("/api/edit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: image.url,  // Data URL from preview
        prompt: editPrompt,
        quality: 'hd',
        style: image.style || 'vivid',
        size: image.size || '1024x1024',
      }),
    })
    // ... handle response and add edited image to gallery
  } else if (currentQuality === 'standard') {
    // Inform user and fall back to generation
    toast({
      title: "HD Quality Required for Editing",
      description: "Image editing with inpainting requires HD quality (GPT-Image-1)...",
    })
  }
})
```

## User Experience

### Before Fix:
1. Upload image with HD quality selected
2. Click Edit → Enter prompt (e.g., "make the eyes blue")
3. System generates a NEW image with WaveSpeed
4. Original image composition is lost

### After Fix:
1. Upload image with HD quality selected
2. Click Edit → Enter prompt (e.g., "make the eyes blue")
3. System uses GPT-Image-1 inpainting
4. **Only the eyes change color, rest of image preserved** ✨

## Quality Setting Behavior

### HD Quality (GPT-Image-1):
- Uses advanced inpainting/editing
- Preserves original image composition
- Makes targeted changes based on prompt
- Shows "Editing with GPT-Image-1" toast

### Standard Quality (WaveSpeed):
- Shows informative toast about HD requirement
- Falls back to generation
- User can switch to HD in settings for true editing

## Testing Instructions

### Test 1: HD Quality Editing
1. Open Settings (gear icon)
2. Set Image Quality to "HD (GPT-Image-1)"
3. Upload any image
4. Click Edit button
5. Enter specific edit (e.g., "change the background to sunset")
6. Click Apply Edit
7. **Expected**: Toast shows "Editing with GPT-Image-1", edited image preserves original but with changed background

### Test 2: Standard Quality Fallback
1. Open Settings
2. Set Image Quality to "Standard (WaveSpeed)"
3. Upload any image
4. Click Edit button
5. Enter edit prompt
6. Click Apply Edit
7. **Expected**: Toast shows "HD Quality Required for Editing", then generates new image

### Test 3: Error Handling
1. Use HD quality
2. Upload image
3. Edit with problematic prompt
4. **Expected**: Falls back to generation with appropriate toast

## Benefits
- Proper utilization of GPT-Image-1's advanced capabilities
- True image editing instead of regeneration
- Clear quality requirements communicated
- Graceful fallbacks for all scenarios

## Technical Notes
- Uses data URLs (from preview) not Gemini URIs
- Edit API checks for Gemini URIs and rejects them
- Data URLs work because the image data is embedded
- Quality setting stored with each image in gallery