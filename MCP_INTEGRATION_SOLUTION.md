# MCP Integration Solution for Next.js

## Problem Analysis

The main issues with the current MCP integration:

1. **Server Instance Persistence**: Each API route runs in isolation in Next.js, so the singleton pattern doesn't share state between routes
2. **Command Execution Errors**: The "file argument must be of type string" error indicates issues with process spawning
3. **State Management**: No proper server-side state persistence mechanism

## Solution Implemented

### 1. Server State Persistence

I've updated all API routes to load servers from config before operations:

```typescript
// Before any operation in API routes
const serverManager = MCPServerManager.getInstance();
await serverManager.loadFromConfig();
```

This ensures that servers saved to config are available across all API routes.

### 2. Environment Variable Handling

Fixed the process spawning to include the system PATH:

```typescript
this.process = execa(this.config.command, this.config.args || [], {
  env: {
    ...process.env,  // Include system environment
    ...this.config.env,  // Add custom environment variables
  },
  stderr: 'pipe',
  stdout: 'pipe',
  stdin: 'pipe',
});
```

### 3. Error Logging

Added stderr logging for better debugging:

```typescript
if (this.process.stderr) {
  this.process.stderr.on('data', (data) => {
    console.error(`MCP server stderr (${this.config.name}):`, data.toString());
  });
}
```

## Architecture Recommendations

Based on research into best practices and CopilotKit's approach:

### 1. Consider Using a Persistent Service

Instead of relying on singleton patterns in API routes, consider:

- **Option A**: Use a separate Next.js API route that acts as a long-running service
- **Option B**: Use a WebSocket server for persistent connections
- **Option C**: Use Redis or another cache for server state

### 2. CopilotKit-Style Implementation

CopilotKit uses a more robust approach:
- Client-side React hooks for state management
- Server-side adapters for MCP communication
- Built-in error recovery and retry logic

### 3. Alternative Transport Mechanisms

For production use, consider:
- **HTTP+SSE**: For remote MCP servers (better for cloud deployment)
- **WebSockets**: For real-time bidirectional communication
- **REST API Gateway**: For simpler request/response patterns

## Testing the Fix

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try adding a server again through the UI

3. The server should now be properly persisted and connectable

## Future Improvements

1. **Implement Redis Cache**: Store server instances in Redis for true persistence
2. **Add Health Checks**: Periodically check server connectivity
3. **Implement Retry Logic**: Auto-reconnect on failure
4. **Use Process Manager**: Consider PM2 or similar for managing MCP server processes
5. **Add WebSocket Support**: For real-time tool execution updates

## Alternative: Using CopilotKit

If the current implementation continues to have issues, consider migrating to CopilotKit:

```bash
npx @copilotkit/cli
```

CopilotKit provides:
- Built-in MCP support
- Automatic tool integration
- Production-ready architecture
- Active community support

## Debugging Tips

If you still see errors:

1. Check the browser console for client-side errors
2. Check the server logs for stderr output
3. Verify the MCP server command is correct (try running it manually)
4. Ensure all required environment variables are set
5. Check file permissions for the config file