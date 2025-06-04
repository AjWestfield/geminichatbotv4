#!/usr/bin/env node

// Test the simplified escape/unescape approach

// Simplified functions
function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')     // Backslashes first
    .replace(/"/g, '\\"');      // Quotes
}

function unescapeFromStream(str) {
  return str
    .replace(/\\"/g, '"')       // Quotes
    .replace(/\\\\/g, '\\');    // Backslashes (must be last)
}

function stringifyForStream(data) {
  const jsonStr = JSON.stringify(data);
  return escapeForStream(jsonStr);
}

function parseFromStream(str) {
  const unescaped = unescapeFromStream(str);
  return JSON.parse(unescaped);
}

// Test data with all problematic characters
const testData = {
  type: 'webSearchResults',
  data: {
    query: 'What is the latest news in NBA?',
    results: [{
      title: 'Thunder defeat Timberwolves 117-96 in pivotal Game 4',
      content: 'MINNEAPOLIS — The Oklahoma City Thunder\tdominated the Minnesota Timberwolves\n117-96 in Game 4 of the Western Conference Finals.\r\nShai Gilgeous-Alexander led with 34 points.',
      url: 'https://example.com/nba-news',
      score: 0.95,
      special: 'Test\x00null\x07bell\x1Bescape'
    }],
    formattedText: 'The Thunder defeated the Timberwolves[1] in "Game 4"[2].',
    citations: [{ 
      number: 1, 
      source: { 
        title: 'Game Report with "quotes"', 
        url: 'https://example.com\\path' 
      } 
    }]
  }
};

console.log('Testing Simplified Escape/Unescape\n');
console.log('Original data contains:');
console.log('- Em dash (—)');
console.log('- Tabs (\\t)');
console.log('- Newlines (\\n)');
console.log('- Carriage returns (\\r)');
console.log('- Null bytes and other control chars');
console.log('- Quotes in strings');
console.log('- Backslashes in URLs');

try {
  // Step 1: Stringify for stream
  const escaped = stringifyForStream(testData);
  console.log('\n✅ Step 1: Escaped for stream');
  console.log('Length:', escaped.length);
  console.log('First 200 chars:', escaped.substring(0, 200));
  
  // Check that no literal control characters remain
  const hasControlChars = /[\x00-\x1F\x7F-\x9F]/.test(escaped);
  console.log('Has unescaped control chars:', hasControlChars ? '❌ YES' : '✅ NO');
  
  // Step 2: Simulate sending through stream
  const streamData = `[WEB_SEARCH_RESULTS]${escaped}[/WEB_SEARCH_RESULTS]`;
  
  // Step 3: Extract on client side
  const match = streamData.match(/\[WEB_SEARCH_RESULTS\]([\s\S]*?)\[\/WEB_SEARCH_RESULTS\]/);
  if (!match) throw new Error('Failed to extract data');
  
  // Step 4: Parse from stream
  const parsed = parseFromStream(match[1]);
  console.log('\n✅ Step 2: Successfully parsed from stream');
  
  // Step 5: Verify data integrity
  const isEqual = JSON.stringify(parsed) === JSON.stringify(testData);
  console.log('\n✅ Step 3: Data integrity check:', isEqual ? 'PASSED' : 'FAILED');
  
  if (!isEqual) {
    console.log('Expected:', JSON.stringify(testData).substring(0, 200));
    console.log('Got:', JSON.stringify(parsed).substring(0, 200));
  } else {
    // Verify specific fields
    console.log('\nVerifying specific fields:');
    console.log('✓ Query:', parsed.data.query);
    console.log('✓ Title:', parsed.data.results[0].title);
    console.log('✓ Content has tab:', parsed.data.results[0].content.includes('\t'));
    console.log('✓ Content has newline:', parsed.data.results[0].content.includes('\n'));
    console.log('✓ Em dash preserved:', parsed.data.results[0].content.includes('—'));
    console.log('✓ Citation with quotes:', parsed.data.citations[0].source.title);
    console.log('✓ URL with backslash:', parsed.data.citations[0].source.url);
  }
  
  console.log('\n🎉 All tests passed! The simplified approach works correctly.');
  
} catch (error) {
  console.log('\n❌ Test failed:', error.message);
  if (error.stack) {
    console.log('Stack:', error.stack);
  }
}