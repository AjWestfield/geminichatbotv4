# Image Upload Options Implementation Plan

## Overview
When a user uploads an image without any text prompt, the system will present three action options:
1. **Analyze Image** - Performs visual analysis (current default behavior)
2. **Edit Image** - Adds to Images tab and uses GPT-Image-1 inpainting
3. **Animate Image** - Creates video using image-to-video functionality

## Current Flow Analysis
- **Location**: `/app/api/chat/route.ts` (lines 114-138)
- **Detection**: `fileMimeType.startsWith("image/") && !lastMessage.content.trim()`
- **Current behavior**: Auto-sets message to "Please analyze this image..."

## Implementation Architecture

### 1. Backend Changes (`/app/api/chat/route.ts`)

#### Option A: Quick Action Buttons (Recommended)
Instead of auto-analyzing, return a special response with action buttons:

```typescript
if (fileMimeType.startsWith("image/") && !lastMessage.content.trim()) {
  messageContent = "[IMAGE_OPTIONS]" + JSON.stringify({
    type: "image_upload",
    fileUri: fileUri,
    options: [
      {
        id: "analyze",
        label: "🔍 Analyze Image",
        description: "Get detailed insights about the image content"
      },
      {
        id: "edit", 
        label: "✏️ Edit Image",
        description: "Modify the image using AI-powered editing"
      },
      {
        id: "animate",
        label: "🎬 Animate Image", 
        description: "Transform this image into a video"
      }
    ]
  }) + "[/IMAGE_OPTIONS]";
}
```

#### Option B: Natural Language Prompt
Return a friendly message with the options:

```typescript
messageContent = `I've received your image! What would you like me to do with it?

**Choose an option:**
• Type "1" or "analyze" - To analyze the image content
• Type "2" or "edit" - To edit the image (opens in Images tab)
• Type "3" or "animate" - To create a video from this image

Just type the number or keyword of your choice.`;
```

### 2. Frontend Changes

#### A. Create Image Options Component (`/components/image-options-card.tsx`)
```tsx
interface ImageOptionsCardProps {
  options: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  onSelect: (optionId: string) => void;
  imageUri: string;
}

export function ImageOptionsCard({ options, onSelect, imageUri }: ImageOptionsCardProps) {
  return (
    <div className="bg-[#3C3C3C] rounded-xl p-4 space-y-3">
      <h3 className="text-white font-medium">What would you like to do with this image?</h3>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="text-left p-3 bg-[#2B2B2B] hover:bg-[#333333] rounded-lg transition-colors"
          >
            <div className="font-medium text-white">{option.label}</div>
            <div className="text-sm text-gray-400">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### B. Update Chat Message Component (`/components/chat-message.tsx`)
Add detection and rendering for image options:

```tsx
// Extract image options from message
const imageOptions = useMemo(() => {
  if (!isUser && message.content) {
    const optionsMatch = message.content.match(/\[IMAGE_OPTIONS\]([\s\S]*?)\[\/IMAGE_OPTIONS\]/);
    if (optionsMatch) {
      try {
        return JSON.parse(optionsMatch[1]);
      } catch (e) {
        console.error('Failed to parse image options:', e);
      }
    }
  }
  return null;
}, [message, isUser]);

