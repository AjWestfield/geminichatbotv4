/**
 * Video Generation Handler for Chat Integration
 *
 * This module handles video generation requests from the chat interface
 */

import { detectImageAspectRatioFromGeminiUri } from '@/lib/server-image-utils'

export interface VideoGenerationRequest {
  type: 'text-to-video' | 'image-to-video';
  prompt: string;
  imageUrl?: string;
  imageUri?: string; // Google AI File Manager URI
  duration?: 5 | 10;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'standard' | 'pro';
  negativePrompt?: string;
}

export class VideoGenerationHandler {
  /**
   * Detects if a message contains a video generation request
   * Enhanced to handle uploaded file context with automatic aspect ratio detection
   */
  static async detectVideoRequest(
    message: string,
    fileUri?: string,
    fileMimeType?: string
  ): Promise<VideoGenerationRequest | null> {
    console.log('[VIDEO DETECTION] Starting detection with params:', {
      message: message.substring(0, 100) + '...',
      fileUri: fileUri,
      fileMimeType: fileMimeType
    });

    const lowerMessage = message.toLowerCase();

    // Check if an image was uploaded
    const hasUploadedImage = fileUri && fileMimeType?.startsWith('image/');
    console.log('[VIDEO DETECTION] Has uploaded image:', hasUploadedImage);

    // Text-to-video patterns
    const textToVideoPatterns = [
      /(?:generate|create|make|produce)\s+(?:a\s+)?video\s+(?:of|showing|about)\s+(.+)/i,
      /(?:can you|please|could you)\s+(?:generate|create|make)\s+(?:a\s+)?video\s+(?:of|showing|about)\s+(.+)/i,
      /video\s+(?:of|showing|about)\s+(.+)/i,
      /(?:animate|animation)\s+(?:of|showing)\s+(.+?)(?:\s+from scratch)?/i
    ];

    // Image-to-video patterns (when user mentions animating an existing image)
    const imageToVideoPatterns = [
      /animate\s+(?:this|the)\s+image/i,
      /make\s+(?:this|the)\s+image\s+move/i,
      /turn\s+(?:this|the)\s+image\s+into\s+(?:a\s+)?video/i,
      /create\s+(?:an?\s+)?animation\s+from\s+(?:this|the)\s+image/i,
      /animate\s+(?:this|it)/i,
      /make\s+(?:this|it)\s+move/i,
      /bring\s+(?:this|the)\s+image\s+to\s+life/i,
      /add\s+motion\s+to\s+(?:this|the)\s+image/i
    ];

    // Check for duration specifications
    const durationMatch = message.match(/(\d+)\s*(?:second|sec|s)\s+(?:video|animation)/i);
    const duration = durationMatch ? (parseInt(durationMatch[1]) === 10 ? 10 : 5) : 5;

    // Auto-detect aspect ratio from uploaded image or fall back to text parsing
    let aspectRatio: '16:9' | '9:16' | '1:1' = '16:9';
    let aspectRatioSource = 'default';

    // Priority 1: Auto-detect from uploaded image using server-side analysis
    if (hasUploadedImage && fileUri) {
      try {
        console.log('[VIDEO DETECTION] Auto-detecting aspect ratio from uploaded image...');
        aspectRatio = await detectImageAspectRatioFromGeminiUri(fileUri);
        aspectRatioSource = 'auto-detected';
        console.log(`[VIDEO DETECTION] ✅ Auto-detected aspect ratio: ${aspectRatio} from image`);
      } catch (error) {
        console.warn('[VIDEO DETECTION] Failed to auto-detect aspect ratio:', error);
        aspectRatioSource = 'fallback';
      }
    }

    // Priority 2: Parse from message text (if auto-detection failed or no image)
    if (aspectRatioSource !== 'auto-detected') {
      if (message.match(/portrait|vertical|9:16|mobile/i)) {
        aspectRatio = '9:16';
        aspectRatioSource = 'text-parsed';
      } else if (message.match(/square|1:1|instagram/i)) {
        aspectRatio = '1:1';
        aspectRatioSource = 'text-parsed';
      } else {
        aspectRatio = '16:9';
        aspectRatioSource = 'default';
      }
    }

    console.log(`[VIDEO DETECTION] Final aspect ratio: ${aspectRatio} (source: ${aspectRatioSource})`);

    // Check for model preference
    let model: 'standard' | 'pro' = 'standard';
    if (message.match(/high quality|best quality|pro|1080p|professional/i)) {
      model = 'pro';
    }

    // Check for image-to-video patterns first (higher priority when image is uploaded)
    if (hasUploadedImage) {
      console.log('[VIDEO DETECTION] Checking image-to-video patterns...');

      for (let i = 0; i < imageToVideoPatterns.length; i++) {
        const pattern = imageToVideoPatterns[i];
        const matches = pattern.test(message);
        console.log(`[VIDEO DETECTION] Pattern ${i} (${pattern.source}): ${matches}`);

        if (matches) {
          console.log('[VIDEO DETECTION] ✅ Image-to-video pattern matched!');
          const result = {
            type: 'image-to-video' as const,
            prompt: message,
            imageUri: fileUri,
            duration,
            aspectRatio,
            model,
            negativePrompt: ''
          };
          console.log('[VIDEO DETECTION] Returning result:', result);
          return result;
        }
      }

      // Also check if user is asking for general animation with uploaded image
      const generalAnimationMatch = message.match(/animate|animation|move|motion|video/i);
      console.log('[VIDEO DETECTION] General animation match:', generalAnimationMatch);

      if (generalAnimationMatch) {
        console.log('[VIDEO DETECTION] ✅ General animation pattern matched!');
        const result = {
          type: 'image-to-video' as const,
          prompt: message,
          imageUri: fileUri,
          duration,
          aspectRatio,
          model,
          negativePrompt: ''
        };
        console.log('[VIDEO DETECTION] Returning result:', result);
        return result;
      }
    }

    console.log('[VIDEO DETECTION] Checking text-to-video patterns...');

    // Try to match text-to-video patterns
    for (let i = 0; i < textToVideoPatterns.length; i++) {
      const pattern = textToVideoPatterns[i];
      const match = message.match(pattern);
      console.log(`[VIDEO DETECTION] Text-to-video pattern ${i} (${pattern.source}): ${!!match}`);

      if (match) {
        console.log('[VIDEO DETECTION] ✅ Text-to-video pattern matched!');
        const result = {
          type: 'text-to-video' as const,
          prompt: match[1].trim(),
          duration,
          aspectRatio,
          model: model,
          negativePrompt: ''
        };
        console.log('[VIDEO DETECTION] Returning result:', result);
        return result;
      }
    }

    console.log('[VIDEO DETECTION] ❌ No patterns matched, returning null');
    return null;
  }

