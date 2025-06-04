# Auto Aspect Ratio Detection for Image-to-Video Animation

## Overview

The auto aspect ratio detection feature automatically analyzes source images and selects the optimal video aspect ratio (16:9, 9:16, or 1:1) for image-to-video animations. This eliminates the need to manually choose aspect ratios and ensures the best fit for your source content.

## How It Works

### Detection Algorithm

When you open the Animate Image modal, the system:

1. **Loads the source image** and analyzes its natural dimensions
2. **Calculates the aspect ratio** (width ÷ height)
3. **Maps to the closest supported video ratio** using these thresholds:

```typescript
// Aspect ratio mapping logic
const ratio = width / height

if (ratio >= 1.5) {
  // Wide/landscape images → 16:9 widescreen
  return "16:9"
} else if (ratio >= 0.8 && ratio <= 1.2) {
  // Square-ish images → 1:1 square
  return "1:1"
} else if (ratio <= 0.7) {
  // Tall/portrait images → 9:16 vertical
  return "9:16"
} else {
  // Ambiguous ratios → fallback based on orientation
  return ratio > 1 ? "16:9" : "9:16"
}
```

### Visual Feedback

- **🔮 Smart Detection Alert**: Shows the detected ratio and reasoning
- **🏷️ Auto Badge**: Indicates when aspect ratio was auto-detected
- **📊 Detailed Info**: Displays original image dimensions and calculated ratio

## Usage

### Automatic Detection (Default)

1. Click the **Animate** button on any image
2. The modal opens and automatically detects the optimal aspect ratio
3. You'll see a purple alert explaining the detection
4. Proceed with your animation prompt

### Manual Override

- You can still manually change the aspect ratio if needed
- The "Auto" badge disappears when you manually select a different ratio
- Your manual selection takes precedence

### Settings Control

Enable/disable auto-detection in **Settings → Video → Auto Aspect Ratio Detection**:

- ✅ **Enabled (Default)**: Automatic detection for all images
- ❌ **Disabled**: Always use the default aspect ratio setting

## Examples

### Landscape Photo (2400×1600)

- **Ratio**: 1.5
- **Detection**: 16:9 (Landscape)
- **Reasoning**: "Landscape image (2400×1600, ratio 1.50) → 16:9 widescreen"

### Portrait Photo (1080×1920)

- **Ratio**: 0.56
- **Detection**: 9:16 (Portrait)
- **Reasoning**: "Portrait image (1080×1920, ratio 0.56) → 9:16 vertical"

### Square Image (1024×1024)

- **Ratio**: 1.0
- **Detection**: 1:1 (Square)
- **Reasoning**: "Square image (1024×1024, ratio 1.00) → 1:1 square"

### Screenshot (1440×900)

- **Ratio**: 1.6
- **Detection**: 16:9 (Landscape)
- **Reasoning**: "Landscape image (1440×900, ratio 1.60) → 16:9 widescreen"

## Benefits

### 🎯 **Optimal Results**

- Videos maintain the natural orientation of your source images
- No awkward cropping or letterboxing

### ⚡ **Faster Workflow**

- No need to manually analyze and select aspect ratios
- One-click animation with smart defaults

### 🎨 **Better Composition**

- Preserves the intended framing of your original image
- Matches user expectations for different content types

### 📱 **Platform Optimization**

- Portrait images → 9:16 (perfect for TikTok, Instagram Stories)
- Landscape images → 16:9 (great for YouTube, desktop viewing)
- Square images → 1:1 (ideal for Instagram feeds)

## Technical Details

### Performance

- Detection happens instantly when the modal opens
- Uses HTML5 Image API for efficient dimension reading
- Graceful fallback to default settings if detection fails

### CORS Handling

- Supports images with proper CORS headers
- Falls back to default aspect ratio for cross-origin images without CORS

### Error Handling

- Network failures → Default aspect ratio
- Invalid images → Default aspect ratio
- Detection errors → Logged to console with fallback

## Settings Integration

The auto-detection setting is:

- ✅ **Saved to localStorage** (persists between sessions)
- 🔄 **Synced across components** (Settings ↔ Modal)
- 🎛️ **Configurable per user** (enable/disable globally)

## Future Enhancements

Potential improvements for future versions:

- **Smart Content Analysis**: Detect faces, objects, or text to influence ratio selection
- **Batch Processing**: Auto-detect ratios for multiple images at once
- **Custom Thresholds**: Allow users to adjust the detection sensitivity
- **Format Recommendations**: Suggest optimal ratios based on intended platform (TikTok, YouTube, etc.)
