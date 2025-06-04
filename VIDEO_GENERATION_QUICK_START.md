# Video Generation Quick Start Guide

## 🎬 Implementation Summary

This guide provides step-by-step instructions to implement video generation using Replicate's Kling models.

## 📋 Prerequisites

1. **Get Replicate API Token**
   - Sign up at https://replicate.com
   - Go to https://replicate.com/account/api-tokens
   - Create a new token
   - Add to `.env.local`: `REPLICATE_API_TOKEN=your_token_here`

2. **Install Dependencies**
   ```bash
   npm install replicate
   ```

## 🚀 Implementation Steps

### Step 1: Create Video Generation Types
Create `/lib/video-generation-types.ts`:
```typescript
export interface GeneratedVideo {
  id: string;
  prompt: string;
  url: string;
  thumbnailUrl?: string;
  duration: 5 | 10;
  aspectRatio: "16:9" | "9:16" | "1:1";
  model: 'standard' | 'pro';
  sourceImage?: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

export interface VideoGenerationSettings {
  model: 'standard' | 'pro';
  defaultDuration: 5 | 10;
  defaultAspectRatio: "16:9" | "9:16" | "1:1";
  defaultNegativePrompt?: string;
}
```

### Step 2: Create Replicate Client
Create `/lib/replicate-client.ts`:
```typescript
import Replicate from "replicate";

export class ReplicateVideoClient {
  private replicate: Replicate;
  private model: string;

  constructor(apiKey: string, model: 'standard' | 'pro' = 'standard') {
    this.replicate = new Replicate({ auth: apiKey });
    this.model = model === 'pro' 
      ? "kwaivgi/kling-v1.6-pro:4f5c186ffc7b666da826c82c2da862b79bcb2b7c93fd642b22c52e32c3ee9d99"
      : "kwaivgi/kling-v1.6-standard:b7c92e7bed907c6cf8ea616b2b266b309f30b6421c8b0b60ad8dd387f2babd42";
  }

  async generateVideo(input: {
    prompt: string;
    duration?: 5 | 10;
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    negative_prompt?: string;
    start_image?: string;
    cfg_scale?: number;
  }) {
    const output = await this.replicate.run(this.model, { input });
    return output;
  }
}
```

### Step 3: Create API Endpoint
Create `/app/api/generate-video/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ReplicateVideoClient } from "@/lib/replicate-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, duration, aspectRatio, negativePrompt, startImage, model } = body;

    const client = new ReplicateVideoClient(
      process.env.REPLICATE_API_TOKEN!,
      model || 'standard'
    );

    const videoUrl = await client.generateVideo({
      prompt,
      duration: duration || 5,
      aspect_ratio: aspectRatio || "16:9",
      negative_prompt: negativePrompt || "",
      start_image: startImage,
      cfg_scale: 0.5
    });

    return NextResponse.json({
      id: crypto.randomUUID ? crypto.randomUUID() : `video-${Date.now()}`,
      url: videoUrl,
      prompt,
      duration: duration || 5,
      aspectRatio: aspectRatio || "16:9",
      model: model || 'standard',
      sourceImage: startImage
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
```

### Step 4: Add Video Settings to Settings Dialog
Update `/components/settings-dialog.tsx` to include:
```typescript
// Add to imports
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add to state
const [videoModel, setVideoModel] = useState(settings.videoModel || 'standard')
const [videoDuration, setVideoDuration] = useState(settings.videoDuration || 5)
const [videoAspectRatio, setVideoAspectRatio] = useState(settings.videoAspectRatio || '16:9')

// Add to settings section
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Video Generation</h3>
  
  <div className="space-y-2">
    <Label>Model Quality</Label>
    <Select value={videoModel} onValueChange={setVideoModel}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="standard">Standard (720p)</SelectItem>
        <SelectItem value="pro">Pro (1080p)</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="space-y-2">
    <Label>Default Duration</Label>
    <Select value={videoDuration.toString()} onValueChange={(v) => setVideoDuration(Number(v))}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="5">5 seconds</SelectItem>
        <SelectItem value="10">10 seconds</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="space-y-2">
    <Label>Default Aspect Ratio</Label>
    <Select value={videoAspectRatio} onValueChange={setVideoAspectRatio}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
        <SelectItem value="1:1">1:1 (Square)</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

### Step 5: Create Video Gallery Component
Create `/components/video-gallery.tsx`:
```typescript
import { GeneratedVideo } from "@/lib/video-generation-types"
import { Play, Download, Loader2 } from "lucide-react"
import { useState } from "react"

