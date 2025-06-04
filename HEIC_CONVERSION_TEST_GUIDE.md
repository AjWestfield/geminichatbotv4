# HEIC Conversion Test Guide

## Quick Test Instructions

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test via the app**:
   - Open http://localhost:3000
   - Click the paperclip icon to upload a file
   - Select a HEIC image from your iPhone
   - You should see:
     - "Converting HEIC to JPEG..." progress indicator
     - Actual image thumbnail appears (not placeholder)
     - File info shows "HEIC format"

3. **Test via the test page**:
   - Open http://localhost:3000/test-heic.html
   - Drag and drop or select a HEIC file
   - See conversion details and preview

## What to Expect

### Success Case:
1. HEIC file selected
2. "Converting HEIC to JPEG..." appears briefly
3. Thumbnail preview shows actual image
4. Console shows: "HEIC converted successfully in XXXms"
5. File uploads normally to Gemini
6. All features work (analyze, edit, animate)

### Error Cases:
- **Large files (>50MB)**: Shows error, continues without preview
- **Corrupted HEIC**: Shows error, falls back to placeholder
- **Server not running**: Shows connection error

## Console Output

Look for these messages in browser console:
```
HEIC file detected, converting to JPEG for preview...
[HEIC Conversion] Processing IMG_5718.HEIC (0.84MB)
[HEICConverter] Starting HEIC to JPEG conversion...
[HEICConverter] Conversion successful
[HEIC Conversion] Completed in 245ms
HEIC converted successfully in 245ms
```

## Troubleshooting

### "Cannot find module 'heic-convert'"
Run: `npm install heic-convert sharp --legacy-peer-deps`

### Conversion fails
- Check file size (<50MB)
- Try a different HEIC file
- Check console for specific error

### No thumbnail appears
- Verify conversion API returns 200 status
- Check browser console for errors
- Ensure preview data URL is valid

## Technical Details

- **Conversion time**: 100-500ms typical
- **Thumbnail size**: 400px max dimension
- **Cache**: 50 most recent conversions
- **Supported formats**: .heic, .heif
- **Quality**: 90% JPEG conversion, 80% thumbnail

## Testing Different Scenarios

1. **Single HEIC file**: Should show thumbnail
2. **Multiple uploads**: Each should convert independently
3. **Mixed formats**: JPEG/PNG show instantly, HEIC converts first
4. **Large HEIC (>10MB)**: May take 1-2 seconds
5. **Rapid uploads**: Cache prevents re-conversion

## API Testing

Test the conversion endpoint directly:
```bash
curl -X POST http://localhost:3000/api/convert-heic \
  -F "file=@/path/to/your/image.heic" \
  | jq .
```

Response:
```json
{
  "success": true,
  "preview": "data:image/jpeg;base64,...",
  "originalName": "IMG_5718.HEIC",
  "originalSize": 881234,
  "previewSize": "45.2KB",
  "conversionTime": "245ms"
}
```