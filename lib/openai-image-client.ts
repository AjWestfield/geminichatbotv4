/**
 * OpenAI GPT-Image-1 Client
 *
 * GPT-Image-1 is OpenAI's multimodal image generation model
 * - Requires organization verification (government ID + facial verification)
 * - Uses token-based pricing for text, image input, and image output
 * - Supports generation, editing, and variations
 * - Can process up to 10 input images
 *
 * Key Features:
 * - High-fidelity image generation
 * - Image-to-image transformations
 * - Inpainting with alpha channel masks
 * - Multi-image composition
 * - Accurate text rendering in images
 * - Transparent background support
 *
 * IMPORTANT: GPT-Image-1 has specific parameter requirements:
 * - quality: "low", "medium", "high" (NOT "standard" or "hd")
 * - NO style parameter supported (unlike DALL-E models)
 * - edit operations do NOT accept quality parameter
 */

import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

interface GPTImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

interface GPTImageErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * Convert image URL to base64 data
 * Works in both browser and Node.js environments
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return as data URL
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to convert URL to base64:', error);
    throw new Error('Failed to process image URL');
  }
}

/**
 * Generate a new image using GPT-Image-1
 */
export async function generateImageWithGPTImage1(
  prompt: string,
  options: {
    size?: '1024x1024' | '1536x1024' | '1024x1536';
    quality?: 'low' | 'medium' | 'high';
    output_format?: 'png' | 'jpeg' | 'webp';
    background?: 'transparent' | 'auto';
    moderation?: 'low' | 'auto';
    n?: number;
  } = {}
) {
  const {
    size = '1024x1024',
    quality = 'medium',
    output_format = 'png',
    background = 'auto',
    moderation = 'auto',
    n = 1,
  } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('Generating image...');
    console.log(`Quality: ${quality}, Size: ${size}, Format: ${output_format}`);

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n,
      size: size as any,
      quality: quality as any,
      output_format: output_format as any,
      background: background as any,
      moderation: moderation as any,
    });

    // Handle both URL and base64 responses
    let resultImageUrl = response.data[0]?.url;
    if (!resultImageUrl && response.data[0]?.b64_json) {
      resultImageUrl = `data:image/${output_format};base64,${response.data[0].b64_json}`;
    }

    return {
      success: true,
      imageUrl: resultImageUrl || '',
      revisedPrompt: response.data[0]?.revised_prompt,
      model: 'gpt-image-1',
    };
  } catch (error: any) {
    console.error('GPT-Image-1 generation error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // If GPT-Image-1 requires verification or is not available
    if (error.message?.includes('invalid_model') || 
        error.message?.includes('model_not_found') ||
        error.message?.includes('verification required') ||
        error.message?.includes('organization not verified')) {
      
      console.log('GPT-Image-1 not available, falling back to DALL-E-3...');
      
      // Fall back to DALL-E-3 (which supports style parameter)
      try {
        const dalle3Response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1, // DALL-E-3 only supports n=1
          size: size as any,
          quality: quality === 'high' ? 'hd' : 'standard', // Map quality
          // Note: DALL-E-3 supports style but not background/moderation
        });

        return {
          success: true,
          imageUrl: dalle3Response.data[0]?.url || '',
          revisedPrompt: dalle3Response.data[0]?.revised_prompt,
          model: 'dall-e-3 (fallback)',
        };
      } catch (dalle3Error: any) {
        console.error('DALL-E-3 fallback also failed:', dalle3Error.message);
        // Try DALL-E-2 as last resort
        const dalle2Response = await openai.images.generate({
          model: 'dall-e-2',
          prompt,
          n,
          size: size === '1536x1024' || size === '1024x1536' ? '1024x1024' : size as any,
        });

        return {
          success: true,
          imageUrl: dalle2Response.data[0]?.url || '',
          model: 'dall-e-2 (fallback)',
        };
      }
    }

    throw error;
  }
}

/**
 * Edit an existing image using GPT-Image-1's image-to-image capabilities
 * Note: GPT-Image-1 edit operations do NOT accept quality parameter
 */
