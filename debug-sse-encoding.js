#!/usr/bin/env node

// Debug SSE encoding size issues

const encoder = new TextEncoder();

// Test data size calculations
function testSSEEncoding(dataSize) {
  // Create test data of specified size
  const testData = {
    type: 'webSearchResults',
    data: {
      query: 'test query',
      results: Array(10).fill(null).map((_, i) => ({
        title: `Result ${i}`,
        url: `https://example.com/${i}`,
        content: 'x'.repeat(Math.floor(dataSize / 15)), // Distribute size across results
        score: 0.9
      }))
    }
  };
  
  const jsonStr = JSON.stringify(testData);
  console.log(`\n=== Testing with target size ~${dataSize} bytes ===`);
  console.log('Original JSON size:', jsonStr.length, 'bytes');
  
  // Escape for stream (mimicking stringifyForStream)
  const escaped = jsonStr
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  console.log('Escaped size:', escaped.length, 'bytes');
  
  // Wrap in WEB_SEARCH_RESULTS tags
  const streamData = `[WEB_SEARCH_RESULTS]${escaped}[/WEB_SEARCH_RESULTS]`;
  console.log('With tags size:', streamData.length, 'bytes');
  
  // SSE format with additional escaping
  const sseFormatted = `0:"${streamData.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
  console.log('SSE formatted size:', sseFormatted.length, 'bytes');
  
  // Encode to bytes
  const encoded = encoder.encode(sseFormatted);
  console.log('Encoded byte size:', encoded.length, 'bytes');
  
  // Check if it exceeds common buffer limits
  const limits = [8192, 12288, 16384, 32768];
  for (const limit of limits) {
    if (encoded.length > limit && encoded.length < limit + 1000) {
      console.log(`⚠️  WARNING: Size ${encoded.length} is just over ${limit} byte limit!`);
    }
  }
  
  return encoded.length;
}

// Test various sizes
console.log('Testing SSE encoding size expansion...\n');

// Test the reported sizes from the error
const reportedServerSize = 13010;
const reportedClientSize = 12304;

console.log(`Reported server size: ${reportedServerSize} bytes`);
console.log(`Reported client size: ${reportedClientSize} bytes`);
console.log(`Difference: ${reportedServerSize - reportedClientSize} bytes`);
console.log(`Client received: ${((reportedClientSize / reportedServerSize) * 100).toFixed(1)}% of data`);

// Test sizes around the problematic range
testSSEEncoding(10000);
testSSEEncoding(11000);
testSSEEncoding(12000);
testSSEEncoding(13000);
testSSEEncoding(14000);

// Calculate what original size would result in ~12304 bytes after encoding
console.log('\n=== Reverse calculation ===');
console.log('If client receives 12304 bytes, working backwards:');
// SSE format adds: '0:"' prefix (3) + '"\n' suffix (3) = 6 bytes
// Plus double escaping of quotes and newlines
const withoutSSEWrapper = 12304 - 6;
console.log(`Without SSE wrapper: ~${withoutSSEWrapper} bytes`);
// The [WEB_SEARCH_RESULTS] tags add 42 bytes
const withoutTags = withoutSSEWrapper - 42;
console.log(`Without tags: ~${withoutTags} bytes`);
// Escaping roughly adds 10-20% depending on content
const originalEstimate = Math.floor(withoutTags / 1.15);
console.log(`Original JSON estimate: ~${originalEstimate} bytes`);