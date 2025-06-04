# React Hooks Error Fix - Video Animation

## Problem
When animating an image, React threw an error about hooks being called in a different order:
```
Error: React has detected a change in the order of Hooks called by Home.
Previous render: useEffect
Next render: useSyncExternalStore
```

## Root Cause
The `useMultiVideoPolling` hook was violating React's Rules of Hooks by:
1. Using `Array.map()` to call the `useVideoPolling` hook for each video
2. This caused the number of hooks to change when videos were added/removed from the polling array

```typescript
// OLD CODE - VIOLATES RULES OF HOOKS
const pollingResults = videos.map(({ videoId, predictionId }) => {
  return useVideoPolling(videoId, predictionId, options); // ❌ Hook inside map
});
```

When a new video animation started, the array length changed, causing React to detect a different number of hooks.

## Solution
Refactored `useMultiVideoPolling` to be a single hook that manages all video polling internally:

### Key Changes:
1. **No Dynamic Hook Calls**: Removed the `map` that was calling hooks
2. **Fixed Hook Structure**: All hooks are now called at the top level
3. **Internal State Management**: Uses Maps and Sets inside refs to manage multiple videos
4. **Single Effect**: One effect manages all video polling instead of multiple hooks

### Implementation Details:
```typescript
// NEW CODE - FOLLOWS RULES OF HOOKS
export function useMultiVideoPolling(videos, options) {
  // Fixed hooks at top level
  const { getProgress, updateProgress, ... } = useVideoProgressStore();
  
  // Use refs with Maps/Sets for dynamic state
  const pollTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const startTimesRef = useRef<Map<string, number>>(new Map());
  
  // Single effect to manage all videos
  useEffect(() => {
    // Handle all videos internally without calling hooks
  }, [videos, ...dependencies]);
  
  return { allProgress, isAnyPolling, stopAllPolling };
}
```

## Benefits
1. **Complies with Rules of Hooks**: Hook count never changes between renders
2. **Better Performance**: Single hook manages all videos efficiently
3. **Cleaner Code**: Centralized polling logic
4. **No More Errors**: React no longer detects hook order changes

## Testing
1. Generate an image
2. Click the animate button
3. Verify no hook errors in console
4. Try animating multiple images - all should work without errors

## Technical Details
- Maps and Sets in refs allow dynamic state without changing hook count
- All polling timeouts are managed in a single Map
- Effect dependencies are properly managed to avoid stale closures
- Cleanup function properly clears all timeouts

## Prevention
To avoid similar issues in the future:
1. Never call hooks inside loops, conditions, or callbacks
2. Use refs with Maps/Sets for dynamic collections
3. Keep hook count constant across all renders
4. Use ESLint rules for hooks to catch violations early