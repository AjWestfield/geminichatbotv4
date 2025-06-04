# Enable Persistence - Step by Step Guide

## Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New project"
3. Fill in:
   - Project name: `gemini-chatbot` (or any name)
   - Database password: (save this somewhere safe)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

## Step 2: Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
   - **anon public**: `eyJhbGc...` (this is your API key)
3. Copy both values

## Step 3: Create Vercel Blob Storage

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Go to **Storage** tab
3. Click **Create Database** → **Blob**
4. Name it: `gemini-chatbot-images`
5. Click **Create**
6. Go to the blob store and click **Manage** → **Tokens**
7. Create a new token with **Read/Write** access
8. Copy the token

## Step 4: Add to .env.local

Add these lines to your `.env.local` file:

```env
# Persistence Configuration
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_API_KEY=eyJhbGc... (your long anon key)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... (your blob token)

# Optional: Redis for caching (skip if you don't have Redis)
# REDIS_URL=redis://...
```

## Step 5: Run Setup Script

```bash
npm run setup-persistence
```

This will check your configuration and guide you through any issues.

## Step 6: Create Database Tables

1. Go to your Supabase dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy and paste the SQL from `lib/database/schema.sql`
5. Click **Run**

You should see "Success. No rows returned"

## Step 7: Restart Your App

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

## Step 8: Verify It's Working

1. The yellow "Persistence Not Configured" notification should disappear
2. Create a new chat and send a message
3. Refresh the page - your chat should still be there!
4. Generate an image - it will be saved to cloud storage

## Troubleshooting

### "Invalid Supabase URL"
- Make sure the URL starts with `https://` and ends with `.supabase.co`
- Don't include any trailing slashes

### "Tables not found"
- Make sure you ran the SQL schema in Step 6
- Check you're in the right Supabase project

### Still seeing the yellow notification?
- Make sure you saved the `.env.local` file
- Restart your development server
- Check for typos in the environment variable names

## What You Get

✅ **Chat History**: All conversations saved
✅ **Image Gallery**: Images stored in the cloud
✅ **Search**: Find any previous chat
✅ **Persistence**: Everything saved automatically

## Quick Test

1. Send a message: "Hello, testing persistence!"
2. Generate an image: "generate a beautiful sunset"
3. Refresh the page
4. Your chat and image should still be there!

## Next Steps

- All chats are now automatically saved
- You can search, edit, and delete chats from the sidebar
- Images are stored securely in Vercel Blob Storage
- Everything persists between sessions!