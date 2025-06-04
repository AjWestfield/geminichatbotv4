import Replicate from "replicate";
import { VideoGenerationInput } from "./video-generation-types";

export interface PredictionStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  logs?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export class ReplicateVideoClient {
  private replicate: Replicate;
  private model: string;

  constructor(apiKey: string, model: 'standard' | 'pro' = 'standard') {
    this.replicate = new Replicate({ auth: apiKey });

    // Using Kling v1.6 models as documented
    this.model = model === 'pro'
      ? "kwaivgi/kling-v1.6-pro"
      : "kwaivgi/kling-v1.6-standard";
  }

  /**
   * Generate video using direct run method (blocking, waits for completion)
   * Use this for immediate results when you don't need progress tracking
   */
  async generateVideo(input: VideoGenerationInput): Promise<string> {
    try {
      console.log(`Starting video generation with Kling v1.6 ${this.model.includes('pro') ? 'Pro' : 'Standard'} model`);
      console.log('Input:', input);

      // Format input according to Kling v1.6 API
      const replicateInput: any = {
        prompt: input.prompt,
        duration: input.duration || 5,
        cfg_scale: input.cfg_scale || 0.5,
        aspect_ratio: input.aspect_ratio || "16:9",
        negative_prompt: input.negative_prompt || ""
      };

      // Add start_image if provided (for image-to-video)
      if (input.start_image) {
        replicateInput.start_image = input.start_image;
      }

      console.log('Calling Replicate API with input:', replicateInput);

      // Use replicate.run() as shown in documentation
      const output = await this.replicate.run(this.model, { input: replicateInput });

      console.log('Replicate API response:', output);

      // The output should be a URL to the generated video
      if (typeof output === 'string') {
        console.log('Video generated successfully:', output);
        return output;
      } else if (output && typeof output === 'object' && 'url' in output) {
        // Sometimes the output is an object with a url method
        const url = typeof output.url === 'function' ? output.url() : output.url;
        console.log('Video generated successfully:', url);
        return url;
      } else if (Array.isArray(output) && output.length > 0) {
        console.log('Video generated successfully:', output[0]);
        return output[0];
      } else {
        console.error('Unexpected output format:', output);
        throw new Error('Unexpected output format from Replicate');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  }

  /**
   * Create a prediction for video generation (non-blocking, allows for polling)
   * Use this when you want to track progress and poll for status
   */
  async createPrediction(input: VideoGenerationInput): Promise<string> {
    try {
      console.log(`Creating prediction with Kling v1.6 ${this.model.includes('pro') ? 'Pro' : 'Standard'} model`);
      console.log('Input:', input);

      // Format input according to Kling v1.6 API
      const replicateInput: any = {
        prompt: input.prompt,
        duration: input.duration || 5,
        cfg_scale: input.cfg_scale || 0.5,
        aspect_ratio: input.aspect_ratio || "16:9",
        negative_prompt: input.negative_prompt || ""
      };

      // Add start_image if provided
      if (input.start_image) {
        replicateInput.start_image = input.start_image;
      }

      // Add reference images if provided
      if (input.reference_images && input.reference_images.length > 0) {
        replicateInput.reference_images = input.reference_images;
      }

      console.log('Creating Replicate prediction with input:', replicateInput);

      const prediction = await this.replicate.predictions.create({
        model: this.model,
        input: replicateInput
      });

      console.log('Prediction created successfully:', prediction.id);
      return prediction.id;
    } catch (error) {
      console.error('Error creating prediction:', error);
      throw error;
    }
  }

  /**
   * Get the status of a prediction
   */
  async getPredictionStatus(predictionId: string): Promise<PredictionStatus> {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);

      return {
        id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        error: prediction.error?.toString(),
        logs: prediction.logs,
        created_at: prediction.created_at,
        started_at: prediction.started_at,
        completed_at: prediction.completed_at
      };
    } catch (error) {
      console.error('Error getting prediction status:', error);
      throw error;
    }
  }

  /**
   * Wait for a prediction to complete (with optional timeout)
   */
  async waitForPrediction(predictionId: string, timeoutMs: number = 600000): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getPredictionStatus(predictionId);

      if (status.status === 'succeeded') {
        if (typeof status.output === 'string') {
          return status.output;
        } else if (Array.isArray(status.output) && status.output.length > 0) {
          return status.output[0];
        } else {
          throw new Error('No output URL found in successful prediction');
        }
      } else if (status.status === 'failed' || status.status === 'canceled') {
        throw new Error(status.error || `Prediction ${status.status}`);
      }

      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Prediction timed out');
  }

  /**
   * Cancel a prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      await this.replicate.predictions.cancel(predictionId);
      console.log('Prediction canceled successfully:', predictionId);
    } catch (error) {
      console.error('Error canceling prediction:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async getVideoStatus(predictionId: string): Promise<{
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string;
    error?: string;
  }> {
    const prediction = await this.getPredictionStatus(predictionId);
    return {
      status: prediction.status,
      output: typeof prediction.output === 'string' ? prediction.output :
              Array.isArray(prediction.output) ? prediction.output[0] : undefined,
      error: prediction.error
    };
  }
}
