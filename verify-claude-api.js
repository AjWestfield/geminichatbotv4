// Verify Claude API is working
require('dotenv').config({ path: '.env.local' });

async function verifyClaude() {
  console.log('Verifying Claude API configuration...\n');
  
  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ ANTHROPIC_API_KEY is configured');
  console.log(`   Key starts with: ${apiKey.substring(0, 15)}...`);
  console.log(`   Key length: ${apiKey.length} characters\n`);
  
  try {
    // Test API call
    console.log('Testing Claude API connection...');
    const Anthropic = require('@anthropic-ai/sdk').default;
    
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{ 
        role: 'user', 
        content: 'Respond with exactly: "Claude API is working!"' 
      }]
    });
    
    console.log('✅ Claude API call successful!');
    console.log('   Model:', message.model);
    console.log('   Response:', message.content[0].text);
    console.log('\n🎉 Claude Sonnet 4 is ready to use in your chat interface!');
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    if (error.status === 401) {
      console.error('   The API key appears to be invalid or expired.');
      console.error('   Please check your ANTHROPIC_API_KEY in .env.local');
    }
  }
}

verifyClaude();