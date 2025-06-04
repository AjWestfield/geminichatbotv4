# How to Run the Database Migration

You need to fix the `original_image_id` column in your database to save edited images. Here's how:

## Option 1: Quick Fix in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run this simple fix**:
   ```sql
   ALTER TABLE images 
   ALTER COLUMN original_image_id TYPE TEXT;
   ```

4. **Click "Run"**
   - You should see "Success" message

That's it! Your edited images will now save properly.

## Option 2: Full Migration (Recommended)

If you want to be thorough, run the complete migration:

1. Open Supabase SQL Editor
2. Copy and paste the contents of `manual-migration-fix.sql`
3. Click "Run"

This will:
- Check the current column type
- Drop any foreign key constraints
- Change the column to TEXT
- Add a helpful comment
- Verify the change

## Option 3: Fix Your Environment

Add the missing key to `.env.local`:
```
SUPABASE_ANON_KEY=your-anon-key-here
```

Then run:
```bash
node run-image-id-fix.js
```

## Verify It Worked

After running the migration, test by:
1. Generating an image
2. Editing it
3. Check console - should see "Image saved successfully"
4. Refresh page - edited image should persist

## What This Fixes

- ❌ Before: `invalid input syntax for type uuid: "img_1748976895957_5b516nlg2"`
- ✅ After: Edited images save successfully with their local IDs

The database was expecting UUID format (like `123e4567-e89b-12d3-a456-426614174000`) but our local IDs use a different format (`img_timestamp_random`).