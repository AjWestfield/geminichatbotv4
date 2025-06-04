import { NextRequest, NextResponse } from "next/server";
import { ReplicateVideoClient } from "@/lib/replicate-client";
import { generateVideoThumbnail } from "@/lib/video-utils";

export const maxDuration = 600; // 10 minutes timeout

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      duration,
      aspectRatio,
      negativePrompt,
      startImage,
      model,
      cfg_scale,
      referenceImages,
      enableProgressTracking = true // New option to enable/disable progress tracking
    } = body;

    // Validate required fields - Kling models need at least a prompt
    if (!prompt && !startImage) {
      return NextResponse.json(
        { error: "Either a prompt or start image is required" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      console.error('REPLICATE_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: "Replicate API key not configured. Please add REPLICATE_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    console.log('Starting video generation with progress tracking:', {
      prompt,
      model,
      duration,
      aspectRatio,
      enableProgressTracking
    });

    // Create Replicate client
    const client = new ReplicateVideoClient(apiKey, model || 'standard');

    const inputParams = {
      prompt,
      duration: duration || 5,
      aspect_ratio: aspectRatio || "16:9",
      negative_prompt: negativePrompt || "",
      start_image: startImage,
      cfg_scale: cfg_scale || 0.5,
      reference_images: referenceImages
    };

    // Use prediction-based generation for better progress tracking
    if (enableProgressTracking) {
      try {
        console.log('Creating prediction for progress tracking...');
        const predictionId = await client.createPrediction(inputParams);

        console.log('Prediction created successfully:', predictionId);

        // Return prediction ID for polling
        return NextResponse.json({
          id: predictionId,
          predictionId,
          status: 'generating',
          stage: 'initializing',
          progress: 0,
          prompt,
          duration: duration || 5,
          aspectRatio: aspectRatio || "16:9",
          model: model || 'standard',
          sourceImage: startImage,
          enablePolling: true
        });
      } catch (predictionError) {
        console.log('Prediction creation failed, falling back to direct generation:', predictionError);
        // Fall through to direct generation
      }
    }

    // Fallback to direct generation (blocking, no progress tracking)
    try {
      console.log('Using direct generation (no progress tracking)...');
      const videoUrl = await client.generateVideo(inputParams);

      console.log('Video generated successfully:', videoUrl);

      // Return immediately with the video URL
      return NextResponse.json({
        id: 'kling-' + Date.now(),
        status: 'succeeded',
        output: videoUrl,
        url: videoUrl,
        prompt,
        duration: duration || 5,
        aspectRatio: aspectRatio || "16:9",
        model: model || 'standard',
        sourceImage: startImage,
        enablePolling: false
      });
    } catch (directError) {
      console.error('Both prediction and direct generation failed:', directError);
      throw directError;
    }

  } catch (error) {
    console.error('Video generation error:', error);

    // Parse specific error messages for better user feedback
    let errorMessage = 'Failed to generate video';
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        errorMessage = 'Invalid Replicate API key. Please check your configuration.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
      } else if (error.message.includes('insufficient credits')) {
        errorMessage = 'Insufficient Replicate credits. Please add credits to your account.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        status: 'failed',
        stage: 'failed'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check video status (kept for backward compatibility)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get('id');

    if (!predictionId) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    // Check if this is a fake prediction ID (kling- + timestamp)
    if (predictionId.startsWith('kling-') && /^kling-\d+$/.test(predictionId)) {
      console.log('Detected fake prediction ID for completed video:', predictionId);
      return NextResponse.json({
        status: 'succeeded',
        output: null,
        thumbnailUrl: null
      });
    }

    const apiKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Replicate API key not configured" },
        { status: 500 }
      );
    }

    const client = new ReplicateVideoClient(apiKey);
    const status = await client.getVideoStatus(predictionId);

    // Generate thumbnail if video is ready
    let thumbnailUrl;
    if (status.status === 'succeeded' && status.output) {
      try {
        thumbnailUrl = status.output; // Use video URL as thumbnail for now
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    }

    return NextResponse.json({
      ...status,
      thumbnailUrl
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
