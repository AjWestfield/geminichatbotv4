"use client"

import { useState, useEffect } from "react"
import { Download, Trash2, Search, Filter, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type GeneratedImage,
  downloadImage,
  formatImageTimestamp,
  getQualityBadgeColor,
  saveGeneratedImages,
  loadGeneratedImages,
  clearImageStorage,
  getStorageInfo
} from "@/lib/image-utils"
import { cn } from "@/lib/utils"
import { ImageEditModal } from "./image-edit-modal"

interface ImageGalleryProps {
  images: GeneratedImage[]
  onImagesChange?: (images: GeneratedImage[]) => void
}

export function ImageGallery({ images: propImages, onImagesChange }: ImageGalleryProps) {
  const [images, setImages] = useState<GeneratedImage[]>(propImages)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [qualityFilter, setQualityFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  // Sync with prop changes - properly handle isGenerating state transitions
  useEffect(() => {
    console.log('[ImageGallery] Syncing with prop changes, propImages:', 
      propImages.map(img => ({ id: img.id, isGenerating: img.isGenerating }))
    )
    
    setImages(prevImages => {
      // Create a map of existing images with their isGenerating state
      const existingStates = new Map(
        prevImages.map(img => [img.id, img.isGenerating])
      )
      
      console.log('[ImageGallery] Existing states:', Array.from(existingStates.entries()))
      
      // Update with new images, allowing isGenerating to transition from true to false
      const updated = propImages.map(img => {
        const wasGenerating = existingStates.get(img.id)
        const isNowGenerating = img.isGenerating
        
        // Allow transition from generating (true) to complete (false)
        // But preserve false state if it was already false
        let finalGeneratingState = isNowGenerating
        if (existingStates.has(img.id) && wasGenerating === false && isNowGenerating === true) {
          // Don't allow going back from false to true (completed to generating)
          finalGeneratingState = false
        }
        
        return {
          ...img,
          isGenerating: finalGeneratingState
        }
      })
      
      console.log('[ImageGallery] Updated images after sync:', 
        updated.map(img => ({ id: img.id, isGenerating: img.isGenerating }))
      )
      
      return updated
    })
  }, [propImages])

  // Load images from localStorage on mount
  useEffect(() => {
    if (images.length === 0) {
      const savedImages = loadGeneratedImages()
      if (savedImages.length > 0) {
        setImages(savedImages)
        onImagesChange?.(savedImages)
      }
    }
  }, [images.length, onImagesChange])

  // Save images to localStorage when they change
  useEffect(() => {
    if (images.length > 0) {
      saveGeneratedImages(images)
    }
  }, [images])

  // Filter images based on search and quality
  const filteredImages = images.filter(image => {
    // Show images that are generating or have valid URLs
    if (!image.isGenerating && (!image.url || image.url.trim() === '')) {
      return false
    }

    const matchesSearch = searchQuery === "" ||
      image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.revisedPrompt?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesQuality = qualityFilter === "all" || image.quality === qualityFilter

    return matchesSearch && matchesQuality
  })

  const handleDownload = async (image: GeneratedImage, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsLoading(true)
    try {
      const filename = `wavespeed-image-${image.id}.png`
      await downloadImage(image.url, filename)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (imageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updatedImages = images.filter(img => img.id !== imageId)
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
    saveGeneratedImages(updatedImages)

    // Close modal if deleting the selected image
    if (selectedImage?.id === imageId) {
      setSelectedImage(null)
    }
  }

  const handleEditComplete = (editedImage: GeneratedImage) => {
    const updatedImages = [...images, editedImage]
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
    saveGeneratedImages(updatedImages)
    setEditingImage(null)
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#2B2B2B] flex items-center justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="No images">
            <title>No images</title>
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 8L12 3L7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Images Generated Yet</h3>
        <p className="text-[#B0B0B0] max-w-sm">
          Start generating images by typing prompts like "Generate an image of..." in the chat.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-[#333333] space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2B2B2B] border-[#333333] text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-[140px] bg-[#2B2B2B] border-[#333333] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent className="bg-[#2B2B2B] border-[#333333]">
              <SelectItem value="all">All Quality</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">
              {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
            </span>
            {images.length > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all saved images? This cannot be undone.')) {
                      clearImageStorage()
                      setImages([])
                      onImagesChange?.([])
                    }
                  }}
                  className="text-gray-400 hover:text-gray-300 underline text-xs"
                >
                  Clear storage
                </button>
              </>
            )}
          </div>
          <span className="text-gray-400">
            Powered by WaveSpeed AI
          </span>
        </div>
      </div>

      {/* Image Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => {
            return (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] hover:ring-2 hover:ring-white/20 transition-all w-full"
              >
                {/* Clickable overlay */}
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-10"
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View image: ${image.prompt}`}
                  disabled={image.isGenerating}
                />
                
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  // Show placeholder while generating
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#3C3C3C] flex items-center justify-center">
                        <svg 
                          width="32" 
                          height="32" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="animate-pulse"
                        >
                          <title>Image being generated</title>
                          <path d="M20 12V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H12" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M10 9C10 9.55228 9.55228 10 9 10C8.44772 10 8 9.55228 8 9C8 8.44772 8.44772 8 9 8C9.55228 8 10 8.44772 10 9Z" fill="#B0B0B0"/>
                          <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16 19L19 19M17.5 17.5V20.5" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {image.isGenerating ? 'Generating...' : 'Loading...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto z-20">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 bg-black/50 hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingImage(image)
                      }}
                      disabled={image.isGenerating || !image.url}
                      title="Edit image"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 bg-black/50 hover:bg-black/70"
                      onClick={(e) => handleDownload(image, e)}
                      disabled={isLoading || image.isGenerating || !image.url}
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 hover:text-red-400"
                      onClick={(e) => handleDelete(image.id, e)}
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                      {image.prompt}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {image.originalImageId && (
                        <Badge variant="secondary" className="text-xs">
                          Edited
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn("text-xs border", getQualityBadgeColor(image.quality))}
                      >
                        {image.quality}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatImageTimestamp(image.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Full Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-[#2B2B2B] border-[#333333] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Generated Image</DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                {selectedImage.url ? (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3C3C3C] flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Image not available">
                          <title>Image not available</title>
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 8L12 3L7 8" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 3V15" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-gray-400">Image not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="w-full">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Prompt</h4>
                  <p className="text-white break-words whitespace-pre-wrap">{selectedImage.prompt}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#333333]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("border", getQualityBadgeColor(selectedImage.quality))}
                    >
                      {selectedImage.quality} quality
                    </Badge>
                    {selectedImage.model && (
                      <Badge
                        variant="outline"
                        className="border-gray-500/30"
                      >
                        {selectedImage.model.includes('gpt-image-1') ? 'GPT-Image-1' :
                         selectedImage.model.includes('dall-e') ? 'DALL-E' : 
                         selectedImage.model.includes('flux') ? 'WaveSpeed AI' : 
                         selectedImage.model}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-400">
                      Generated {formatImageTimestamp(
                        selectedImage.timestamp instanceof Date 
                          ? selectedImage.timestamp 
                          : new Date(selectedImage.timestamp)
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null)
                        setEditingImage(selectedImage)
                      }}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedImage)}
                      disabled={isLoading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(selectedImage.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        image={editingImage}
        onEditComplete={handleEditComplete}
      />
    </div>
  )
}
