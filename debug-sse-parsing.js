#!/usr/bin/env node

// Debug SSE parsing to understand where the issue might be

// Simulate SSE stream parsing
function parseSSEMessage(data) {
  // The AI SDK expects format: 0:"content"\n
  const lines = data.split('\n');
  console.log('SSE lines count:', lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    console.log(`Line ${i}:`, line.substring(0, 50) + (line.length > 50 ? '...' : ''));
    console.log('  Length:', line.length);
    
    // Check if it matches the expected format
    const match = line.match(/^(\d+):"(.*)"/);
    if (match) {
      console.log('  ✅ Valid SSE format');
      console.log('  ID:', match[1]);
      console.log('  Content length:', match[2].length);
      
      // Check if content has web search results
      if (match[2].includes('[WEB_SEARCH_RESULTS]')) {
        console.log('  Contains web search results');
        
        // Try to extract
        const searchMatch = match[2].match(/\[WEB_SEARCH_RESULTS\]([\s\S]*?)\[\/WEB_SEARCH_RESULTS\]/);
        if (searchMatch) {
          console.log('  Extracted data length:', searchMatch[1].length);
          return searchMatch[1];
        }
      }
    } else {
      console.log('  ❌ Invalid SSE format');
    }
  }
  
  return null;
}

// Test with a large payload
console.log('Testing SSE parsing with large payload...\n');

// Create a large test payload
const largeData = {
  type: 'webSearchResults',
  data: {
    query: 'Test query',
    results: []
  }
};

// Add many results to simulate the 17KB payload
for (let i = 0; i < 50; i++) {
  largeData.data.results.push({
    title: `Result ${i}: Long title with many words to increase size`,
    url: `https://example.com/article/${i}/very-long-url-path-to-increase-payload-size`,
    content: `This is result ${i} with a long content string. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
    score: 0.9 - (i * 0.01),
    published_date: '2024-05-25'
  });
}

// Inline escape functions
function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function unescapeFromStream(str) {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Process the large data
const jsonStr = JSON.stringify(largeData);
console.log('JSON string length:', jsonStr.length);

const escaped = escapeForStream(jsonStr);
console.log('Escaped length:', escaped.length);

// Create SSE message
const streamData = `[WEB_SEARCH_RESULTS]${escaped}[/WEB_SEARCH_RESULTS]`;
const sseMessage = `0:"${streamData}"\n`;

console.log('SSE message length:', sseMessage.length);
console.log('');

// Test parsing
const extracted = parseSSEMessage(sseMessage);
if (extracted) {
  console.log('\nExtracted data successfully');
  
  try {
    const unescaped = unescapeFromStream(extracted);
    const parsed = JSON.parse(unescaped);
    console.log('✅ Parsed successfully!');
    console.log('Results count:', parsed.data.results.length);
  } catch (error) {
    console.log('❌ Parse error:', error.message);
    
    // Find the error position
    if (error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const unescaped = unescapeFromStream(extracted);
        console.log('\nError at position:', pos);
        console.log('Context:', unescaped.substring(pos - 30, pos + 30));
      }
    }
  }
}

// Test chunked reading (in case the issue is with partial reads)
console.log('\n\nTesting chunked reading...');
const chunkSize = 1000;
let buffer = '';
for (let i = 0; i < sseMessage.length; i += chunkSize) {
  const chunk = sseMessage.substring(i, i + chunkSize);
  buffer += chunk;
  
  // Check if we have a complete message
  if (buffer.includes('\n')) {
    console.log(`Chunk ${i/chunkSize}: Received ${chunk.length} bytes`);
  }
}

console.log('Final buffer length:', buffer.length);
console.log('Buffer equals original?', buffer === sseMessage);