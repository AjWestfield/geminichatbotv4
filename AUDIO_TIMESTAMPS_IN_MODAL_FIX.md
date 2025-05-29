# Audio Timestamps in File Preview Modal Fix

## Problem
The timestamps were displaying in the Canvas view instead of in the File Preview Modal where they belong. When clicking on an uploaded audio file, the transcription should show in one tab and timestamps in another tab within the modal, not in the canvas.

## Solution
Fixed the location where timestamps are displayed by:

1. **Removed timestamps tab from Canvas view**
   - Removed Clock icon import
   - Removed timestamps TabsTrigger 
   - Removed timestamps TabsContent
   - Removed transcription prop from CanvasView

2. **Updated FilePreviewModal for audio files**
   - Audio files now use the same tab structure as video files
   - Shows two tabs: "Full Transcript" and "Timed Segments"
   - Timed Segments tab only appears when segments exist
   - Clickable timestamps that jump to that point in audio

3. **Cleaned up state management**
   - Removed currentTranscription state from page.tsx
   - Removed onTranscriptionReceived callback from ChatInterface
   - Removed all related props and function calls

## Result
Now when you:
1. Upload an audio file
2. Click on the uploaded file attachment
3. The File Preview Modal opens with:
   - Audio player at the top
   - Two tabs below: "Full Transcript" and "Timed Segments"
   - Full Transcript shows the complete transcription
   - Timed Segments shows clickable timestamps with text segments
   - Clicking a timestamp seeks the audio to that position

## Files Modified
- `components/file-preview-modal.tsx` - Updated audio section to use tabs
- `components/canvas-view.tsx` - Removed timestamps tab
- `app/page.tsx` - Removed transcription state management
- `components/chat-interface.tsx` - Removed onTranscriptionReceived callback

## Testing
1. Upload an audio file (MP3, WAV, etc.)
2. Wait for transcription to complete
3. Click on the audio file attachment in the chat
4. Modal should open with audio player and tabs
5. Check "Full Transcript" tab for complete text
6. Check "Timed Segments" tab for clickable timestamps
7. Click timestamps to jump to that point in audio

The timestamps are now properly contained within the File Preview Modal where they logically belong with the audio file, not scattered in the Canvas view.