// In render:
{imageOptions && (
  <ImageOptionsCard
    options={imageOptions.options}
    imageUri={imageOptions.fileUri}
    onSelect={(optionId) => handleImageOptionSelect(optionId, imageOptions.fileUri)}
  />
)}
```

### 3. Option Handlers

#### A. Analyze Image Handler
```typescript
const handleAnalyzeImage = (imageUri: string) => {
  // Send a message to analyze the image
  const analyzeMessage = "Please analyze this image and provide detailed insights.";
  // Submit with the existing file context
  handleSubmit(analyzeMessage);
};
```

#### B. Edit Image Handler
```typescript
const handleEditImage = async (imageUri: string) => {
  // 1. Add image to the Images tab gallery
  const placeholderImage: GeneratedImage = {
    id: generateImageId(),
    url: imageUri, // Use the uploaded image URI
    prompt: "Uploaded for editing",
    timestamp: new Date(),
    isUploaded: true,
    readyForEdit: true
  };
  
  // 2. Add to gallery
  onGeneratedImagesChange?.([...generatedImages, placeholderImage]);
  
  // 3. Switch to Images tab
  onImageGenerationStart?.();
  
  // 4. Show edit prompt dialog
  const editPrompt = await showEditPromptDialog();
  if (editPrompt) {
    // Trigger image editing
    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUri,
        prompt: editPrompt,
        quality: imageQuality,
        style: imageStyle,
        size: imageSize
      })
    });
  }
};
```

#### C. Animate Image Handler
```typescript
const handleAnimateImage = async (imageUri: string) => {
  // Show animation prompt dialog
  const animationPrompt = await showAnimationPromptDialog();
  if (animationPrompt) {
    // Send animation request
    const animateMessage = `Animate this image: ${animationPrompt}`;
    handleSubmit(animateMessage);
  }
};
```

### 4. Dialog Components

#### A. Edit Prompt Dialog
```tsx
export function EditPromptDialog({ 
  isOpen, 
  onClose, 
  onSubmit 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What would you like to edit?</DialogTitle>
          <DialogDescription>
            Describe the changes you want to make to the image
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="e.g., Change the sky to sunset, add a hat to the person, remove the background..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(prompt)} disabled={!prompt.trim()}>
            Start Editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Integration Points

#### A. Chat Interface Updates
```typescript
// Add state for dialogs
const [editPromptDialog, setEditPromptDialog] = useState({ isOpen: false, imageUri: '' });
const [animatePromptDialog, setAnimatePromptDialog] = useState({ isOpen: false, imageUri: '' });

// Handle option selection
const handleImageOptionSelect = useCallback((optionId: string, imageUri: string) => {
  switch (optionId) {
    case 'analyze':
      // Submit analyze request
      handleInputChange({ target: { value: 'analyze' } });
      handleSubmit();
      break;
      
    case 'edit':
      setEditPromptDialog({ isOpen: true, imageUri });
      break;
      
    case 'animate':
      setAnimatePromptDialog({ isOpen: true, imageUri });
      break;
  }
}, [handleInputChange, handleSubmit]);
```

#### B. Message Flow
1. User uploads image without text
2. Backend returns IMAGE_OPTIONS response
3. Frontend displays option buttons
4. User clicks option
5. System executes corresponding handler
6. Results appear in appropriate tab

### 6. Error Handling

```typescript
// Check for required API keys
const checkRequirements = (option: string) => {
  switch (option) {
    case 'edit':
      if (!process.env.OPENAI_API_KEY) {
        return "Image editing requires OpenAI API key configuration";
      }
      break;
    case 'animate':
      if (!process.env.REPLICATE_API_KEY) {
        return "Video generation requires Replicate API key configuration";
      }
      break;
  }
  return null;
};
```

## Implementation Steps

1. **Phase 1**: Backend detection and options response
2. **Phase 2**: Frontend option card component
3. **Phase 3**: Message parsing and rendering
4. **Phase 4**: Option handlers implementation
5. **Phase 5**: Dialog components for edit/animate
6. **Phase 6**: Integration and testing

## Testing Scenarios

1. Upload image → See options → Select analyze → Get analysis
2. Upload image → See options → Select edit → Enter prompt → See edited image
3. Upload image → See options → Select animate → Enter prompt → See video generation
4. Upload image with text → Normal flow (no options shown)
5. API key missing → Show appropriate error message

## Benefits

- **User Control**: Users choose what to do with uploaded images
- **Clear Intent**: No ambiguity about user's desired action
- **Better UX**: Visual options are easier than remembering commands
- **Extensible**: Easy to add more options in the future