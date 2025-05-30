import { cn, formatDuration, getFileExtension, formatVideoDuration } from "@/lib/utils"
import { FileAudio, Image as ImageIcon, Video } from "lucide-react"
import { useState } from "react"
import { FilePreviewModal } from "./file-preview-modal"
import { MCPToolAnimation } from "./mcp-tool-animation"
import { MCPToolResult } from "./mcp-tool-result"
import { AnimatePresence } from "framer-motion"

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
  }
  mcpToolExecuting?: {
    messageId: string
    toolName: string
    serverName: string
    startTime: number
  } | null
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

export default function ChatMessage({ message, mcpToolExecuting }: ChatMessageProps) {
  const isUser = message.role === "user"
  const attachments = message.experimental_attachments
  const [selectedFile, setSelectedFile] = useState<MessageAttachment | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  
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
                  <div 
                    key={key}
                    className="file-attachment cursor-pointer hover:bg-black/40 transition-colors"
                    onClick={() => setSelectedFile(attachment)}
                    title={`${attachment.name}\nClick to preview`}
                  >
                    {fileType.startsWith("image/") ? (
                      <>
                        {attachment.url && attachment.url !== '' ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              console.error('Image failed to load:', attachment.url);
                              (e.target as HTMLImageElement).style.display = 'none';
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
                )
              })}
            </div>
          )}
          <div className="text-sm whitespace-pre-wrap">
            {message.content && message.content.trim() && (() => {
              // Filter out internal API key protocol messages
              const content = message.content
                .replace(/REQUEST_API_KEY:\{[^}]+\}/g, '')
                .replace(/API_KEY_PROVIDED:\{[^}]+\}/g, '')
                .trim()
              
              return content && parseSimpleMarkdown(content)
            })()}
          </div>
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
        />
      )}
    </>
  )
}