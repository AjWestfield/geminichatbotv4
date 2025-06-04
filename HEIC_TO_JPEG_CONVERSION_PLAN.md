# HEIC to JPEG Conversion Implementation Plan

## Overview
Implement automatic HEIC to JPEG conversion for thumbnail preview generation while preserving the original HEIC file for upload to Gemini.

## Step-by-Step Implementation Plan

### Phase 1: Install Dependencies
```bash
npm install heic-convert sharp
```
- **heic-convert**: Pure JavaScript HEIC decoder
- **sharp**: High-performance image processing (for resizing thumbnails)

### Phase 2: Create HEIC Conversion Service

#### 1. Create `/lib/heic-converter.ts`
```typescript
import heicConvert from 'heic-convert';
import sharp from 'sharp';

export class HEICConverter {
  static async convertToJPEG(heicBuffer: Buffer): Promise<Buffer> {
    // Convert HEIC to JPEG
    const jpegBuffer = await heicConvert({
      buffer: heicBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    return jpegBuffer;
  }
  
  static async createThumbnail(imageBuffer: Buffer, maxSize: number = 200): Promise<Buffer> {
    // Create a small thumbnail for preview
    const thumbnail = await sharp(imageBuffer)
      .resize(maxSize, maxSize, {
        fit: 'cover',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnail;
  }
  
  static async convertHEICtoDataURL(heicBuffer: Buffer): Promise<string> {
    const jpegBuffer = await this.convertToJPEG(heicBuffer);
    const thumbnail = await this.createThumbnail(jpegBuffer);
    const base64 = thumbnail.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
}
```

### Phase 3: Create API Endpoint for HEIC Conversion

#### 2. Create `/app/api/convert-heic/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { HEICConverter } from '@/lib/heic-converter';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check if it's a HEIC file
    const isHEIC = file.type === 'image/heic' || 
                   file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif');
    
    if (!isHEIC) {
      return NextResponse.json({ error: 'Not a HEIC file' }, { status: 400 });
    }
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert HEIC to JPEG data URL
    const dataURL = await HEICConverter.convertHEICtoDataURL(buffer);
    
    return NextResponse.json({ 
      success: true, 
      preview: dataURL,
      originalName: file.name,
      originalSize: file.size
    });
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert HEIC file', details: error.message },
      { status: 500 }
    );
  }
}
```

### Phase 4: Update Chat Interface to Use Conversion

#### 3. Modify `/components/chat-interface.tsx` handleFileSelect
```typescript
// In handleFileSelect function, after file selection:

if (file.type.startsWith("image/")) {
  // Check if it's a HEIC/HEIF file
  if (file.type === 'image/heic' || file.type === 'image/heif' || 
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    console.log('HEIC file detected, converting to JPEG for preview...');
    
    try {
      // Convert HEIC to JPEG for preview
      const convertFormData = new FormData();
      convertFormData.append('file', file);
      
      const convertResponse = await fetch('/api/convert-heic', {
        method: 'POST',
        body: convertFormData
      });
      
      if (convertResponse.ok) {
        const { preview } = await convertResponse.json();
        console.log('HEIC converted successfully for preview');
        preview = preview; // Use the converted JPEG data URL
      } else {
        console.warn('HEIC conversion failed, continuing without preview');
        preview = undefined;
      }
    } catch (error) {
      console.error('HEIC conversion error:', error);
      preview = undefined;
    }
  } else {
    // Regular image handling (existing code)
    const reader = new FileReader();
    preview = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
```

### Phase 5: Optimize Performance

#### 4. Add Caching for Converted Images
```typescript
// In HEICConverter class, add caching:
private static cache = new Map<string, string>();

static async convertHEICtoDataURLWithCache(
  heicBuffer: Buffer, 
  cacheKey: string
): Promise<string> {
  // Check cache first
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey)!;
  }
  
  const dataURL = await this.convertHEICtoDataURL(heicBuffer);
  
  // Cache the result (limit cache size)
  if (this.cache.size > 50) {
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  this.cache.set(cacheKey, dataURL);
  
  return dataURL;
}
```

### Phase 6: Add Progress Indication

#### 5. Show conversion progress in UI
```typescript
// Add a conversion state in chat-interface.tsx:
const [isConvertingHEIC, setIsConvertingHEIC] = useState(false);

// In handleFileSelect:
if (isHEIC) {
  setIsConvertingHEIC(true);
  setUploadStatus('converting'); // New status
  
  try {
    // ... conversion code ...
  } finally {
    setIsConvertingHEIC(false);
  }
}

// Update UploadProgress component to show conversion status
```

### Phase 7: Error Handling & Fallbacks

#### 6. Implement robust error handling
```typescript
// In the conversion endpoint:
- Handle corrupted HEIC files
- Handle unsupported HEIC variants
- Provide meaningful error messages
- Fall back to placeholder on conversion failure

// Client-side:
- Show user-friendly error messages
- Maintain functionality even if preview fails
- Log errors for debugging
```

## Alternative Approaches Considered

### 1. Browser-side conversion (heic2any)
- **Pros**: No server load, faster for small files
- **Cons**: Limited browser support, larger bundle size, may fail on some HEIC variants

### 2. External service (Cloudinary, Imgix)
- **Pros**: Robust, handles edge cases well
- **Cons**: Requires API keys, costs money, adds latency

### 3. Native OS conversion (macOS sips command)
- **Pros**: Fast, native quality
- **Cons**: Platform-specific, won't work on all deployments

## Recommended Approach
Use server-side conversion with heic-convert for maximum compatibility and control.

## Testing Plan
1. Test with various HEIC files from different iPhone models
2. Test large HEIC files (>10MB)
3. Test corrupted/invalid HEIC files
4. Test performance with multiple simultaneous conversions
5. Verify original HEIC is preserved for Gemini upload

## Performance Considerations
- Conversion typically takes 100-500ms for average photos
- Thumbnail generation adds ~50ms
- Consider implementing a queue for multiple uploads
- Cache converted thumbnails to avoid re-conversion

## Security Considerations
- Validate file size limits before conversion
- Sanitize file names
- Implement rate limiting on conversion endpoint
- Clean up temporary files after conversion