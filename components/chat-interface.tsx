"use client"

import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ChatMessage from "./chat-message"
import { AI_Prompt } from "@/components/ui/animated-ai-input"
import { useState, useCallback, useRef, useEffect } from "react"
import { UploadProgress } from "./upload-progress"
import { AnimatePresence } from "framer-motion"
import { generateVideoThumbnail, getVideoDuration } from "@/lib/video-utils"
import {
  type GeneratedImage,
  generateImageId,
  isImageGenerationRequest,
  extractImagePrompt
} from "@/lib/image-utils"
import { SettingsDialog } from "./settings-dialog"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useChatWithTools } from "@/hooks/use-chat-with-tools"
import { toast } from "sonner"
import { SecureApiKeyInput } from "./secure-api-key-input"
import { MCPAgentWorkflow } from "@/lib/mcp/mcp-agent-workflow"
import { GeneratedVideo } from "@/lib/video-generation-types"
import { useVideoProgressStore } from "@/lib/stores/video-progress-store"
import { InlineImageOptions } from "./inline-image-options"
import { ImageActionDialog } from "./image-action-dialog"
import { getImageAspectRatio } from "@/lib/image-utils"

interface FileUpload {
  file: File
  preview?: string
  geminiFile?: {
    uri: string
    mimeType: string
    name: string
  }
  transcription?: {
    text: string
    language?: string
    duration?: number
    segments?: Array<{
      start: number
      end: number
      text: string
    }> // For detailed timing info
  }
  videoThumbnail?: string // Add this for video thumbnail
  videoDuration?: number // Add this for video duration
  aspectRatio?: {
    width: number
    height: number
    aspectRatio: number
    orientation: 'landscape' | 'portrait' | 'square'
    imageSize: '1024x1024' | '1536x1024' | '1024x1536'
    videoAspectRatio: '16:9' | '9:16' | '1:1'
  }
}

interface ChatInterfaceProps {
  onGeneratedImagesChange?: (images: GeneratedImage[]) => void
  onImageGenerationStart?: () => void
  onAnimateImage?: (imageUrl: string, imageName: string) => void
  onGeneratedVideosChange?: (videos: GeneratedVideo[]) => void
  onVideoGenerationStart?: () => void
  generatedVideos?: GeneratedVideo[]
  onEditImageRequested?: (imageId: string | null) => void
  onChatSubmitRef?: (submitFn: (message: string) => void) => void
  onMessagesChange?: (messages: any[]) => void
  onModelChange?: (model: string) => void
  selectedModel?: string
  initialMessages?: any[]
  chatId?: string | null
  onResetChat?: () => void
}

