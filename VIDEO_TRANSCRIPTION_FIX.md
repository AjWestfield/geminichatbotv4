# Video Transcription Error Fix

## Problem
When uploading a 35MB video file, the transcription failed with an empty error message: `Error: Transcription failed: {}`. The issue was:
1. The video exceeded OpenAI Whisper's 25MB file size limit
2. The error message wasn't being displayed properly to the user

## Solution Implemented

### 1. Pre-Upload File Size Check
Added a file size check before attempting transcription to avoid unnecessary API calls:

```typescript
// Check file size before attempting transcription
const MAX_TRANSCRIPTION_SIZE = 25 * 1024 * 1024 // 25MB
if (file.size > MAX_TRANSCRIPTION_SIZE) {
  console.warn(`File too large for transcription: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 25MB)`)
  toast.warning("Transcription Skipped", {
    description: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB (max 25MB for transcription). The file will be uploaded without transcription.`
  })
} else {
  // Proceed with transcription
}
```

### 2. Existing Error Handling
The error handling was already improved to properly parse error responses:
- Attempts to read response as text first
- Tries to parse as JSON
- Falls back to creating error object from text if parsing fails
- Shows appropriate toast messages for different error types

## User Experience
- Files larger than 25MB will show a warning toast explaining the size limit
- The file will still be uploaded successfully for AI analysis
- Video analysis will work without transcription (visual analysis only)
- Clear feedback is provided about why transcription was skipped

## Technical Details
- OpenAI Whisper API has a hard 25MB file size limit
- This limit cannot be bypassed without chunking or compression
- The fix prevents unnecessary API calls for oversized files
- Error messages are now properly displayed to users

## Testing
To test the fix:
1. Upload a video file larger than 25MB
2. You should see a warning toast about transcription being skipped
3. The file should still upload successfully
4. The AI can analyze the video visually without audio transcription