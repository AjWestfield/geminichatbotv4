import Anthropic from '@anthropic-ai/sdk';
import { MCPToolsContext } from '@/lib/mcp/mcp-tools-context';
import { parseClaudeToolCalls } from './claude-client';

export async function handleClaudeStreaming(
  claudeClient: Anthropic,
  messages: any[],
  systemPrompt: string,
  toolsContext: { tools: any[], systemPrompt: string }
) {
  // Create a text encoder for streaming
  const encoder = new TextEncoder();
  
  // Helper function to escape text for the expected format
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  };
  
  // Create a readable stream for the response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Format messages for Claude
        const formattedMessages = messages
          .filter((m) => m.role !== 'system' && m.id !== 'welcome-message')
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          }));

        // Create the stream
        const stream = await claudeClient.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8192,
          temperature: 0.7,
          system: systemPrompt + '\n\n' + toolsContext.systemPrompt,
          messages: formattedMessages as any,
          stream: true,
        });

        let fullContent = '';
        
        // Process the stream
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullContent += text;
            
            // Send the chunk to the client in the expected format
            const escapedText = escapeText(text);
            controller.enqueue(encoder.encode(`0:"${escapedText}"\n`));
          }
        }

        // Check for tool calls in the response
        const toolCalls = parseClaudeToolCalls(fullContent);
        
        if (toolCalls.length > 0) {
          // Process tool calls
          for (const toolCall of toolCalls) {
            const result = await MCPToolsContext.executeToolCall(toolCall);
            
            // Format the tool execution result to match frontend parser expectations
            const toolExecutionMessage = `[TOOL_CALL]
${
              JSON.stringify({
                tool: toolCall.tool,
                server: toolCall.server,
                arguments: toolCall.arguments || {}
              }, null, 2)
            }
Tool executed successfully.
${result}
[Tool execution completed]
[/TOOL_CALL]`;
            
            const escapedExecution = escapeText(toolExecutionMessage);
            controller.enqueue(encoder.encode(`0:"${escapedExecution}"\n`));
          }
        }

        // Send completion signal in the expected format
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        controller.close();
      } catch (error) {
        console.error('Claude streaming error:', error);
        // Send error in the expected format
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const escapedError = escapeText(errorMessage);
        controller.enqueue(encoder.encode(`3:{"error":"${escapedError}"}\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Removed processToolCall function - using MCPToolsContext.executeToolCall directly