export async function editImageWithGPTImage1(
  imageUrl: string,
  prompt: string,
  options: {
    size?: '1024x1024' | '1536x1024' | '1024x1536';
    mask?: string; // Optional mask URL for inpainting
    n?: number;
  } = {}
) {
  const {
    size = '1024x1024',
    mask,
    n = 1,
  } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured.');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('Editing image with GPT-Image-1...');
    console.log('Original image:', imageUrl);
    console.log('Edit prompt:', prompt);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Convert buffer to File using OpenAI's toFile helper
    const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

    // Prepare parameters for GPT-Image-1 edit
    // Note: NO quality parameter for edit operations
    const editParams: any = {
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt,
      size: size as any,
      n: n,
    };

    // Add mask if provided for inpainting
    if (mask) {
      const maskResponse = await fetch(mask);
      if (maskResponse.ok) {
        const maskArrayBuffer = await maskResponse.arrayBuffer();
        const maskBuffer = Buffer.from(maskArrayBuffer);
        const maskFile = await toFile(maskBuffer, 'mask.png', { type: 'image/png' });
        editParams.mask = maskFile;
        console.log('Using mask for inpainting');
      }
    }

    // Use OpenAI SDK to edit the image
    const response = await openai.images.edit(editParams);

    // Handle both URL and base64 responses
    let resultImageUrl = response.data[0]?.url;

    if (!resultImageUrl && response.data[0]?.b64_json) {
      // Convert base64 to data URL
      resultImageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
    }

    return {
      success: true,
      imageUrl: resultImageUrl || '',
      originalImageUrl: imageUrl,
      prompt,
      revisedPrompt: response.data[0]?.revised_prompt,
      model: 'gpt-image-1',
      method: 'image-to-image',
    };
  } catch (error: any) {
    console.error('GPT-Image-1 edit error:', error);
    console.error('Error details:', error.response?.data || error.message);

    // Check for moderation/safety system errors first
    if (error.message?.includes('safety system') || error.code === 'moderation_blocked' || error.type === 'image_generation_user_error') {
      // Pass through the moderation error without fallback
      throw error;
    }

    // If the model is not found or requires verification
    if (error.message?.includes('invalid_model') || 
        error.message?.includes('model_not_found') ||
        error.message?.includes('verification required')) {
      // Try with dall-e-2 as fallback
      console.log('GPT-Image-1 not available, falling back to dall-e-2...');

      const openai = new OpenAI({ apiKey });

      // Re-download the image for the fallback attempt
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

      const fallbackParams: any = {
        model: 'dall-e-2',
        image: imageFile,
        prompt: prompt,
        size: size === '1536x1024' || size === '1024x1536' ? '1024x1024' : size as any,
        n: 1,
      };

      if (mask) {
        const maskResponse = await fetch(mask);
        if (maskResponse.ok) {
          const maskBuffer = Buffer.from(await maskResponse.arrayBuffer());
          const maskFile = await toFile(maskBuffer, 'mask.png', { type: 'image/png' });
          fallbackParams.mask = maskFile;
        }
      }

      const fallbackResponse = await openai.images.edit(fallbackParams);

      // Handle both URL and base64 responses for fallback
      let fallbackImageUrl = fallbackResponse.data[0]?.url;
      if (!fallbackImageUrl && fallbackResponse.data[0]?.b64_json) {
        fallbackImageUrl = `data:image/png;base64,${fallbackResponse.data[0].b64_json}`;
      }

      return {
        success: true,
        imageUrl: fallbackImageUrl || '',
        originalImageUrl: imageUrl,
        prompt,
        revisedPrompt: fallbackResponse.data[0]?.revised_prompt,
        model: 'dall-e-2 (fallback)',
        method: 'image-to-image',
      };
    }

    throw error;
  }
}

/**
 * Create variations of an image using GPT-Image-1
 */
export async function createImageVariationGPT1(
  imageUrl: string,
  options: {
    n?: number;
    size?: '1024x1024' | '1536x1024' | '1024x1536';
    style?: 'vivid' | 'natural';
  } = {}
) {
  const {
    n = 1,
    size = '1024x1024',
    style = 'natural',
  } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured.');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('Creating image variation with GPT-Image-1...');

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Convert buffer to File using OpenAI's toFile helper
    const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

    // Use OpenAI SDK to create variations
    const response = await openai.images.createVariation({
      model: 'gpt-image-1' as any,
      image: imageFile,
      n: n,
      size: size as any,
    });

    return {
      success: true,
      imageUrl: response.data[0]?.url || '',
      model: 'gpt-image-1',
      method: 'variation',
    };
  } catch (error: any) {
    console.error('GPT-Image-1 variation error:', error);

    // If gpt-image-1 is not available, fall back to dall-e-2
    if (error.message?.includes('invalid_model') || error.message?.includes('model_not_found')) {
      console.log('GPT-Image-1 not available, falling back to dall-e-2...');

      // Re-download the image for the fallback
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

      const fallbackResponse = await openai.images.createVariation({
        model: 'dall-e-2' as any,
        image: imageFile,
        n: n,
        size: size === '1536x1024' || size === '1024x1536' ? '1024x1024' : size as any,
      });

      return {
        success: true,
        imageUrl: fallbackResponse.data[0]?.url || '',
        model: 'dall-e-2 (fallback)',
        method: 'variation',
      };
    }

    throw error;
  }
}

/**
 * Smart edit function that uses GPT-Image-1's advanced capabilities
 */
export async function smartEditWithGPTImage1(
  imageUrl: string,
  editPrompt: string,
  options: {
    size?: '1024x1024' | '1536x1024' | '1024x1536';
    quality?: 'low' | 'medium' | 'high';
    style?: 'vivid' | 'natural';
    mask?: string;
  } = {}
) {
  const {
    size = '1024x1024',
    quality = 'medium',
    style = 'natural',
    mask,
  } = options;

  console.log('Using smart image editing approach with GPT-Image-1...');

  try {
    // Use the image-to-image edit capability with GPT-Image-1
    const result = await editImageWithGPTImage1(imageUrl, editPrompt, {
      size,
      quality,
      style,
      mask,
    });

    return result;
  } catch (error: any) {
    // The error is already handled in editImageWithGPTImage1 with fallback
    // Just pass through any remaining errors
    throw error;
  }
}

/**
 * Check GPT-Image-1 availability
 * Note: Requires organization verification (government ID + facial verification)
 */
export async function checkGPTImage1Available() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return false;
  }

  try {
    // Check if we can access GPT-Image-1
    // In practice, you might want to make a test API call
    // For now, we assume availability if API key exists
    return true;
  } catch (error) {
    console.error('Failed to check GPT-Image-1 availability:', error);
    return false;
  }
}
