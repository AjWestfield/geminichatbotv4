// Debug the actual escape flow

// Our test data
const webSearchResults = {
  query: 'What is the latest news in NBA?',
  results: [{
    title: 'Thunder defeat Timberwolves 117-96 in pivotal Game 4',
    content: 'MINNEAPOLIS — The Oklahoma City Thunder\tdominated the Minnesota Timberwolves\n117-96 in Game 4 of the Western Conference Finals.\r\nShai Gilgeous-Alexander led with 34 points.',
    url: 'https://example.com/nba-news',
    score: 0.95
  }],
  formattedText: 'The Thunder defeated the Timberwolves[1] in Game 4[2].',
  citations: [{ number: 1, source: { title: 'Game Report', url: 'https://example.com' } }]
};

// This is what stringifyForStream does
function stringifyForStream(data) {
  const jsonStr = JSON.stringify(data);
  return escapeForStream(jsonStr);
}

function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')     // Backslashes first
    .replace(/"/g, '\\"')       // Quotes
    .replace(/\n/g, '\\n')      // Newlines
    .replace(/\r/g, '\\r')      // Carriage returns
    .replace(/\t/g, '\\t')      // Tabs
    .replace(/\f/g, '\\f')      // Form feeds
    .replace(/[\b]/g, '\\b')    // Backspace
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x7F-\x9F]/g, (char) => {
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
}

// Step 1: Create the payload
const searchPayload = {
  type: 'webSearchResults',
  data: webSearchResults
};

// Step 2: JSON.stringify
const jsonStr = JSON.stringify(searchPayload);
console.log('Step 1 - JSON.stringify length:', jsonStr.length);
console.log('First 300 chars:', jsonStr.substring(0, 300));
console.log('Around position 203:', jsonStr.substring(180, 220));

// Find the problematic content
const contentStart = jsonStr.indexOf('MINNEAPOLIS');
console.log('\nContent starts at position:', contentStart);
console.log('Content area:', jsonStr.substring(contentStart, contentStart + 100));

// Step 3: Escape for stream
const escaped = escapeForStream(jsonStr);
console.log('\nStep 2 - After escapeForStream length:', escaped.length);
console.log('First 300 chars:', escaped.substring(0, 300));

// Check for the actual issue
console.log('\nLooking for the problem:');

// The issue is that JSON.stringify already escapes some characters
// Let's see what happens
const testContent = 'MINNEAPOLIS — The Oklahoma City Thunder\tdominated';
console.log('\nOriginal content:', testContent);
console.log('After JSON.stringify:', JSON.stringify(testContent));

// When we JSON.stringify the whole object
const wholeObject = { content: testContent };
const wholeJson = JSON.stringify(wholeObject);
console.log('\nWhole object stringified:', wholeJson);

// Now when we escape this for stream
const wholeEscaped = escapeForStream(wholeJson);
console.log('After escape for stream:', wholeEscaped);

// The problem might be that JSON.stringify is already escaping \t as \\t
// and then we're trying to escape it again
console.log('\nChecking double escaping:');
const alreadyEscaped = '\\t';
console.log('Already escaped tab:', alreadyEscaped);
console.log('After our escape:', escapeForStream(alreadyEscaped));