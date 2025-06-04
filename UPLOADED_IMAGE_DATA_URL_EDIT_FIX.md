# Uploaded Image Data URL Edit Fix

## Problem
When users uploaded an image and tried to edit it using the "Edit" button, the system would generate a completely new image instead of editing the uploaded image. This only happened with uploaded images - generated images could be edited correctly.

## Root Cause
The issue was in the `editImageWithGPTImage1` function in `/lib/openai-image-client.ts`. The function was using `fetch()` to download images before editing them. However, uploaded images are stored as data URLs (e.g., `data:image/png;base64,...`), and `fetch()` cannot handle data URLs - it only works with HTTP/HTTPS URLs.

## Solution
Modified the image processing logic to detect and handle data URLs separately:

1. **Detection**: Check if the image URL starts with `data:`
2. **Data URL Processing**: Extract the base64 data from the data URL and convert it directly to a Buffer
3. **HTTP URL Processing**: Continue using `fetch()` for regular HTTP/HTTPS URLs

### Code Changes
Updated the following functions in `/lib/openai-image-client.ts`:
- `editImageWithGPTImage1` - Main editing function
- `createImageVariationGPT1` - Image variation function
- Both fallback handlers for DALL-E 2

### Example of the Fix
```typescript
let imageBuffer: Buffer;

// Handle data URLs differently from HTTP URLs
if (imageUrl.startsWith('data:')) {
  console.log('Processing data URL for editing...');
  // Extract base64 data from data URL
  const base64Match = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!base64Match) {
    throw new Error('Invalid data URL format');
  }
  const base64Data = base64Match[1];
  imageBuffer = Buffer.from(base64Data, 'base64');
} else {
  // Download the image from HTTP URL
  console.log('Downloading image from URL...');
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }
  const imageArrayBuffer = await imageResponse.arrayBuffer();
  imageBuffer = Buffer.from(imageArrayBuffer);
}
```

## Testing
To test the fix:
1. Upload an image using the upload button
2. Click the "Edit" button on the uploaded image
3. Enter an edit prompt (e.g., "Make the background blue")
4. Verify that the image is edited with your changes applied

## Console Output
When editing an uploaded image, you should now see:
```
Processing data URL for editing...
```

Instead of an error or fallback to image generation.

## Benefits
- Uploaded images can now be edited using GPT-Image-1's advanced inpainting capabilities
- Consistent editing experience for both uploaded and generated images
- No more confusion about why uploaded images behave differently