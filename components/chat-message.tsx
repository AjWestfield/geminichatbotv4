import { cn, formatDuration, getFileExtension, formatVideoDuration } from "@/lib/utils"
import { FileAudio, Image as ImageIcon, Video } from "lucide-react"
import { useState, useMemo } from "react"
import { FilePreviewModal } from "./file-preview-modal"
import { MCPToolAnimation } from "./mcp-tool-animation"
import { MCPToolResult } from "./mcp-tool-result"
import { AnimatePresence } from "framer-motion"
import AgentPlan, { Task } from "@/components/ui/agent-plan"
import { VideoGenerationProgress } from "./video-generation-progress"
import { ImageOptionsCard } from "./image-options-card"
import { InlineImageOptions } from "./inline-image-options"

interface MessageAttachment {
  name: string
  contentType: string
  url?: string
  transcription?: {
    text: string
    language?: string
    duration?: number
    segments?: any[]
  }
  videoThumbnail?: string
  videoDuration?: number
  additionalFiles?: {
    name: string
    contentType: string
    url?: string
    transcription?: {
      text: string
      language?: string
      duration?: number
      segments?: any[]
    }
    videoThumbnail?: string
    videoDuration?: number
  }[]
}

interface MCPToolCall {
  id: string
  tool: string
  server: string
  status: 'executing' | 'completed' | 'failed'
  result?: any
  error?: string
  isExpanded: boolean
  timestamp: number
  duration?: number
}

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system" | "function" | "data" | "tool"
    content: string
    createdAt?: Date
    experimental_attachments?: MessageAttachment[]
    toolCalls?: MCPToolCall[]
    agentPlan?: {
      tasks: Task[]
      onTaskUpdate?: (taskId: string, status: string) => void
      onSubtaskUpdate?: (taskId: string, subtaskId: string, status: string) => void
    }
  }
  mcpToolExecuting?: {
    messageId: string
    toolName: string
    serverName: string
    startTime: number
  } | null
  onAnimateImage?: (imageUrl: string, imageName: string) => void
  onEditImage?: (imageUrl: string, imageName: string) => void
  onImageOptionSelect?: (optionId: string, imageUri: string) => void
  onMultiImageOptionSelect?: (option: 'analyze' | 'edit' | 'animate', attachment: MessageAttachment) => void
}

// Function to detect and extract agent plan from content
function extractAgentPlan(content: string): { tasks: Task[], cleanContent: string } | null {
  // Look for markers that indicate an agent plan
  const planMarkers = [
    /\[AGENT_PLAN\]([\s\S]*?)\[\/AGENT_PLAN\]/,
    /📋\s*(?:Task List|Plan|Workflow):\s*\n((?:[-•*]\s*.+\n?)+)/i,
    /(?:I'll|Let me)\s+(?:create|break down|organize)\s+(?:this|the)\s+(?:task|work|project)\s+into\s+(?:steps|tasks):\s*\n((?:\d+\.\s*.+\n?)+)/i
  ]
  
  for (const marker of planMarkers) {
    const match = content.match(marker)
    if (match) {
      const planText = match[1]
      const tasks: Task[] = []
      
      // Extract task lines
      const taskLines = planText.split('\n').filter(line => line.trim())
      taskLines.forEach((line, index) => {
        // Remove bullet points, numbers, etc.
        const cleanLine = line.replace(/^[-•*\d]+\.\s*/, '').trim()
        if (cleanLine) {
          tasks.push({
            id: `task-${index + 1}`,
            title: cleanLine,
            description: '',
            status: 'pending',
            priority: index === 0 ? 'high' : 'medium',
            level: 0,
            dependencies: index > 0 ? [`task-${index}`] : [],
            subtasks: []
          })
        }
      })
      
      if (tasks.length > 0) {
        // Remove the plan from content
        const cleanContent = content.replace(match[0], '').trim()
        return { tasks, cleanContent }
      }
    }
  }
  
  return null
}



// Simple markdown parser for bold text and line breaks
function parseSimpleMarkdown(text: string) {
  // Split by double asterisks to handle bold text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove asterisks and make bold
      const boldText = part.slice(2, -2)
      return <strong key={index} className="font-semibold">{boldText}</strong>
    }
    
    // Handle line breaks
    const lines = part.split('\n')
    return lines.map((line, lineIndex) => (
      <span key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    ))
  })
}

