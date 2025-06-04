# Image Upload Options - Test Guide

## Overview
When users upload an image without any text, they now see three options:
1. 🔍 **Analyze Image** - Get detailed insights about the image content
2. ✏️ **Edit Image** - Modify the image using AI-powered editing
3. 🎬 **Animate Image** - Transform this image into a video

## Testing Instructions

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Open browser to http://localhost:3000
3. Have test images ready (JPG, PNG, etc.)

### Test 1: Basic Options Display
1. Click the paperclip (attachment) icon
2. Select an image file
3. Wait for upload to complete
4. **DO NOT type any text**
5. Press Enter or click Send

**Expected Result:**
- You should see a card with three option buttons
- Each button should have an icon, label, and description

### Test 2: Analyze Image Option
1. Upload an image without text
2. Click "🔍 Analyze Image"

**Expected Result:**
- The word "analyze" appears in the input
- Message is sent automatically
- AI provides detailed image analysis

### Test 3: Edit Image Option
1. Upload an image without text
2. Click "✏️ Edit Image"

**Expected Result:**
- Image is added to the Images tab
- Canvas automatically switches to Images tab
- Toast notification appears
- "edit this image" appears in the input
- You can now type specific edit instructions

### Test 4: Animate Image Option
1. Upload an image without text
2. Click "🎬 Animate Image"

**Expected Result:**
- "animate this image" appears in the input
- Message is sent automatically
- Video generation starts (if API key configured)
- Progress appears in Video tab

### Test 5: Normal Flow (With Text)
1. Upload an image
2. Type any message (e.g., "What is this?")
3. Press Enter

**Expected Result:**
- NO options card appears
- Normal message processing occurs
- AI responds based on your text

## Error Scenarios

### Missing API Keys
- **Edit Image**: If OpenAI API key missing, should show configuration message
- **Animate Image**: If Replicate API key missing, should show configuration message

### Network Errors
- Test with dev server stopped
- Should show appropriate error messages

## Visual Testing

### Dark Theme Compatibility
- Options card should match dark theme
- Hover states should be visible
- Text should be readable

### Responsive Design
- Test on mobile viewport
- Buttons should stack properly
- Text should not overflow

## Integration Testing

### With MCP Tools
1. Enable MCP tools
2. Upload image
3. Select any option
4. Verify MCP tools still work

### With Multiple Files
1. Upload multiple images
2. Verify options appear for image files only
3. Audio/video files should follow normal flow

## Performance Testing

### Large Images
1. Upload a large image (>5MB)
2. Options should appear after upload completes
3. No UI freezing

### Rapid Selection
1. Upload image
2. Quickly click different options
3. Should handle only the first selection

## Edge Cases

### Cancel Upload
1. Start uploading image
2. Cancel before completion
3. No options should appear

### Quick Re-upload
1. Upload image and select option
2. Immediately upload another image
3. New options should appear for new image

## Debugging

If options don't appear:
1. Check browser console for errors
2. Verify backend returns `[IMAGE_OPTIONS]` marker
3. Check network tab for API response
4. Ensure ChatMessage component receives onImageOptionSelect prop

## Success Criteria

✅ Options appear only for images uploaded without text
✅ All three options work correctly
✅ Normal flow unaffected when text is provided
✅ Smooth transitions between options
✅ Error handling for missing API keys
✅ Visual consistency with app theme