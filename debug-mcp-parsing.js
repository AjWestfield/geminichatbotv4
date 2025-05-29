// Quick test to debug MCP tool parsing
// Run this in browser console when on the chat page

// Test the parsing functions
const testContent = `I can help you find the latest news in AI. I will use the \`web_search_exa\` tool to search the web for recent articles.

[TOOL_CALL]
{
  "tool": "web_search_exa",
  "server": "Exa",
  "arguments": {
    "query": "latest news in AI",
    "numResults": 5
  }
}
[/TOOL_CALL]

Executing tool: web_search_exa
Tool executed successfully.

{
  "requestId": "test123",
  "results": [
    {"title": "Test Result 1"},
    {"title": "Test Result 2"}
  ]
}

[Tool execution completed. The results have been displayed to the user. Please analyze these results and provide relevant insights, recommendations, or answer the user's original question based on the information retrieved.]

Based on the search results, here are the key AI developments...`;

// Function to test tool extraction
function testToolExtraction() {
  console.log('=== Testing Tool Extraction ===');
  
  // Test regex for TOOL_CALL
  const toolCallPattern = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g;
  const matches = testContent.match(toolCallPattern);
  console.log('Tool call matches found:', matches?.length || 0);
  if (matches) {
    console.log('First match:', matches[0]);
  }
  
  // Test execution pattern
  const executingPattern = /Executing tool: (\S+)\n([^]*?)(?=\n\n\[Tool execution completed|$)/;
  const execMatch = testContent.match(executingPattern);
  console.log('Execution match found:', !!execMatch);
  if (execMatch) {
    console.log('Tool name:', execMatch[1]);
    console.log('Result preview:', execMatch[2]?.substring(0, 100) + '...');
  }
}

// Function to test content stripping
function testContentStripping() {
  console.log('\n=== Testing Content Stripping ===');
  
  let cleaned = testContent;
  
  // Remove TOOL_CALL blocks
  cleaned = cleaned.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '');
  console.log('After removing TOOL_CALL:', cleaned.includes('[TOOL_CALL]') ? 'FAILED' : 'SUCCESS');
  
  // Remove execution results
  cleaned = cleaned.replace(
    /Executing tool: \S+[\s\S]*?(?=(?:\n\n\[(?:Tool execution completed|AI_ANALYSIS_INSTRUCTION))|(?:\n\nExecuting tool:)|$)/g,
    ''
  );
  console.log('After removing execution:', cleaned.includes('Executing tool:') ? 'FAILED' : 'SUCCESS');
  console.log('After removing JSON:', cleaned.includes('"requestId"') ? 'FAILED' : 'SUCCESS');
  
  // Remove markers
  cleaned = cleaned.replace(/\[Tool execution completed[^\]]*\]/g, '');
  
  // Clean up newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  console.log('\nCleaned content:');
  console.log(cleaned);
  console.log('\nOriginal length:', testContent.length);
  console.log('Cleaned length:', cleaned.length);
}

// Run tests
testToolExtraction();
testContentStripping();

// Check if the hooks are available in window
if (window.parseToolCallsFromContent) {
  console.log('\n=== Testing Actual Functions ===');
  const toolCalls = window.parseToolCallsFromContent(testContent);
  console.log('Tool calls extracted:', toolCalls);
  
  const stripped = window.stripToolCallsFromContent(testContent);
  console.log('Stripped content:', stripped);
}
