import { NextRequest, NextResponse } from 'next/server'
import { getChat, updateChatTitle, deleteChat } from '@/lib/services/chat-persistence'

// GET /api/chats/[chatId] - Get a specific chat with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const chatData = await getChat(chatId)

    if (!chatData) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(chatData)
  } catch (error) {
    console.error('Error in GET /api/chats/[chatId]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    )
  }
}

// PATCH /api/chats/[chatId] - Update chat (e.g., title)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const { title } = await req.json()

    if (title) {
      const success = await updateChatTitle(chatId, title)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update chat' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/chats/[chatId]:', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

// DELETE /api/chats/[chatId] - Delete a chat
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const success = await deleteChat(chatId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete chat' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/chats/[chatId]:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}