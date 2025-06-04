"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import ChatInterface from "@/components/chat-interface"
import CanvasView from "@/components/canvas-view"
import ResizablePanels from "@/components/resizable-panels"
import { GeneratedImage, loadGeneratedImages, saveGeneratedImages } from "@/lib/image-utils"
import { GeneratedVideo } from "@/lib/video-generation-types"
import { useMCPInitialization } from "@/hooks/use-mcp-initialization"
import { AnimateImageModal } from "@/components/animate-image-modal"
import { useToast } from "@/hooks/use-toast"
import { useVideoProgressStore } from "@/lib/stores/video-progress-store"
import { useMultiVideoPolling } from "@/hooks/use-video-polling"
import { detectImageAspectRatio } from "@/lib/image-utils"
import { useChatPersistence } from "@/hooks/use-chat-persistence"
import { PersistenceNotification } from "@/components/persistence-notification"
import { addVideoToLocalStorage, loadVideosFromLocalStorage, type StoredVideo } from "@/lib/video-storage"
import { generateChatTitle } from "@/lib/chat-naming"
import { isPersistenceConfigured } from "@/lib/database/supabase"

export default function Home() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
  const [activeCanvasTab, setActiveCanvasTab] = useState("preview")
  const [animatingImage, setAnimatingImage] = useState<GeneratedImage | null>(null)
  const [videoPollingPairs, setVideoPollingPairs] = useState<Array<{ videoId: string; predictionId: string }>>([])
  const [autoOpenEditImageId, setAutoOpenEditImageId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp")
  const [loadedMessages, setLoadedMessages] = useState<any[] | undefined>(undefined)
  const [chatLoading, setChatLoading] = useState(false)

  const { toast } = useToast()
  const { addVideo, completeVideo, failVideo, getAllGeneratingVideos } = useVideoProgressStore()
  
  // Chat persistence
  const {
    currentChatId,
    setCurrentChatId,
    chats,
    createNewChat,
    saveMessages,
    saveImage: saveImageToDB,
    saveVideo: saveVideoToDB,
    loadChat,
    loadAllImages,
    loadAllVideos,
  } = useChatPersistence()
  
  // Store reference to chat interface submit function
  const chatSubmitRef = useRef<((message: string) => void) | null>(null)
  const messagesRef = useRef<any[]>([])

  // Video generation settings (load from localStorage)
  const [videoSettings, setVideoSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGenerationSettings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return {
      model: 'standard',
      duration: 5,
      aspectRatio: '16:9',
      autoDetectAspectRatio: true
    }
  })

  // Initialize MCP state once at the app root
  useMCPInitialization()

  // Load images from database on mount
  useEffect(() => {
    const loadPersistedImages = async () => {
      console.log('[PAGE] Starting to load persisted images...')
      
      const isPersistenceEnabled = isPersistenceConfigured()
      console.log('[PAGE] Persistence enabled:', isPersistenceEnabled)
      
      // Load from database
      const dbImages = await loadAllImages()
      console.log('[PAGE] Database images loaded:', {
        total: dbImages.length,
        edited: dbImages.filter((img: GeneratedImage) => img.originalImageId).length,
        models: [...new Set(dbImages.map((img: GeneratedImage) => img.model))],
        ids: dbImages.map((img: GeneratedImage) => ({ id: img.id, originalImageId: img.originalImageId }))
      })
      
      // Load from localStorage
      const localImages = loadGeneratedImages()
      console.log('[PAGE] LocalStorage images loaded:', {
        total: localImages.length,
        edited: localImages.filter((img: GeneratedImage) => img.originalImageId).length,
        ids: localImages.map((img: GeneratedImage) => ({ id: img.id, originalImageId: img.originalImageId }))
      })
      
      let finalImages: GeneratedImage[] = []
      
      if (isPersistenceEnabled && dbImages.length > 0) {
        // When persistence is enabled and we have database images,
        // treat database as the source of truth
        
        // Create a set of database image IDs for quick lookup
        const dbImageIds = new Set(dbImages.map((img: GeneratedImage) => img.id))
        
        // Only include localStorage images that are NOT in the database
        // These are likely new images that haven't been saved yet
        const unsavedLocalImages = localImages.filter((localImg: GeneratedImage) => 
          !dbImageIds.has(localImg.id)
        )
        
        console.log('[PAGE] Unsaved local images:', unsavedLocalImages.length)
        
        // Combine database images with unsaved local images
        finalImages = [...dbImages, ...unsavedLocalImages]
        
        // Clean up localStorage - remove images that exist in database
        const imagesToKeep = localImages.filter((img: GeneratedImage) => 
          !dbImageIds.has(img.id)
        )
        
        if (imagesToKeep.length !== localImages.length) {
          console.log('[PAGE] Cleaning up localStorage, removing', localImages.length - imagesToKeep.length, 'images that exist in database')
          saveGeneratedImages(imagesToKeep)
        }
        
        // Mark all database images as saved
        dbImages.forEach((img: GeneratedImage) => {
          savedImageIdsRef.current.add(img.id)
        })
        
      } else if (!isPersistenceEnabled) {
        // When persistence is not enabled, use localStorage only
        finalImages = localImages
        console.log('[PAGE] Using localStorage only (persistence not configured)')
        
      } else {
        // Persistence is enabled but no database images - use localStorage
        finalImages = localImages
        console.log('[PAGE] No database images found, using localStorage')
      }
      
      console.log('[PAGE] Final images to display:', {
        total: finalImages.length,
        fromDb: dbImages.length,
        fromLocal: finalImages.length - dbImages.length
      })
      
      if (finalImages.length > 0) {
        setGeneratedImages(finalImages)
      }
    }
    loadPersistedImages()
  }, [loadAllImages])

  // Load videos from database and local storage on mount
  useEffect(() => {
    const loadPersistedVideos = async () => {
      // Load from database first
      const dbVideos = await loadAllVideos()
      // Load from local storage as backup
      const localVideos = loadVideosFromLocalStorage()
      
      // Combine and deduplicate videos
      const allVideos = [...dbVideos]
      localVideos.forEach(localVideo => {
        if (!allVideos.find(v => v.id === localVideo.id)) {
          allVideos.push(localVideo)
        }
      })
      
      if (allVideos.length > 0) {
        console.log('[PAGE] Loaded', allVideos.length, 'videos (', dbVideos.length, 'from DB,', localVideos.length, 'from local)')
        setGeneratedVideos(allVideos)
      }
    }
    loadPersistedVideos()
  }, [loadAllVideos])

  // Clear autoOpenEditImageId after it's been used
  useEffect(() => {
    if (autoOpenEditImageId) {
      const timer = setTimeout(() => {
        setAutoOpenEditImageId(null)
      }, 1000) // Give enough time for the modal to open
      return () => clearTimeout(timer)
    }
  }, [autoOpenEditImageId])

  // Handle chat selection from sidebar
  const handleChatSelect = useCallback(async (chatId: string) => {
    setChatLoading(true)
    // Set the current chat ID to switch to the selected chat
    setCurrentChatId(chatId)
    
    const chatData = await loadChat(chatId)
    if (chatData) {
      // Convert database messages to chat interface format
      const formattedMessages = chatData.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at),
        attachments: msg.attachments,
      }))
      
      // Load images from the chat
      if (chatData.images && chatData.images.length > 0) {
        setGeneratedImages(chatData.images)
      }
      
      // Load videos from the chat
      if (chatData.videos && chatData.videos.length > 0) {
        setGeneratedVideos(chatData.videos)
      }
      
      // Set the loaded messages
      setLoadedMessages(formattedMessages)
      setSelectedModel(chatData.chat.model || selectedModel)
    }
    setChatLoading(false)
  }, [loadChat, selectedModel, setCurrentChatId])

  // Handle new chat creation
  const handleNewChat = useCallback(() => {
    setCurrentChatId(null)
    setLoadedMessages(undefined) // Reset to show welcome message
    setGeneratedImages([]) // Clear images
    setGeneratedVideos([]) // Clear videos
    console.log('Starting new chat')
  }, [setCurrentChatId])

  // Handle messages update from ChatInterface
  const handleMessagesUpdate = useCallback(async (messages: any[]) => {
    messagesRef.current = messages
    
    // Save messages to database with intelligent naming
    if (messages.length > 0) {
      // Generate intelligent chat title for new chats
      if (!currentChatId && messages.length >= 2) {
        // Wait for the saveMessages to create the chat, then update with intelligent title
        const result = await saveMessages(messages, selectedModel)
        
        // Generate intelligent title based on conversation
        const intelligentTitle = generateChatTitle(messages, 50)
        
        // Update the chat title if we have a new chat
        if (result && intelligentTitle !== 'New Chat') {
          try {
            await fetch(`/api/chats/${result.chatId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: intelligentTitle }),
            })
            console.log('[PAGE] Updated chat title to:', intelligentTitle)
          } catch (error) {
            console.error('[PAGE] Failed to update chat title:', error)
          }
        }
      } else {
        // Regular save for existing chats
        await saveMessages(messages, selectedModel)
      }
    }
  }, [saveMessages, selectedModel, currentChatId])

  // Track saved image and video IDs to prevent duplicates
  const savedImageIdsRef = useRef<Set<string>>(new Set())
  const savedVideoIdsRef = useRef<Set<string>>(new Set())

  // Enhanced image generation callback that saves to DB
  const handleGeneratedImagesChange = useCallback(async (images: GeneratedImage[]) => {
    setGeneratedImages(images)
    
    // Clean up savedImageIdsRef by removing IDs that are no longer in the images array
    const currentImageIds = new Set(images.map(img => img.id))
    savedImageIdsRef.current.forEach(savedId => {
      if (!currentImageIds.has(savedId)) {
        console.log('[PAGE] Removing deleted image from saved set:', savedId)
        savedImageIdsRef.current.delete(savedId)
      }
    })
    
    // Save all new images to database (not just the last one)
    for (const image of images) {
      // Debug logging
      console.log('[PAGE] Processing image for save:', {
        id: image.id,
        isGenerating: image.isGenerating,
        originalImageId: image.originalImageId,
        isEdited: !!image.originalImageId,
        alreadySaved: savedImageIdsRef.current.has(image.id)
      })
      
      // Save if: image is complete OR it's an edited image (even if marked as generating)
      if (image && (!image.isGenerating || image.originalImageId)) {
        // Check if we've already saved this image to prevent duplicates
        if (savedImageIdsRef.current.has(image.id)) {
          console.log('[PAGE] Image already saved, skipping:', image.id)
          continue
        }
        
        console.log('[PAGE] Saving image to database:', {
          id: image.id,
          model: image.model,
          isUploaded: image.isUploaded,
          isGenerating: image.isGenerating,
          originalImageId: image.originalImageId,
          prompt: image.prompt
        })
        
        // Mark as saved before the async operation to prevent race conditions
        savedImageIdsRef.current.add(image.id)
        
        const saved = await saveImageToDB(image)
        if (saved) {
          console.log('[PAGE] Image saved successfully:', image.id, 'DB ID:', saved.id)
          
          // If this was an edited image with a data URL, update it with the blob URL
          if (image.url.startsWith('data:') && saved.url && !saved.url.startsWith('data:')) {
            console.log('[PAGE] Updating edited image with blob URL from database')
            setGeneratedImages(prev => prev.map(img => 
              img.id === image.id ? { ...img, url: saved.url } : img
            ))
          }
        } else {
          console.log('[PAGE] Failed to save image:', image.id)
          // Remove from saved set if save failed
          savedImageIdsRef.current.delete(image.id)
        }
      } else {
        console.log('[PAGE] Skipping image save (still generating):', {
          id: image.id,
          isGenerating: image.isGenerating
        })
      }
    }
  }, [saveImageToDB])

  // Enhanced video generation callback that saves to DB
  const handleGeneratedVideosChange = useCallback(async (videos: GeneratedVideo[]) => {
    setGeneratedVideos(videos)
    
    // Save all new completed videos to database (not just the last one)
    for (const video of videos) {
      if (video && video.status === 'completed' && !video.url.startsWith('blob:')) {
        // Check if we've already saved this video to prevent duplicates
        if (savedVideoIdsRef.current.has(video.id)) {
          continue
        }
        
        console.log('[PAGE] Saving video to database:', {
          id: video.id,
          model: video.model,
          status: video.status,
          prompt: video.prompt,
          duration: video.duration
        })
        
        // Mark as saved before the async operation to prevent race conditions
        savedVideoIdsRef.current.add(video.id)
        
        const saved = await saveVideoToDB(video)
        if (saved) {
          console.log('[PAGE] Video saved successfully:', video.id)
        } else {
          console.log('[PAGE] Failed to save video:', video.id)
          // Remove from saved set if save failed
          savedVideoIdsRef.current.delete(video.id)
        }
      }
    }
  }, [saveVideoToDB])

  // Debounced auto tab switching with toast notification
  const lastSwitchTimeRef = useRef<number>(0)
  const switchToVideoTab = useCallback((reason: string) => {
    const now = Date.now()

    // Prevent multiple switches within 2 seconds
    if (now - lastSwitchTimeRef.current < 2000) {
      console.log(`[PAGE] Debouncing tab switch request: ${reason}`)
      return
    }

    // Only switch if we're not already on video tab
    if (activeCanvasTab === "video") {
      console.log(`[PAGE] Already on video tab, skipping switch: ${reason}`)
      return
    }

    lastSwitchTimeRef.current = now
    console.log(`[PAGE] Switching to video tab: ${reason}`)
    setActiveCanvasTab("video")

    toast({
      title: "Switched to Video tab",
      description: reason,
      duration: 3000
    })
  }, [toast, activeCanvasTab])

  // Enhanced video completion handler with database persistence
  const handleVideoComplete = useCallback(async (completedVideo: GeneratedVideo) => {
    console.log('[PAGE] Video generation completed:', completedVideo.id)

    // Add completion timestamp
    const completedVideoWithTimestamp = {
      ...completedVideo,
      status: 'completed' as const,
      completedAt: new Date()
    }

    // Update the video in the list
    setGeneratedVideos(prev => prev.map(v =>
      v.id === completedVideo.id
        ? completedVideoWithTimestamp
        : v
    ))

    // Remove from polling pairs
    setVideoPollingPairs(prev => prev.filter(pair => pair.videoId !== completedVideo.id))

    // Save completed video to database and local storage
    if (!savedVideoIdsRef.current.has(completedVideo.id)) {
      console.log('[PAGE] Saving completed video:', completedVideo.id)
      savedVideoIdsRef.current.add(completedVideo.id)
      
      // Save to database
      const saved = await saveVideoToDB(completedVideoWithTimestamp)
      if (saved) {
        console.log('[PAGE] Video saved to database successfully:', completedVideo.id)
      } else {
        console.log('[PAGE] Failed to save video to database:', completedVideo.id)
      }
      
      // Always save to local storage as backup
      const storedVideo: StoredVideo = {
        ...completedVideoWithTimestamp,
        chatId: currentChatId || undefined
      }
      const localSaved = addVideoToLocalStorage(storedVideo)
      if (localSaved) {
        console.log('[PAGE] Video saved to local storage successfully:', completedVideo.id)
      } else {
        console.log('[PAGE] Failed to save video to local storage:', completedVideo.id)
      }
      
      // Only remove from saved set if both saves failed
      if (!saved && !localSaved) {
        savedVideoIdsRef.current.delete(completedVideo.id)
      }
    }

    // Show success notification
    toast({
      title: "Video generated!",
      description: `"${completedVideo.prompt}" is ready to view.`,
      duration: 5000
    })

    // Update browser tab title
    if (typeof window !== 'undefined') {
      document.title = "✅ Video Ready - Gemini Chatbot"
      setTimeout(() => {
        document.title = "Gemini Chatbot"
      }, 3000)
    }
  }, [toast, saveVideoToDB])

  // Enhanced video error handler
  const handleVideoError = useCallback((videoId: string, error: string) => {
    console.log('[PAGE] Video generation failed:', videoId, error)

    // Update the video in the list
    setGeneratedVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, status: 'failed', error }
        : v
    ))

    // Remove from polling pairs
    setVideoPollingPairs(prev => prev.filter(pair => pair.videoId !== videoId))

    // Show error notification
    toast({
      title: "Video generation failed",
      description: error,
      variant: "destructive",
      duration: 7000
    })
  }, [toast])

  // Setup multi-video polling
  useMultiVideoPolling(videoPollingPairs, {
    onComplete: handleVideoComplete,
    onError: handleVideoError,
    pollInterval: 8000,
    maxPollTime: 600000 // 10 minutes
  })

  // Update browser tab title with progress
  useEffect(() => {
    const generatingVideos = getAllGeneratingVideos()

    if (generatingVideos.length > 0) {
      const avgProgress = Math.round(
        generatingVideos.reduce((sum, video) => sum + video.progress, 0) / generatingVideos.length
      )
      document.title = `🎬 ${avgProgress}% - Generating ${generatingVideos.length} video${generatingVideos.length > 1 ? 's' : ''}`
    } else {
      document.title = "Gemini Chatbot"
    }
  }, [getAllGeneratingVideos])


  // Handle animate image action
  const handleAnimateImage = useCallback((imageUrlOrImage: string | GeneratedImage, imageName?: string) => {
    // Handle both formats - from chat interface (url, name) and from image gallery (GeneratedImage)
    if (typeof imageUrlOrImage === 'string') {
      // From chat interface - create a GeneratedImage object
      if (!imageUrlOrImage || imageUrlOrImage.trim() === '') {
        console.error('[PAGE] Cannot animate image: URL is empty')
        toast({
          title: "Cannot animate image",
          description: "Image URL is missing or invalid",
          variant: "destructive",
          duration: 3000
        })
        return
      }
      setAnimatingImage({
        id: `img-${Date.now()}`,
        url: imageUrlOrImage,
        prompt: imageName || 'Animated image',
        timestamp: new Date(),
        quality: 'hd',
        size: '1024x1024',
        model: 'gpt-image-1'
      })
    } else {
      // From image gallery - validate the GeneratedImage has a URL
      if (!imageUrlOrImage.url || imageUrlOrImage.url.trim() === '') {
        console.error('[PAGE] Cannot animate image: GeneratedImage has no URL', imageUrlOrImage)
        toast({
          title: "Cannot animate image",
          description: "This image cannot be animated because it has no valid URL",
          variant: "destructive",
          duration: 3000
        })
        return
      }
      // Ensure the image is not still generating
      if (imageUrlOrImage.isGenerating) {
        console.error('[PAGE] Cannot animate image: Image is still generating')
        toast({
          title: "Image still generating",
          description: "Please wait for the image to finish generating before animating",
          variant: "destructive",
          duration: 3000
        })
        return
      }
      setAnimatingImage(imageUrlOrImage)
    }
    switchToVideoTab("Ready to animate your image")
  }, [switchToVideoTab, toast])

  // Enhanced video animation handler
  const handleAnimate = useCallback(async (params: {
    prompt: string
    duration: 5 | 10
    aspectRatio: "16:9" | "9:16" | "1:1"
    negativePrompt?: string
    model?: 'standard' | 'pro'
  }) => {
    if (!animatingImage) return

    try {
      // Create a new video entry with generating status
      const newVideo: GeneratedVideo = {
        id: `video-${Date.now()}`,
        prompt: params.prompt,
        url: '',
        duration: params.duration,
        aspectRatio: params.aspectRatio,
        model: params.model || videoSettings.model,
        sourceImage: animatingImage.url,
        status: 'generating',
        createdAt: new Date()
      }

      // Add video to list immediately
      setGeneratedVideos(prev => [...prev, newVideo])
      setAnimatingImage(null)

      // Switch to video tab
      switchToVideoTab("Video generation started")

      // Add to progress store with duration for better time estimation
      addVideo(newVideo.id, params.prompt, params.duration)

      // Call the API with progress tracking enabled
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          duration: params.duration,
          aspectRatio: params.aspectRatio,
          negativePrompt: params.negativePrompt,
          startImage: animatingImage.url,
          model: params.model || videoSettings.model,
          enableProgressTracking: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start video generation')
      }

      const result = await response.json()
      console.log('[PAGE] Video generation API response:', result)

      // Handle immediate completion (rare, but possible)
      if (result.status === 'succeeded' && result.url) {
        handleVideoComplete({
          ...newVideo,
          url: result.url,
          status: 'completed'
        })
        return
      }

      // Handle prediction-based generation (most common)
      if (result.enablePolling && result.predictionId) {
        console.log('[PAGE] Starting polling for video:', newVideo.id, 'prediction:', result.predictionId)

        // Add to polling pairs for real-time progress tracking
        setVideoPollingPairs(prev => [...prev, {
          videoId: newVideo.id,
          predictionId: result.predictionId
        }])
      } else {
        // Handle any other status
        console.warn('[PAGE] Unexpected API response format:', result)
        failVideo(newVideo.id, 'Unexpected response from video generation API')
      }

    } catch (error) {
      console.error('[PAGE] Video generation error:', error)

      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

      // Update video status
      setGeneratedVideos(prev => prev.map(v =>
        v.id.startsWith('video-') && v.status === 'generating'
          ? { ...v, status: 'failed', error: errorMessage }
          : v
      ))

      toast({
        title: "Failed to start video generation",
        description: errorMessage,
        variant: "destructive",
        duration: 7000
      })
    }
  }, [animatingImage, videoSettings, switchToVideoTab, addVideo, handleVideoComplete, failVideo, toast])

  // Handle video cancellation
  const handleCancelVideo = useCallback(async (videoId: string) => {
    console.log('[PAGE] Canceling video generation:', videoId)

    // Find the prediction ID
    const pollingPair = videoPollingPairs.find(pair => pair.videoId === videoId)

    if (pollingPair) {
      try {
        // Cancel the prediction on Replicate (if supported)
        // For now, we'll just stop polling and mark as failed
        setVideoPollingPairs(prev => prev.filter(pair => pair.videoId !== videoId))
        failVideo(videoId, 'Canceled by user')

        // Update video status
        setGeneratedVideos(prev => prev.map(v =>
          v.id === videoId
            ? { ...v, status: 'failed', error: 'Canceled by user' }
            : v
        ))

        toast({
          title: "Video generation canceled",
          description: "The video generation has been stopped.",
          duration: 3000
        })
      } catch (error) {
        console.error('[PAGE] Error canceling video:', error)
      }
    }
  }, [videoPollingPairs, failVideo, toast])

  return (
    <main className="h-screen bg-[#1E1E1E]">
      <PersistenceNotification />
      <AppSidebar 
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      <div className="pl-[3.05rem] transition-all duration-200 h-full">
        <ResizablePanels
          leftPanel={
            <ChatInterface
              onGeneratedImagesChange={handleGeneratedImagesChange}
              onImageGenerationStart={() => setActiveCanvasTab("images")}
              onAnimateImage={handleAnimateImage}
              onGeneratedVideosChange={handleGeneratedVideosChange}
              onVideoGenerationStart={() => {
                switchToVideoTab("Video generation started from chat")
              }}
              generatedVideos={generatedVideos}
              onEditImageRequested={setAutoOpenEditImageId}
              onChatSubmitRef={(submitFn) => { chatSubmitRef.current = submitFn }}
              onMessagesChange={handleMessagesUpdate}
              onModelChange={setSelectedModel}
              selectedModel={selectedModel}
              initialMessages={loadedMessages}
              chatId={currentChatId}
              onResetChat={() => setLoadedMessages(undefined)}
            />
          }
          rightPanel={
            <CanvasView
              generatedImages={generatedImages}
              onImagesChange={handleGeneratedImagesChange}
              generatedVideos={generatedVideos}
              onVideosChange={handleGeneratedVideosChange}
              onAnimateImage={handleAnimateImage}
              activeTab={activeCanvasTab}
              onTabChange={setActiveCanvasTab}
              onCancelVideo={handleCancelVideo}
              autoOpenEditImageId={autoOpenEditImageId}
            />
          }
          defaultLeftWidth={600}
          minLeftWidth={360}
          maxLeftWidth={800}
        />
      </div>

      {/* Animate Image Modal */}
      <AnimateImageModal
        isOpen={!!animatingImage}
        onClose={() => setAnimatingImage(null)}
        imageUrl={animatingImage?.url || ''}
        imageName={animatingImage?.prompt}
        onAnimate={handleAnimate}
        defaultModel={videoSettings.model}
        defaultDuration={videoSettings.duration}
        defaultAspectRatio={videoSettings.aspectRatio}
        enableAutoDetection={videoSettings.autoDetectAspectRatio}
      />
    </main>
  )
}
