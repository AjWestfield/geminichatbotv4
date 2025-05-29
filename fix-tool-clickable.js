const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing tool click/expand functionality...\n');

// Fix 1: Update MCPToolAnimation to be clickable
const animationPath = path.join(__dirname, 'components/mcp-tool-animation.tsx');
let animationContent = fs.readFileSync(animationPath, 'utf8');

// Backup
fs.writeFileSync(animationPath + '.backup', animationContent);

// Add click handler and hover styles
const oldDiv = `className="mb-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3"`;
const newDiv = `className="mb-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
      onClick={() => {
        // Temporary: Show info while executing
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = \`\${tool} is executing on \${server}. Results will appear when complete.\`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }}`;

animationContent = animationContent.replace(oldDiv, newDiv);
fs.writeFileSync(animationPath, animationContent);

console.log('✅ Made MCPToolAnimation clickable with feedback');

// Fix 2: Quick fix for testing - make tools show as completed
const hooksPath = path.join(__dirname, 'hooks/use-chat-with-tools.ts');
let hooksContent = fs.readFileSync(hooksPath, 'utf8');

// Backup
fs.writeFileSync(hooksPath + '.backup-clickable', hooksContent);

// Change back to completed for immediate clickability
hooksContent = hooksContent.replace(
  `status: 'executing', // Tool declaration found, execution pending`,
  `status: 'completed', // Temporarily show as completed for clickability`
);

// Add a default result
hooksContent = hooksContent.replace(
  `timestamp: Date.now()
}`,
  `timestamp: Date.now(),
      result: 'Click to view details...' // Default result for clickability
}`
);

fs.writeFileSync(hooksPath, hooksContent);

console.log('✅ Updated tool status to show as completed (temporary fix)');
console.log('\n⚠️  This is a temporary fix that shows tools as completed immediately.');
console.log('This enables clicking but may show incomplete results.\n');

console.log('Next steps:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Test with: "What is the latest news about AI?"');
console.log('3. Tools should now be clickable!\n');

console.log('To revert:');
console.log('- mv components/mcp-tool-animation.tsx.backup components/mcp-tool-animation.tsx');
console.log('- mv hooks/use-chat-with-tools.ts.backup-clickable hooks/use-chat-with-tools.ts');
