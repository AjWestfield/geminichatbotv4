# Image Generation Animation Effect

## Overview

This implementation adds a beautiful animation effect to images while they are being generated. The animation creates a progressive reveal effect with a blur that moves from top to bottom over 30 seconds.

## How It Works

### 1. Animation Component

The `ImageGeneration` component (`components/ui/ai-chat-image-generation-1.tsx`) provides:
- Three states: "starting", "generating", and "completed"
- Animated text with gradient effect that shows generation status
- Progressive blur reveal effect using CSS `clipPath` and `maskImage`
- Customizable duration (default 30 seconds)

### 2. Image Generation Flow

1. **Generation Starts**: 
   - A placeholder image is added with `isGenerating: true`
   - The Images tab automatically opens
   - Animation component wraps the placeholder

2. **During Generation**:
   - Text shows "Getting started..." → "Creating image. May take a moment..."
   - Blur effect progressively reveals from top to bottom
   - Actual generation happens in parallel

3. **Generation Completes**:
   - Real image URL replaces the placeholder
   - Animation completes if still running
   - Image becomes interactive (can download, edit, etc.)

### 3. Key Features

- **Seamless Experience**: Animation continues even if image loads early
- **Error Handling**: Placeholder is removed if generation fails
- **Performance**: Only actively generating images have animations
- **Persistence**: Completed images are saved to localStorage

## Usage

To generate an image with the animation:

1. Type "generate an image of..." or "create an image of..." in the chat
2. The Images tab will open automatically
3. Watch the animation as your image is created
4. The completed image appears when ready

## Technical Details

### State Management

```typescript
interface GeneratedImage {
  // ... other fields
  isGenerating?: boolean      // Track if currently generating
  generationStartTime?: Date  // When generation started
}
```

### Animation Timing

- **Starting phase**: 3 seconds
- **Generating phase**: Up to 30 seconds (adjustable)
- **Completion**: Smooth fade out of blur effect

### CSS Effects

- **Text Animation**: Gradient moves across text infinitely during generation
- **Blur Reveal**: Uses `clipPath` and `maskImage` for smooth top-to-bottom reveal
- **Dark Theme**: Optimized colors for dark background (#2B2B2B, #333333)

## Customization

To adjust animation duration:

```typescript
<ImageGeneration duration={45000}> {/* 45 seconds */}
  {/* Your content */}
</ImageGeneration>
```

## Browser Compatibility

- Works in all modern browsers
- Uses `-webkit-mask-image` for Safari compatibility
- Graceful degradation for older browsers