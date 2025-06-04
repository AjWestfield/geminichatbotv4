#!/usr/bin/env node

// Debug script to test JSON truncation issue

// Inline the functions from json-escape-utils.ts
function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')     // Backslashes must be first
    .replace(/"/g, '\\"');      // Quotes
}

function unescapeFromStream(str) {
  return str
    .replace(/\\"/g, '"')       // Unescape quotes
    .replace(/\\\\/g, '\\');    // Unescape backslashes (must be last)
}

function parseFromStream(str) {
  const unescaped = unescapeFromStream(str);
  
  try {
    return JSON.parse(unescaped);
  } catch (error) {
    console.error('[parseFromStream] JSON parse error:', error.message);
    console.error('[parseFromStream] Input length:', str.length);
    console.error('[parseFromStream] Unescaped length:', unescaped.length);
    
    if (error instanceof SyntaxError && error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        console.error('[parseFromStream] Error position:', pos);
        console.error('[parseFromStream] Context:', unescaped.substring(Math.max(0, pos - 30), Math.min(unescaped.length, pos + 30)));
        console.error('[parseFromStream] Char at error:', unescaped.charAt(pos), 'Code:', unescaped.charCodeAt(pos));
      }
    }
    
    throw error;
  }
}

// Test data that mimics the problematic structure
const testData = {
  type: 'webSearchResults',
  data: {
    query: 'test query',
    results: [
      {
        title: 'Test Result 1',
        url: 'https://example.com/1',
        content: 'This is a test result with some content that includes a date: Tue, 27 May 2024. The content continues with more text that makes this result longer to reach the problematic position around 1550 characters. We need to add more content here to make sure we hit that specific position where the truncation happens. Adding more text and more text and even more text to reach the target length. This is getting quite long now but we need to ensure we can reproduce the exact issue that is happening in production.',
        score: 0.95,
        publishedDate: 'Tue, 27 May 2024'
      },
      {
        title: 'Test Result 2',
        url: 'https://example.com/2',
        content: 'Another test result with different content and another date: Wed, 28 May 2024. More content here to make this longer as well. We want to ensure that the JSON is large enough to trigger the truncation issue that we are seeing in the production environment. Adding more text here to increase the size of the JSON payload.',
        score: 0.90,
        publishedDate: 'Wed, 28 May 2024'
      },
      {
        title: 'Test Result 3',
        url: 'https://example.com/3',
        content: 'A third result to make the JSON even larger. This one also has a date: Thu, 29 May 2024. We continue to add more content to ensure we can reproduce the exact truncation issue. The goal is to have a JSON structure that when escaped for stream transport becomes large enough to be truncated at the problematic position.',
        score: 0.85,
        publishedDate: 'Thu, 29 May 2024'
      }
    ],
    formattedText: 'Formatted search results text that is also quite long to contribute to the overall size of the JSON payload. This formatted text would typically contain a summary of all the search results in a human-readable format.',
    citations: ['Citation 1 with some text', 'Citation 2 with more text', 'Citation 3 with even more text to make it longer'],
    responseTime: 1234,
    images: [
      { url: 'https://example.com/image1.jpg', alt: 'Image 1 description' },
      { url: 'https://example.com/image2.jpg', alt: 'Image 2 description' }
    ]
  }
};

// Convert to JSON and escape for stream
const jsonStr = JSON.stringify(testData);
console.log('Original JSON length:', jsonStr.length);
console.log('Original JSON valid:', (() => { try { JSON.parse(jsonStr); return true; } catch { return false; } })());

// Escape for stream
const escaped = escapeForStream(jsonStr);
console.log('\nEscaped length:', escaped.length);

// Find where "ate":"Tue, 27 May" appears in the escaped string
const datePattern = 'ate\\\\":\\\\"Tue, 27 May';
const dateIndex = escaped.indexOf(datePattern);
console.log(`\nLooking for pattern "${datePattern}"`);
if (dateIndex > 0) {
  console.log(`Found at position ${dateIndex}`);
  console.log('Context:', escaped.substring(dateIndex - 20, dateIndex + 40));
}

// Test parsing at different truncation points
console.log('\n=== Testing truncation at various points ===');
const truncationPoints = [1000, 1500, 1550, 1600, 2000, escaped.length];

for (const point of truncationPoints) {
  console.log(`\n--- Truncation at ${point} chars (${((point/escaped.length)*100).toFixed(1)}% of total) ---`);
  const truncated = escaped.substring(0, point);
  
  if (truncated.length < escaped.length) {
    console.log('Last 50 chars:', truncated.substring(Math.max(0, truncated.length - 50)));
  }
  
  try {
    const parsed = parseFromStream(truncated);
    console.log('✅ Parse result: SUCCESS');
  } catch (error) {
    console.log('❌ Parse failed');
  }
}

// Now let's check what might cause truncation at ~12304 bytes as mentioned in the issue
console.log('\n=== Checking specific byte limits ===');
const byteLimits = [8192, 12288, 12304, 16384];
for (const limit of byteLimits) {
  const truncated = escaped.substring(0, limit);
  console.log(`\nByte limit ${limit}:`);
  console.log(`- Characters: ${truncated.length}`);
  console.log(`- Last 30 chars: "${truncated.substring(Math.max(0, truncated.length - 30))}"`);
  
  // Check if it ends mid-escape sequence
  const lastFew = truncated.substring(Math.max(0, truncated.length - 10));
  if (lastFew.includes('\\') && !lastFew.endsWith('\\\\')) {
    console.log('⚠️  WARNING: Truncation might be in the middle of an escape sequence!');
  }
}