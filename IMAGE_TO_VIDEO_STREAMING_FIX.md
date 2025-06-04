# Image-to-Video Streaming Fix

## Problem
When users uploaded an image and requested to animate it, the system would fail with:
```
Error: [GoogleGenerativeAI Error]: Failed to parse stream
```

## Root Cause
The video generation marker `[VIDEO_GENERATION_STARTED]` was being injected as a large JSON blob into the streaming response, which disrupted the AI SDK's expected SSE (Server-Sent Events) format.

## Solution
Modified the streaming injection in `/app/api/chat/route.ts` to:
1. Split the video generation data into smaller chunks (100 characters each)
2. Send each chunk separately with proper JSON escaping
3. Maintain the AI SDK's expected format: `0:<json-string>\n`

## Code Changes

### Before
```typescript
const videoMarker = `\n\n[VIDEO_GENERATION_STARTED]\n${JSON.stringify(videoGenerationData, null, 2)}\n[/VIDEO_GENERATION_STARTED]`
const escapedMarker = JSON.stringify(videoMarker)
controller.enqueue(encoder.encode(`0:${escapedMarker}\n`))
```

### After
```typescript
// Split the video marker into smaller chunks to avoid parsing issues
const videoMarkerStart = '\n\n[VIDEO_GENERATION_STARTED]\n'
const videoMarkerData = JSON.stringify(videoGenerationData, null, 2)
const videoMarkerEnd = '\n[/VIDEO_GENERATION_STARTED]'

// Send each part separately
controller.enqueue(encoder.encode(`0:${JSON.stringify(videoMarkerStart)}\n`))

// Split the JSON data into smaller chunks
const chunkSize = 100
for (let i = 0; i < videoMarkerData.length; i += chunkSize) {
  const chunk = videoMarkerData.slice(i, i + chunkSize)
  controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`))
}

controller.enqueue(encoder.encode(`0:${JSON.stringify(videoMarkerEnd)}\n`))
```

## Testing
To test the fix:
1. Upload an image via the attachment button
2. Type "Animate this image" or similar prompt
3. Verify no streaming errors occur
4. Check that video generation starts successfully

## Result
- ✅ No more "Failed to parse stream" errors
- ✅ Video generation markers are properly transmitted
- ✅ Frontend correctly extracts and processes video data
- ✅ Image-to-video animation requests work as expected