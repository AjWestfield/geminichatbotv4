"use client"

import type React from "react"
import { useChat } from "ai/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ChatMessage from "./chat-message"
import { AI_Prompt } from "@/components/ui/animated-ai-input"
import { useState, useCallback, useRef, useEffect } from "react"
import AgentTaskView from "./agent-task-view"

interface FileUpload {
  file: File
  preview?: string
  geminiFile?: {
    uri: string
    mimeType: string
    name: string
  }
}

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-preview-05-20")
  const [showAgentTasks, setShowAgentTasks] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Store object URLs for cleanup
  const objectURLsRef = useRef<Set<string>>(new Set())

  // Store file attachments for each message
  const [messageAttachments, setMessageAttachments] = useState<Record<string, {
    name: string
    contentType: string
    url?: string
  }[]>>({})
  
  // Track pending attachment for the next message
  const pendingAttachmentRef = useRef<{
    name: string
    contentType: string
    url?: string
  } | null>(null)

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, stop, append } = useChat({
    api: "/api/chat",
    body: {
      model: selectedModel,
      fileUri: selectedFile?.geminiFile?.uri,
      fileMimeType: selectedFile?.geminiFile?.mimeType,
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
      for (const url of objectURLsRef.current) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    
    try {
      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file)
        objectURLsRef.current.add(preview)
      }
      
      // Upload to Gemini
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to upload file")
      }
      
      const data = await response.json()
      
      setSelectedFile({
        file,
        preview,
        geminiFile: data.file,
      })
    } catch (error) {
      console.error("File upload error:", error)
      alert("Failed to upload file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [])
  
  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    pendingAttachmentRef.current = null
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
          url: selectedFile.preview || ''
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

      <div className="p-4 border-t border-[#333333]">
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

      {showAgentTasks && (
        <div className="absolute inset-0 z-50">
          <AgentTaskView isVisible={showAgentTasks} onClose={() => setShowAgentTasks(false)} />
        </div>
      )}
    </div>
  )
}