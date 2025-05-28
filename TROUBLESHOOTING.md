## Troubleshooting Image Generation Model Selection

### Issue
The Image Generation Settings show "High Quality (GPT-Image-1)" selected, but images are being generated with WaveSpeed AI instead.

### Debugging Steps Applied

1. **Fixed Props Issue**: Corrected the ImageGenerationSettings component props (was missing proper onQualityChange prop binding)

2. **Added Debug Logging**:
   - Log quality state changes in chat-interface.tsx
   - Log quality parameter in the API route
   - Log the actual quality value being sent in the request

3. **State Management**: 
   - Default quality is set to "hd" (GPT-Image-1)
   - Quality state is properly bound to the settings component

### To Test the Fix

1. **Refresh the Application**:
   ```bash
   # Refresh your browser at http://localhost:3006
   # Or restart the dev server if needed
   ```

2. **Open Browser Console** (F12 or right-click → Inspect → Console)

3. **Test Generation**:
   - Open Image Generation Settings (⚙️ icon)
   - Ensure "High Quality (GPT-Image-1)" is selected
   - Click "Done"
   - Generate an image with a prompt
   - Check console logs for:
     - "Image quality setting changed to: hd"
     - "Current quality setting: hd"
     - "Received quality parameter: hd"
     - "Using GPT-Image-1? true"

4. **If Still Using WaveSpeed**:
   - Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
   - Check if OpenAI API is responding (might be falling back due to API errors)
   - Look for any error messages in the console

### Manual API Test

You can also test the API directly:

```bash
# Test GPT-Image-1 (HD quality)
curl -X POST http://localhost:3006/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset",
    "quality": "hd"
  }'

# Test WaveSpeed (Standard quality)  
curl -X POST http://localhost:3006/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset", 
    "quality": "standard"
  }'
```

### Common Issues and Solutions

1. **State Not Persisting**: 
   - The settings dialog might not be saving the selection
   - Solution: Added proper state management and logging

2. **API Fallback**:
   - If OpenAI fails, it falls back to WaveSpeed
   - Check for OpenAI API errors in console/network tab

3. **Browser Cache**:
   - Old JavaScript might be cached
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)

4. **Component Props**:
   - Fixed the missing onQualityChange prop binding
   - Now properly updates the parent component state
