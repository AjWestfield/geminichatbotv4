# Loading Message Fix

## Issue
The loading message was showing "Generating image with WaveSpeed AI..." even when using GPT-Image-1, causing confusion.

## Solution
Updated the loading message in `chat-interface.tsx` to dynamically display the correct model based on the quality setting:

- **HD Quality**: Shows "Generating image with GPT-Image-1..." with purple loading dots
- **Standard Quality**: Shows "Generating image with WaveSpeed AI..." with blue loading dots

## Implementation
```tsx
<span className="text-sm text-[#B0B0B0]">
  Generating image with {imageQuality === 'hd' ? 'GPT-Image-1' : 'WaveSpeed AI'}...
</span>
```

The loading dots also change color:
- Purple (bg-purple-400) for GPT-Image-1
- Blue (bg-blue-400) for WaveSpeed AI

This provides clear visual feedback about which model is being used during the generation process.
