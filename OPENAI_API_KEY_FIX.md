# OpenAI API Key Detection Fix

## Problem
The image editing functionality was showing an error "OpenAI API Key Required" even when the API key was properly configured in the `.env.local` file.

## Root Cause
The client-side code was checking for `process.env.NEXT_PUBLIC_OPENAI_API_KEY` before making the API request:

```typescript
if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY && typeof window !== 'undefined' && !window.localStorage.getItem('OPENAI_API_KEY')) {
  toast.error("OpenAI API Key Required", {
    description: "Image editing requires an OpenAI API key. Please add it in settings."
  })
  return;
}
```

This check was flawed because:
1. The actual environment variable is `OPENAI_API_KEY` (without the `NEXT_PUBLIC_` prefix)
2. Non-public environment variables are only available on the server side, not in the browser
3. The client-side check would always fail unless the user manually added the key to localStorage

## Solution
Removed the client-side API key check entirely. The server-side API route already properly checks for the API key and returns appropriate error messages.

### Changes Made
1. **Removed client-side check** in `handleEditConfirm` function
2. **Improved error handling** to properly parse JSON error responses from the server

### Before:
```typescript
// Check if OpenAI API key is available
if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY && typeof window !== 'undefined' && !window.localStorage.getItem('OPENAI_API_KEY')) {
  toast.error("OpenAI API Key Required", {
    description: "Image editing requires an OpenAI API key. Please add it in settings."
  })
  return;
}
```

### After:
```typescript
// Removed - let server handle API key validation
```

Also improved error handling:
```typescript
const errorData = await response.json();
toast.error("Edit Failed", { 
  description: errorData.details || errorData.error || "Failed to edit image" 
});
```

## How It Works Now
1. User requests image edit
2. Request is sent to `/api/edit-image`
3. Server checks for `OPENAI_API_KEY` environment variable
4. If missing, server returns a proper error message with instructions
5. Client displays the server's error message to the user

## Benefits
- Works correctly with server-side environment variables
- No need for users to manually add API keys to localStorage
- Consistent with how other API keys are handled in the app
- Better error messages from the server

## Testing
1. Ensure `OPENAI_API_KEY` is set in `.env.local`
2. Upload an image
3. Click Edit
4. Enter an edit prompt
5. The edit should work without any API key errors