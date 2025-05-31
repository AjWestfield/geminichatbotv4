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
  
  // Helper function to format text for the AI SDK data stream format
  const formatTextChunk = (text: string) => {
    // Format as SSE: data: 0:"text"
    return `data: 0:${JSON.stringify(text)}\n\n`;
  };
  
  // Helper function to format tool call for the AI SDK format
  const formatToolCall = (toolCall: any) => {
    // Format as SSE: data: 9:{"toolCallId":"...","toolName":"...","args":{...}}
    return `data: 9:${JSON.stringify({
      toolCallId: `tool-${Date.now()}-${Math.random()}`,
      toolName: toolCall.tool,
      args: toolCall.arguments || {}
    })}\n\n`;
  };
  
  // Helper function to format tool result for the AI SDK format
  const formatToolResult = (toolCallId: string, result: any) => {
    // Format as SSE: data: a:{"toolCallId":"...","result":...}
    return `data: a:${JSON.stringify({
      toolCallId,
      result
    })}\n\n`;
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
            
            // Send the chunk to the client in the AI SDK format
            controller.enqueue(encoder.encode(formatTextChunk(text)));
          }
        }

        // Check for tool calls in the response
        const toolCalls = parseClaudeToolCalls(fullContent);
        
        if (toolCalls.length > 0) {
          // Process tool calls
          for (const toolCall of toolCalls) {
            // Generate a unique tool call ID
            const toolCallId = `tool-${Date.now()}-${Math.random()}`;
            
            // Send tool call notification
            controller.enqueue(encoder.encode(formatToolCall({
              ...toolCall,
              toolCallId
            })));
            
            // Execute the tool
            const result = await MCPToolsContext.executeToolCall(toolCall);
            
            // Send tool result
            controller.enqueue(encoder.encode(formatToolResult(toolCallId, result)));
            
            // Also send the formatted message for display
            const toolExecutionMessage = `[TOOL_CALL]
${
              JSON.stringify({
                tool: toolCall.tool,
                server: toolCall.server,
                arguments: toolCall.arguments || {}
              }, null, 2)
            }
Tool executed successfully.
${JSON.stringify(result, null, 2)}
[Tool execution completed]
[/TOOL_CALL]`;
            
            controller.enqueue(encoder.encode(formatTextChunk(toolExecutionMessage)));
          }
        }

        // Send completion signal in the AI SDK format
        controller.enqueue(encoder.encode(`data: d:{"finishReason":"stop"}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Claude streaming error:', error);
        // Send error in the AI SDK format
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: 3:${JSON.stringify(errorMessage)}\n\n`));
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