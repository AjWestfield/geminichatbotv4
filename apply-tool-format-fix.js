const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing tool call format mismatch...\n');

// Fix the system prompt in mcp-tools-context.ts
const mcpContextPath = path.join(__dirname, 'lib/mcp/mcp-tools-context.ts');
let mcpContent = fs.readFileSync(mcpContextPath, 'utf8');

// Create backup
fs.writeFileSync(mcpContextPath + '.backup', mcpContent);

// Fix the system prompt format
const oldPrompt = `prompt += \`To use a tool, include a tool call in your response using this EXACT format:
TOOL_CALL
{
  "tool": "tool_name",
  "server": "server_name",
  "arguments": {
    "param": "value"
  }
}
TOOL_CALL`;

const newPrompt = `prompt += \`To use a tool, include a tool call in your response using this EXACT format:
[TOOL_CALL]
{
  "tool": "tool_name",
  "server": "server_name",
  "arguments": {
    "param": "value"
  }
}
[/TOOL_CALL]`;

mcpContent = mcpContent.replace(oldPrompt, newPrompt);

// Also fix the stray TOOL_CALL on line 139
mcpContent = mcpContent.replace(/^TOOL_CALL$/m, '[/TOOL_CALL]');

// Write the fixed content
fs.writeFileSync(mcpContextPath, mcpContent);

console.log('✅ Fixed system prompt format in mcp-tools-context.ts');
console.log('📝 Backup saved as mcp-tools-context.ts.backup\n');

console.log('✨ Fix applied successfully!\n');
console.log('Next steps:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. Test with a query like: "What is the latest news about AI?"');
console.log('3. Tool results should now display properly!\n');
console.log('To revert if needed:');
console.log('mv lib/mcp/mcp-tools-context.ts.backup lib/mcp/mcp-tools-context.ts');
