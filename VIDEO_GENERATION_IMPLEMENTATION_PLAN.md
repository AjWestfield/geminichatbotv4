# Video Generation Implementation Plan

## Overview
This document outlines the implementation plan for integrating Replicate's Kling v1.6 models to enable video generation capabilities in the chatbot application.

## Model Capabilities

### kwaivgi/kling-v1.6-standard
- **Resolution**: 720p
- **Features**: Text-to-video AND Image-to-video (start_image is optional)
- **Duration**: 5s or 10s
- **Cost**: Lower cost option

### kwaivgi/kling-v1.6-pro  
- **Resolution**: 1080p
- **Features**: Primarily Image-to-video (start_image is required)
- **Duration**: 5s or 10s
- **Cost**: Higher quality, higher cost

## API Schema

### Input Parameters (Both Models)
```typescript
interface VideoGenerationInput {
  prompt: string;                    // Required: Text description
  duration?: 5 | 10;                 // Default: 5
  cfg_scale?: number;                // 0-1, default: 0.5 (flexibility)
  start_image?: string;              // URI (optional for standard, required for pro)
  end_image?: string;                // URI (optional, pro only)
  aspect_ratio?: "16:9" | "9:16" | "1:1";  // Default: "16:9"
  negative_prompt?: string;          // Things to exclude
  reference_images?: string[];       // Up to 4 reference images
}
```

### Output
- Returns URI to generated video file
- Format: MP4
- Frame rate: 30fps

## Architecture Design

### 1. Core Components

#### A. Replicate Client (`/lib/replicate-client.ts`)
```typescript
interface ReplicateVideoConfig {
  model: 'standard' | 'pro';
  apiKey: string;
}

class ReplicateClient {
  constructor(config: ReplicateVideoConfig)
  
  // Generate video from text or image
  async generateVideo(input: VideoGenerationInput): Promise<string>
  
  // Poll for completion
  async waitForCompletion(predictionId: string): Promise<string>
}
```

#### B. Video Generation Types (`/lib/video-generation-types.ts`)
```typescript
interface GeneratedVideo {
  id: string;
  prompt: string;
  url: string;
  thumbnailUrl?: string;
  duration: 5 | 10;
  aspectRatio: "16:9" | "9:16" | "1:1";
  model: 'standard' | 'pro';
  sourceImage?: string;  // For image-to-video
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

interface VideoGenerationSettings {
  model: 'standard' | 'pro';
  defaultDuration: 5 | 10;
  defaultAspectRatio: "16:9" | "9:16" | "1:1";
  defaultNegativePrompt?: string;
}
```

### 2. API Endpoints

#### A. Video Generation Endpoint (`/app/api/generate-video/route.ts`)
- POST endpoint for video generation
- Handles both text-to-video and image-to-video
- Streams progress updates via SSE
- Returns video URL and metadata

#### B. Video Status Endpoint (`/app/api/video-status/[id]/route.ts`)
- GET endpoint to check video generation status
- Returns current status and URL when complete

### 3. UI Components

#### A. Video Generation Settings (`/components/video-generation-settings.tsx`)
- Model selection (Standard/Pro)
- Default duration (5s/10s)
- Default aspect ratio
- Negative prompt defaults

#### B. Animate Image Modal (`/components/animate-image-modal.tsx`)
- Prompt input
- Duration selection
- Aspect ratio selection
- Negative prompt input
- Progress indicator

#### C. Video Gallery (`/components/video-gallery.tsx`)
- Grid display of generated videos
- Thumbnail previews
- Play on click
- Download option
- Delete functionality

#### D. Updated Canvas View
- Replace placeholder with VideoGallery component
- Show generating videos with progress
- Handle video playback

### 4. Integration Points

#### A. Image Gallery Enhancement
- Add "Animate" button to image hover/click actions
- Pass image URL to animation modal
- Track which images have been animated

#### B. Chat Interface Integration
- Detect video generation intents
- Support commands like:
  - "Generate a video of [prompt]"
  - "Animate this image with [prompt]"
  - "Create a 10 second video of [prompt]"
- Display generation progress in chat
- Show video preview when complete

#### C. Settings Dialog Update
- Add "Video Generation" section
- Model selection dropdown
- Duration preference
- Aspect ratio preference
- API key input for Replicate

### 5. Data Flow

#### Text-to-Video Flow:
1. User enters prompt in chat or video tab
2. System checks video settings
3. Call Replicate API (standard model)
4. Poll for completion
5. Generate thumbnail
6. Store video metadata
7. Display in video gallery

#### Image-to-Video Flow:
1. User clicks "Animate" on image
2. Modal opens with image preview
3. User enters animation prompt
4. Call Replicate API with image URL
5. Poll for completion
6. Generate thumbnail
7. Store video metadata
8. Display in video gallery

### 6. Storage Strategy

#### LocalStorage Structure:
```typescript
interface VideoStorage {
  videos: GeneratedVideo[];
  settings: VideoGenerationSettings;
}
```

#### Quota Management:
- Store video URLs (not files)
- Limit stored videos to 50
- Auto-cleanup old videos
- Track generation history

### 7. Error Handling

- API key validation
- Model availability checks
- Generation timeout (10 minutes)
- Retry logic for failed generations
- User-friendly error messages

### 8. Progress Tracking

- Real-time status updates
- Estimated time remaining
- Cancel generation option
- Queue management for multiple requests

## Implementation Order

1. **Phase 1: Core Infrastructure**
   - Replicate client
   - Video types and utilities
   - Basic API endpoint

2. **Phase 2: Settings Integration**
   - Add video settings to Settings dialog
   - Store preferences in LocalStorage
   - API key management

3. **Phase 3: UI Components**
   - Video gallery component
   - Animate image modal
   - Progress indicators

4. **Phase 4: Feature Integration**
   - Image gallery "Animate" button
   - Chat command processing
   - Video tab activation

5. **Phase 5: Polish & Testing**
   - Error handling improvements
   - Performance optimization
   - User experience refinements

## Environment Variables

Add to `.env.local`:
```
REPLICATE_API_TOKEN=your_replicate_api_token
```

## Dependencies

Add to `package.json`:
```json
{
  "replicate": "^0.25.1"
}
```

## Cost Considerations

- Standard model: ~$0.032 per second of video
- Pro model: ~$0.064 per second of video
- Implement usage tracking and limits
- Consider caching generated videos

## Future Enhancements

1. Video editing capabilities
2. Style transfer between videos
3. Video-to-video transformations
4. Batch video generation
5. Custom model fine-tuning