  /**
   * Generates a response for video generation requests
   */
  static generateResponse(request: VideoGenerationRequest): string {
    const aspectRatioDisplay = {
      '16:9': 'Landscape (16:9)',
      '9:16': 'Portrait (9:16)',
      '1:1': 'Square (1:1)'
    }[request.aspectRatio] || request.aspectRatio;

    if (request.type === 'text-to-video') {
      return `I'll generate a ${request.duration}-second video of "${request.prompt}" for you.

**Video Details:**
- Model: Kling v1.6 ${request.model === 'pro' ? 'Pro' : 'Standard'}
- Duration: ${request.duration} seconds
- Aspect Ratio: ${aspectRatioDisplay}
- Quality: ${request.model === 'pro' ? 'High quality professional output' : 'Standard quality'}

The video is being generated and will appear in the Video tab. Kling v1.6 typically takes 5-8 minutes to generate a ${request.duration}-second video.

**Generation Process:**
1. The system is using Replicate's Kling v1.6 ${request.model === 'pro' ? 'Pro' : 'Standard'} model
2. Your prompt is being processed to create the video
3. You'll see the result in the Video tab once complete
4. You can then view, download, or share your video

The video generation has started! Check the Video tab in a few minutes.`;
    } else {
      return `I'm animating your uploaded image into a ${request.duration}-second video! 🎬

**Animation Details:**
- Model: Kling v1.6 ${request.model === 'pro' ? 'Pro (1080p)' : 'Standard (720p)'}
- Duration: ${request.duration} seconds
- Aspect Ratio: ${aspectRatioDisplay} 🔮 *Auto-detected from your image*
- Source: Your uploaded image

**What's happening:**
1. Your image is being used as the starting frame
2. The AI will add natural motion and movement
3. The aspect ratio was automatically detected to match your image
4. The animation will appear in the Video tab once complete

**Animation Instructions:** "${request.prompt}"

The animation typically takes 5-8 minutes to generate. You'll see the result in the Video tab!`;
    }
  }

  /**
   * Extracts video generation parameters from a message
   */
  static parseVideoParameters(message: string): {
    duration: 5 | 10;
    aspectRatio: '16:9' | '9:16' | '1:1';
    negativePrompt: string;
  } {
    // Duration
    const durationMatch = message.match(/(\d+)\s*(?:second|sec|s)/i);
    const duration = durationMatch ? (parseInt(durationMatch[1]) === 10 ? 10 : 5) : 5;

    // Aspect ratio (fallback for non-auto-detected cases)
    let aspectRatio: '16:9' | '9:16' | '1:1' = '16:9';
    if (message.match(/portrait|vertical|9:16|mobile/i)) {
      aspectRatio = '9:16';
    } else if (message.match(/square|1:1|instagram/i)) {
      aspectRatio = '1:1';
    }

    // Negative prompt
    const negativeMatch = message.match(/(?:without|no|avoid|exclude)\s+(.+?)(?:\.|,|;|$)/i);
    const negativePrompt = negativeMatch ? negativeMatch[1].trim() : '';

    return { duration, aspectRatio, negativePrompt };
  }
}
