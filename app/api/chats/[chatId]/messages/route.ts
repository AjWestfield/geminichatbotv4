import { NextRequest, NextResponse } from 'next/server'
import { addMessage } from '@/lib/services/chat-persistence'

// POST /api/chats/[chatId]/messages - Add a message to a chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const { role, content, attachments } = await req.json()

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    const message = await addMessage(chatId, role, content, attachments)

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error in POST /api/chats/[chatId]/messages:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}