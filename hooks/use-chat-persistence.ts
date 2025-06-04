import { useState, useEffect, useCallback } from 'react'
import { ChatSummary, Chat, Message as DBMessage } from '@/lib/database/supabase'
import { GeneratedImage } from '@/lib/image-utils'
import { GeneratedVideo } from '@/lib/video-generation-types'
import { Message } from 'ai'

export function useChatPersistence(initialChatId?: string) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null)
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all chats for sidebar
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      setChats(data.chats)
    } catch (error) {
      console.error('Error fetching chats:', error)
      setError('Failed to load chat history')
    }
  }, [])

  // Create a new chat
  const createNewChat = useCallback(async (title: string, model: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model }),
      })
      
      if (!response.ok) throw new Error('Failed to create chat')
      
      const data = await response.json()
      setCurrentChatId(data.chat.id)
      await fetchChats() // Refresh chat list
      return data.chat
    } catch (error) {
      console.error('Error creating chat:', error)
      setError('Failed to create new chat')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchChats])

  // Save a message
  const saveMessage = useCallback(async (
    chatId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    attachments?: any[]
  ) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, attachments }),
      })
      
      if (!response.ok) throw new Error('Failed to save message')
      
      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error saving message:', error)
      return null
    }
  }, [])

  // Save messages from the chat interface
  const saveMessages = useCallback(async (messages: Message[], model: string) => {
    if (messages.length === 0) return

    try {
      // Create a new chat if we don't have one
      let chatId = currentChatId
      if (!chatId) {
        // Generate title from first user message
        const firstUserMessage = messages.find(m => m.role === 'user')
        const title = firstUserMessage?.content.slice(0, 50) || 'New Chat'
        
        const chat = await createNewChat(title, model)
        if (!chat) return
        chatId = chat.id
      }

      // Save all messages
      for (const message of messages) {
        // Skip welcome message
        if (message.id === 'welcome-message') continue
        
        await saveMessage(
          chatId,
          message.role as 'user' | 'assistant' | 'system',
          message.content
        )
      }
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }, [currentChatId, createNewChat, saveMessage])

  // Save an image
  const saveImage = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          chatId: currentChatId,
        }),
      })
      
      // Don't throw error for persistence failures - just return null
      if (!response.ok) {
        // Only log non-persistence errors
        if (response.status !== 500) {
          console.warn('Failed to save image:', response.status)
        }
        return null
      }
      
      const data = await response.json()
      return data.image
    } catch (error) {
      // Silently fail for persistence errors
      return null
    }
  }, [currentChatId])

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete chat')
      
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }
      
      await fetchChats() // Refresh chat list
      return true
    } catch (error) {
      console.error('Error deleting chat:', error)
      setError('Failed to delete chat')
      return false
    }
  }, [currentChatId, fetchChats])

  // Update chat title
  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (!response.ok) throw new Error('Failed to update chat')
      
      await fetchChats() // Refresh chat list
      return true
    } catch (error) {
      console.error('Error updating chat:', error)
      return false
    }
  }, [fetchChats])

  // Load a specific chat
  const loadChat = useCallback(async (chatId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      if (!response.ok) throw new Error('Failed to load chat')
      
      const data = await response.json()
      setCurrentChatId(chatId)
      return data
    } catch (error) {
      console.error('Error loading chat:', error)
      setError('Failed to load chat')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search chats
  const searchChats = useCallback(async (query: string) => {
    try {
      const response = await fetch(`/api/chats?search=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search chats')
      
      const data = await response.json()
      return data.chats
    } catch (error) {
      console.error('Error searching chats:', error)
      return []
    }
  }, [])

  // Load all images from database
  const loadAllImages = useCallback(async () => {
    try {
      const response = await fetch('/api/images?limit=100')
      if (!response.ok) throw new Error('Failed to load images')
      
      const data = await response.json()
      console.log('[PERSISTENCE] Raw API response:', {
        total: data.images?.length || 0,
        sample: data.images?.[0],
        hasOriginalImageId: data.images?.filter((img: any) => img.original_image_id).length || 0
      })
      
      // Convert stored images to GeneratedImage format
      const mapped = data.images.map((img: any) => ({
        id: img.metadata?.localId || img.id,
        url: img.url,
        prompt: img.prompt,
        revisedPrompt: img.revised_prompt,
        timestamp: new Date(img.created_at),
        quality: img.quality,
        style: img.style,
        size: img.size,
        model: img.model,
        isUploaded: img.is_uploaded,
        originalImageId: img.original_image_id || img.metadata?.originalImageId, // Check both fields
        geminiUri: img.metadata?.geminiUri, // Restore Gemini URI for uploaded images
      }))
      
      console.log('[PERSISTENCE] Mapped images:', {
        total: mapped.length,
        edited: mapped.filter((img: any) => img.originalImageId).length,
        sample: mapped.filter((img: any) => img.originalImageId)[0]
      })
      
      return mapped
    } catch (error) {
      console.error('Error loading all images:', error)
      return []
    }
  }, [])

  // Save a video
  const saveVideo = useCallback(async (video: GeneratedVideo) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video,
          chatId: currentChatId,
        }),
      })
      
      // Don't throw error for persistence failures - just return null
      if (!response.ok) {
        // Only log non-persistence errors
        if (response.status !== 500) {
          console.warn('Failed to save video:', response.status)
        }
        return null
      }
      
      const data = await response.json()
      return data.video
    } catch (error) {
      // Silently fail for persistence errors
      return null
    }
  }, [currentChatId])

  // Load all videos from database
  const loadAllVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos?limit=100')
      if (!response.ok) throw new Error('Failed to load videos')
      
      const data = await response.json()
      // Convert stored videos to GeneratedVideo format
      return data.videos.map((vid: any) => ({
        id: vid.metadata?.localId || vid.id,
        url: vid.url,
        thumbnailUrl: vid.thumbnail_url,
        prompt: vid.prompt,
        duration: vid.duration,
        aspectRatio: vid.aspect_ratio,
        model: vid.model,
        sourceImage: vid.source_image_url,
        status: vid.status,
        createdAt: new Date(vid.created_at),
        completedAt: vid.completed_at ? new Date(vid.completed_at) : undefined,
        finalElapsedTime: vid.final_elapsed_time,
        error: vid.error_message,
      }))
    } catch (error) {
      console.error('Error loading all videos:', error)
      return []
    }
  }, [])

  // Load chats on mount
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  return {
    currentChatId,
    setCurrentChatId,
    chats,
    isLoading,
    error,
    createNewChat,
    saveMessage,
    saveMessages,
    saveImage,
    saveVideo,
    deleteChat,
    updateChatTitle,
    loadChat,
    searchChats,
    refreshChats: fetchChats,
    loadAllImages,
    loadAllVideos,
  }
}