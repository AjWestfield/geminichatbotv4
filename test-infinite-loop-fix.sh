#\!/bin/bash

echo "Testing infinite loop fix in agent plan implementation..."

# Kill any existing dev server
echo "Stopping any existing dev server..."
pkill -f "next dev" || true

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Start the dev server
echo "Starting development server..."
npm run dev &
DEV_PID=$\!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

# Check if server is running
if \! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Failed to start development server"
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Development server started successfully"

# Monitor console for infinite loop indicators
echo "Monitoring for infinite loop indicators for 30 seconds..."
echo "If you see repeated 'Maximum update depth exceeded' errors, the fix didn't work."
echo "If the server runs smoothly without errors, the fix is successful."

# Let it run for 30 seconds to check for infinite loops
sleep 30

echo "Test complete. Check the console output above for any errors."
echo "Stopping development server..."
kill $DEV_PID 2>/dev/null || true

echo "Done\!"
