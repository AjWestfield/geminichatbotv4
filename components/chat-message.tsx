import type { Message } from "ai"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3",
          isUser ? "bg-[#3C3C3C] text-white" : "bg-[#2B2B2B] text-white",
        )}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  )
}
