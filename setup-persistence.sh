#!/bin/bash

echo "Setting up persistence dependencies..."
echo "======================================"
echo ""

# Install Supabase client for database
echo "Installing Supabase client..."
npm install @supabase/supabase-js

# Install Vercel Blob for image storage
echo "Installing Vercel Blob storage..."
npm install @vercel/blob

# Install Redis client for caching (optional)
echo "Installing Redis client..."
npm install redis

# Install date-fns for date handling
echo "Installing date-fns..."
npm install date-fns

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Add the following to your .env.local:"
echo "   SUPABASE_URL=your_supabase_url"
echo "   SUPABASE_API_KEY=your_supabase_anon_key"
echo "   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token"
echo "   REDIS_URL=your_redis_url (optional)"
echo ""
echo "2. Create your Supabase tables using the SQL in /lib/database/schema.sql"
echo "3. Start your development server: npm run dev"