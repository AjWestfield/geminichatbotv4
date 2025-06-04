# Inline Image Options Enhancement - Implementation Plan

## Overview
Enhance the inline image options to be more compact, responsive, and functional with proper prompting for edit/animate actions and automatic aspect ratio detection.

## Step-by-Step Implementation Plan

### Phase 1: UI Redesign (Compact & Responsive)

#### 1.1 Update `inline-image-options.tsx`
- Remove the question text to save space
- Make buttons smaller with icon-first design
- Use a horizontal layout with equal spacing
- Add tooltips for clarity
- Responsive design for mobile

```tsx
// Compact button design
<div className="flex gap-1.5 p-2">
  <Button size="xs" title="Analyze image content">
    🔍 <span className="hidden sm:inline ml-1">Analyze</span>
  </Button>
  <Button size="xs" title="Edit with AI">
    ✏️ <span className="hidden sm:inline ml-1">Edit</span>
  </Button>
  <Button size="xs" title="Create video">
    🎬 <span className="hidden sm:inline ml-1">Animate</span>
  </Button>
</div>
```

### Phase 2: Aspect Ratio Detection

#### 2.1 Create `getImageAspectRatio` utility
```typescript
async function getImageAspectRatio(file: File): Promise<{
  width: number
  height: number
  aspectRatio: number
  orientation: 'landscape' | 'portrait' | 'square'
  imageSize: '1024x1024' | '1792x1024' | '1024x1792'
  videoAspectRatio: '16:9' | '9:16' | '1:1'
}> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      const width = img.width
      const height = img.height
      const aspectRatio = width / height
      
      // Determine orientation
      let orientation: 'landscape' | 'portrait' | 'square'
      let imageSize: '1024x1024' | '1792x1024' | '1024x1792'
      let videoAspectRatio: '16:9' | '9:16' | '1:1'
      
      if (Math.abs(aspectRatio - 1) < 0.1) {
        orientation = 'square'
        imageSize = '1024x1024'
        videoAspectRatio = '1:1'
      } else if (aspectRatio > 1) {
        orientation = 'landscape'
        imageSize = '1792x1024'
        videoAspectRatio = '16:9'
      } else {
        orientation = 'portrait'
        imageSize = '1024x1792'
        videoAspectRatio = '9:16'
      }
      
      URL.revokeObjectURL(url)
      resolve({ width, height, aspectRatio, orientation, imageSize, videoAspectRatio })
    }
    
    img.src = url
  })
}
```

#### 2.2 Store aspect ratio on upload
- Add to `FileUpload` interface
- Calculate during `handleFileSelect`
- Pass to option handlers

### Phase 3: Prompt Dialog Component

#### 3.1 Create `image-action-dialog.tsx`
```tsx
interface ImageActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (prompt: string) => void
  action: 'edit' | 'animate'
  imageName: string
}

export function ImageActionDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action,
  imageName 
}: ImageActionDialogProps) {
  const [prompt, setPrompt] = useState('')
  
  const placeholders = {
    edit: "e.g., Change the background to a sunset, add a hat, remove the person...",
    animate: "e.g., Make the person wave, zoom into the face, pan across the scene..."
  }
  
  const titles = {
    edit: "What would you like to edit?",
    animate: "How should the image move?"
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>
            {action === 'edit' ? 'Describe the changes for ' : 'Describe the animation for '}
            {imageName}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={placeholders[action]}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => {
              onConfirm(prompt)
              onClose()
            }} 
            disabled={!prompt.trim()}
          >
            {action === 'edit' ? 'Start Editing' : 'Create Video'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Phase 4: Implement Button Actions

#### 4.1 Analyze Button
```typescript
case 'analyze':
  // Direct analysis - submit empty message
  setShowImageOptions(false)
  handleInputChange({ target: { value: '' } })
  setTimeout(() => originalHandleSubmit(syntheticEvent), 50)
  break
```

#### 4.2 Edit Button
```typescript
case 'edit':
  setShowImageOptions(false)
  setActionDialog({
    isOpen: true,
    action: 'edit',
    imageName: selectedFile.file.name
  })
  break

// On dialog confirm:
const handleEditConfirm = async (prompt: string) => {
  // Use GPT-Image-1 inpainting
  const response = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: selectedFile.geminiFile.uri,
      prompt: prompt,
      quality: 'hd', // Always HD for editing
      style: imageStyle,
      size: aspectRatioData.imageSize, // Auto-detected size
    })
  })
  
  if (response.ok) {
    const result = await response.json()
    // Add to gallery
    // Switch to Images tab
  }
}
```

#### 4.3 Animate Button
```typescript
case 'animate':
  setShowImageOptions(false)
  setActionDialog({
    isOpen: true,
    action: 'animate',
    imageName: selectedFile.file.name
  })
  break

// On dialog confirm:
const handleAnimateConfirm = (prompt: string) => {
  // Submit with animation prompt
  handleInputChange({ target: { value: `animate this image: ${prompt}` } })
  setTimeout(() => originalHandleSubmit(syntheticEvent), 50)
}
```

### Phase 5: Integration Points

#### 5.1 Chat Interface Updates
```typescript
// Add state
const [aspectRatioData, setAspectRatioData] = useState(null)
const [actionDialog, setActionDialog] = useState({ 
  isOpen: false, 
  action: null, 
  imageName: '' 
})

// Update handleFileSelect
if (file.type.startsWith("image/")) {
  const aspectData = await getImageAspectRatio(file)
  setAspectRatioData(aspectData)
  setShowImageOptions(true)
}
```

#### 5.2 API Integration
- Edit API should receive auto-detected size
- Animate API should receive auto-detected aspect ratio
- Both should use the uploaded image URI

### Phase 6: Error Handling

```typescript
// Check API keys before actions
const checkApiKeys = (action: string) => {
  if (action === 'edit' && !process.env.OPENAI_API_KEY) {
    toast.error("OpenAI API key required for image editing")
    return false
  }
  if (action === 'animate' && !process.env.REPLICATE_API_KEY) {
    toast.error("Replicate API key required for video generation")
    return false
  }
  return true
}
```

## Implementation Order

1. **UI First** - Make buttons compact and responsive
2. **Aspect Ratio** - Add detection utility and integration
3. **Dialog Component** - Create reusable prompt dialog
4. **Analyze Action** - Simplest, direct submission
5. **Edit Action** - Dialog → API → Gallery
6. **Animate Action** - Dialog → Submission
7. **Testing** - All three paths with different images

## Expected Results

- ✅ Compact, responsive button layout
- ✅ Direct analyze without prompts
- ✅ Edit with prompt dialog → GPT-Image-1
- ✅ Animate with prompt dialog → Video generation
- ✅ Automatic aspect ratio detection
- ✅ Proper size selection based on image dimensions

## Benefits

1. **Better UX** - Clear, compact interface
2. **Smart Defaults** - Auto-detect optimal settings
3. **Guided Actions** - Prompts help users describe what they want
4. **Seamless Flow** - Each action has appropriate interaction