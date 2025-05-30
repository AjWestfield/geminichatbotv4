// Test Claude API directly
import { getClaudeClient } from './lib/claude-client.js';

async function testClaude() {
  try {
    console.log('Testing Claude API...');
    const client = getClaudeClient();
    
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say "Hello from Claude!"' }]
    });
    
    console.log('✓ Claude API works!');
    console.log('Response:', response.content[0].text);
  } catch (error) {
    console.error('✗ Claude API error:', error.message);
  }
}

testClaude();
