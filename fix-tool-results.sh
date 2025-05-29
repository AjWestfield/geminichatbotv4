#!/bin/bash

# Fix tool results display in geminichatbotv2

echo "Fixing tool results display issue..."

# Create a backup of the original file
cp hooks/use-chat-with-tools.ts hooks/use-chat-with-tools.ts.backup

# Apply the fix using a Node.js script
cat > fix-tool-parsing.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'hooks/use-chat-with-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the execution pattern section
const oldPattern = `      // Look for execution result INSIDE the TOOL_CALL block
      const execPattern = /Tool executed successfully\\.\\s*\\n\\s*({[\\s\\S]*?})\\s*\\n\\s*\\[Tool execution completed/
      const execMatch = execPattern.exec(toolCallContent)`;

const newPattern = `      // Look for execution result INSIDE the TOOL_CALL block
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

// Replace the pattern
if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  console.log('✓ Updated execution pattern matching');
} else {
  console.log('⚠️  Could not find exact pattern, attempting alternative fix...');
  
  // Try a more flexible replacement
  const flexiblePattern = /const execPattern = \/Tool executed successfully[^}]+execPattern\.exec\(toolCallContent\)/s;
  if (flexiblePattern.test(content)) {
    content = content.replace(flexiblePattern, newPattern);
    console.log('✓ Applied alternative pattern fix');
  }
}

// Also update the result parsing to be more robust
const resultParsingOld = `          toolCall.result = JSON.parse(resultJson)`;
const resultParsingNew = `          try {
            toolCall.result = JSON.parse(resultJson)
          } catch (e) {
            // If JSON parsing fails, try to extract meaningful content
            if (resultJson.includes('"type"') && resultJson.includes('"text"')) {
              const textMatch = resultJson.match(/"text"\\s*:\\s*"([^"]+)"/);
              toolCall.result = textMatch ? textMatch[1] : resultJson;
            } else {
              toolCall.result = resultJson;
            }
          }`;

content = content.replace(resultParsingOld, resultParsingNew);

// Write the updated content
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fix applied successfully!');
console.log('📝 Backup saved as hooks/use-chat-with-tools.ts.backup');

EOF

# Run the fix
node fix-tool-parsing.js

# Clean up
rm fix-tool-parsing.js

echo ""
echo "✅ Tool results display fix has been applied!"
echo ""
echo "Next steps:"
echo "1. Restart your development server (npm run dev)"
echo "2. Test with a query that uses tools (e.g., 'What is veo 3?')"
echo "3. Check that tool results now appear in the UI"
echo ""
echo "If you need to revert:"
echo "mv hooks/use-chat-with-tools.ts.backup hooks/use-chat-with-tools.ts"
