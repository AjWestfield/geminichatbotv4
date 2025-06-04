import { NextRequest, NextResponse } from 'next/server'
import { getChats, createChat, searchChats } from '@/lib/services/chat-persistence'

// GET /api/chats - Get all chats or search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let chats
    if (search) {
      chats = await searchChats(search)
    } else {
      chats = await getChats(limit)
    }

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Error in GET /api/chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}

// POST /api/chats - Create a new chat
export async function POST(req: NextRequest) {
  try {
    const { title, model } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const chat = await createChat(
      title,
      model || 'gemini-2.0-flash-exp'
    )

    if (!chat) {
      // Return a mock chat object when persistence is not configured
      const mockChat = {
        id: `temp-${Date.now()}`,
        title,
        model: model || 'gemini-2.0-flash-exp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ chat: mockChat })
    }

    return NextResponse.json({ chat })
  } catch (error) {
    console.error('Error in POST /api/chats:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}