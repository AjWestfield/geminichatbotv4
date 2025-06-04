# Image Edit Background Generation Implementation

## Overview
This implementation allows image editing to continue in the background when the modal is closed, similar to how video generation works. A loading card with progress indication is shown in the image gallery while the edit is processing.

## Key Features

1. **Non-blocking Modal**: When user clicks "Start Edit", the modal closes immediately and generation continues in background
2. **Progress Tracking**: Real-time progress updates with percentage, elapsed time, and stage indicators
3. **Visual Feedback**: Loading card with animated gradient, progress bar, and blurred original image preview
4. **Cancel Support**: Users can cancel ongoing generations
5. **Multiple Simultaneous Edits**: Support for multiple image edits running in parallel

## Technical Implementation

### 1. Image Progress Store (`/lib/stores/image-progress-store.ts`)
- Zustand store for tracking image generation progress
- Tracks stages: initializing → processing → finalizing → completed/failed
- Calculates estimated time based on quality settings
- Supports both new generation and edit operations

### 2. Image Loading Card (`/components/image-loading-card.tsx`)
- Visual component showing generation progress
- Animated gradient background with shimmer effect
- Progress bar with percentage display
- Stage indicators with appropriate icons
- Shows original image as blurred background for edits
- Cancel button to abort generation

### 3. Modified Image Gallery (`/components/image-gallery.tsx`)
- Displays loading cards for generating images
- Updates progress every second
- Automatically adds completed images to gallery
- Removes loading cards after completion

### 4. Updated Edit Modal (`/components/image-edit-modal.tsx`)
- Submits generation to progress store
- Closes immediately after submission
- Performs API call in background via separate function
- Updates progress stages during generation

## Usage

1. Click on any image in the gallery
2. Select "Edit" option
3. Enter your edit prompt
4. Click "Start Edit"
5. Modal closes and loading card appears
6. Monitor progress in the gallery
7. Edited image appears when complete

## Benefits

- **Better UX**: Users can continue using the app while images generate
- **Visual Progress**: Clear indication of generation status
- **Consistency**: Matches video generation behavior
- **Reliability**: Generation continues even if user navigates away from modal

## Testing

Run `./test-image-edit-background.sh` for detailed testing instructions.

## Future Enhancements

1. Add queue management for multiple generations
2. Implement retry logic for failed generations
3. Add notification when generation completes
4. Save generation history for resume functionality