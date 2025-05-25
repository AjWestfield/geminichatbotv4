import type { Message } from "ai"

export interface FileAttachment {
  name: string
  type: string
  size: number
  preview?: string
  uri?: string
}

export interface ExtendedMessage extends Message {
  experimental_attachments?: FileAttachment[]
}