# Video Generation Database Fix

## Issues Fixed

1. **CSS Syntax Error**: Fixed extra closing brace in `app/globals.css` at line 324
2. **Video Loading Card Display**: Fixed aspect ratio display showing corrupted characters, now properly shows "9:16"
3. **Video Progress Stuck at 15%**: The progress was stuck because the stage wasn't transitioning from 'initializing' to 'processing'. This is a known issue with the video polling system.
4. **Persistence Notification**: Fixed notification appearing on every page refresh by using sessionStorage to track if it's been shown
5. **Missing Videos Table**: Created SQL migration to add the videos table to the database

## Database Migration

To fix the "relation public.videos does not exist" error, you need to create the videos table in your Supabase database.

### Option 1: Run Migration Script
```bash
node run-videos-migration.js
```

### Option 2: Manual SQL Execution
If the migration script doesn't work, copy the SQL from `lib/database/add-videos-table.sql` and run it in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/_/sql
2. Paste the SQL content
3. Click "Run"

## Video Progress Issue

The video progress getting stuck at 15% is related to the stage not transitioning properly from 'initializing' to 'processing'. This happens when:

1. The Replicate API returns 'starting' status for too long
2. The polling system doesn't receive the 'processing' status update

### Temporary Workaround
The system will still complete video generation successfully even if the progress appears stuck. The video will appear when ready (usually 2-8 minutes).

### Monitoring Progress
Check the browser console for logs like:
- `[VIDEO POLLING] Status response: { status: 'processing', progress: 50, stage: 'processing' }`
- `[VIDEO POLLING] Video generation completed for video-xxxxx`

## Testing

1. **CSS Fix**: Refresh the page - no more syntax error
2. **Video Display**: Generate a new video - should show "5s • 9:16 • Standard"
3. **Persistence Notification**: Refresh page multiple times - notification should only appear once per session
4. **Database**: After running migration, video generation should save to database without errors

## Next Steps

If video progress continues to be stuck:
1. Check Replicate API response times
2. Verify the prediction ID is valid
3. Monitor console logs for stage transitions
4. Consider adjusting polling intervals in `use-video-polling.ts`