export default function ChatInterface({ 
  onGeneratedImagesChange, 
  onImageGenerationStart, 
  onAnimateImage, 
  onGeneratedVideosChange, 
  onVideoGenerationStart, 
  generatedVideos = [], 
  onEditImageRequested, 
  onChatSubmitRef,
  onMessagesChange,
  onModelChange,
  selectedModel: initialSelectedModel,
  initialMessages,
  chatId,
  onResetChat
}: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel || "gemini-2.5-flash-preview-05-20")
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'complete' | 'error' | 'converting'>('idle')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // MCP tool execution state is now managed by useChatWithTools hook

  // MCP tool management state
  const [enabledTools, setEnabledTools] = useState<Record<string, Record<string, boolean>>>({})
  const [enabledServers, setEnabledServers] = useState<Record<string, boolean>>({})

  // Track processed messages to prevent infinite loops
  const processedMessagesRef = useRef<Set<string>>(new Set())

  // API Key request state
  const [apiKeyRequest, setApiKeyRequest] = useState<{
    isOpen: boolean
    serverName: string
    serverInfo?: any
  }>({ isOpen: false, serverName: '' })

  // Image generation settings
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>(() => {
    // Load saved quality preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imageGenerationQuality')
      if (saved === 'standard' || saved === 'hd') {
        console.log('Loaded saved quality preference:', saved)
        return saved
      }
    }
    return 'hd' // Default to 'hd' for GPT-Image-1
  })
  const [imageStyle, setImageStyle] = useState<'vivid' | 'natural'>('vivid')
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [showImageSettings, setShowImageSettings] = useState(false)

  // Show image options when image is uploaded
  const [showImageOptions, setShowImageOptions] = useState(false)

  // Action dialog state for edit/animate prompts
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    action: 'edit' | 'animate' | null
    imageName: string
  }>({ isOpen: false, action: null, imageName: '' })

  // Ref to store handleSubmit function to avoid temporal dead zone
  const handleSubmitRef = useRef<((e?: React.FormEvent) => void) | null>(null)

  // Video generation settings
  const [videoModel, setVideoModel] = useState<'standard' | 'pro'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGenerationModel')
      return (saved === 'pro' ? 'pro' : 'standard')
    }
    return 'standard'
  })
  const [videoDuration, setVideoDuration] = useState<5 | 10>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGenerationDuration')
      return saved === '10' ? 10 : 5
    }
    return 5
  })
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGenerationAspectRatio')
      return saved as '16:9' | '9:16' | '1:1' || '16:9'
    }
    return '16:9'
  })
  const [autoDetectAspectRatio, setAutoDetectAspectRatio] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoAutoDetectAspectRatio')
      return saved !== 'false' // Default to true
    }
    return true
  })

  // Store object URLs for cleanup
  const objectURLsRef = useRef<Set<string>>(new Set())

  // Use a ref to store the current quality to avoid stale closures
  const imageQualityRef = useRef(imageQuality)

  // Debug: Log quality changes
  useEffect(() => {
    console.log('Image quality setting changed to:', imageQuality)
    console.log('Current image generation model:', imageQuality === 'hd' ? 'GPT-Image-1' : 'WaveSpeed AI')
    // Update the ref whenever imageQuality changes
    imageQualityRef.current = imageQuality
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageGenerationQuality', imageQuality)
    }
  }, [imageQuality])

  // Save video settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('videoGenerationModel', videoModel)
      localStorage.setItem('videoGenerationDuration', videoDuration.toString())
      localStorage.setItem('videoGenerationAspectRatio', videoAspectRatio)
      localStorage.setItem('videoAutoDetectAspectRatio', autoDetectAspectRatio.toString())

      // Also save as a combined object for the page component
      localStorage.setItem('videoGenerationSettings', JSON.stringify({
        model: videoModel,
        duration: videoDuration,
        aspectRatio: videoAspectRatio,
        autoDetectAspectRatio: autoDetectAspectRatio
      }))
    }
  }, [videoModel, videoDuration, videoAspectRatio, autoDetectAspectRatio])

  // Wrapper function for setImageQuality with logging
  const updateImageQuality = useCallback((newQuality: 'standard' | 'hd') => {
    console.log('[updateImageQuality] Changing from', imageQuality, 'to', newQuality)
    setImageQuality(newQuality)
  }, [imageQuality])

  // Callback to handle settings dialog close
  const handleSettingsClose = useCallback((open: boolean) => {
    setShowImageSettings(open)
    if (!open) {
      // Log current settings when dialog closes
      console.log('Settings dialog closed. Current quality:', imageQuality)
      console.log('Settings dialog closed. Current style:', imageStyle)
      console.log('Settings dialog closed. Current size:', imageSize)
    }
  }, [imageQuality, imageStyle, imageSize])

  // Initialize MCP on mount and start workflow monitor
  useEffect(() => {
    // Initialize MCP servers
    fetch('/api/mcp/init')
      .then(res => res.json())
      .then(data => console.log('MCP initialized:', data))
      .catch(err => console.error('Failed to initialize MCP:', err))

    // Initialize the MCP Agent Workflow monitor (starts automatically)
    MCPAgentWorkflow.getInstance()
    console.log('MCP Agent Workflow monitor initialized')

    // Cleanup on unmount
    return () => {
      MCPAgentWorkflow.getInstance().stopMonitoring()
    }
  }, [])

  // Store file attachments for each message
  const [messageAttachments, setMessageAttachments] = useState<Record<string, {
    name: string
    contentType: string
    url?: string
    transcription?: {
      text: string
      language?: string
      duration?: number
      segments?: Array<{
        start: number
        end: number
        text: string
      }>
    }
    videoThumbnail?: string // Add this
    videoDuration?: number // Add this
  }[]>>({})

  // Track pending attachment for the next message
  const pendingAttachmentRef = useRef<{
    name: string
    contentType: string
    url?: string
    transcription?: {
      text: string
      language?: string
      duration?: number
      segments?: Array<{
        start: number
        end: number
        text: string
      }>
    }
    videoThumbnail?: string // Add this
    videoDuration?: number // Add this
    additionalFiles?: Array<{
      name: string
      contentType: string
      url?: string
      transcription?: {
        text: string
        language?: string
        duration?: number
        segments?: Array<{
          start: number
          end: number
          text: string
        }>
      }
      videoThumbnail?: string
      videoDuration?: number
    }>
  } | null>(null)

  // Use initial messages if provided, otherwise use welcome message
  const defaultInitialMessages = [
    {
      id: "welcome-message",
      role: "assistant",
      content: "Hello! I'm your AI assistant powered by Gemini. How can I help you today?",
    },
  ]

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, stop, mcpToolExecuting, reload } = useChatWithTools({
    api: "/api/chat",
    body: {
      model: selectedModel,
      // For backward compatibility, keep single file fields
      fileUri: selectedFile?.geminiFile?.uri,
      fileMimeType: selectedFile?.geminiFile?.mimeType,
      transcription: selectedFile?.transcription, // Include transcription data
      chatId: chatId, // Include chat ID for persistence
      // Include ALL files (both single and multiple) in multipleFiles array
      multipleFiles: (() => {
        const allFiles = []
        if (selectedFile?.geminiFile) {
          allFiles.push({
            uri: selectedFile.geminiFile.uri,
            mimeType: selectedFile.geminiFile.mimeType,
            name: selectedFile.file.name,
            transcription: selectedFile.transcription
          })
        }
        if (selectedFiles.length > 0) {
          allFiles.push(...selectedFiles.filter(f => f.geminiFile).map(file => ({
            uri: file.geminiFile!.uri,
            mimeType: file.geminiFile!.mimeType,
            name: file.file.name,
            transcription: file.transcription
          })))
        }
        return allFiles.length > 0 ? allFiles : undefined
      })(),
    },
    initialMessages: initialMessages || defaultInitialMessages,
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Notify parent when messages change
  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model)
    onModelChange?.(model)
  }, [onModelChange])

  // Reset chat state when chatId changes or reset is requested
  useEffect(() => {
    if (chatId === null && onResetChat) {
      // Clear local state when starting a new chat
      setLocalMessages([])
      setSelectedFile(null)
      setMessageAttachments({})
      pendingAttachmentRef.current = null
    }
  }, [chatId, onResetChat])

  // Watch for new messages and attach pending files
  useEffect(() => {
    if (messages.length > 0 && pendingAttachmentRef.current) {
      const lastMessage = messages[messages.length - 1]

      // Check if this is a new user message without attachments
      if (lastMessage.role === 'user' && !messageAttachments[lastMessage.id] && pendingAttachmentRef.current) {
        console.log('Attaching file to message:', lastMessage.id, pendingAttachmentRef.current)

        const attachment = pendingAttachmentRef.current
        
        // Create an array with the primary attachment and any additional files
        const allAttachments = [attachment];
        
        // Add additional files if they exist
        if (attachment.additionalFiles && attachment.additionalFiles.length > 0) {
          allAttachments.push(...attachment.additionalFiles);
        }
        
        setMessageAttachments(prev => ({
          ...prev,
          [lastMessage.id]: allAttachments
        }))

        // Clear the pending attachment
        pendingAttachmentRef.current = null
      }
    }
  }, [messages, messageAttachments])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Delay cleanup to ensure URLs are still valid when needed
      setTimeout(() => {
        for (const url of objectURLsRef.current) {
          URL.revokeObjectURL(url)
        }
      }, 5000) // 5 second delay
    }
  }, [])

  // Clear local messages when real messages change (to prevent duplicates)
  // But preserve image generation success messages
  useEffect(() => {
    if (messages.length > 1) { // Keep initial welcome message check
      setLocalMessages(prev => prev.filter(msg =>
        msg.id.startsWith('img-success-') ||
        msg.id.startsWith('img-error-')
      ))
    }
  }, [messages.length])

  // Process a single file (extracted from handleFileSelect for reuse)
  const processFile = useCallback(async (file: File): Promise<FileUpload> => {
    const fileUpload: FileUpload = { file }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      try {
        const preview = URL.createObjectURL(file)
        
        // Handle HEIC conversion
        if (file.type === 'image/heic' || file.type === 'image/heif' || 
            file.name.toLowerCase().endsWith('.heic') || 
            file.name.toLowerCase().endsWith('.heif')) {
          
          const convertFormData = new FormData()
          convertFormData.append('file', file)
          
          const convertResponse = await fetch('/api/convert-heic', {
            method: 'POST',
            body: convertFormData
          })
          
          if (convertResponse.ok) {
            const { preview: convertedPreview } = await convertResponse.json()
            fileUpload.preview = convertedPreview
          } else {
            fileUpload.preview = preview
          }
        } else {
          fileUpload.preview = preview
        }

        // Get aspect ratio for image-to-video
        try {
          const aspectRatio = await getImageAspectRatio(file)
          fileUpload.aspectRatio = aspectRatio
        } catch (error) {
          console.warn('Failed to get image aspect ratio:', error)
        }
      } catch (error) {
        console.error('Failed to create image preview:', error)
      }
    }

    // Upload to Google AI for processing
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // The API returns 'file' not 'geminiFile'
      if (result.file) {
        fileUpload.geminiFile = result.file
      }

      if (result.transcription) {
        fileUpload.transcription = result.transcription
      }

      if (result.videoThumbnail) {
        fileUpload.videoThumbnail = result.videoThumbnail
      }

      if (result.videoDuration) {
        fileUpload.videoDuration = result.videoDuration
      }
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }

    return fileUpload
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    // Check if we already have a file selected
    if (selectedFile || selectedFiles.length > 0) {
      // We have existing files, we need to convert to multiple files mode
      // First, process the new file
      setIsUploading(true)
      setUploadProgress(0)
      setUploadStatus('uploading')
      
      try {
        const processedFile = await processFile(file)
        
        // Convert single file to array if needed and add new file
        if (selectedFile && selectedFiles.length === 0) {
          setSelectedFiles([selectedFile, processedFile])
          setSelectedFile(null)
          setShowImageOptions(false)
        } else {
          setSelectedFiles(prev => [...prev, processedFile])
        }
        
        setUploadStatus('complete')
        toast.success(`File added successfully`)
      } catch (error: any) {
        console.error("File upload error:", error)
        setUploadStatus('error')
        toast.error("File Upload Failed", {
          description: error.message || "An error occurred while uploading the file."
        })
      } finally {
        setIsUploading(false)
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadProgress(0)
        }, 2000)
      }
      return
    }
    
    // This is the first file, handle as single file
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')
    
    // Clear multiple files array when selecting a single file
    setSelectedFiles([])

    try {
      // Create preview for images, audio, and video files
      let preview: string | undefined
      let videoThumbnail: string | undefined
      let videoDuration: number | undefined

      if (file.type.startsWith("image/")) {
        // Check if it's a HEIC/HEIF file (browsers can't display these)
        if (file.type === 'image/heic' || file.type === 'image/heif' || 
            file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          console.log('HEIC file detected, converting to JPEG for preview...')
          setUploadStatus('converting')
          setUploadProgress(0)
          
          try {
            // Convert HEIC to JPEG for preview
            const convertFormData = new FormData()
            convertFormData.append('file', file)
            
            const convertResponse = await fetch('/api/convert-heic', {
              method: 'POST',
              body: convertFormData
            })
            
            if (convertResponse.ok) {
              const { preview: convertedPreview, conversionTime } = await convertResponse.json()
              console.log(`HEIC converted successfully in ${conversionTime}`)
              preview = convertedPreview // Use the converted JPEG data URL
              setUploadProgress(100)
            } else {
              const errorData = await convertResponse.json()
              console.warn('HEIC conversion failed:', errorData.error)
              console.warn('Details:', errorData.details)
              // Continue without preview
              preview = undefined
            }
          } catch (error) {
            console.error('HEIC conversion error:', error)
            // Continue without preview
            preview = undefined
          }
          
          // Reset converting status
          setUploadStatus('uploading')
          setUploadProgress(0)
        } else {
          // Convert to data URL for image editing compatibility
          const reader = new FileReader()
          preview = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }
      } else if (file.type.startsWith("audio/")) {
        preview = URL.createObjectURL(file)
        objectURLsRef.current.add(preview)
      } else if (file.type.startsWith("video/")) {
        // For video files, create object URL and generate thumbnail
        preview = URL.createObjectURL(file)
        objectURLsRef.current.add(preview)

        try {
          // Generate thumbnail at 2 seconds (or 0 if video is shorter)
          videoThumbnail = await generateVideoThumbnail(file, 2.0)
          videoDuration = await getVideoDuration(file)
          console.log('Video thumbnail generated, duration:', videoDuration)
        } catch (thumbError) {
          console.error('Failed to generate video thumbnail:', thumbError)
          // Continue without thumbnail
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to Gemini
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()

      // Transcribe audio and video files with Whisper
      let transcription: FileUpload['transcription'] = undefined
      if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
        // Check file size before attempting transcription
        const MAX_TRANSCRIPTION_SIZE = 25 * 1024 * 1024 // 25MB
        if (file.size > MAX_TRANSCRIPTION_SIZE) {
          console.warn(`File too large for transcription: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 25MB)`)
          toast.warning("Transcription Skipped", {
            description: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB (max 25MB for transcription). The file will be uploaded without transcription.`
          })
        } else {
          try {
            setUploadStatus('transcribing')
            setUploadProgress(0)

            // Simulate transcription progress
            const transcribeProgressInterval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev >= 80) {
                  clearInterval(transcribeProgressInterval)
                  return 80
                }
                return prev + 20
              })
            }, 300)

            const transcribeFormData = new FormData()
            transcribeFormData.append("file", file)

            const transcribeResponse = await fetch("/api/transcribe", {
              method: "POST",
              body: transcribeFormData,
            })

          clearInterval(transcribeProgressInterval)
          setUploadProgress(100)

          if (transcribeResponse.ok) {
            const transcribeData = await transcribeResponse.json()
            transcription = {
              text: transcribeData.transcription.text,
              language: transcribeData.transcription.language,
              duration: transcribeData.transcription.duration || videoDuration,
              segments: transcribeData.transcription.segments,
            }
            console.log('Transcription successful:', transcription)
          } else {
            let errorData: any = {}
            
            // Try to parse the error response
            try {
              const text = await transcribeResponse.text()
              if (text) {
                try {
                  errorData = JSON.parse(text)
                } catch (parseError) {
                  console.error('Failed to parse error response:', text)
                  errorData = { error: 'Transcription failed', details: text }
                }
              }
            } catch (readError) {
              console.error('Failed to read error response:', readError)
              errorData = { error: 'Transcription failed', details: 'Unable to read server response' }
            }
            
            console.error('Transcription failed:', errorData)

            // Show user-friendly error message
            const errorMessage = errorData.error || 'Transcription failed'
            const errorDetails = errorData.details || 'Unknown error'

            // Check status code for specific errors
            if (transcribeResponse.status === 400 && file.size > 25 * 1024 * 1024) {
              toast.error("File Too Large", {
                description: `Maximum file size for transcription is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
              })
            } else if (errorDetails.includes("Connection error")) {
              toast.error("Connection Error", {
                description: "Unable to connect to transcription service. Please check your internet connection and try again."
              })
            } else if (errorDetails.includes("25MB")) {
              toast.error("File Too Large", {
                description: `Maximum file size for transcription is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
              })
            } else if (errorDetails.includes("Invalid OpenAI API key")) {
              toast.error("API Key Error", {
                description: "OpenAI API key is missing or invalid. Please check your configuration."
              })
            } else {
              toast.error(errorMessage, {
                description: errorDetails
              })
            }

            // Continue without transcription
            console.warn('Continuing without transcription due to error')
          }
        } catch (transcribeError: any) {
          console.error("Transcription error:", transcribeError)

          // Show error to user
          toast.error("Transcription Error", {
            description: transcribeError.message || "Failed to transcribe audio. The file will be uploaded without transcription."
          })

          // Continue without transcription
          }
        }
      }

      // Detect aspect ratio for images
      let aspectRatio = undefined
      if (file.type.startsWith("image/")) {
        try {
          aspectRatio = await getImageAspectRatio(file)
          console.log('Detected aspect ratio:', {
            width: aspectRatio.width,
            height: aspectRatio.height,
            ratio: aspectRatio.aspectRatio,
            orientation: aspectRatio.orientation,
            imageSize: aspectRatio.imageSize,
            videoAspectRatio: aspectRatio.videoAspectRatio
          })
        } catch (err) {
          console.error('Failed to detect aspect ratio:', err)
        }
      }

      setSelectedFile({
        file,
        preview,
        geminiFile: data.file,
        transcription,
        videoThumbnail,
        videoDuration,
        aspectRatio,
      })

      setUploadStatus('complete')

      // Show image options if it's an image file
      if (file.type.startsWith("image/")) {
        setShowImageOptions(true)
      }

      // Hide success message after 2 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 2000)

    } catch (error: any) {
      console.error("File upload error:", error)
      setUploadStatus('error')

      // Show error to user
      toast.error("File Upload Failed", {
        description: error.message || "An error occurred while uploading the file. Please try again."
      })

      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 3000)
    } finally {
      setIsUploading(false)
    }
  }, [processFile, selectedFile, selectedFiles])

  const handleFileRemove = useCallback(() => {
    // Don't revoke the URL immediately as it might still be needed
    setSelectedFile(null)
    pendingAttachmentRef.current = null
    setUploadStatus('idle')
    setUploadProgress(0)
    setShowImageOptions(false)
  }, [])

  // Handle multiple files
  const handleFilesSelect = useCallback(async (files: File[]) => {
    setIsUploading(true)
    setUploadStatus('uploading')
    
    // If we have a single file selected, convert it to the multiple files array first
    if (selectedFile && selectedFiles.length === 0) {
      // Add the existing single file to the array
      setSelectedFiles([selectedFile])
      setSelectedFile(null)
      setShowImageOptions(false)
    }
    
    const processedFiles: FileUpload[] = []
    
    try {
      // Calculate progress based on existing files + new files
      const existingCount = selectedFiles.length
      const totalCount = existingCount + files.length
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const progress = ((existingCount + i + 1) / totalCount) * 100
        setUploadProgress(progress)
        
        // Process each file
        const fileUpload = await processFile(file)
        processedFiles.push(fileUpload)
      }
      
      // Append to existing files instead of replacing
      setSelectedFiles(prev => [...prev, ...processedFiles])
      setUploadStatus('complete')
      
      const totalFiles = selectedFiles.length + files.length
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} added (${totalFiles} total)`)
    } catch (error: any) {
      console.error('Multiple file upload error:', error)
      setUploadStatus('error')
      toast.error("File Upload Failed", {
        description: error.message || "An error occurred while uploading files."
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 3000)
    }
  }, [processFile, selectedFile, selectedFiles])

  const handleFilesRemove = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAllFilesRemove = useCallback(() => {
    setSelectedFile(null)
    setSelectedFiles([])
    setShowImageOptions(false)
    setUploadStatus('idle')
    setUploadProgress(0)
  }, [])

  // Local messages for image generation feedback
  const [localMessages, setLocalMessages] = useState<Array<{id: string, role: string, content: string}>>([])

  const handleImageGeneration = useCallback(async (originalPrompt: string) => {
    setIsGeneratingImage(true)

    // Add user's message to local messages immediately
    const userMessage = {
      id: `img-user-${Date.now()}`,
      role: "user",
      content: originalPrompt,
    }
    setLocalMessages(prev => [...prev, userMessage])

    // Switch to Images tab when starting generation
    onImageGenerationStart?.()

    // Create a placeholder image with generating state
    const placeholderId = generateImageId()
    const placeholderImage: GeneratedImage = {
      id: placeholderId,
      url: '', // Empty URL while generating
      prompt: originalPrompt,
      timestamp: new Date(),
      quality: imageQualityRef.current,
      style: imageStyle,
      size: imageSize,
      model: imageQualityRef.current === 'hd' ? 'gpt-image-1' : 'flux-dev-ultra-fast',
      isGenerating: true,
      generationStartTime: new Date(),
    }

    // Add placeholder to gallery immediately using functional update
    setGeneratedImages(prevImages => {
      const updatedWithPlaceholder = [...prevImages, placeholderImage]
      console.log('Adding placeholder image:', placeholderImage)
      console.log('Updated images with placeholder:', updatedWithPlaceholder)
      // Defer the parent state update to avoid setState during render
      setTimeout(() => {
        onGeneratedImagesChange?.(updatedWithPlaceholder)
      }, 0)
      return updatedWithPlaceholder
    })

    try {
      console.log('Generating image with original prompt:', originalPrompt)

      // Extract the cleaned prompt for the API, but keep the original for display
      const cleanedPrompt = extractImagePrompt(originalPrompt)
      console.log('Cleaned prompt for API:', cleanedPrompt)

      // Use the ref to get the current quality value to avoid stale closures
      const currentQuality = imageQualityRef.current
      console.log('Current quality setting from ref:', currentQuality) // Debug log
      console.log('Sending request with quality:', currentQuality) // Additional debug

      // Double-check the quality value
      const qualityToSend = currentQuality
      console.log('Quality value being sent to API:', qualityToSend)

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: cleanedPrompt,  // Use cleaned prompt for API
          originalPrompt: originalPrompt,  // Send original too
          quality: qualityToSend,
          style: imageStyle,
          size: imageSize,
          n: 1,
        }),
      }).catch(error => {
        console.error('Network error:', error)
        throw new Error('Failed to connect to the server. Make sure the development server is running.')
      })

      let data: {
        success: boolean
        images: Array<{
          url: string
          revisedPrompt?: string
          index: number
        }>
        metadata: {
          model: string
          provider: string
          quality: string
          style: string
          size: string
          originalPrompt: string
          imageCount: number
        }
        error?: string
        details?: string
      }
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid response from image generation API')
      }

      if (!response.ok) {
        console.error('Image generation failed. Status:', response.status)
        console.error('Response data:', data)

        // Provide more detailed error message
        const errorMessage = data?.error || data?.details || `Failed to generate image (Status: ${response.status})`
        throw new Error(errorMessage)
      }

      console.log('Image generation response:', data)

      // Update the placeholder image with the actual result
      const newImages: GeneratedImage[] = data.images.map((img) => ({
        id: placeholderId, // Use the placeholder ID to update it
        url: img.url,
        prompt: data.metadata.originalPrompt,
        revisedPrompt: img.revisedPrompt,
        timestamp: new Date(),
        quality: data.metadata.quality as 'standard' | 'hd',
        style: data.metadata.style as 'vivid' | 'natural' | undefined,
        size: data.metadata.size,
        model: data.metadata.model,
        isGenerating: false, // Image is done generating
        generationStartTime: placeholderImage.generationStartTime,
        urlAvailableTime: new Date(), // Track when URL became available
      }))

      // Update state by replacing the placeholder using functional update
      console.log('Updating placeholder with actual image:', {
        placeholderId,
        newImageUrl: newImages[0]?.url,
        newImage: newImages[0]
      })

      setGeneratedImages(prevImages => {
        console.log('Previous images:', prevImages)
        const updatedImages = prevImages.map(img =>
          img.id === placeholderId ? newImages[0] : img
        )
        console.log('Updated images:', updatedImages)
        // Don't save to localStorage - we're using database persistence
        // Defer the parent state update to avoid setState during render
        setTimeout(() => {
          onGeneratedImagesChange?.(updatedImages)
        }, 0)
        return updatedImages
      })

      // Add success message to local messages
      const modelName = data.metadata.model.includes('gpt-image-1') ? 'GPT-Image-1' :
                       data.metadata.model.includes('dall-e') ? 'DALL-E' :
                       data.metadata.model.includes('flux') ? 'WaveSpeed AI' :
                       data.metadata.model
      const successMessage = {
        id: `img-success-${Date.now()}`,
        role: "assistant" as const,
        content: `✨ **I've successfully generated your image!**

**Prompt:** "${newImages[0].prompt}"
**Model:** ${modelName}${data.metadata.model.includes('fallback') ? ' (fallback)' : ''}
**Quality:** ${newImages[0].quality?.toUpperCase() || currentQuality.toUpperCase()}
**Size:** ${newImages[0].size || imageSize}

You can view it in the **Images** tab on the right.`,
      }
      setLocalMessages(prev => [...prev, successMessage])

    } catch (error) {
      console.error("Image generation error:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      // Remove the placeholder on error using functional update
      setGeneratedImages(prevImages => {
        const updatedAfterError = prevImages.filter(img => img.id !== placeholderId)
        // Defer the parent state update to avoid setState during render
        setTimeout(() => {
          onGeneratedImagesChange?.(updatedAfterError)
        }, 0)
        return updatedAfterError
      })

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      // Check if it's a network error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        const errorMsg = {
          id: `img-error-${Date.now()}`,
          role: "assistant",
          content: `❌ I couldn't connect to the image generation service.\n\nPlease check:\n\n1. **Is your development server running?**\n   Run: \`npm run dev\` or \`pnpm dev\`\n\n2. **Did the server crash?**\n   Check your terminal for errors\n\n3. **Is the server running on the correct port?**\n   Should be: http://localhost:3000`,
        }
        setLocalMessages(prev => [...prev, errorMsg])
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        const modelName = imageQualityRef.current === 'hd' ? 'GPT-Image-1' : 'WaveSpeed';
        const errorMsg = {
          id: `img-error-${Date.now()}`,
          role: "assistant",
          content: `⏳ Rate limit reached.\n\nThe ${modelName} API has a rate limit to prevent abuse.\n\n**Solution:** Wait a few seconds and try again.\n\n${imageQualityRef.current === 'hd' ? 'GPT-Image-1 is a premium service with token-based limits.' : 'This is a fast, high-quality image generation service with reasonable limits.'}`,
        }
        setLocalMessages(prev => [...prev, errorMsg])
      } else if (errorMessage.includes('timeout')) {
        const errorMsg = {
          id: `img-error-${Date.now()}`,
          role: "assistant",
          content: "⏱️ Image generation timed out.\n\nThe generation took longer than expected (>30 seconds).\n\n**Solutions:**\n1. Try a simpler prompt\n2. Try again - it might work on the next attempt\n3. Check if the service is experiencing high load",
        }
        setLocalMessages(prev => [...prev, errorMsg])
      } else {
        const errorMsg = {
          id: `img-error-${Date.now()}`,
          role: "assistant",
          content: `❌ I couldn't generate the image.\n\n**Error:** ${errorMessage}\n\nPlease try again or check the console for more details.`,
        }
        setLocalMessages(prev => [...prev, errorMsg])
      }
    } finally {
      setIsGeneratingImage(false)
    }
  }, [onGeneratedImagesChange, onImageGenerationStart, imageStyle, imageSize])


  // Handle inline image option selection
  const handleImageOptionSelect = useCallback((option: 'analyze' | 'edit' | 'animate', imageIndex?: number) => {
    console.log('[handleImageOptionSelect] Selected option:', option, 'imageIndex:', imageIndex);

    // Determine which file to work with
    const targetFile = imageIndex !== undefined ? selectedFiles[imageIndex] : selectedFile;
    
    if (!targetFile) {
      console.error('[handleImageOptionSelect] No target file found');
      return;
    }

    // Hide the options
    setShowImageOptions(false);

    switch (option) {
      case 'analyze':
        // Direct analysis - submit with analyze prompt
        const analyzePrompt = 'Analyze this image and provide a detailed analysis';
        handleInputChange({ target: { value: analyzePrompt } } as React.ChangeEvent<HTMLInputElement>)

        // Submit after a short delay to ensure state update
        setTimeout(() => {
          console.log('[analyze] Submitting with file:', targetFile?.file?.name)
          console.log('[analyze] File URI:', targetFile?.geminiFile?.uri)
          console.log('[analyze] File type:', targetFile?.file?.type)
          const event = new Event('submit', { bubbles: true, cancelable: true }) as any
          event.preventDefault = () => {}
          originalHandleSubmit(event)
        }, 100)
        break;

      case 'edit':
        // Add uploaded image to gallery for editing
        if (targetFile && targetFile.geminiFile && targetFile.preview) {
          console.log('[ChatInterface] Creating uploaded image for gallery with quality:', imageQuality)
          console.log('[ChatInterface] Target file aspect ratio:', targetFile.aspectRatio)
          console.log('[ChatInterface] Using size:', targetFile.aspectRatio?.imageSize || imageSize)
          
          const uploadedImage: GeneratedImage = {
            id: generateImageId(),
            url: targetFile.preview, // Use the preview URL which is a data URL
            prompt: `Uploaded: ${targetFile.file.name}`,
            timestamp: new Date(),
            quality: imageQuality || 'standard',
            style: imageStyle,
            size: targetFile.aspectRatio?.imageSize || imageSize,
            model: 'uploaded',
            isUploaded: true,
            isGenerating: false, // Important: Mark as not generating so it gets saved
            geminiUri: targetFile.geminiFile.uri // Store the Gemini URI for reference
          }
          console.log('[ChatInterface] Uploaded image object:', {
            id: uploadedImage.id,
            size: uploadedImage.size,
            quality: uploadedImage.quality,
            aspectRatio: targetFile.aspectRatio
          })

          // Add to gallery
          setGeneratedImages(prev => {
            const newImages = [...prev, uploadedImage]
            // Don't save to localStorage - we're using database persistence
            // Defer parent state update to avoid setState during render
            setTimeout(() => {
              onGeneratedImagesChange?.(newImages)
              // Request auto-open of edit modal
              onEditImageRequested?.(uploadedImage.id)
            }, 0)
            return newImages
          })

          // Switch to Images tab
          onImageGenerationStart?.()

          // Clear the selected file
          setSelectedFile(null)
          
          toast.success("Image Added to Gallery", {
            description: "Opening edit dialog...",
            duration: 2000
          })
        }
        break;

      case 'animate':
        // Show animate prompt dialog
        if (targetFile) {
          setActionDialog({
            isOpen: true,
            action: 'animate',
            imageName: targetFile.file.name
          })
        }
        break;
    }
  }, [handleInputChange, selectedFile, selectedFiles, originalHandleSubmit]);

  // Handle image option selection for single images
  const handleInlineImageOptionSelect = useCallback((option: 'analyze' | 'edit' | 'animate') => {
    handleImageOptionSelect(option);
  }, [handleImageOptionSelect]);

  // Handle image option selection for multiple images in chat
  const handleMultiImageOptionSelect = useCallback((option: 'analyze' | 'edit' | 'animate', attachment: any) => {
    console.log('[handleMultiImageOptionSelect] Called with:', { option, attachmentName: attachment.name });
    
    // For multiple images, we need to create a temporary file object to work with existing logic
    // This simulates the selectedFile structure that handleImageOptionSelect expects
    const mockFile = {
      file: {
        name: attachment.name,
        type: attachment.contentType,
        size: 0
      },
      preview: attachment.url,
      geminiFile: { uri: attachment.url } // Use the attachment URL as the URI
    };

    // Set this as the temporary selected file and trigger the option handler
    const originalSelectedFile = selectedFile;
    setSelectedFile(mockFile as any);
    
    // Use timeout to ensure state is updated before calling handler
    setTimeout(() => {
      handleImageOptionSelect(option);
      // Restore the original selected file
      setSelectedFile(originalSelectedFile);
    }, 0);
  }, [handleImageOptionSelect, selectedFile]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    // Prevent default form submission
    if (e) {
      e.preventDefault()
    }

    // Check if we have input or a file
    if (!input.trim() && !selectedFile && selectedFiles.length === 0) {
      return
    }

    // Check if this is an image generation request
    if (input.trim() && isImageGenerationRequest(input)) {
      // Pass the original input, not the extracted prompt
      handleImageGeneration(input)
      // Clear the input
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
      // Don't call originalHandleSubmit for image generation
      return
    }


    // Store the attachment info before submission
    // Combine single file and multiple files into one array
    const allFiles: FileUpload[] = []
    
    if (selectedFile) {
      allFiles.push(selectedFile)
    }
    
    if (selectedFiles.length > 0) {
      allFiles.push(...selectedFiles)
    }
    
    if (allFiles.length > 0) {
      // Use the first file as primary attachment
      const primaryFile = allFiles[0]
      pendingAttachmentRef.current = {
        name: primaryFile.file.name,
        contentType: primaryFile.file.type,
        url: primaryFile.preview || '',
        transcription: primaryFile.transcription,
        videoThumbnail: primaryFile.videoThumbnail,
        videoDuration: primaryFile.videoDuration,
        additionalFiles: allFiles.slice(1).map(file => ({
          name: file.file.name,
          contentType: file.file.type,
          url: file.preview || '',
          transcription: file.transcription,
          videoThumbnail: file.videoThumbnail,
          videoDuration: file.videoDuration,
        }))
      }
      console.log(`Pending attachments set: ${allFiles.length} file(s)`, pendingAttachmentRef.current)
    }

    // Only call originalHandleSubmit if we have a valid message
    if (input.trim() || selectedFile || selectedFiles.length > 0) {
      originalHandleSubmit(e)
    }

    // Clear files after submission
    setSelectedFile(null)
    setSelectedFiles([])
  }, [input, selectedFile, selectedFiles, originalHandleSubmit, handleImageGeneration, handleInputChange])

  // Store handleSubmit in ref to avoid temporal dead zone issues
  handleSubmitRef.current = handleSubmit

  // Handle edit dialog confirmation
  const handleEditConfirm = useCallback(async (prompt: string) => {
    if (!selectedFile || !selectedFile.geminiFile) return;

    // For uploaded images, we'll use image generation with the edit prompt
    // This avoids the Gemini URI access limitation
    try {
      toast.info("Processing your edit request...", {
        description: "I'll create a new image based on your changes"
      });

      // Create a prompt that will trigger image generation
      const editPrompt = `Based on the uploaded image, generate an image with these modifications: ${prompt}. The new image should match the original style and composition, only applying the requested changes.`;

      // Set the input with the edit prompt
      handleInputChange({ target: { value: editPrompt } } as React.ChangeEvent<HTMLInputElement>)
      
      // Submit with the image still attached
      setTimeout(() => {
        console.log('[handleEditConfirm] Submitting with file:', selectedFile?.file?.name)
        handleSubmitRef.current?.() // Use ref to avoid initialization issues
      }, 100)

      // Don't clear the file here - let handleSubmit do it after submission

    } catch (error) {
      console.error('Image editing error:', error);
      toast.error("Edit Error", {
        description: error instanceof Error ? error.message : "Failed to process edit request"
      });
    }
  }, [selectedFile, handleInputChange]);

  // Handle animate dialog confirmation
  const handleAnimateConfirm = useCallback((prompt: string) => {
    if (!selectedFile) return;

    // Use detected aspect ratio or current setting
    const aspectRatio = selectedFile.aspectRatio?.videoAspectRatio || videoAspectRatio;

    // Store the aspect ratio for video generation
    if (selectedFile.aspectRatio?.videoAspectRatio && typeof window !== 'undefined') {
      localStorage.setItem('videoGenerationAspectRatio', selectedFile.aspectRatio.videoAspectRatio);
    }

    // Submit with animation prompt
    handleInputChange({ target: { value: `animate this image: ${prompt}` } } as React.ChangeEvent<HTMLInputElement>)
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true, cancelable: true }) as any
      event.preventDefault = () => {}
      originalHandleSubmit(event)
    }, 100)
  }, [handleInputChange, originalHandleSubmit, selectedFile, videoAspectRatio]);

  // Handle image option selection (from chat message)
  const handleChatImageOptionSelect = useCallback((optionId: string, imageUri: string) => {
    console.log('[handleImageOptionSelect] Selected option:', optionId, 'for image:', imageUri);

    switch (optionId) {
      case 'analyze':
        // Submit analyze request with detailed prompt
        handleInputChange({ target: { value: 'Analyze this image and provide a detailed analysis' } } as React.ChangeEvent<HTMLInputElement>)
        setTimeout(() => {
          const event = new Event('submit', { bubbles: true, cancelable: true }) as any
          event.preventDefault = () => {}
          originalHandleSubmit(event)
        }, 100)
        break;

      case 'edit':
        // Add uploaded image to gallery for editing
        if (selectedFile && selectedFile.geminiFile && selectedFile.preview) {
          const uploadedImage: GeneratedImage = {
            id: generateImageId(),
            url: selectedFile.preview, // Use the preview URL which is a data URL
            prompt: `Uploaded: ${selectedFile.file.name}`,
            timestamp: new Date(),
            quality: imageQuality || 'standard',
            style: imageStyle,
            size: selectedFile.aspectRatio?.imageSize || imageSize,
            model: 'uploaded',
            isUploaded: true,
            isGenerating: false, // Important: Mark as not generating so it gets saved
            geminiUri: selectedFile.geminiFile.uri // Store the Gemini URI for reference
          }

          // Add to gallery
          setGeneratedImages(prev => {
            const newImages = [...prev, uploadedImage]
            // Don't save to localStorage - we're using database persistence
            // Defer parent state update to avoid setState during render
            setTimeout(() => {
              onGeneratedImagesChange?.(newImages)
              // Request auto-open of edit modal
              onEditImageRequested?.(uploadedImage.id)
            }, 0)
            return newImages
          })

          // Switch to Images tab
          onImageGenerationStart?.()

          // Clear the selected file
          setSelectedFile(null)
          
          toast.success("Image Added to Gallery", {
            description: "Opening edit dialog...",
            duration: 2000
          })
        }
        break;

      case 'animate':
        // Submit animate request
        handleInputChange({ target: { value: 'animate this image' } } as React.ChangeEvent<HTMLInputElement>)
        setTimeout(() => {
          const event = new Event('submit', { bubbles: true, cancelable: true }) as any
          event.preventDefault = () => {}
          originalHandleSubmit(event)
        }, 100)
        break;
    }
  }, [handleInputChange, originalHandleSubmit, selectedFile, imageQuality, imageStyle, imageSize, onGeneratedImagesChange, onImageGenerationStart])

  // Helper function to submit with a specific message
  const submitWithMessage = useCallback((message: string) => {
    // Set the input value
    handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>)

    // We need to wait for React to update the state before submitting
    setTimeout(() => {
      // Double-check file is still selected
      console.log('[submitWithMessage] Submitting with file:', selectedFile?.file?.name)
      console.log('[submitWithMessage] Input value:', input)

      // Call handleSubmit directly
      handleSubmit()
    }, 100)
  }, [handleInputChange, selectedFile, handleSubmit, input])

  // Expose submit function to parent component
  useEffect(() => {
    if (onChatSubmitRef) {
      onChatSubmitRef(submitWithMessage)
    }
  }, [onChatSubmitRef, submitWithMessage])

  const handleToolToggle = useCallback((serverId: string, toolName: string, enabled: boolean) => {
    setEnabledTools(prev => ({
      ...prev,
      [serverId]: {
        ...prev[serverId],
        [toolName]: enabled
      }
    }))
    console.log('Tool toggled:', { serverId, toolName, enabled })
  }, [])

  const handleServerToggle = useCallback((serverId: string, enabled: boolean) => {
    setEnabledServers(prev => ({
      ...prev,
      [serverId]: enabled
    }))
    console.log('Server toggled:', { serverId, enabled })
  }, [])

  // Check messages for API key requests
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      // Check for API key request pattern: REQUEST_API_KEY:{...}
      const apiKeyMatch = lastMessage.content.match(/REQUEST_API_KEY:({[^}]+})/)
      if (apiKeyMatch) {
        try {
          const requestData = JSON.parse(apiKeyMatch[1])
          setApiKeyRequest({
            isOpen: true,
            serverName: requestData.server,
            serverInfo: requestData.info
          })
        } catch (e) {
          console.error('Failed to parse API key request:', e)
        }
      }
    }
  }, [messages])

  // Get video progress store functions
  const { addVideo, updateProgress, completeVideo, failVideo } = useVideoProgressStore()

  // Check messages for video generation markers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    console.log('[VIDEO DEBUG] Checking last message:', {
      hasMessage: !!lastMessage,
      role: lastMessage?.role,
      contentLength: lastMessage?.content?.length,
      containsMarker: lastMessage?.content?.includes('[VIDEO_GENERATION_STARTED]')
    })
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      // Debug: Log message content to check for video markers
      if (lastMessage.content.includes('VIDEO_GENERATION')) {
        console.log('[Chat Interface] Message contains VIDEO_GENERATION. Content preview:', lastMessage.content.substring(0, 500))
      }

      // Check for VIDEO_GENERATION_STARTED pattern
      const videoMatch = lastMessage.content.match(/\[VIDEO_GENERATION_STARTED\]([\s\S]*?)\[\/VIDEO_GENERATION_STARTED\]/)
      if (videoMatch) {
        try {
          const videoData = JSON.parse(videoMatch[1])
          console.log('[Chat Interface] Successfully parsed video generation data:', videoData)

          // Create a new video entry
          const newVideo: GeneratedVideo = {
            id: videoData.id,
            prompt: videoData.prompt,
            url: videoData.url || '',
            duration: videoData.duration,
            aspectRatio: videoData.aspectRatio,
            model: videoData.model,
            status: videoData.status === 'succeeded' ? 'completed' : 'generating',
            createdAt: new Date()
          }

          if (onGeneratedVideosChange) {
            // Check if video already exists
            const existingVideoIndex = generatedVideos.findIndex(v => v.id === newVideo.id)
            if (existingVideoIndex === -1) {
              // Add new video
              console.log('[VIDEO DEBUG] Adding new video and switching tab:', newVideo.id)
              onGeneratedVideosChange([...generatedVideos, newVideo])

              // Add video to progress store
              addVideo(newVideo.id, newVideo.prompt)

              // Switch to video tab when new video generation starts
              if (onVideoGenerationStart) {
                console.log('[VIDEO DEBUG] Calling onVideoGenerationStart')
                onVideoGenerationStart()
              } else {
                console.log('[VIDEO DEBUG] onVideoGenerationStart is not defined!')
              }
            } else if (videoData.status === 'succeeded' && generatedVideos[existingVideoIndex].status === 'generating') {
              // Update existing video with completed status
              const updatedVideos = [...generatedVideos]
              updatedVideos[existingVideoIndex] = newVideo
              onGeneratedVideosChange(updatedVideos)

              // Mark video as complete in progress store
              completeVideo(newVideo.id)
            }
          }

          // If video is generating, start polling
          if (videoData.status !== 'succeeded' && !videoData.url) {
            const pollStatus = async () => {
              try {
                const statusResponse = await fetch(`/api/generate-video?id=${videoData.id}`)
                const status = await statusResponse.json()

                if (status.status === 'succeeded' && status.output) {
                  // Update video with completed URL
                  if (onGeneratedVideosChange) {
                    const updatedVideos = generatedVideos.map(v =>
                      v.id === videoData.id
                        ? { ...v, url: status.output, status: 'completed' as const, thumbnailUrl: status.thumbnailUrl }
                        : v
                    )
                    onGeneratedVideosChange(updatedVideos)
                  }

                  // Mark video as complete in progress store
                  completeVideo(videoData.id)
                } else if (status.status === 'failed') {
                  // Update video with failed status
                  if (onGeneratedVideosChange) {
                    const updatedVideos = generatedVideos.map(v =>
                      v.id === videoData.id
                        ? { ...v, status: 'failed' as const, error: status.error || 'Generation failed' }
                        : v
                    )
                    onGeneratedVideosChange(updatedVideos)
                  }
                  // Mark video as failed in progress store
                  failVideo(videoData.id, status.error || 'Generation failed')
                } else {
                  // Continue polling
                  setTimeout(pollStatus, 5000)
                }
              } catch (error) {
                console.error('Polling error:', error)
              }
            }

            // Start polling after a delay
            setTimeout(pollStatus, 5000)
          }
        } catch (e) {
          console.error('Failed to parse video generation data:', e)
        }
      }
    }
  }, [messages, onGeneratedVideosChange, generatedVideos])

  // Handle editing image from file preview modal
  const handleEditImageFromModal = useCallback((imageUrl: string, imageName: string) => {
    // Create a temporary generated image to add to the gallery
    const tempImage: GeneratedImage = {
      id: generateImageId(),
      prompt: `Edit of ${imageName}`,
      url: imageUrl,
      timestamp: new Date(),
      quality: 'hd',
      model: 'uploaded',
      isGenerating: false
    }

    // Add to generated images
    setGeneratedImages(prev => [...prev, tempImage])
    
    // Notify parent to add to gallery
    if (onGeneratedImagesChange) {
      onGeneratedImagesChange([...generatedImages, tempImage])
    }

    // Switch to Images tab
    if (onImageGenerationStart) {
      onImageGenerationStart()
    }

    // Request auto-open of edit modal after a small delay
    setTimeout(() => {
      if (onEditImageRequested) {
        onEditImageRequested(tempImage.id)
      }
    }, 100)

    toast.success("Image Added to Gallery", {
      description: "Opening edit dialog...",
      duration: 2000
    })
  }, [generatedImages, onGeneratedImagesChange, onImageGenerationStart, onEditImageRequested])

  const handleApiKeySubmit = useCallback((apiKey: string) => {
    // Send the API key back to the assistant
    const maskedKey = apiKey.length > 8
      ? apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4)
      : '•'.repeat(apiKey.length)

    // Create a message with the API key
    const apiKeyMessage = `API_KEY_PROVIDED:${JSON.stringify({
      server: apiKeyRequest.serverName,
      apiKey: apiKey,
      masked: maskedKey
    })}`

    // Send as a new message
    if (originalHandleSubmit) {
      // Create a synthetic form event
      const syntheticEvent = {
        preventDefault: () => {},
        target: {}
      } as React.FormEvent<HTMLFormElement>

      // Temporarily set the input value
      handleInputChange({ target: { value: apiKeyMessage } } as React.ChangeEvent<HTMLInputElement>)

      // Submit the message
      setTimeout(() => {
        originalHandleSubmit(syntheticEvent)
      }, 0)
    }

    // Close the dialog
    setApiKeyRequest({ isOpen: false, serverName: '' })
  }, [apiKeyRequest.serverName, originalHandleSubmit, handleInputChange])

  return (
    <div className="flex flex-col h-full border-r border-[#333333] bg-[#2B2B2B]">
      <div className="p-4 border-b border-[#333333] bg-[#2B2B2B]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageSettings(true)}
            className="text-gray-400 hover:text-white"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500 font-medium">Error: {error.message}</p>
            <p className="text-xs text-red-400 mt-1">The assistant will continue to work in local mode.</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col space-y-4">
          {messages.map((message) => {
            const attachments = messageAttachments[message.id];
            return (
              <ChatMessage
                key={message.id}
                message={{
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  createdAt: message.createdAt,
                  experimental_attachments: attachments,
                  toolCalls: message.toolCalls,
                }}
                mcpToolExecuting={mcpToolExecuting}
                onAnimateImage={onAnimateImage}
                onEditImage={handleEditImageFromModal}
                onImageOptionSelect={handleChatImageOptionSelect}
                onMultiImageOptionSelect={handleMultiImageOptionSelect}
              />
            );
          })}
          {/* Render local messages (for image generation feedback) */}
          {localMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                id: message.id,
                role: message.role as "user" | "assistant" | "system",
                content: message.content,
                createdAt: new Date(),
              }}
              onAnimateImage={onAnimateImage}
              onEditImage={handleEditImageFromModal}
              onImageOptionSelect={handleChatImageOptionSelect}
              onMultiImageOptionSelect={handleMultiImageOptionSelect}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-[#3C3C3C]">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.1s]"
                    />
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"
                    />
                  </div>
                  <span className="text-sm text-[#B0B0B0]">Agent is thinking...</span>
                </div>
              </div>
            </div>
          )}
          {isGeneratingImage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-[#3C3C3C]">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]" />
                  </div>
                  <span className="text-sm text-[#B0B0B0]">
                    Generating image...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-[#333333]">
        <AnimatePresence>
          <UploadProgress
            progress={uploadProgress}
            status={uploadStatus}
            fileName={selectedFile?.file.name}
            fileSize={selectedFile?.file.size}
          />
        </AnimatePresence>
        <div className="p-4 relative">
          <InlineImageOptions
            isVisible={showImageOptions && selectedFile?.file.type.startsWith("image/") && selectedFiles.length === 0}
            onOptionSelect={handleInlineImageOptionSelect}
          />
          <AI_Prompt
            value={input}
            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            onFileSelect={handleFileSelect}
            onFilesSelect={handleFilesSelect}
            selectedFile={selectedFile}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
            onFilesRemove={handleFilesRemove}
            onAllFilesRemove={handleAllFilesRemove}
            onToolToggle={handleToolToggle}
            onServerToggle={handleServerToggle}
          />
        </div>
      </div>


      <SettingsDialog
        open={showImageSettings}
        onOpenChange={handleSettingsClose}
        imageQuality={imageQuality}
        onImageQualityChange={updateImageQuality}
        imageStyle={imageStyle}
        onImageStyleChange={setImageStyle}
        imageSize={imageSize}
        onImageSizeChange={setImageSize}
        videoModel={videoModel}
        onVideoModelChange={setVideoModel}
        videoDuration={videoDuration}
        onVideoDurationChange={setVideoDuration}
        videoAspectRatio={videoAspectRatio}
        onVideoAspectRatioChange={setVideoAspectRatio}
        autoDetectAspectRatio={autoDetectAspectRatio}
        onAutoDetectAspectRatioChange={setAutoDetectAspectRatio}
      />

      <SecureApiKeyInput
        isOpen={apiKeyRequest.isOpen}
        onClose={() => setApiKeyRequest({ isOpen: false, serverName: '' })}
        onSubmit={handleApiKeySubmit}
        serverName={apiKeyRequest.serverName}
        serverInfo={apiKeyRequest.serverInfo}
      />

      <ImageActionDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, action: null, imageName: '' })}
        onConfirm={actionDialog.action === 'edit' ? handleEditConfirm : handleAnimateConfirm}
        action={actionDialog.action || 'edit'}
        imageName={actionDialog.imageName}
      />
    </div>
  )
}
