// Verify all API keys are working
require('dotenv').config({ path: '.env.local' });

async function verifyAllAPIs() {
  console.log('🔍 Verifying All API Configurations\n');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // 1. Check Gemini API
  console.log('\n1. Google Gemini API:');
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('✅ GEMINI_API_KEY is configured');
    console.log(`   Key: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 5)}`);
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
      const result = await model.generateContent('Say "Gemini is working"');
      const response = await result.response;
      console.log('✅ Gemini API is working!');
      results.push({ api: 'Gemini', status: 'Working' });
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      results.push({ api: 'Gemini', status: 'Error', message: error.message });
    }
  } else {
    console.log('❌ GEMINI_API_KEY not found');
    results.push({ api: 'Gemini', status: 'Not configured' });
  }
  
  // 2. Check OpenAI API
  console.log('\n2. OpenAI API:');
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    console.log('✅ OPENAI_API_KEY is configured');
    console.log(`   Key: ${openaiKey.substring(0, 15)}...${openaiKey.substring(openaiKey.length - 5)}`);
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OpenAI is working"' }],
        max_tokens: 20
      });
      console.log('✅ OpenAI API is working!');
      results.push({ api: 'OpenAI', status: 'Working' });
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
      results.push({ api: 'OpenAI', status: 'Error', message: error.message });
    }
  } else {
    console.log('❌ OPENAI_API_KEY not found');
    results.push({ api: 'OpenAI', status: 'Not configured' });
  }
  
  // 3. Check Anthropic API
  console.log('\n3. Anthropic Claude API:');
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    console.log('✅ ANTHROPIC_API_KEY is configured');
    console.log(`   Key: ${anthropicKey.substring(0, 15)}...${anthropicKey.substring(anthropicKey.length - 5)}`);
    try {
      const Anthropic = require('@anthropic-ai/sdk').default;
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say "Claude is working"' }]
      });
      console.log('✅ Claude API is working!');
      results.push({ api: 'Claude', status: 'Working' });
    } catch (error) {
      console.error('❌ Claude API error:', error.message);
      results.push({ api: 'Claude', status: 'Error', message: error.message });
    }
  } else {
    console.log('❌ ANTHROPIC_API_KEY not found');
    results.push({ api: 'Claude', status: 'Not configured' });
  }
  
  // 4. Check WaveSpeed API (for image generation)
  console.log('\n4. WaveSpeed API:');
  const wavespeedKey = process.env.WAVESPEED_API_KEY;
  if (wavespeedKey) {
    console.log('✅ WAVESPEED_API_KEY is configured');
    console.log(`   Key: ${wavespeedKey.substring(0, 10)}...${wavespeedKey.substring(wavespeedKey.length - 5)}`);
    results.push({ api: 'WaveSpeed', status: 'Configured' });
  } else {
    console.log('❌ WAVESPEED_API_KEY not found');
    results.push({ api: 'WaveSpeed', status: 'Not configured' });
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 API Status Summary:\n');
  
  const workingAPIs = results.filter(r => r.status === 'Working').length;
  const configuredAPIs = results.filter(r => r.status === 'Working' || r.status === 'Configured').length;
  
  results.forEach(result => {
    const icon = result.status === 'Working' ? '✅' : 
                 result.status === 'Configured' ? '🔧' :
                 result.status === 'Error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.api}: ${result.status}`);
    if (result.message) {
      console.log(`   Error: ${result.message}`);
    }
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\n🎯 ${workingAPIs} APIs tested and working`);
  console.log(`📦 ${configuredAPIs} APIs configured total`);
  
  if (workingAPIs >= 3) {
    console.log('\n🎉 Your multi-model chat system is ready to use!');
    console.log('   - Gemini models for general chat');
    console.log('   - Claude Sonnet 4 for advanced reasoning');
    console.log('   - GPT-Image-1 for high-quality images');
    console.log('   - WaveSpeed for fast image generation');
  }
}

verifyAllAPIs().catch(console.error);