# Streaming and Video Generation Fixes

## Date: January 6, 2025

### 1. Fixed Claude Streaming JSON Parsing Error

**Issue**: "Unexpected non-whitespace character after JSON at position 200" error when streaming responses with tool execution results containing JSON data.

**Root Cause**: When tool execution results contained raw JSON, it was being inserted directly into the streamed text without proper handling, causing JSON parsing errors in the frontend.

**Fix Applied** (`lib/claude-streaming-handler.ts`):
- Split tool execution results into separate chunks to avoid JSON parsing issues
- Ensure all content is properly JSON-encoded before streaming
- Send tool header, result, and formatting separately

**Changes**:
```typescript
// Before: Single concatenated message could break JSON parsing
const formattedResult = `\n\n**Tool Execution: ${toolCall.server} - ${toolCall.tool}**\n${result}\n\n`;
controller.enqueue(encoder.encode(`0:${JSON.stringify(formattedResult)}\n`));

// After: Split into separate properly encoded chunks
controller.enqueue(encoder.encode(`0:${JSON.stringify('\n\n**Tool Execution: ' + toolCall.server + ' - ' + toolCall.tool + '**\n')}\n`));
controller.enqueue(encoder.encode(`0:${JSON.stringify(resultString)}\n`));
controller.enqueue(encoder.encode(`0:${JSON.stringify('\n\n')}\n`));
```

### 2. Updated Replicate Video Generation Models

**Issue**: The Kling v1.6 models were outdated/unavailable on Replicate.

**Fix Applied** (`lib/replicate-client.ts`):
- **Standard Model**: Changed to Stable Video Diffusion (image-to-video only)
  - Model ID: `stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438`
  - Requires input image
  - Generates 14 frames at 6 fps
  
- **Pro Model**: Changed to AnimateDiff Lightning (text-to-video capable)
  - Model ID: `lucataco/animate-diff-lightning:d1531b7e8fec9ebb1e9de6c4c4e2814cd826d25dfa3f952357f87c98770c9ed5`
  - Supports both text-to-video and image-to-video
  - Faster generation with Lightning optimization

### 3. Updated Model Parameters

**Stable Video Diffusion** (Standard):
```typescript
{
  input_image: input.start_image, // Required
  cond_aug: 0.02,
  decoding_t: 7,
  video_length: "14_frames_with_svd",
  sizing_strategy: "maintain_aspect_ratio",
  motion_bucket_id: 127,
  fps: 6
}
```

**AnimateDiff Lightning** (Pro):
```typescript
{
  prompt: input.prompt,
  num_frames: Math.min(input.duration * 8, 32),
  guidance_scale: input.cfg_scale || 7.5,
  num_inference_steps: 4,
  seed: -1,
  image: input.start_image // Optional
}
```

### 4. Updated Validation Logic

- Standard model now requires an input image (returns error if missing)
- Pro model can do either text-to-video or image-to-video
- Default model for text-to-video changed from 'standard' to 'pro'
- Updated user-facing messages to explain model capabilities

### 5. Environment Variable Consistency

- Fixed inconsistency between `REPLICATE_API_KEY` and `REPLICATE_API_TOKEN`
- Now checks for both variable names for backward compatibility

## Testing

To test the fixes:

1. **Streaming Fix**: Use Claude with MCP tools and verify no JSON parsing errors appear
2. **Video Generation**: 
   - Text-to-video: Should use Pro model (AnimateDiff)
   - Image-to-video: Can use either model
   - Standard model should error if no image provided

## Notes

- Stable Video Diffusion is more stable but limited to image-to-video
- AnimateDiff Lightning is faster and supports text-to-video
- Both models have different parameter requirements
- Frame counts and durations are approximate based on model capabilities