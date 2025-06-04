import { supabase, isPersistenceConfigured, Chat, Message, StoredImage, StoredVideo, ChatSummary } from '@/lib/database/supabase'
import { uploadImageToBlob } from '@/lib/storage/blob-storage'
import { GeneratedImage } from '@/lib/image-utils'
import { GeneratedVideo } from '@/lib/video-generation-types'

// Create a new chat
export async function createChat(title: string, model: string): Promise<Chat | null> {
  if (!isPersistenceConfigured() || !supabase) {
    console.log('Persistence not configured - chat creation skipped')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        title,
        model,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    // Only log if it's not a connection error (which is expected when not configured)
    if (!error.message?.includes('fetch failed')) {
      console.error('Error creating chat:', error)
    }
    return null
  }
}

// Get all chats (for sidebar)
export async function getChats(limit = 50): Promise<ChatSummary[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('chat_summaries')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error (which is expected when not configured)
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching chats:', error)
    }
    return []
  }
}

// Get a single chat with messages
export async function getChat(chatId: string): Promise<{ chat: Chat; messages: Message[] } | null> {
  if (!isPersistenceConfigured() || !supabase) {
    return null
  }

  try {
    // Get chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (chatError) throw chatError

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    return { chat, messages: messages || [] }
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching chat:', error)
    }
    return null
  }
}

// Add a message to a chat
export async function addMessage(
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  attachments?: any[]
): Promise<Message | null> {
  if (!isPersistenceConfigured() || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role,
        content,
        attachments: attachments || [],
      })
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    return data
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error adding message:', error)
    }
    return null
  }
}

// Update chat title
export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
  if (!isPersistenceConfigured() || !supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)

    if (error) throw error
    return true
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error updating chat title:', error)
    }
    return false
  }
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<boolean> {
  if (!isPersistenceConfigured() || !supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (error) throw error
    return true
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error deleting chat:', error)
    }
    return false
  }
}

// Save image to database and blob storage
export async function saveImage(
  image: GeneratedImage,
  chatId?: string,
  messageId?: string
): Promise<StoredImage | null> {
  if (!isPersistenceConfigured() || !supabase) {
    console.log('[SAVE IMAGE] Persistence not configured')
    return null
  }
  
  console.log('[SAVE IMAGE] Starting save for image:', {
    id: image.id,
    model: image.model,
    isUploaded: image.isUploaded,
    prompt: image.prompt,
    urlType: image.url.startsWith('data:') ? 'data URL' : 'external URL',
    chatId: chatId
  })
  
  try {
    // Upload to blob storage first
    const extension = image.isUploaded ? 'png' : 'png' // Keep as PNG for uploaded images
    const filename = `${image.id}-${Date.now()}.${extension}`
    console.log('[SAVE IMAGE] Uploading to blob storage with filename:', filename)
    console.log('[SAVE IMAGE] Image type:', image.isUploaded ? 'uploaded' : 'generated')
    const blobUrl = await uploadImageToBlob(image.url, filename)
    console.log('[SAVE IMAGE] Blob storage upload result:', blobUrl)

    // Save to database
    const insertData: any = {
      chat_id: chatId,
      message_id: messageId,
      url: blobUrl,
      prompt: image.prompt,
      revised_prompt: image.revisedPrompt,
      quality: image.quality,
      style: image.style,
      size: image.size,
      model: image.model,
      is_uploaded: image.isUploaded || false,
      metadata: {
        localId: image.id,
        timestamp: image.timestamp,
        geminiUri: image.geminiUri, // Preserve Gemini URI for uploaded images
        originalImageId: image.originalImageId, // Store in metadata as backup
      },
    }
    
    // Only include original_image_id if it's a valid UUID or the column accepts TEXT
    // This is a temporary workaround for the UUID type issue
    if (image.originalImageId) {
      // Check if it looks like a UUID (basic check)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(image.originalImageId)
      if (isUUID) {
        insertData.original_image_id = image.originalImageId
      } else {
        // For local IDs, skip the field but store in metadata
        console.log('[SAVE IMAGE] Skipping original_image_id field for local ID:', image.originalImageId)
      }
    }
    
    console.log('[SAVE IMAGE] Inserting to database:', insertData)
    
    const { data, error } = await supabase
      .from('images')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[SAVE IMAGE] Database insert error:', error)
      throw error
    }
    
    console.log('[SAVE IMAGE] Successfully saved to database:', data)
    return data
  } catch (error: any) {
    // Log all errors for debugging
    console.error('[SAVE IMAGE] Error saving image:', error)
    console.error('[SAVE IMAGE] Error details:', {
      message: error.message || 'Unknown error',
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return null
  }
}

// Get images for a chat
export async function getChatImages(chatId: string): Promise<StoredImage[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching chat images:', error)
    }
    return []
  }
}

// Get all images (for gallery)
export async function getAllImages(limit = 100): Promise<StoredImage[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching all images:', error)
    }
    return []
  }
}