export default function ChatMessage({ message, mcpToolExecuting, onAnimateImage, onEditImage, onImageOptionSelect, onMultiImageOptionSelect }: ChatMessageProps) {
  const isUser = message.role === "user"
  const attachments = message.experimental_attachments
  const [selectedFile, setSelectedFile] = useState<MessageAttachment | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [showOptionsForAttachment, setShowOptionsForAttachment] = useState<string | null>(null)
  
  // Extract video generation data from message
  const videoData = useMemo(() => {
    if (!isUser && message.content) {
      const videoMatch = message.content.match(/\[VIDEO_GENERATION_STARTED\]([\s\S]*?)\[\/VIDEO_GENERATION_STARTED\]/)
      if (videoMatch) {
        try {
          return JSON.parse(videoMatch[1])
        } catch (e) {
          console.error('Failed to parse video generation data:', e)
        }
      }
    }
    return null
  }, [message, isUser])
  
  // Extract image options from message
  const imageOptions = useMemo(() => {
    if (!isUser && message.content) {
      console.log('[ChatMessage] Checking for IMAGE_OPTIONS in message:', message.id)
      const optionsMatch = message.content.match(/\[IMAGE_OPTIONS\]([\s\S]*?)\[\/IMAGE_OPTIONS\]/)
      if (optionsMatch) {
        console.log('[ChatMessage] Found IMAGE_OPTIONS marker!')
        try {
          const parsed = JSON.parse(optionsMatch[1])
          console.log('[ChatMessage] Successfully parsed image options:', parsed)
          return parsed
        } catch (e) {
          console.error('Failed to parse image options:', e)
        }
      }
    }
    return null
  }, [message, isUser])
  
  // Check if message contains an agent plan
  const planData = useMemo(() => {
    if (message.agentPlan) {
      return {
        tasks: message.agentPlan.tasks,
        cleanContent: message.content,
        onTaskUpdate: message.agentPlan.onTaskUpdate,
        onSubtaskUpdate: message.agentPlan.onSubtaskUpdate
      }
    }
    
    // Try to extract plan from content
    if (!isUser && message.content) {
      const extracted = extractAgentPlan(message.content)
      if (extracted) {
        return {
          tasks: extracted.tasks,
          cleanContent: extracted.cleanContent,
          onTaskUpdate: undefined,
          onSubtaskUpdate: undefined
        }
      }
    }
    
    return null
  }, [message, isUser])
  
  
  const toggleToolExpansion = (toolId: string) => {
    const newExpanded = new Set(expandedTools)
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId)
    } else {
      newExpanded.add(toolId)
    }
    setExpandedTools(newExpanded)
  }

  return (
    <>
      <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[85%] rounded-xl px-4 py-3",
            isUser ? "bg-[#3C3C3C] text-white" : "bg-[#2B2B2B] text-white",
            "sm:max-w-[80%] md:max-w-[85%]"
          )}
        >
          {attachments && attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => {
                const fileType = attachment.contentType || ''
                const key = `${message.id}-${attachment.name}`
                const fileExtension = getFileExtension(attachment.name)
                
                return (
                  <div key={key} className="flex flex-col">
                    <div 
                      className="file-attachment cursor-pointer hover:bg-black/40 transition-colors"
                    onClick={() => {
                      // For images, show options inline (analyze, edit, animate)
                      if (fileType.startsWith("image/") && onMultiImageOptionSelect) {
                        // Toggle options for this specific image
                        const attachmentKey = `${message.id}-${attachment.name}`
                        if (showOptionsForAttachment === attachmentKey) {
                          setShowOptionsForAttachment(null) // Hide options if already showing
                        } else {
                          setShowOptionsForAttachment(attachmentKey) // Show options for this image
                        }
                      } else {
                        // For non-images, open preview modal
                        setSelectedFile(attachment)
                      }
                    }}
                    title={`${attachment.name}\nClick to preview`}
                  >
                    {fileType.startsWith("image/") ? (
                      <>
                        {/* Check if we have a valid preview URL (including converted HEIC previews) */}
                        {(() => {
                          const hasValidUrl = attachment.url && 
                                            attachment.url !== '' && 
                                            !attachment.url.includes('generativelanguage.googleapis.com');
                          if (attachment.name.toLowerCase().endsWith('.heic')) {
                            console.log('[ChatMessage] HEIC attachment:', {
                              name: attachment.name,
                              hasUrl: !!attachment.url,
                              urlLength: attachment.url?.length || 0,
                              isDataUrl: attachment.url?.startsWith('data:') || false,
                              hasValidUrl
                            });
                          }
                          return hasValidUrl;
                        })() ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              console.error('Image failed to load:', attachment.url);
                              // Instead of hiding, show placeholder
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0';
                                placeholder.innerHTML = '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </>
                    ) : fileType.startsWith("video/") ? (
                      <>
                        {attachment.videoThumbnail ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={attachment.videoThumbnail} 
                              alt={`${attachment.name} thumbnail`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Video className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0">
                            <Video className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </>
                    ) : fileType.startsWith("audio/") ? (
                      <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0">
                        <FileAudio className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs font-medium truncate-filename">
                        {attachment.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="uppercase">{fileExtension}</span>
                        {(attachment.contentType === 'image/heic' || 
                          attachment.contentType === 'image/heif' ||
                          attachment.name.toLowerCase().endsWith('.heic') ||
                          attachment.name.toLowerCase().endsWith('.heif')) && (
                          <>
                            <span>•</span>
                            <span>Apple format</span>
                          </>
                        )}
                        {attachment.videoDuration && (
                          <>
                            <span>•</span>
                            <span>{formatVideoDuration(attachment.videoDuration)}</span>
                          </>
                        )}
                        {!attachment.videoDuration && attachment.transcription?.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(attachment.transcription.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    </div>
                    {/* Show image options for clicked image in multiple image scenario */}
                    {showOptionsForAttachment === `${message.id}-${attachment.name}` && 
                     fileType.startsWith("image/") && 
                     onMultiImageOptionSelect && (
                      <div className="mt-2 ml-2">
                        <InlineImageOptions
                          isVisible={true}
                          onOptionSelect={(option) => {
                            onMultiImageOptionSelect(option, attachment)
                            setShowOptionsForAttachment(null) // Hide options after selection
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div className="text-sm whitespace-pre-wrap">
            {(() => {
              // Use clean content if we have plan, otherwise use original content
              let contentToDisplay = message.content
              if (planData) {
                contentToDisplay = planData.cleanContent
              }
              
              if (contentToDisplay && contentToDisplay.trim()) {
                // Filter out internal API key protocol messages, video generation markers, and image options
                const content = contentToDisplay
                  .replace(/REQUEST_API_KEY:\{[^}]+\}/g, '')
                  .replace(/API_KEY_PROVIDED:\{[^}]+\}/g, '')
                  .replace(/\[VIDEO_GENERATION_STARTED\][\s\S]*?\[\/VIDEO_GENERATION_STARTED\]/g, '')
                  .replace(/\[IMAGE_OPTIONS\][\s\S]*?\[\/IMAGE_OPTIONS\]/g, '')
                  .trim()
                
                return content && parseSimpleMarkdown(content)
              }
              return null
            })()}
          </div>
          
          {/* Display Image Options if available */}
          {imageOptions && onImageOptionSelect && (
            <div className="mt-3 w-full">
              <ImageOptionsCard
                options={imageOptions.options}
                imageUri={imageOptions.fileUri}
                onSelect={(optionId) => onImageOptionSelect(optionId, imageOptions.fileUri)}
              />
            </div>
          )}
          
          {/* Display Video Generation Progress if available */}
          {videoData && (
            <div className="mt-3 w-full">
              <VideoGenerationProgress
                videoId={videoData.id}
                prompt={videoData.prompt}
              />
            </div>
          )}
          
          {/* Display Agent Plan if available */}
          {planData && (
            <div className="mt-3 w-full overflow-x-auto">
              <AgentPlan
                tasks={planData.tasks}
                onTaskUpdate={planData.onTaskUpdate}
                onSubtaskUpdate={planData.onSubtaskUpdate}
                compact={true}
                className="max-w-full"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Render MCP tool calls below the message */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className={cn(
          "mt-2 w-full overflow-hidden",
          isUser ? "pr-4 max-w-[85%] ml-auto" : "pl-4 max-w-[85%]"
        )}>
          <AnimatePresence mode="wait">
            {/* Show MCP tool animation for executing tools */}
            {message.toolCalls
              .filter(tc => tc.status === 'executing')
              .map((toolCall) => (
                <MCPToolAnimation
                  key={toolCall.id}
                  tool={toolCall.tool}
                  server={toolCall.server}
                />
              ))
            }
            
            {/* Show MCP tool results for completed tools */}
            {message.toolCalls
              .filter(tc => tc.status === 'completed' || tc.status === 'failed')
              .map((toolCall) => (
                <MCPToolResult
                  key={toolCall.id}
                  tool={toolCall.tool}
                  server={toolCall.server}
                  result={toolCall.result}
                  status={toolCall.status}
                  error={toolCall.error}
                  isExpanded={expandedTools.has(toolCall.id)}
                  onToggleExpand={() => toggleToolExpansion(toolCall.id)}
                  timestamp={toolCall.timestamp}
                  duration={toolCall.duration}
                />
              ))
            }
          </AnimatePresence>
        </div>
      )}
      
      {selectedFile && (
        <FilePreviewModal
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          file={selectedFile}
          onAnimate={onAnimateImage}
          onEdit={onEditImage}
        />
      )}
    </>
  )
}