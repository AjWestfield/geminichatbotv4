# Image Generation Model Configuration

## Overview

The Gemini AI Chatbot now supports dual image generation models with a quality-based toggle system:

- **High Quality (HD)**: Uses OpenAI's GPT-Image-1 (default)
- **Standard Quality**: Uses WaveSpeed AI's Flux Dev Ultra Fast

## Model Selection

The quality setting in the Image Generation Settings now controls which model is used:

### GPT-Image-1 (High Quality)
- **Provider**: OpenAI
- **Model**: gpt-image-1 (with fallback to dall-e-3/dall-e-2)
- **Features**:
  - Superior image quality
  - Accurate text rendering in images
  - Advanced multimodal capabilities
  - Better understanding of complex prompts
- **Sizes**: 1024×1024, 1536×1024, 1024×1536
- **When to use**: For best quality, text in images, complex scenes

### WaveSpeed AI (Standard Quality)
- **Provider**: WaveSpeed
- **Model**: flux-dev-ultra-fast
- **Features**:
  - Very fast generation (seconds)
  - Good quality output
  - Efficient processing
  - Reliable performance
- **Sizes**: 1024×1024, 1792×1024, 1024×1792
- **When to use**: For quick iterations, simple images, when speed matters

## How to Use

1. **Access Settings**: Click the settings icon (⚙️) in the chat interface
2. **Choose Model**: Select between:
   - "High Quality (GPT-Image-1)" - Default
   - "Standard (WaveSpeed AI)"
3. **Generate**: Use natural language like:
   - "Generate an image of..."
   - "Create a picture showing..."
   - "Draw an illustration of..."

## API Configuration

Both models require API keys in `.env.local`:

```env
# For GPT-Image-1 (High Quality)
OPENAI_API_KEY=your_openai_api_key

# For WaveSpeed (Standard)
WAVESPEED_API_KEY=your_wavespeed_api_key
```

## Features

### Quality Toggle = Model Selection
The quality setting now directly controls which AI model generates your images:
- HD → GPT-Image-1 (OpenAI)
- Standard → WaveSpeed AI

### Automatic Fallback
If GPT-Image-1 is not available, the system automatically falls back to:
1. DALL-E 3 (if available)
2. DALL-E 2 (if available)
3. WaveSpeed AI (if OpenAI fails completely)

### Model Display
Generated images now show which model was used:
- In the image gallery grid
- In the full-size image modal
- In the success message after generation

### Size Adjustments
The system automatically adjusts sizes based on the selected model:
- GPT-Image-1 uses 1536×1024 instead of 1792×1024 for landscape
- GPT-Image-1 uses 1024×1536 instead of 1024×1792 for portrait

## Technical Details

### API Endpoint
`POST /api/generate-image`

Request body:
```json
{
  "prompt": "Your image description",
  "quality": "hd",  // "hd" for GPT-Image-1, "standard" for WaveSpeed
  "style": "vivid", // or "natural"
  "size": "1024x1024" // or other supported sizes
}
```

### Response
```json
{
  "success": true,
  "images": [{
    "url": "https://...",
    "revisedPrompt": "Enhanced prompt",
    "index": 0
  }],
  "metadata": {
    "model": "gpt-image-1", // or "flux-dev-ultra-fast"
    "provider": "openai",   // or "wavespeed"
    "quality": "hd",
    "style": "vivid",
    "size": "1024x1024"
  }
}
```

## Benefits

1. **Flexibility**: Choose between quality and speed
2. **Cost Control**: Use Standard (WaveSpeed) for testing, HD for final images
3. **Reliability**: Automatic fallback ensures generation always works
4. **Transparency**: Always know which model generated each image
5. **Future-Proof**: Easy to add more models later

## Troubleshooting

### GPT-Image-1 Not Working?
- Ensure your OpenAI API key has access to image generation
- Check if your organization is verified with OpenAI
- The system will automatically fall back to DALL-E models

### WaveSpeed Not Working?
- Verify your WaveSpeed API key is valid
- Check for rate limits
- Ensure you have credits available

### Model Selection Not Appearing?
- Refresh the page
- Check the browser console for errors
- Verify both API keys are configured
