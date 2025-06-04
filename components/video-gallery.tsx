"use client"

import { GeneratedVideo } from "@/lib/video-generation-types"
import { Play, Download, Loader2, X, Video as VideoIcon, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VideoPlayerModal } from "./video-player-modal"
import { VideoLoadingCard } from "./video-loading-card"

interface VideoGalleryProps {
  videos: GeneratedVideo[]
  onVideoClick?: (video: GeneratedVideo) => void
  onVideoDelete?: (videoId: string) => void
  onCancelVideo?: (videoId: string) => void
  className?: string
}

export function VideoGallery({ videos, onVideoClick, onVideoDelete, onCancelVideo, className }: VideoGalleryProps) {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null)

  // Organize videos by status
  const organizedVideos = useMemo(() => {
    const generating = videos.filter(v => v.status === 'generating')
    const completed = videos.filter(v => v.status === 'completed')
    const failed = videos.filter(v => v.status === 'failed')

    return { generating, completed, failed }
  }, [videos])

  const handleDownload = async (video: GeneratedVideo, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(video.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video-${video.id}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  const renderVideoCard = (video: GeneratedVideo) => {
    return (
      <div
        key={video.id}
        className="relative group cursor-pointer"
        onMouseEnter={() => setHoveredVideo(video.id)}
        onMouseLeave={() => setHoveredVideo(null)}
      >
        {video.status === 'generating' ? (
          <VideoLoadingCard
            video={video}
            onCancel={onCancelVideo}
            showCancel={!!onCancelVideo}
          />
        ) : video.status === 'failed' ? (
          <div className="aspect-video bg-red-900/20 rounded-lg flex flex-col items-center justify-center border border-red-800/50 relative group">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-red-400 font-medium">Generation failed</p>
            {video.error && (
              <p className="text-xs text-red-300 mt-1 px-4 text-center">{video.error}</p>
            )}

            {/* Delete button for failed videos */}
            {onVideoDelete && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-6 w-6 bg-black/60 hover:bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onVideoDelete(video.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <div
            className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
            onClick={() => {
              if (onVideoClick) {
                onVideoClick(video)
              } else {
                setSelectedVideo(video)
              }
            }}
          >
            <video
              src={video.url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              {...(hoveredVideo === video.id && { autoPlay: true })}
            />

            {/* Thumbnail overlay for when not hovering */}
            {hoveredVideo !== video.id && video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.prompt}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="h-12 w-12 text-white drop-shadow-lg" />
            </div>

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-black/60 hover:bg-black/80"
                onClick={(e) => handleDownload(video, e)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {onVideoDelete && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-black/60 hover:bg-black/80"
                  onClick={(e) => {
                    e.stopPropagation()
                    onVideoDelete(video.id)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Video info */}
        <div className="mt-2">
          <p className="text-sm text-gray-300 truncate" title={video.prompt}>
            {video.prompt}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {video.duration}s • {video.aspectRatio}
            </span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              video.model === 'pro'
                ? "bg-purple-500/20 text-purple-300"
                : "bg-blue-500/20 text-blue-300"
            )}>
              {video.model === 'pro' ? 'Pro' : 'Standard'}
            </span>
            {video.sourceImage && (
              <span className="text-xs text-gray-500">• From image</span>
            )}
            {video.status === 'completed' && video.finalElapsedTime && (
              <span className="text-xs text-green-400">
                • Generated in {Math.floor(video.finalElapsedTime / 60)}:{(video.finalElapsedTime % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSectionHeader = (title: string, count: number, icon: React.ReactNode, description?: string) => {
    if (count === 0) return null

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="text-lg font-semibold text-white">
            {title} ({count})
          </h3>
        </div>
        {description && (
          <p className="text-sm text-gray-400 mb-3">{description}</p>
        )}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[#2B2B2B] flex items-center justify-center mb-6">
            <VideoIcon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Video Generation</h3>
          <p className="text-[#B0B0B0] max-w-md">
            Generate videos from text prompts or animate your images. Try "Generate a video of..." or click Animate on any image.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-6 space-y-8", className)}>
      {/* Generating Videos Section */}
      {organizedVideos.generating.length > 0 && (
        <div>
          {renderSectionHeader(
            "Generating",
            organizedVideos.generating.length,
            <Clock className="h-5 w-5 text-blue-400" />,
            "Videos currently being generated. This typically takes 2-8 minutes."
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizedVideos.generating.map(renderVideoCard)}
          </div>
        </div>
      )}

      {/* Completed Videos Section */}
      {organizedVideos.completed.length > 0 && (
        <div>
          {renderSectionHeader(
            "Completed",
            organizedVideos.completed.length,
            <CheckCircle className="h-5 w-5 text-green-400" />,
            "Successfully generated videos ready to view and download."
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizedVideos.completed.map(renderVideoCard)}
          </div>
        </div>
      )}

      {/* Failed Videos Section */}
      {organizedVideos.failed.length > 0 && (
        <div>
          {renderSectionHeader(
            "Failed",
            organizedVideos.failed.length,
            <AlertCircle className="h-5 w-5 text-red-400" />,
            "Videos that failed to generate. You can delete these or try generating again."
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizedVideos.failed.map(renderVideoCard)}
          </div>
        </div>
      )}

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  )
}
