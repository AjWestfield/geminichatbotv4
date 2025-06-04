# Video Generation API Fix

## Summary of Fixes

Fixed the video generation errors by addressing three main issues:

### 1. Environment Variable Mismatch
- **Issue**: Code was looking for `REPLICATE_API_TOKEN` but `.env.local` had `REPLICATE_API_KEY`
- **Fix**: Updated all references from `REPLICATE_API_TOKEN` to `REPLICATE_API_KEY`:
  - `/app/api/generate-video/route.ts`
  - `/app/api/chat/route.ts`
  - `/lib/claude-streaming-handler.ts`

### 2. Stream Parsing Error
- **Issue**: Frontend AI SDK couldn't parse custom `video:` event type
- **Fix**: Removed custom event and included video generation info as regular text messages
  - Changed from `controller.enqueue(encoder.encode('video:...'))`
  - To standard text format: `controller.enqueue(encoder.encode('0:"Video info..."'))`

### 3. System Prompt Duplication
- **Issue**: System instruction was too long due to concatenating both prompts
- **Fix**: Use only `MCP_AGENT_INSTRUCTIONS_ENHANCED` instead of concatenating with `MCP_SYSTEM_PROMPT_ENHANCED`

## API Key Configuration

The Replicate API key is correctly set in `.env.local`:
```
REPLICATE_API_KEY=your_replicate_api_key_here
```

## Video Generation Flow

1. User requests: "create a video of a woman walking her dog"
2. System detects video generation request
3. Checks for REPLICATE_API_KEY
4. Calls `/api/generate-video` with parameters
5. Returns status and ID to user
6. Frontend can poll for completion

## Next Steps

The video generation should now work properly. The frontend will receive:
- Clear status messages about video generation
- Video ID for tracking progress
- No stream parsing errors

Test by asking the agent to "create a video" and it should now trigger actual video generation instead of saying it cannot create videos.