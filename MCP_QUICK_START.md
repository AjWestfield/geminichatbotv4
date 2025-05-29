# MCP Integration Quick Start Guide

## Installation

```bash
# Install MCP SDK
npm install @modelcontextprotocol/sdk --legacy-peer-deps

# Install additional dependencies
npm install execa --legacy-peer-deps
```

## Basic MCP Client Implementation

```typescript
// lib/mcp/mcp-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/transport/stdio.js';
import { execa } from 'execa';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export class MCPClientWrapper {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: any = null;

  constructor(
    private serverPath: string,
    private serverArgs: string[] = []
  ) {}

  async connect(): Promise<void> {
    try {
      // Start the server process
      this.process = execa(this.serverPath, this.serverArgs);
      
      // Create transport
      this.transport = new StdioClientTransport({
        stdin: this.process.stdin,
        stdout: this.process.stdout,
        stderr: this.process.stderr,
      });

      // Create client
      this.client = new Client(
        {
          name: 'gemini-chatbot-v2',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      console.log('Connected to MCP server:', this.serverPath);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
    if (this.process) {
      this.process.kill();
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const response = await this.client.listTools();
    return response.tools || [];
  }

  async callTool(name: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    return response.content;
  }

  async listResources(): Promise<any[]> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const response = await this.client.listResources();
    return response.resources || [];
  }

  async readResource(uri: string): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const response = await this.client.readResource({ uri });
    return response.contents;
  }
}
```

## API Route for MCP Integration

```typescript
// app/api/mcp/tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MCPClientWrapper } from '@/lib/mcp/mcp-client';

// Store active MCP connections
const mcpConnections = new Map<string, MCPClientWrapper>();

export async function GET(req: NextRequest) {
  const serverId = req.nextUrl.searchParams.get('serverId');
  
  if (!serverId) {
    return NextResponse.json({ error: 'serverId required' }, { status: 400 });
  }

  try {
    const client = mcpConnections.get(serverId);
    if (!client) {
      return NextResponse.json({ error: 'Server not connected' }, { status: 404 });
    }

    const tools = await client.listTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error listing tools:', error);
    return NextResponse.json({ error: 'Failed to list tools' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { serverId, toolName, arguments: toolArgs } = await req.json();

  if (!serverId || !toolName) {
    return NextResponse.json({ error: 'serverId and toolName required' }, { status: 400 });
  }

  try {
    const client = mcpConnections.get(serverId);
    if (!client) {
      return NextResponse.json({ error: 'Server not connected' }, { status: 404 });
    }

    const result = await client.callTool(toolName, toolArgs);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error calling tool:', error);
    return NextResponse.json({ error: 'Failed to call tool' }, { status: 500 });
  }
}
```

## React Hook for MCP Tools

```typescript
// hooks/use-mcp-tools.ts
import { useState, useEffect, useCallback } from 'react';
import { MCPTool } from '@/lib/mcp/mcp-client';

export function useMCPTools(serverId: string | null) {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
      setTools([]);
      return;
    }

    const fetchTools = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/mcp/tools?serverId=${serverId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        
        const data = await response.json();
        setTools(data.tools);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [serverId]);

  const callTool = useCallback(async (toolName: string, args: any) => {
    if (!serverId) {
      throw new Error('No server selected');
    }

    const response = await fetch('/api/mcp/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        toolName,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to call tool');
    }

    const data = await response.json();
    return data.result;
  }, [serverId]);

  return { tools, loading, error, callTool };
}
```

## UI Component for MCP Tools

```typescript
// components/mcp-tools-panel.tsx
import { useState } from 'react';
import { useMCPTools } from '@/hooks/use-mcp-tools';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Terminal } from 'lucide-react';

interface MCPToolsPanelProps {
  serverId: string | null;
  onToolResult?: (result: any) => void;
}

export function MCPToolsPanel({ serverId, onToolResult }: MCPToolsPanelProps) {
  const { tools, loading, error, callTool } = useMCPTools(serverId);
  const [executing, setExecuting] = useState<string | null>(null);

  const handleToolClick = async (toolName: string) => {
    try {
      setExecuting(toolName);
      
      // For demo, use empty args or prompt user for input
      const args = {}; // TODO: Create input form based on tool schema
      
      const result = await callTool(toolName, args);
      onToolResult?.(result);
    } catch (error) {
      console.error('Tool execution failed:', error);
    } finally {
      setExecuting(null);
    }
  };

  if (!serverId) {
    return (
      <div className="p-4 text-center text-gray-500">
        No MCP server selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Terminal className="w-5 h-5" />
        Available Tools
      </h3>
      
      <div className="space-y-2">
        {tools.map((tool) => (
          <Card key={tool.name} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{tool.name}</h4>
                {tool.description && (
                  <p className="text-sm text-gray-600">{tool.description}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleToolClick(tool.name)}
                disabled={executing === tool.name}
              >
                {executing === tool.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Run'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {tools.length === 0 && (
        <p className="text-center text-gray-500">No tools available</p>
      )}
    </div>
  );
}
```

## Integration with Chat Interface

```typescript
// Modify components/chat-interface.tsx to include MCP tools

import { MCPToolsPanel } from './mcp-tools-panel';

// Add to ChatInterface component
const [selectedMCPServer, setSelectedMCPServer] = useState<string | null>(null);

// In the component render, add a section for MCP tools
<div className="border-t border-gray-200 p-4">
  <MCPToolsPanel 
    serverId={selectedMCPServer}
    onToolResult={(result) => {
      // Add tool result to chat
      const toolMessage = {
        id: `tool-${Date.now()}`,
        role: 'assistant',
        content: `Tool result: ${JSON.stringify(result, null, 2)}`,
      };
      setLocalMessages(prev => [...prev, toolMessage]);
    }}
  />
</div>
```

## Example MCP Server (Calculator)

```typescript
// example-servers/calculator/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/transport/stdio.js';

const server = new Server(
  {
    name: 'calculator-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
      },
      {
        name: 'multiply',
        description: 'Multiply two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'add':
      return {
        content: [
          {
            type: 'text',
            text: `${args.a} + ${args.b} = ${args.a + args.b}`,
          },
        ],
      };
    
    case 'multiply':
      return {
        content: [
          {
            type: 'text',
            text: `${args.a} × ${args.b} = ${args.a * args.b}`,
          },
        ],
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.log('Calculator MCP server running');
```

## Next Steps

1. **Install Dependencies**: Run `npm install @modelcontextprotocol/sdk execa --legacy-peer-deps`
2. **Create MCP Directory**: Add `lib/mcp/` and `example-servers/` directories
3. **Implement Basic Client**: Start with the MCPClientWrapper class
4. **Create API Routes**: Add the MCP tools API endpoints
5. **Test with Example Server**: Create and test the calculator server
6. **Integrate with UI**: Add the MCP tools panel to your chat interface

## Testing the Integration

```bash
# Build the example server
cd example-servers/calculator
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node
npx tsc index.ts

# Run the server standalone to test
node index.js

# Test in your app
# 1. Start your Next.js app
# 2. Connect to the MCP server through the UI
# 3. Execute tools and see results in chat
```

This quick start guide provides a foundation for integrating MCP servers into your Gemini chatbot application. You can expand on this by adding more sophisticated server management, tool input forms, and better error handling.