// Delete an image
export async function deleteImage(imageId: string): Promise<boolean> {
  if (!isPersistenceConfigured() || !supabase) {
    console.log('[DELETE IMAGE] Persistence not configured')
    return false
  }

  try {
    console.log('[DELETE IMAGE] Attempting to delete image:', imageId)
    
    // Check if the imageId is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)
    
    let image: any = null
    let fetchError: any = null
    
    if (isUUID) {
      // Try to find by UUID
      const result = await supabase
        .from('images')
        .select('id, url')
        .eq('id', imageId)
        .single()
      
      image = result.data
      fetchError = result.error
    } else {
      // Skip UUID search and force metadata search for non-UUID IDs
      fetchError = { code: 'PGRST116' } // Simulate not found error
    }

    // If not found by UUID, try to find by local ID in metadata
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('[DELETE IMAGE] Not found by UUID, trying by local ID in metadata')
      const { data: images, error: searchError } = await supabase
        .from('images')
        .select('id, url, metadata')
        .eq('metadata->>localId', imageId)
        .limit(1)
      
      if (searchError) throw searchError
      
      if (images && images.length > 0) {
        image = images[0]
        console.log('[DELETE IMAGE] Found image by local ID, database ID:', image.id)
      } else {
        throw new Error('Image not found')
      }
    } else if (fetchError) {
      throw fetchError
    }

    if (!image) {
      console.error('[DELETE IMAGE] Image not found:', imageId)
      return false
    }

    // Delete from database using the actual database ID
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', image.id)

    if (error) throw error

    console.log('[DELETE IMAGE] Successfully deleted from database:', image.id)

    // Delete from blob storage (fire and forget)
    if (image.url) {
      import('@/lib/storage/blob-storage').then(({ deleteImageFromBlob }) => {
        deleteImageFromBlob(image.url).catch(err => 
          console.error('[DELETE IMAGE] Failed to delete from blob storage:', err)
        )
      })
    }

    return true
  } catch (error: any) {
    console.error('[DELETE IMAGE] Error deleting image:', error)
    return false
  }
}

// Search chats
export async function searchChats(query: string): Promise<ChatSummary[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('chat_summaries')
      .select('*')
      .or(`title.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error searching chats:', error)
    }
    return []
  }
}

// Save video to database
export async function saveVideo(
  video: GeneratedVideo,
  chatId?: string,
  messageId?: string
): Promise<StoredVideo | null> {
  if (!isPersistenceConfigured() || !supabase) {
    console.log('[SAVE VIDEO] Persistence not configured')
    return null
  }
  
  console.log('[SAVE VIDEO] Starting save for video:', {
    id: video.id,
    model: video.model,
    status: video.status,
    prompt: video.prompt,
    duration: video.duration,
    chatId: chatId
  })
  
  try {
    // Calculate final elapsed time if completed
    let finalElapsedTime: number | undefined
    if (video.status === 'completed' && video.createdAt && video.completedAt) {
      // Ensure dates are Date objects
      const createdAt = video.createdAt instanceof Date ? video.createdAt : new Date(video.createdAt)
      const completedAt = video.completedAt instanceof Date ? video.completedAt : new Date(video.completedAt)
      finalElapsedTime = Math.floor((completedAt.getTime() - createdAt.getTime()) / 1000)
    }

    // Save to database
    const insertData = {
      chat_id: chatId,
      message_id: messageId,
      url: video.url,
      thumbnail_url: video.thumbnailUrl,
      prompt: video.prompt,
      duration: video.duration,
      aspect_ratio: video.aspectRatio,
      model: video.model,
      source_image_url: video.sourceImage,
      status: video.status,
      final_elapsed_time: finalElapsedTime || video.finalElapsedTime,
      error_message: video.error,
      completed_at: video.completedAt ? 
        (video.completedAt instanceof Date ? video.completedAt.toISOString() : new Date(video.completedAt).toISOString()) : 
        undefined,
      metadata: {
        localId: video.id,
        timestamp: video.createdAt,
      },
    }
    
    console.log('[SAVE VIDEO] Inserting to database:', insertData)
    
    const { data, error } = await supabase
      .from('videos')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[SAVE VIDEO] Database insert error:', error)
      throw error
    }
    
    console.log('[SAVE VIDEO] Successfully saved to database:', data)
    return data
  } catch (error: any) {
    // Log all errors for debugging
    console.error('[SAVE VIDEO] Error saving video:', error)
    console.error('[SAVE VIDEO] Error details:', {
      message: error.message || 'Unknown error',
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return null
  }
}

// Get videos for a chat
export async function getChatVideos(chatId: string): Promise<StoredVideo[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching chat videos:', error)
    }
    return []
  }
}

// Get all videos (for gallery)
export async function getAllVideos(limit = 100): Promise<StoredVideo[]> {
  if (!isPersistenceConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error fetching all videos:', error)
    }
    return []
  }
}

// Delete a video
export async function deleteVideo(videoId: string): Promise<boolean> {
  if (!isPersistenceConfigured() || !supabase) {
    return false
  }

  try {
    // Get video URL first for cleanup
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('url')
      .eq('id', videoId)
      .single()

    if (fetchError) throw fetchError

    // Delete from database
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (error) throw error

    // Note: Videos are typically hosted on external services (like Replicate)
    // so we don't need to delete from blob storage like we do with images

    return true
  } catch (error: any) {
    // Only log if it's not a connection error
    if (!error.message?.includes('fetch failed')) {
      console.error('Error deleting video:', error)
    }
    return false
  }
}