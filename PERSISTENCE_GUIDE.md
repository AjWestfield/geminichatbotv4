# Chat Persistence Guide

This guide explains how to set up and use the chat persistence system in the Gemini Chatbot application.

## Overview

The persistence system provides:
- **Chat History**: Save and load previous conversations
- **Message Storage**: Persist all messages with their attachments
- **Image Gallery**: Save generated images to the cloud
- **Search**: Find chats by content
- **Organization**: Automatic grouping by time periods

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @vercel/blob date-fns
# Optional for caching:
npm install redis
```

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-supabase-anon-key

# Vercel Blob Storage (Required for images)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Redis (Optional for caching)
REDIS_URL=redis://your-redis-url
```

### 3. Run Setup Script

```bash
node setup-persistence.js
```

This script will:
- Verify your configuration
- Test database connections
- Help you create the required tables

### 4. Create Database Tables

If the setup script couldn't create tables automatically, go to your Supabase dashboard:

1. Navigate to the SQL Editor
2. Copy the contents of `lib/database/schema.sql`
3. Run the SQL to create tables

## Getting Your API Keys

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your project URL and anon key

### Vercel Blob Storage
1. Go to [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
2. Create a new Blob store
3. Copy the read-write token

### Redis (Optional)
1. Use a service like [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com/cloud/)
2. Create a Redis database
3. Copy the connection URL

## How It Works

### Chat Management

When you start a conversation:
1. A new chat is automatically created when you send your first message
2. The chat title is generated from your first message
3. All subsequent messages are saved to this chat

### Sidebar Features

- **New Chat**: Click to start a fresh conversation
- **Chat History**: Shows all your previous chats grouped by:
  - Today
  - Yesterday
  - This Week
  - This Month
  - Older
- **Search**: Type to find chats containing specific words
- **Edit**: Click the edit icon to rename a chat
- **Delete**: Click the trash icon to delete a chat

### Loading Previous Chats

Click any chat in the sidebar to:
1. Load all messages from that conversation
2. Restore any images generated in that chat
3. Continue the conversation where you left off

### Image Persistence

Generated images are automatically:
1. Uploaded to Vercel Blob Storage
2. Associated with the current chat
3. Restored when you reload the chat

## Features in Action

### Starting a New Chat
```
1. Click "New Chat" in sidebar
2. Type your message
3. Chat is auto-saved with first message as title
```

### Searching Chats
```
1. Type in the search box
2. Results update in real-time
3. Click any result to load that chat
```

### Managing Chats
```
- Hover over a chat to see edit/delete buttons
- Click edit icon → type new name → press Enter
- Click delete icon → confirm deletion
```

## Troubleshooting

### "Failed to load chat history"
- Check your Supabase credentials
- Ensure tables are created
- Verify network connection

### "Images not saving"
- Check Vercel Blob Storage token
- Ensure BLOB_READ_WRITE_TOKEN is set
- Verify storage quota

### "Search not working"
- Check if chats are being saved
- Verify database connection
- Look for console errors

## Data Privacy

- All data is stored in your own Supabase database
- Images are stored in your Vercel Blob Storage
- No data is shared with third parties
- You have full control over your data

## API Endpoints

The persistence system uses these endpoints:

- `GET /api/chats` - List all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/[id]` - Load specific chat
- `PATCH /api/chats/[id]` - Update chat title
- `DELETE /api/chats/[id]` - Delete chat
- `POST /api/chats/[id]/messages` - Save message
- `POST /api/images` - Save image
- `GET /api/images` - List all images

## Database Schema

The system uses three main tables:

### chats
- `id`: Unique identifier
- `title`: Chat title
- `model`: AI model used
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### messages
- `id`: Unique identifier
- `chat_id`: Reference to chat
- `role`: user/assistant/system
- `content`: Message text
- `attachments`: File attachments (JSON)
- `created_at`: Creation timestamp

### images
- `id`: Unique identifier
- `chat_id`: Reference to chat (optional)
- `message_id`: Reference to message (optional)
- `url`: Blob storage URL
- `prompt`: Generation prompt
- `metadata`: Image details (JSON)
- `created_at`: Creation timestamp

## Performance Tips

1. **Enable Redis**: Improves chat list loading speed
2. **Limit History**: Old chats are automatically paginated
3. **Clean Up**: Delete old chats you no longer need
4. **Image Optimization**: Images are automatically optimized before storage

## Future Enhancements

Planned features:
- Export chat as markdown/PDF
- Bulk operations (delete multiple chats)
- Chat sharing with unique URLs
- Automatic backups
- Chat templates