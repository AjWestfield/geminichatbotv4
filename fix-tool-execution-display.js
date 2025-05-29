const fs = require('fs');
const path = require('path');

console.log('🔧 Applying comprehensive fix for tool execution display...\n');

// File to fix
const filePath = path.join(__dirname, 'hooks/use-chat-with-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync(filePath + '.backup3', content);
console.log('📝 Created backup: use-chat-with-tools.ts.backup3');

// Fix 1: Change initial status from 'completed' to 'executing'
content = content.replace(
  `status: 'completed', // Since execution happens inside, it's already completed`,
  `status: 'executing', // Tool declaration found, execution pending`
);

// Fix 2: Don't try to parse results from the TOOL_CALL block
// Find the section that looks for execution results and simplify it
const oldLogic = `      // Look for execution result INSIDE the TOOL_CALL block
      // Updated patterns to handle extra newlines and various formats
      const execPatterns = [
        /Tool executed successfully\\.\\s*\\n+\\s*({[\\s\\S]*?})\\s*\\n*\\s*\\[Tool execution completed/,
        /Tool executed successfully\\.\\s*\\n+\\s*({[\\s\\S]*?})/,
        /Tool executed successfully\\.\\s*\\n+\\s*([\\s\\S]*?)(?:\\[Tool execution completed|$)/,
        /Tool executed successfully\\.\\s*\\n\\s*(.+)/
      ]

      let execMatch = null
      for (const pattern of execPatterns) {
        execMatch = pattern.exec(toolCallContent)
        if (execMatch) break
      }`;

const newLogic = `      // Don't look for results in TOOL_CALL block - they come separately
      // Just mark that we found a tool declaration
      console.log('[parseToolCallsFromContent] Tool declaration found, awaiting execution')`;

content = content.replace(oldLogic, newLogic);

// Fix 3: Comment out the result extraction logic since results come later
const resultExtractionStart = `      if (execMatch) {`;
const resultExtractionEnd = `      }
      
      // Calculate duration`;

// Find and comment out this section
const startIdx = content.indexOf(resultExtractionStart);
const endIdx = content.indexOf(resultExtractionEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const beforeSection = content.substring(0, startIdx);
  const afterSection = content.substring(endIdx);
  content = beforeSection + `      // Results will be handled when execution completes
      /*
      if (execMatch) {
        // Original result extraction logic - disabled
      }
      */
      ` + afterSection;
}

// Write the fixed content
fs.writeFileSync(filePath, content);

console.log('\n✅ Applied comprehensive fix!');
console.log('\nWhat this fixes:');
console.log('1. Tools now show as "executing" when declared');
console.log('2. Removed incorrect result parsing from declaration');
console.log('3. Tools will show spinner while executing');
console.log('\n⚠️  Note: Tools will stay in "executing" state.');
console.log('A full fix requires updating the server-client communication.');
console.log('\nNext steps:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Test with: "What is the latest news about AI?"');
console.log('3. You should see the tool with a spinner (executing state)');
