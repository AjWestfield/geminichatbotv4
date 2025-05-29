const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing tool execution flow to show results before analysis...\n');

// Read the route file
const routePath = path.join(__dirname, 'app/api/chat/route.ts');
let routeContent = fs.readFileSync(routePath, 'utf8');

// Backup
fs.writeFileSync(routePath + '.backup-flow', routeContent);

// Find the tool execution section and modify it
const oldExecution = `                    // Execute the tool
                    const toolResult = await MCPToolsContext.executeToolCall(toolCall)
                    
                    // Store the tool execution result in the format expected by the parser
                    const toolExecutionMessage = \`Executing tool: \${toolCall.tool}\\nTool executed successfully.\\n\${toolResult}\\n[Tool execution completed. The results have been displayed to the user.]\``;

const newExecution = `                    // Send tool execution started message
                    const startMsg = \`\\n[TOOL_EXECUTION_STARTED]\\nExecuting tool: \${toolCall.tool} on \${toolCall.server}...\\n\`
                    controller.enqueue(encoder.encode(\`0:"\${startMsg.replace(/\\n/g, '\\\\n')}"\n\`))
                    
                    // Execute the tool
                    const toolResult = await MCPToolsContext.executeToolCall(toolCall)
                    
                    // Send tool execution completed with results
                    const toolExecutionMessage = \`[TOOL_EXECUTION_COMPLETED]\\nTool: \${toolCall.tool}\\nServer: \${toolCall.server}\\nStatus: completed\\nResults:\\n\${toolResult}\\n[/TOOL_EXECUTION_COMPLETED]\\n\``;

routeContent = routeContent.replace(oldExecution, newExecution);

// Add a delay before analysis to ensure UI updates
const oldAnalysisStart = `                    // Create a strong analysis instruction
                    const analysisInstruction = \`\\n\\n---\\n🔍 **MANDATORY ANALYSIS SECTION**\\n\\nBased on the \${toolCall.tool} results above, you MUST now provide:`;

const newAnalysisStart = `                    // Add delay to ensure client processes the tool results
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    
                    // Send analysis header
                    const analysisHeader = \`\\n\\n---\\n🔍 **ANALYSIS OF TOOL RESULTS**\\n\\n\`
                    controller.enqueue(encoder.encode(\`0:"\${analysisHeader.replace(/\\n/g, '\\\\n')}"\n\`))
                    
                    // Create a strong analysis instruction
                    const analysisInstruction = \`Based on the \${toolCall.tool} results above, you MUST now provide:`;

routeContent = routeContent.replace(oldAnalysisStart, newAnalysisStart);

// Write the updated route file
fs.writeFileSync(routePath, routeContent);

console.log('✅ Updated API route to send tool results before analysis\n');

// Now update the client-side parsing
const hooksPath = path.join(__dirname, 'hooks/use-chat-with-tools.ts');
let hooksContent = fs.readFileSync(hooksPath, 'utf8');

// Backup
fs.writeFileSync(hooksPath + '.backup-flow', hooksContent);

// Update to handle the new format
const parseUpdate = `// Add new parsing for execution completed messages
function parseExecutionCompletion(content: string, existingCalls: MCPToolCall[]): MCPToolCall[] {
  const updated = [...existingCalls];
  const completionPattern = /\\[TOOL_EXECUTION_COMPLETED\\]\\nTool: ([^\\n]+)\\nServer: ([^\\n]+)\\nStatus: completed\\nResults:\\n([\\s\\S]*?)\\n\\[\\/TOOL_EXECUTION_COMPLETED\\]/g;
  
  let match;
  while ((match = completionPattern.exec(content)) !== null) {
    const [, tool, server, results] = match;
    const index = updated.findIndex(tc => 
      tc.tool === tool && tc.server === server && tc.status === 'executing'
    );
    
    if (index !== -1) {
      updated[index] = {
        ...updated[index],
        status: 'completed',
        result: results.trim(),
        duration: Date.now() - updated[index].timestamp
      };
    }
  }
  
  return updated;
}

`;

// Insert the new function after the parseToolCallsFromContent function
const insertPoint = hooksContent.indexOf('// Process messages to extract tool calls');
if (insertPoint !== -1) {
  hooksContent = hooksContent.slice(0, insertPoint) + parseUpdate + hooksContent.slice(insertPoint);
}

// Update processMessagesWithTools to use the new parser
const oldProcessing = `function processMessagesWithTools(messages: Message[]): MessageWithTools[] {
  return messages.map(msg => {
    const toolCalls = parseToolCallsFromContent(msg.content)`;

const newProcessing = `function processMessagesWithTools(messages: Message[]): MessageWithTools[] {
  return messages.map((msg, index) => {
    let toolCalls = parseToolCallsFromContent(msg.content)
    
    // Check all messages up to current for execution completions
    if (index > 0) {
      const allContent = messages.slice(0, index + 1).map(m => m.content).join('\\n');
      toolCalls = parseExecutionCompletion(allContent, toolCalls);
    }`;

hooksContent = hooksContent.replace(oldProcessing, newProcessing);

// Write the updated hooks file
fs.writeFileSync(hooksPath, hooksContent);

console.log('✅ Updated client-side parsing to handle execution completion\n');

console.log('📋 Summary of changes:');
console.log('1. Tool execution now sends clear start/complete messages');
console.log('2. Added 1.5s delay before analysis to ensure UI updates');
console.log('3. Client properly updates tool status from executing → completed');
console.log('4. Analysis only starts after tool results are displayed\n');

console.log('Next steps:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Test with: "What is the latest news about AI?"');
console.log('3. You should see:');
console.log('   - Tool declaration (executing)');
console.log('   - Tool results (completed)');
console.log('   - Then analysis begins\n');

console.log('To revert:');
console.log('- mv app/api/chat/route.ts.backup-flow app/api/chat/route.ts');
console.log('- mv hooks/use-chat-with-tools.ts.backup-flow hooks/use-chat-with-tools.ts');
