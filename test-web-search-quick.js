// Test Web Search Functionality
require('dotenv').config({ path: '.env.local' });

async function testWebSearch() {
  console.log('🔍 Testing Web Search Functionality\n');
  
  try {
    // Test 1: Import check
    console.log('1. Testing imports...');
    const { TavilyClient, WebSearchContextDetector } = require('./lib/tavily-client');
    console.log('   ✅ Imports successful');
    
    // Test 2: API Key validation
    console.log('\n2. Testing API key...');
    const apiKey = process.env.TAVILY_API_KEY;
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    
    if (!apiKey) {
      console.log('   ❌ TAVILY_API_KEY not found');
      return;
    }
    
    // Test 3: Client creation
    console.log('\n3. Creating client...');
    const client = new TavilyClient(apiKey);
    console.log('   ✅ Client created successfully');
    
    // Test 4: Search test
    console.log('\n4. Testing search...');
    const results = await client.search('TypeScript programming language', {
      max_results: 2,
      search_depth: 'basic'
    });
    
    console.log(`   ✅ Search successful: ${results.results.length} results found`);
    console.log(`   Query: "${results.query}"`);
    console.log(`   Response time: ${results.response_time}s`);
    
    if (results.results.length > 0) {
      const firstResult = results.results[0];
      console.log(`   First result: "${firstResult.title}"`);
    }
    
    // Test 5: Context detection
    console.log('\n5. Testing context detection...');
    const testMessages = [
      'What is the latest AI news?',
      'Search for React tutorials',
      'Hello world'
    ];
    
    testMessages.forEach(msg => {
      const requiresSearch = WebSearchContextDetector.requiresWebSearch(msg);
      console.log(`   "${msg}" -> ${requiresSearch ? '✅ needs search' : '❌ no search'}`);
    });
    
    console.log('\n🎉 All tests passed! Web search is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWebSearch();
