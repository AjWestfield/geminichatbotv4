import { GeneratedVideo } from "./video-generation-types"

const VIDEO_STORAGE_KEY = 'gemini-chat-videos'
const MAX_STORAGE_SIZE = 50 * 1024 * 1024 // 50MB limit

export interface StoredVideo extends GeneratedVideo {
  chatId?: string
  messageId?: string
}

// Save videos to localStorage
export function saveVideosToLocalStorage(videos: StoredVideo[]): boolean {
  try {
    const videosJson = JSON.stringify(videos)
    
    // Check storage size
    if (videosJson.length > MAX_STORAGE_SIZE) {
      console.warn('Video storage size exceeds limit, removing oldest videos')
      // Remove oldest videos until under limit
      const sortedVideos = [...videos].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      let reducedVideos = sortedVideos
      while (JSON.stringify(reducedVideos).length > MAX_STORAGE_SIZE && reducedVideos.length > 0) {
        reducedVideos = reducedVideos.slice(1)
      }
      
      localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(reducedVideos))
    } else {
      localStorage.setItem(VIDEO_STORAGE_KEY, videosJson)
    }
    
    return true
  } catch (error) {
    console.error('Failed to save videos to localStorage:', error)
    return false
  }
}

// Load videos from localStorage
export function loadVideosFromLocalStorage(): StoredVideo[] {
  try {
    const videosJson = localStorage.getItem(VIDEO_STORAGE_KEY)
    if (!videosJson) return []
    
    const videos = JSON.parse(videosJson)
    // Convert date strings back to Date objects
    return videos.map((video: any) => ({
      ...video,
      createdAt: new Date(video.createdAt),
      completedAt: video.completedAt ? new Date(video.completedAt) : undefined
    }))
  } catch (error) {
    console.error('Failed to load videos from localStorage:', error)
    return []
  }
}

// Add a video to localStorage
export function addVideoToLocalStorage(video: StoredVideo): boolean {
  const existingVideos = loadVideosFromLocalStorage()
  
  // Check if video already exists
  const videoIndex = existingVideos.findIndex(v => v.id === video.id)
  
  if (videoIndex >= 0) {
    // Update existing video
    existingVideos[videoIndex] = video
  } else {
    // Add new video
    existingVideos.push(video)
  }
  
  return saveVideosToLocalStorage(existingVideos)
}

// Remove a video from localStorage
export function removeVideoFromLocalStorage(videoId: string): boolean {
  const existingVideos = loadVideosFromLocalStorage()
  const filteredVideos = existingVideos.filter(v => v.id !== videoId)
  return saveVideosToLocalStorage(filteredVideos)
}

// Get videos for a specific chat
export function getVideosForChat(chatId: string): StoredVideo[] {
  const allVideos = loadVideosFromLocalStorage()
  return allVideos.filter(video => video.chatId === chatId)
}

// Clear all videos
export function clearVideoStorage(): boolean {
  try {
    localStorage.removeItem(VIDEO_STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear video storage:', error)
    return false
  }
}

// Get storage info
export function getVideoStorageInfo(): { count: number; sizeBytes: number; sizeMB: number } {
  try {
    const videosJson = localStorage.getItem(VIDEO_STORAGE_KEY) || '[]'
    const videos = JSON.parse(videosJson)
    const sizeBytes = new Blob([videosJson]).size
    
    return {
      count: videos.length,
      sizeBytes,
      sizeMB: Math.round(sizeBytes / (1024 * 1024) * 100) / 100
    }
  } catch (error) {
    return { count: 0, sizeBytes: 0, sizeMB: 0 }
  }
}