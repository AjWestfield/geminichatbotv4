# Tavily Web Search Integration Guide

## Overview
This guide explains how the Tavily API has been integrated into your Next.js chatbot to provide real-time web search capabilities with intelligent context awareness.

## Architecture

### Core Components

1. **Tavily Client** (`/lib/tavily-client.ts`)
   - Singleton pattern for API efficiency
   - Built-in caching (5-minute duration)
   - Rate limiting protection
   - Comprehensive error handling
   - Response formatting for AI

2. **Context Detector** (`WebSearchContextDetector` in `/lib/tavily-client.ts`)
   - Automatic detection of search-worthy queries
   - Pattern matching for various contexts:
     - Time-sensitive information
     - News and current events
     - Real-time data (stocks, weather, sports)
     - Technical documentation
     - Statistical information

3. **API Endpoint** (`/app/api/search/route.ts`)
   - POST endpoint for web searches
   - GET endpoint for health checks
   - Full error handling and validation
   - Security with server-side API key

4. **Chat Integration** (`/app/api/chat/route.ts`)
   - Automatic web search triggering
   - Seamless result injection
   - Maintains conversation flow

## How It Works

### 1. Automatic Search Detection
When a user sends a message, the system automatically detects if web search is needed:

```typescript
const requiresWebSearch = WebSearchContextDetector.requiresWebSearch(messageContent)
```

### 2. Context-Aware Parameters
The system intelligently selects search parameters based on query context:
- News queries → `topic: 'news'`, recent results only
- Financial queries → `topic: 'finance'`, real-time data
- Technical queries → `search_depth: 'advanced'`, more results

### 3. Search Execution
If search is needed, Tavily API is called with optimized parameters:
```typescript
const searchResults = await tavilyClient.search({
  query: messageContent,
  ...contextParams,
  ...domainParams,
})
```

### 4. Result Integration
Search results are formatted and injected into the AI context:
```
Based on real-time web search results:

[Formatted search results here]

---

User Query: [Original question]
```

## Trigger Patterns

### Time-Sensitive Queries
- "What's the latest..."
- "Current status of..."
- "Today's news about..."
- "Recent developments in..."
- Dates: "in 2024", "this week", etc.

### News & Events
- "news", "announced", "released"
- Company/product launches
- Breaking news, headlines
- Mergers, acquisitions, funding

### Real-Time Data
- Stock/crypto prices
- Sports scores
- Weather forecasts
- Traffic conditions

### Technical Information
- "latest documentation"
- "current version of..."
- Security vulnerabilities
- API references

### Statistical Data
- Population figures
- Economic indicators
- Market statistics
- Growth rates

## API Usage

### Direct API Call
```javascript
// POST to /api/search
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'latest AI developments',
    options: {
      search_depth: 'advanced',
      max_results: 10
    }
  })
});

const data = await response.json();
console.log(data.formatted); // AI-ready formatted results
```

### Health Check
```javascript
// GET /api/search
const health = await fetch('/api/search');
const status = await health.json();
// { status: 'ok', configured: true, ... }
```

## Configuration

### Environment Variable
Add your Tavily API key to `.env.local`:
```
TAVILY_API_KEY=tvly-YOUR_API_KEY_HERE
```

### Search Parameters
- `search_depth`: 'basic' or 'advanced'
- `topic`: 'general', 'news', or 'finance'
- `max_results`: 1-10 (default: 5)
- `include_answer`: Direct answer to query
- `include_images`: Related images
- `days`: Time range for news
- `include_domains`: Whitelist domains
- `exclude_domains`: Blacklist domains

## Performance Features

### Caching
- 5-minute cache for identical queries
- Automatic cache management
- Cache hit logging for debugging

### Rate Limiting
- 100ms delay between requests
- Request queuing
- Graceful handling of 429 errors

### Error Handling
- Specific error messages for common issues
- Fallback to AI knowledge on search failure
- User-friendly error notifications

## Testing

### Test Script
```bash
# Create test script
cat > test-tavily-search.js << 'EOF'
const testQueries = [
  'What are the latest developments in AI?',
  'Current Bitcoin price',
  'Today\'s tech news',
  'Weather in San Francisco',
  'Latest React documentation'
];

async function testSearch(query) {
  console.log(`\\n🔍 Testing: "${query}"`);
  
  const response = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log(`✅ Success: ${data.results.results.length} results found`);
    console.log(`Response time: ${data.results.response_time}s`);
    if (data.results.answer) {
      console.log(`Answer: ${data.results.answer.substring(0, 100)}...`);
    }
  } else {
    console.log(`❌ Error: ${data.error}`);
  }
}

async function runTests() {
  console.log('Tavily Search Integration Tests');
  console.log('================================');
  
  for (const query of testQueries) {
    await testSearch(query);
    await new Promise(r => setTimeout(r, 1000));
  }
}

runTests().catch(console.error);
EOF

# Run test
node test-tavily-search.js
```

### Chat Integration Test
1. Start the development server: `npm run dev`
2. Open the chat interface
3. Try queries like:
   - "What's happening in tech today?"
   - "Latest OpenAI announcements"
   - "Current weather in New York"
   - "Bitcoin price right now"

## Monitoring

### Console Logs
Watch for these log messages:
- `[Chat API] Web search detected for query: ...`
- `[Tavily] Searching for: ...`
- `[Tavily] Search completed. Found X results in Ys`
- `[Tavily] Cache hit for query: ...`

### Error Logs
- `[Tavily] Search error: ...`
- `[Chat API] Web search error: ...`

## Best Practices

1. **Query Optimization**
   - Keep queries concise and specific
   - Use context detection patterns
   - Leverage domain filtering when needed

2. **Performance**
   - Monitor cache hit rates
   - Adjust cache duration if needed
   - Use basic search for simple queries

3. **Error Handling**
   - Always have fallback behavior
   - Log errors for debugging
   - Provide user feedback

4. **Security**
   - Never expose API key to client
   - Validate all inputs
   - Sanitize search results

## Troubleshooting

### "TAVILY_API_KEY is not configured"
- Ensure `.env.local` contains `TAVILY_API_KEY=tvly-YOUR_KEY`
- Restart the development server

### "Rate limit exceeded"
- The client implements automatic queuing
- Reduce request frequency if persistent

### "Search request timed out"
- 30-second timeout is configured
- Check network connectivity
- Try simpler queries

### No search results
- Verify search patterns match query
- Check console logs for detection
- Test API endpoint directly

## Future Enhancements

1. **Advanced Features**
   - Multi-language search support
   - Image search integration
   - Custom ranking algorithms

2. **UI Improvements**
   - Visual search indicators
   - Source preview cards
   - Search history

3. **Performance**
   - Redis caching
   - Parallel searches
   - Predictive caching