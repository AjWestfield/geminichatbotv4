# MCP Server Implementation Plan

## Overview

This document outlines a comprehensive plan to integrate Model Context Protocol (MCP) servers into the Gemini Chatbot v2 web application, enabling users to install and use MCP servers that provide tools and capabilities to the AI assistant.

## Architecture Overview

### Current Architecture
- **Frontend**: Next.js 15.2.4 with React
- **AI Integration**: Google Gemini via Vercel AI SDK
- **State Management**: Local state with React hooks
- **Communication**: REST API routes in Next.js

### Proposed MCP Integration Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│  Next.js Backend │────▶│   MCP Servers   │
│  (React/Next)   │◀────│   (API Routes)   │◀────│ (User-installed)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Gemini API   │
                        └──────────────┘
```

## Key Components to Implement

### 1. MCP Server Manager
A service to manage MCP server lifecycle:

```typescript
// lib/mcp/server-manager.ts
export class MCPServerManager {
  private servers: Map<string, MCPServerInstance> = new Map();
  
  async installServer(config: MCPServerConfig): Promise<void> {
    // Validate server configuration
    // Download/install server if needed
    // Initialize server instance
  }
  
  async startServer(serverId: string): Promise<void> {
    // Start MCP server process
    // Establish communication channel
  }
  
  async listTools(serverId: string): Promise<Tool[]> {
    // Query server for available tools
  }
  
  async executeTool(serverId: string, toolName: string, params: any): Promise<any> {
    // Execute tool on MCP server
  }
}
```

### 2. MCP Client Implementation
Client to communicate with MCP servers:

```typescript
// lib/mcp/client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/transport/stdio.js';

export class MCPClient {
  private client: Client;
  
  async connect(serverPath: string): Promise<void> {
    const transport = new StdioClientTransport({
      command: serverPath,
      args: []
    });
    
    this.client = new Client({
      name: 'gemini-chatbot-v2',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await this.client.connect(transport);
  }
  
  async listTools(): Promise<any[]> {
    const response = await this.client.listTools();
    return response.tools;
  }
  
  async callTool(name: string, arguments: any): Promise<any> {
    const response = await this.client.callTool({
      name,
      arguments
    });
    return response;
  }
}
```

### 3. Server Configuration UI
React components for server management:

```typescript
// components/mcp-server-config.tsx
export function MCPServerConfig() {
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  
  return (
    <div className="space-y-4">
      <h3>MCP Servers</h3>
      
      {/* List installed servers */}
      <ServerList servers={servers} />
      
      {/* Add new server form */}
      <AddServerForm onAdd={handleAddServer} />
      
      {/* Server details and tools */}
      <ServerDetails selectedServer={selectedServer} />
    </div>
  );
}
```

### 4. Tool Integration with Chat
Integrate MCP tools into the chat flow:

```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { messages, mcpServers } = await req.json();
  
  // Extract tool calls from Gemini response
  const toolCalls = extractToolCalls(geminiResponse);
  
  // Execute MCP tools if needed
  for (const toolCall of toolCalls) {
    const serverId = toolCall.serverId;
    const result = await mcpManager.executeTool(
      serverId,
      toolCall.name,
      toolCall.arguments
    );
    
    // Include tool results in next message
    messages.push({
      role: 'tool',
      content: result
    });
  }
}
```

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1)
1. Install MCP TypeScript SDK
2. Create MCPServerManager class
3. Implement basic server lifecycle management
4. Create API routes for server management

### Phase 2: Server Installation (Week 2)
1. Create UI for server configuration
2. Implement server discovery/registry
3. Add server validation and security checks
4. Store server configurations in localStorage/database

### Phase 3: Tool Integration (Week 3)
1. Extend chat API to handle tool calls
2. Create tool execution pipeline
3. Add tool result formatting
4. Implement error handling and timeouts

### Phase 4: UI Enhancement (Week 4)
1. Add server management UI to sidebar
2. Create tool documentation viewer
3. Add execution status indicators
4. Implement tool approval workflows

## Security Considerations

1. **Server Validation**: Verify server authenticity before installation
2. **Sandboxing**: Run MCP servers in isolated environments
3. **Permission System**: Require user approval for sensitive operations
4. **Resource Limits**: Implement timeouts and resource quotas
5. **Audit Logging**: Log all tool executions

## Example MCP Server Implementation

```typescript
// example-mcp-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/transport/stdio.js';

const server = new Server({
  name: 'example-tools',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Register a tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'calculate',
      description: 'Perform calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' }
        },
        required: ['expression']
      }
    }]
  };
});

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'calculate') {
    try {
      const result = eval(args.expression); // Note: Use safe evaluation in production
      return {
        content: [{
          type: 'text',
          text: `Result: ${result}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      };
    }
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Integration with Existing Features

### 1. Chat Interface Enhancement
- Add MCP tool indicators in chat messages
- Show tool execution status
- Display tool results inline

### 2. Image Generation Integration
- Allow MCP servers to trigger image generation
- Pass generated images back to MCP tools

### 3. File Upload Integration
- Enable MCP tools to process uploaded files
- Share file context with MCP servers

## Testing Strategy

1. **Unit Tests**: Test MCP client/server communication
2. **Integration Tests**: Test tool execution pipeline
3. **E2E Tests**: Test full user workflow
4. **Security Tests**: Validate sandboxing and permissions

## Performance Considerations

1. **Server Pooling**: Reuse server connections
2. **Lazy Loading**: Start servers only when needed
3. **Caching**: Cache tool metadata and results
4. **Timeout Management**: Implement appropriate timeouts

## Next Steps

1. Create a proof-of-concept with a simple MCP server
2. Implement basic server management UI
3. Test tool integration with Gemini API
4. Gather user feedback and iterate

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [CopilotKit Architecture](https://github.com/CopilotKit/CopilotKit)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)