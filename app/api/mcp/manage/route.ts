import { NextRequest, NextResponse } from 'next/server';
import { MCPAgentWorkflow, MCPSearchResult } from '@/lib/mcp/mcp-agent-workflow';
import { MCPConfigFileManager } from '@/lib/mcp/mcp-config-file-manager';

export async function POST(req: NextRequest) {
  try {
    const { action, request, searchResults } = await req.json();

    if (!action || !request) {
      return NextResponse.json(
        { error: 'Missing required fields: action and request' },
        { status: 400 }
      );
    }

    const workflow = new MCPAgentWorkflow();

    switch (action) {
      case 'install': {
        if (!searchResults || !Array.isArray(searchResults)) {
          return NextResponse.json(
            { error: 'Search results are required for installation' },
            { status: 400 }
          );
        }

        const result = await workflow.installMCPServer(
          request,
          searchResults as MCPSearchResult[],
          (steps) => {
            // Could use Server-Sent Events here for real-time updates
            console.log('Installation progress:', steps);
          }
        );

        return NextResponse.json({
          success: result.success,
          result,
          steps: workflow.getSteps()
        });
      }

      case 'remove': {
        // Extract server name from request
        const serverName = extractServerName(request);
        if (!serverName) {
          return NextResponse.json(
            { error: 'Could not determine server name from request' },
            { status: 400 }
          );
        }

        const result = await workflow.removeMCPServer(serverName);

        return NextResponse.json({
          success: result.success,
          result,
          steps: workflow.getSteps()
        });
      }

      case 'list': {
        const configManager = new MCPConfigFileManager();
        const servers = await configManager.readConfig();
        
        return NextResponse.json({
          success: true,
          servers: servers.mcpServers
        });
      }

      case 'search': {
        // This would typically call out to Exa or Context7 MCP
        // For now, return a placeholder
        return NextResponse.json({
          success: true,
          message: 'Search functionality requires Exa or Context7 MCP to be connected',
          searchResults: []
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('MCP management error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage MCP server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Extract server name from a natural language request
 */
function extractServerName(request: string): string | null {
  const lowerRequest = request.toLowerCase();
  
  // Common patterns
  const patterns = [
    /remove\s+(?:the\s+)?(\w+)(?:\s+server)?/i,
    /uninstall\s+(?:the\s+)?(\w+)(?:\s+server)?/i,
    /delete\s+(?:the\s+)?(\w+)(?:\s+server)?/i,
  ];

  for (const pattern of patterns) {
    const match = request.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Try to find known server names
  const knownServers = [
    'filesystem', 'github', 'gitlab', 'google-drive', 'postgres',
    'sqlite', 'puppeteer', 'brave-search', 'fetch', 'calculator',
    'exa', 'context7', 'everart'
  ];

  for (const server of knownServers) {
    if (lowerRequest.includes(server)) {
      return server.replace('-', '_');
    }
  }

  return null;
}