# Transcription Timestamps Tab

## Feature Restored
The Timestamps tab in the Canvas view has been restored to display transcription segments with clickable timestamps.

## What It Does
When you upload an audio or video file that gets transcribed:
1. The transcription segments (with timestamps) are captured
2. A new "Timestamps" tab appears in the Canvas view
3. Each segment shows:
   - Start time (clickable in blue)
   - The transcribed text
   - Duration of that segment

## How It Works

### Data Flow
1. **Upload File**: When you upload an audio/video file in the chat
2. **Transcription**: OpenAI Whisper transcribes the file and returns segments
3. **State Update**: The transcription data is passed to the Canvas view
4. **Tab Display**: If segments exist, the Timestamps tab appears
5. **Clear on Remove**: When you remove the file, the timestamps are cleared

### Components Updated

#### `app/page.tsx`
- Added `currentTranscription` state
- Passes transcription data from ChatInterface to CanvasView

#### `components/chat-interface.tsx`
- Added `onTranscriptionReceived` callback prop
- Calls callback when transcription is successful
- Clears transcription when file is removed

#### `components/canvas-view.tsx`
- Added `transcription` prop
- Added Timestamps tab with Clock icon
- Displays formatted segments with timestamps
- Shows file name, language, and duration

## UI Features
- **Conditional Tab**: Only shows when transcription has segments
- **Hover Effects**: Segments highlight on hover
- **Timestamp Formatting**: Shows time in MM:SS format
- **Segment Duration**: Shows how long each segment is
- **Scrollable List**: Handles long transcriptions

## Example Display
```
Transcription Timestamps
audio-file.mp3 • English • 5:23

[00:00] Welcome to this tutorial...         3s
[00:03] Today we'll be learning about...   5s
[00:08] First, let's start with...         4s
```

## Testing
1. Upload an audio or video file
2. Wait for transcription to complete
3. Check Canvas view - Timestamps tab should appear
4. Click on any timestamp to see formatting
5. Remove the file - Timestamps tab should disappear

## Technical Details
- Uses OpenAI Whisper's `verbose_json` format to get segments
- Each segment contains:
  - `start`: Start time in seconds
  - `end`: End time in seconds  
  - `text`: Transcribed text for that segment
- Timestamps are formatted using the `formatDuration` utility