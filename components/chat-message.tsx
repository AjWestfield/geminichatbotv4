import { cn } from "@/lib/utils"
import { FileAudio, Image as ImageIcon } from "lucide-react"

interface MessageAttachment {
  name: string
  contentType: string
  url?: string
}

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system" | "function" | "data" | "tool"
    content: string
    createdAt?: Date
    experimental_attachments?: MessageAttachment[]
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const attachments = message.experimental_attachments

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3",
          isUser ? "bg-[#3C3C3C] text-white" : "bg-[#2B2B2B] text-white",
        )}
      >
        {attachments && attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {attachments.map((attachment) => {
              const fileType = attachment.contentType || ''
              const key = `${message.id}-${attachment.name}`
              
              return (
                <div key={key} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                  {fileType.startsWith("image/") ? (
                    <>
                      {attachment.url && attachment.url !== '' ? (
                        <img 
                          src={attachment.url} 
                          alt={attachment.name}
                          className="w-16 h-16 rounded object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', attachment.url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-black/30 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </>
                  ) : fileType.startsWith("audio/") ? (
                    <div className="w-16 h-16 rounded bg-black/30 flex items-center justify-center">
                      <FileAudio className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-400">{fileType}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}