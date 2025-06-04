# Multiple File Selection Implementation Plan

## Overview
Enable users to select and upload multiple files at once, with proper UI feedback and processing.

## Implementation Steps

### Phase 1: Update File Input Handler
```typescript
// In animated-ai-input.tsx
interface AIPromptProps {
  // Change from single file to array
  onFileSelect?: (file: File) => void
  onFilesSelect?: (files: File[]) => void // New prop
  selectedFiles?: FileUpload[] // Array instead of single
}
```

### Phase 2: Update File Preview UI
```typescript
// Show multiple file previews in a scrollable container
{selectedFiles && selectedFiles.length > 0 && (
  <div className="mx-4 mt-2 mb-2 max-h-32 overflow-y-auto">
    <div className="space-y-2">
      {selectedFiles.map((file, index) => (
        <div key={index} className="bg-[#333333] rounded-lg p-2">
          {/* File preview UI */}
        </div>
      ))}
    </div>
  </div>
)}
```

### Phase 3: Update Chat Interface
```typescript
// Handle multiple files
const handleFilesSelect = useCallback(async (files: File[]) => {
  // Process files sequentially to avoid overloading
  for (const file of files) {
    await handleFileSelect(file)
    // Add delay between uploads if needed
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}, [handleFileSelect])
```

### Phase 4: Batch Processing Options
1. **Sequential Processing** (Recommended)
   - Upload files one by one
   - Show progress for each file
   - Prevents server overload

2. **Parallel Processing**
   - Upload all files simultaneously
   - Faster but may hit rate limits
   - Need progress tracking for each

### Phase 5: UI/UX Considerations
1. **File Limit**: Max 10 files at once
2. **Size Limit**: Total size < 100MB
3. **Progress**: Show overall progress (3/5 files uploaded)
4. **Errors**: Handle partial failures gracefully

## Quick Implementation (Minimal Changes)

For a quick implementation with minimal changes:

```typescript
// In animated-ai-input.tsx onChange handler
onChange={(e) => {
  const files = e.target.files
  if (files && files.length > 0 && onFileSelect) {
    // Process files sequentially
    Array.from(files).forEach((file, index) => {
      setTimeout(() => {
        onFileSelect(file)
      }, index * 1000) // 1 second delay between files
    })
    e.target.value = ''
  }
}}
```

This would allow selecting multiple files and process them one by one with a delay.

## Testing Plan
1. Select 2-3 images → Should upload sequentially
2. Mix of images and documents → Each processed correctly
3. Large files → Progress shown for each
4. Cancel mid-upload → Remaining files cancelled
5. Error handling → Failed files don't block others