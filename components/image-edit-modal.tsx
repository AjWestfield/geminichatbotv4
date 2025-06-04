"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Wand2, Info } from "lucide-react"
import type { GeneratedImage } from "@/lib/image-utils"
import { detectImageAspectRatio } from "@/lib/image-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useImageProgressStore } from "@/lib/stores/image-progress-store"

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  image: GeneratedImage | null
  onEditComplete: (editedImage: GeneratedImage) => void
}

export function ImageEditModal({ isOpen, onClose, image, onEditComplete }: ImageEditModalProps) {
  const [editPrompt, setEditPrompt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedSize, setDetectedSize] = useState<"1024x1024" | "1536x1024" | "1024x1536">("1024x1024")
  
  const { addImageGeneration, updateStage, completeImageGeneration, failImageGeneration } = useImageProgressStore()

  // Detect aspect ratio when image changes
  useEffect(() => {
    const detectSize = async () => {
      if (!image?.url) return
      
      try {
        const aspectRatio = await detectImageAspectRatio(image.url)
        // Convert video aspect ratio to image size
        let size: "1024x1024" | "1536x1024" | "1024x1536" = "1024x1024"
        
        if (aspectRatio === "16:9") {
          size = "1536x1024" // Landscape
        } else if (aspectRatio === "9:16") {
          size = "1024x1536" // Portrait
        } else {
          size = "1024x1024" // Square
        }
        
        setDetectedSize(size)
        console.log('[ImageEditModal] Detected aspect ratio:', aspectRatio, 'Using size:', size)
      } catch (error) {
        console.error('[ImageEditModal] Error detecting aspect ratio:', error)
        // Use original size if available
        if (image.size === "1536x1024" || image.size === "1024x1536") {
          setDetectedSize(image.size as any)
        }
      }
    }
    
    detectSize()
  }, [image])

  const handleEdit = async () => {
    if (!image || !editPrompt.trim()) return

    console.log('[ImageEditModal] handleEdit called with image:', {
      id: image.id,
      isUploaded: image.isUploaded,
      quality: image.quality,
      model: image.model,
      size: image.size,
      hasDataUrl: image.url?.startsWith('data:'),
      urlLength: image.url?.length
    })

    setIsSubmitting(true)
    setError(null)

    // Generate unique ID for the new image
    const editedImageId = `edited-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add to progress store
    addImageGeneration(editedImageId, editPrompt, {
      originalImageId: image.id,
      originalImageUrl: image.url,
      quality: image.quality || "standard",
      style: image.style || "vivid",
      size: detectedSize,
      model: "gpt-image-1"
    })

    // Close modal and reset
    onClose()
    setEditPrompt("")
    setIsSubmitting(false)

    // Start the actual generation in the background
    performImageEdit(editedImageId, image, editPrompt, detectedSize, onEditComplete)
  }

  // Separate function to handle the actual API call
  const performImageEdit = async (
    editedImageId: string,
    originalImage: GeneratedImage,
    prompt: string,
    size: "1024x1024" | "1536x1024" | "1024x1536",
    onComplete: (editedImage: GeneratedImage) => void
  ) => {
    try {
      // Update to processing stage
      updateStage(editedImageId, 'processing')

      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: originalImage.url,
          prompt: prompt,
          quality: originalImage.quality || "standard",
          style: originalImage.style || "vivid",
          size: size,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to edit image")
      }

      // Update to finalizing stage
      updateStage(editedImageId, 'finalizing')

      // Create edited image object
      const editedImage: GeneratedImage = {
        id: editedImageId,
        url: data.images[0].url,
        prompt: prompt,
        revisedPrompt: data.images[0].revisedPrompt,
        timestamp: new Date(),
        quality: data.metadata.quality,
        style: data.metadata.style,
        size: size, // Use the detected size
        model: data.metadata.model,
        originalImageId: originalImage.id,
        isGenerating: false, // Explicitly mark as not generating since it's complete
      }

      // Complete the generation
      completeImageGeneration(editedImageId, editedImage)
      onComplete(editedImage)
    } catch (error) {
      console.error("Edit error:", error)
      failImageGeneration(
        editedImageId, 
        error instanceof Error ? error.message : "Failed to edit image"
      )
    }
  }

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#2B2B2B] border-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Edit Image with GPT-Image-1
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Image Preview */}
          <div className="relative rounded-lg overflow-hidden bg-black">
            <img
              src={image.url}
              alt="Original content to be edited"
              className="w-full h-auto max-h-[40vh] object-contain"
            />
          </div>

          {/* Edit Prompt */}
          <div className="space-y-2">
            <Label htmlFor="edit-prompt" className="text-white">
              Describe how you want to edit this image
            </Label>
            <Textarea
              id="edit-prompt"
              placeholder="e.g., 'Transform into a sunset scene', 'Add a rainbow in the sky', 'Change to winter with snow'"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="min-h-[100px] bg-[#1E1E1E] border-[#333333] text-white placeholder:text-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Model Info */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              GPT-Image-1 uses GPT-4o's native multimodal capabilities to understand your instructions and transform images with advanced context awareness. It excels at style changes, scene modifications, and creative transformations while maintaining the core composition of your original image.
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500 font-medium mb-1">
                {error.includes("Content not allowed") ? "Content Policy Violation" : "Edit Failed"}
              </p>
              <p className="text-sm text-red-400">{error}</p>
              {error.includes("Content not allowed") && (
                <div className="mt-2 text-xs text-gray-400">
                  <p className="font-medium mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Try using more generic descriptions (e.g., "superhero" instead of character names)</li>
                    <li>Avoid references to copyrighted characters or brands</li>
                    <li>Use different wording for your edit request</li>
                    <li>Try editing a different image</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Start Edit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
