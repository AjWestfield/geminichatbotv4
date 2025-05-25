"use client"

import type React from "react"
import { useChat } from "ai/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ChatMessage from "./chat-message"
import { AI_Prompt } from "@/components/ui/animated-ai-input"
import { useState, useCallback, useRef, useEffect } from "react"
import AgentTaskView from "./agent-task-view"
import { UploadProgress } from "./upload-progress"
import { AnimatePresence } from "framer-motion"
import { generateVideoThumbnail, getVideoDuration } from "@/lib/video-utils"

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
    segments?: any[] // For detailed timing info
  }
  videoThumbnail?: string // Add this for video thumbnail
  videoDuration?: number // Add this for video duration
}

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-preview-05-20")
  const [showAgentTasks, setShowAgentTasks] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'complete' | 'error'>('idle')
  
  // Store object URLs for cleanup
  const objectURLsRef = useRef<Set<string>>(new Set())

  // Store file attachments for each message
  const [messageAttachments, setMessageAttachments] = useState<Record<string, {
    name: string
    contentType: string
    url?: string
    transcription?: {
      text: string
      language?: string
      duration?: number
      segments?: any[]
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
      segments?: any[]
    }
    videoThumbnail?: string // Add this
    videoDuration?: number // Add this
  } | null>(null)

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, stop, append } = useChat({
    api: "/api/chat",
    body: {
      model: selectedModel,
      fileUri: selectedFile?.geminiFile?.uri,
      fileMimeType: selectedFile?.geminiFile?.mimeType,
      transcription: selectedFile?.transcription, // Include transcription data
    },
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content: "Hello! I'm your AI assistant powered by Gemini. How can I help you today?",
      },
    ],
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Watch for new messages and attach pending files
  useEffect(() => {
    if (messages.length > 0 && pendingAttachmentRef.current) {
      const lastMessage = messages[messages.length - 1]
      
      // Check if this is a new user message without attachments
      if (lastMessage.role === 'user' && !messageAttachments[lastMessage.id] && pendingAttachmentRef.current) {
        console.log('Attaching file to message:', lastMessage.id, pendingAttachmentRef.current)
        
        const attachment = pendingAttachmentRef.current
        setMessageAttachments(prev => ({
          ...prev,
          [lastMessage.id]: [attachment]
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

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')
    
    try {
      // Create preview for images, audio, and video files
      let preview: string | undefined
      let videoThumbnail: string | undefined
      let videoDuration: number | undefined
      
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file)
        objectURLsRef.current.add(preview)
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
            const errorData = await transcribeResponse.json()
            console.error('Transcription failed:', errorData)
            // Show user-friendly error but continue
            if (errorData.details?.includes("25MB")) {
              console.warn('File too large for transcription')
              // You might want to show a toast notification here
            }
          }
        } catch (transcribeError) {
          console.error("Transcription error:", transcribeError)
          // Continue without transcription
        }
      }
      
      setSelectedFile({
        file,
        preview,
        geminiFile: data.file,
        transcription,
        videoThumbnail,
        videoDuration,
      })
      
      setUploadStatus('complete')
      // Hide success message after 2 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 2000)
      
    } catch (error) {
      console.error("File upload error:", error)
      setUploadStatus('error')
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 3000)
    } finally {
      setIsUploading(false)
    }
  }, [])
  
  const handleFileRemove = useCallback(() => {
    // Don't revoke the URL immediately as it might still be needed
    setSelectedFile(null)
    pendingAttachmentRef.current = null
    setUploadStatus('idle')
    setUploadProgress(0)
  }, [])
  
  const handleSubmit = useCallback(() => {
    if (input.trim() || selectedFile) {
      // For demo purposes, show the agent task view when submitting a message
      if (input.toLowerCase().includes("agent") || input.toLowerCase().includes("task")) {
        setShowAgentTasks(true)
      }
      
      // Store the attachment info before submission
      if (selectedFile) {
        pendingAttachmentRef.current = {
          name: selectedFile.file.name,
          contentType: selectedFile.file.type,
          url: selectedFile.preview || '',
          transcription: selectedFile.transcription,
          videoThumbnail: selectedFile.videoThumbnail, // Add this
          videoDuration: selectedFile.videoDuration, // Add this
        }
        console.log('Pending attachment set:', pendingAttachmentRef.current)
      }
      
      originalHandleSubmit()
      
      // Clear file after submission
      setSelectedFile(null)
    }
  }, [input, selectedFile, originalHandleSubmit])

  return (
    <div className="flex flex-col h-full border-r border-[#333333] bg-[#2B2B2B]">
      <div className="p-4 border-b border-[#333333] bg-[#2B2B2B]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
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
                  experimental_attachments: attachments
                }} 
              />
            );
          })}
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
                  <span className="text-sm text-[#B0B0B0]">Gemini is thinking...</span>
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
        <div className="p-4">
          <AI_Prompt
            value={input}
            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onFileRemove={handleFileRemove}
          />
        </div>
      </div>

      {showAgentTasks && (
        <div className="absolute inset-0 z-50">
          <AgentTaskView isVisible={showAgentTasks} onClose={() => setShowAgentTasks(false)} />
        </div>
      )}
    </div>
  )
}