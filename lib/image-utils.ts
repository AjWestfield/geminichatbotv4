/**
 * Image generation and management utilities
 */

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  revisedPrompt?: string
  timestamp: Date
  quality: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  size?: string
  model: string
  originalImageId?: string // For edited images, reference to the original
  editStrength?: number // Strength used for editing (0.0-1.0)
  isGenerating?: boolean // Track if image is currently being generated
  generationStartTime?: Date // When generation started
  urlAvailableTime?: Date // When URL became available for reveal animation
}

/**
 * Generate a unique ID for an image
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Download an image from URL
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
  } catch (error) {
    console.error('Failed to download image:', error)
    throw new Error('Failed to download image')
  }
}

/**
 * Convert image URL to base64 (for persistence)
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert image to base64:', error)
    throw error
  }
}

/**
 * Get quality badge color
 */
export function getQualityBadgeColor(quality: string): string {
  switch (quality) {
    case 'hd':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'standard':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

/**
 * Calculate approximate size of data in bytes
 */
function calculateDataSize(data: any): number {
  return new Blob([JSON.stringify(data)]).size
}

/**
 * Clear old images from storage to make room
 */
function clearOldImages(): void {
  try {
    // Clear all image-related storage
    const keysToRemove = ['generatedImages', 'imageCache']
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e)
      }
    })
    console.log('Cleared old image storage')
  } catch (error) {
    console.error('Failed to clear old images:', error)
  }
}

/**
 * Save generated images to localStorage with size management
 */
export function saveGeneratedImages(images: GeneratedImage[]): void {
  try {
    // Only save completed images (not generating ones)
    const completedImages = images.filter(img => !img.isGenerating && img.url)
    
    if (completedImages.length === 0) {
      return
    }
    
    // Start with most recent 30 images
    let imagesToSave = completedImages.slice(-30)
    
    // Convert dates to strings and minimize data
    const prepareForStorage = (imgs: GeneratedImage[]) => imgs.map(img => ({
      id: img.id,
      url: img.url.substring(0, 200), // Limit URL length
      prompt: img.prompt.substring(0, 200), // Limit prompt length
      timestamp: img.timestamp.toISOString(),
      quality: img.quality,
      model: img.model,
      // Don't save optional fields to save space
    }))
    
    let serialized = prepareForStorage(imagesToSave)
    let dataSize = calculateDataSize(serialized)
    
    // If data is too large, reduce number of images
    const maxSize = 4 * 1024 * 1024 // 4MB limit (conservative)
    while (dataSize > maxSize && imagesToSave.length > 5) {
      imagesToSave = imagesToSave.slice(-Math.floor(imagesToSave.length * 0.7))
      serialized = prepareForStorage(imagesToSave)
      dataSize = calculateDataSize(serialized)
    }
    
    try {
      localStorage.setItem('generatedImages', JSON.stringify(serialized))
      console.log(`Saved ${imagesToSave.length} images (${(dataSize / 1024).toFixed(1)}KB)`)
    } catch (quotaError: any) {
      console.warn('localStorage quota exceeded, clearing old data...')
      
      // Clear old data and try again with only 10 most recent
      clearOldImages()
      
      const minimalImages = completedImages.slice(-10)
      const minimalSerialized = prepareForStorage(minimalImages)
      
      try {
        localStorage.setItem('generatedImages', JSON.stringify(minimalSerialized))
        console.log(`Saved ${minimalImages.length} most recent images after clearing storage`)
      } catch (finalError) {
        console.error('Failed to save even minimal images:', finalError)
        // Don't throw - just log the error so the app continues working
      }
    }
  } catch (error) {
    console.error('Failed to save images:', error)
    // Don't throw - gracefully handle the error
  }
}

/**
 * Load generated images from localStorage
 */
export function loadGeneratedImages(): GeneratedImage[] {
  try {
    const stored = localStorage.getItem('generatedImages')
    if (!stored) return []
    
    // Parse and convert date strings back to Date objects
    const parsed = JSON.parse(stored)
    return parsed.map((img: any) => ({
      id: img.id || generateImageId(),
      url: img.url || '',
      prompt: img.prompt || '',
      revisedPrompt: img.revisedPrompt,
      timestamp: new Date(img.timestamp || Date.now()),
      quality: img.quality || 'standard',
      style: img.style,
      size: img.size,
      model: img.model || 'unknown',
      originalImageId: img.originalImageId,
      editStrength: img.editStrength,
      generationStartTime: img.generationStartTime ? new Date(img.generationStartTime) : undefined,
      isGenerating: false // Loaded images are never generating
    }))
  } catch (error) {
    console.error('Failed to load images:', error)
    // Clear corrupted data
    try {
      localStorage.removeItem('generatedImages')
    } catch (e) {
      console.error('Failed to clear corrupted storage:', e)
    }
    return []
  }
}

/**
 * Detect if a message is requesting image generation
 */
export function isImageGenerationRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // Check for common patterns
  const patterns = [
    /generate\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /create\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /make\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /draw\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /design\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /show\s+me\s+(a|an|the)?\s*\w*\s*(image|picture|illustration|artwork|art|photo|drawing)/i,
    /(image|picture|illustration|artwork|photo|drawing)\s+of/i,
    /visualize/i,
    /generate:|create:|draw:|make:/i
  ]
  
  // Check if any pattern matches
  return patterns.some(pattern => pattern.test(lowerMessage))
}

/**
 * Extract image generation prompt from message
 */
export function extractImagePrompt(message: string): string {
  // Remove common prefixes using regex
  const patterns = [
    /^(generate|create|make|draw|design|show\s+me)\s+(a|an|the)?\s*/i,
    /^(image|picture|illustration|artwork|photo|drawing)\s+of\s*/i,
    /^visualize\s*/i,
  ]
  
  let prompt = message
  for (const pattern of patterns) {
    prompt = prompt.replace(pattern, '')
  }
  
  // Remove trailing "image", "picture", etc. if they appear at the start
  prompt = prompt.replace(/^(image|picture|illustration|artwork|photo|drawing)\s*/i, '')
  
  // Clean up any remaining artifacts
  prompt = prompt.replace(/\s+/g, ' ').trim()
  
  // If the prompt is empty or too short, use the original message
  if (prompt.length < 3) {
    prompt = message.replace(/^(generate|create|make|draw)\s+(a|an|the)?\s*/i, '').trim()
  }
  
  return prompt
}

/**
 * Format timestamp for display
 */
export function formatImageTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}

/**
 * Clear all image storage
 */
export function clearImageStorage(): void {
  try {
    localStorage.removeItem('generatedImages')
    console.log('Image storage cleared')
  } catch (error) {
    console.error('Failed to clear image storage:', error)
  }
}

/**
 * Get storage info
 */
export function getStorageInfo(): { used: number; images: number } {
  try {
    const stored = localStorage.getItem('generatedImages') || '[]'
    const size = new Blob([stored]).size
    const images = JSON.parse(stored).length
    return { used: size, images }
  } catch {
    return { used: 0, images: 0 }
  }
}