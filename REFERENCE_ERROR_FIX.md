# Reference Error and Viewport Warning Fixes

## Issues Fixed

### 1. ReferenceError: Cannot access 'handleSubmit' before initialization

**Problem:**
The `handleSubmit` function was being referenced in dependency arrays of other callbacks before it was defined. JavaScript/TypeScript has a "temporal dead zone" where you cannot access a variable before it's declared when using `const` or `let`.

**Error Location:**
- `handleInlineImageOptionSelect` at line 806
- `handleAnimateConfirm` at line 896  
- `handleImageOptionSelect` at line 959

**Solution:**
Moved the `handleSubmit` function definition from line 961 to line 760, placing it after its dependencies are defined but before any functions that reference it.

### 2. Viewport Metadata Warning

**Problem:**
```
⚠ Unsupported metadata viewport is configured in metadata export in /. 
Please move it to viewport export instead.
```

Next.js 13+ requires viewport metadata to be exported separately from the main metadata object.

**Solution:**
In `/app/layout.tsx`:
- Removed `viewport: 'width=device-width, initial-scale=1'` from the metadata object
- Added a separate export:
```typescript
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}
```

## Files Modified
1. `/components/chat-interface.tsx` - Reordered function definitions
2. `/app/layout.tsx` - Separated viewport export

## Testing
Both errors should now be resolved. The app should:
- Load without any reference errors
- No longer show viewport warnings in the console
- Analyze button should work properly with auto-submit functionality
EOF < /dev/null