interface VideoGalleryProps {
  videos: GeneratedVideo[]
  onVideoClick?: (video: GeneratedVideo) => void
}

export function VideoGallery({ videos, onVideoClick }: VideoGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
      {videos.map((video) => (
        <div key={video.id} className="relative group cursor-pointer">
          {video.status === 'generating' ? (
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div 
              className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
              onClick={() => onVideoClick?.(video)}
            >
              <video
                src={video.url}
                className="w-full h-full object-cover"
                muted
                loop
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-300 truncate">{video.prompt}</p>
          <p className="text-xs text-gray-500">
            {video.duration}s • {video.aspectRatio} • {video.model}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### Step 6: Add Animate Button to Images
Update `/components/image-gallery.tsx` to add animate button:
```typescript
// Add to image hover overlay
<button
  onClick={(e) => {
    e.stopPropagation();
    handleAnimateImage(image);
  }}
  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
  title="Animate Image"
>
  <Video className="h-4 w-4" />
</button>
```

### Step 7: Create Animate Image Modal
Create `/components/animate-image-modal.tsx`:
```typescript
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnimateImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onAnimate: (params: {
    prompt: string
    duration: 5 | 10
    aspectRatio: "16:9" | "9:16" | "1:1"
    negativePrompt?: string
  }) => void
}

export function AnimateImageModal({ isOpen, onClose, imageUrl, onAnimate }: AnimateImageModalProps) {
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState<5 | 10>(5)
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9")
  const [negativePrompt, setNegativePrompt] = useState("")

  const handleSubmit = () => {
    if (prompt.trim()) {
      onAnimate({
        prompt,
        duration,
        aspectRatio,
        negativePrompt: negativePrompt.trim() || undefined
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Animate Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <img src={imageUrl} alt="Source" className="w-full h-48 object-contain rounded-lg bg-gray-100" />
          
          <div>
            <Label>Animation Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to animate this image..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v) as 5 | 10)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio as any}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Negative Prompt (Optional)</Label>
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid in the animation..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!prompt.trim()}>
              Generate Animation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 8: Update Canvas View
Replace video tab content in `/components/canvas-view.tsx`:
```typescript
import { VideoGallery } from "@/components/video-gallery"

// Add to props
generatedVideos?: GeneratedVideo[]

// Replace video TabsContent
<TabsContent value="video" className="h-full mt-0">
  <Card className="w-full h-full bg-[#1A1A1A] border-[#333333] overflow-hidden">
    {generatedVideos && generatedVideos.length > 0 ? (
      <VideoGallery 
        videos={generatedVideos}
        onVideoClick={(video) => {
          // Open video in modal or new tab
          window.open(video.url, '_blank')
        }}
      />
    ) : (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[#2B2B2B] flex items-center justify-center mb-6">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Video Generation</h3>
          <p className="text-[#B0B0B0] max-w-md">
            Generate videos from text prompts or animate your images. Try "Generate a video of..." or click Animate on any image.
          </p>
        </div>
      </div>
    )}
  </Card>
</TabsContent>
```

## 🎯 Usage Examples

### Text-to-Video in Chat:
- "Generate a video of a futuristic city at sunset"
- "Create a 10 second video of waves crashing on a beach"
- "Make a video showing a butterfly emerging from a cocoon"

### Image-to-Video:
1. Generate or upload an image
2. Click the "Animate" button
3. Enter animation prompt: "Make the clouds move and add birds flying"
4. Select duration and aspect ratio
5. Click "Generate Animation"

## 📝 Testing Checklist

- [ ] Replicate API key configured in `.env.local`
- [ ] Video settings appear in Settings dialog
- [ ] Can generate video from text prompt in chat
- [ ] Animate button appears on images
- [ ] Animate modal opens and accepts input
- [ ] Videos appear in video tab
- [ ] Video preview on hover works
- [ ] Progress indicator during generation
- [ ] Error handling for failed generations

## 🚨 Important Notes

1. **API Costs**: 
   - Standard: ~$0.032/second
   - Pro: ~$0.064/second
   - 10s pro video = ~$0.64

2. **Generation Time**:
   - 5s video: 2-5 minutes
   - 10s video: 4-8 minutes

3. **Rate Limits**:
   - Check Replicate dashboard for limits
   - Implement queuing for multiple requests

4. **Storage**:
   - Videos are hosted on Replicate's CDN
   - URLs expire after 24 hours
   - Consider downloading and re-hosting important videos