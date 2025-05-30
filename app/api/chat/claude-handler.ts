import { getClaudeClient } from '@/lib/claude-client';
import { handleClaudeStreaming } from '@/lib/claude-streaming-handler';
import { MCPToolsContext } from '@/lib/mcp/mcp-tools-context';
import { MCP_SYSTEM_PROMPT_ENHANCED } from '@/lib/mcp/mcp-agent-instructions-enhanced';

export async function handleClaudeRequest(
  messages: any[],
  model: string
) {
  try {
    // Get Claude client
    const claudeClient = getClaudeClient();
    
    // Get available MCP tools
    const toolsContext = await MCPToolsContext.getAvailableTools();
    console.log('[Claude Handler] Available tools:', toolsContext.tools.length);
    
    // Create the enhanced system prompt with MCP instructions
    const systemPrompt = MCP_SYSTEM_PROMPT_ENHANCED;
    
    // Handle the streaming response
    return handleClaudeStreaming(
      claudeClient,
      messages,
      systemPrompt,
      toolsContext
    );
  } catch (error) {
    console.error('[Claude Handler] Error:', error);
    throw error;
  }
}