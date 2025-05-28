import { NextRequest, NextResponse } from "next/server"
import { generateImageWithWaveSpeed } from "@/lib/wavespeed-client"
import { generateImageWithGPTImage1 } from "@/lib/openai-image-client"

export async function POST(req: NextRequest) {
  console.log("Image generation API called")
  
  try {
    // Parse request body
    const body = await req.json()
    console.log("Request body:", body)
    console.log("Received quality parameter:", body.quality) // Debug log
    
    const { 
      prompt, 
      quality = "hd", // Default to "hd" which uses GPT-Image-1
      style = "vivid",
      size = "1024x1024",
    } = body
    
    console.log("Quality after destructuring:", quality) // Debug log

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Use GPT-Image-1 for "hd" quality, WaveSpeed for "standard"
    const useGPTImage1 = quality === "hd"
    console.log("Using GPT-Image-1?", useGPTImage1) // Debug log
    
    if (useGPTImage1) {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY not configured, falling back to WaveSpeed")
        // Fall back to WaveSpeed if OpenAI is not configured
        return generateWithWaveSpeed(prompt, { quality: "standard", style, size })
      }

      console.log(`Generating image: "${prompt.substring(0, 50)}..."`)
      console.log(`Quality: HD, Size: ${size}`)

      try {
        // GPT-Image-1 doesn't support 1792x1024 or 1024x1792, adjust sizes
        let gptSize: '1024x1024' | '1536x1024' | '1024x1536' = '1024x1024'
        if (size === '1792x1024') {
          gptSize = '1536x1024' // Closest available size
        } else if (size === '1024x1792') {
          gptSize = '1024x1536' // Closest available size
        } else {
          gptSize = size as '1024x1024'
        }

        // Generate image using GPT-Image-1
        // Note: GPT-Image-1 does NOT support style parameter
        const result = await generateImageWithGPTImage1(prompt, {
          quality: 'high', // GPT-Image-1 uses low/medium/high
          size: gptSize,
          output_format: 'png',
          background: 'auto',
          moderation: 'auto',
          n: 1,
        })

        console.log(`Successfully generated image`)
        
        return NextResponse.json({
          success: true,
          images: [{
            url: result.imageUrl,
            revisedPrompt: result.revisedPrompt || prompt,
            index: 0,
          }],
          metadata: {
            model: result.model,
            provider: "openai",
            quality: "hd",
            style: style, // Keep for UI consistency even though GPT-Image-1 doesn't use it
            size: gptSize,
            originalPrompt: prompt,
            imageCount: 1,
          }
        })

      } catch (error: any) {
        console.error("GPT-Image-1 generation error:", error)
        console.error("Error details:", error.response?.data || error.message)
        
        if (error.message?.includes('safety system') || error.code === 'moderation_blocked') {
          return NextResponse.json(
            { 
              error: "Content not allowed",
              details: "The prompt was rejected by OpenAI's safety system. Please try a different prompt."
            },
            { status: 400 }
          )
        }

        if (error.message?.includes('rate_limit_exceeded')) {
          return NextResponse.json(
            { 
              error: "Rate limit exceeded",
              details: "Too many requests to OpenAI. Please wait a moment and try again."
            },
            { status: 429 }
          )
        }

        // Fall back to WaveSpeed on any GPT-Image-1 error
        console.log("Falling back to WaveSpeed due to GPT-Image-1 error:", error.message)
        return generateWithWaveSpeed(prompt, { quality: "standard", style, size })
      }
    } else {
      // Use WaveSpeed for standard quality
      return generateWithWaveSpeed(prompt, { quality, style, size })
    }

  } catch (error: any) {
    console.error("General error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Helper function to generate with WaveSpeed
async function generateWithWaveSpeed(
  prompt: string,
  options: {
    quality: string,
    style: string,
    size: string,
  }
) {
  // Check if WaveSpeed API key is configured
  if (!process.env.WAVESPEED_API_KEY) {
    console.error("WAVESPEED_API_KEY not configured")
    return NextResponse.json(
      { 
        error: "WaveSpeed API key not configured",
        details: "Please add WAVESPEED_API_KEY to your .env.local file. Get your API key from https://wavespeed.ai"
      },
      { status: 500 }
    )
  }

  console.log(`Generating image: "${prompt.substring(0, 50)}..."`)
  console.log(`Quality: Standard, Style: ${options.style}, Size: ${options.size}`)

  try {
    // Generate image using WaveSpeed
    const result = await generateImageWithWaveSpeed(prompt, {
      quality: options.quality,
      style: options.style,
      size: options.size as '1024x1024' | '1792x1024' | '1024x1792',
    })

    console.log(`Successfully generated image`)
    
    return NextResponse.json({
      success: true,
      images: [{
        url: result.imageUrl,
        revisedPrompt: prompt,
        index: 0,
      }],
      metadata: {
        model: "flux-dev-ultra-fast",
        provider: "wavespeed",
        quality: options.quality,
        style: options.style,
        size: options.size,
        originalPrompt: prompt,
        imageCount: 1,
      }
    })

  } catch (error: any) {
    console.error("WaveSpeed generation error:", error)
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          details: "Too many requests. Please wait a moment and try again."
        },
        { status: 429 }
      )
    }

    if (error.message?.includes('Task failed')) {
      return NextResponse.json(
        { 
          error: "Generation failed",
          details: error.message || "The image generation task failed. Try a different prompt."
        },
        { status: 400 }
      )
    }

    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { 
          error: "Generation timeout",
          details: "Image generation took too long. Please try again."
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Image generation API is accessible",
    models: {
      hd: {
        provider: "openai",
        model: "gpt-image-1",
        description: "OpenAI's multimodal image generation model",
        features: ["Superior quality", "Accurate text rendering", "Multi-image composition", "Transparent backgrounds"],
        sizes: ["1024x1024", "1536x1024", "1024x1536"],
        parameters: {
          quality: ["low", "medium", "high"],
          output_format: ["png", "jpeg", "webp"],
          background: ["transparent", "auto"],
          moderation: ["low", "auto"]
        },
        notes: "Requires organization verification. Does NOT support style parameter."
      },
      standard: {
        provider: "wavespeed",
        model: "flux-dev-ultra-fast",
        description: "WaveSpeed AI's fast image generation",
        features: ["Very fast generation", "Good quality", "Efficient processing"],
        sizes: ["1024x1024", "1792x1024", "1024x1792"]
      }
    },
    defaultQuality: "hd",
    capabilities: {
      quality: ["standard", "hd"],
      style: ["vivid", "natural"] // Note: style only works with WaveSpeed, not GPT-Image-1
    }
  })
}
