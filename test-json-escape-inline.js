#!/usr/bin/env node

// Inline versions of the escape utilities for testing
function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')     // Backslashes must be first
    .replace(/"/g, '\\"')       // Quotes
    .replace(/\n/g, '\\n')      // Newlines
    .replace(/\r/g, '\\r')      // Carriage returns
    .replace(/\t/g, '\\t')      // Tabs
    .replace(/\f/g, '\\f')      // Form feeds
    .replace(/[\b]/g, '\\b')    // Backspace (use character class to avoid word boundary)
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x7F-\x9F]/g, (char) => {
      // Escape any other control characters as unicode
      // Skip chars already handled: \b (08), \t (09), \n (0A), \f (0C), \r (0D)
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
}

function unescapeFromStream(str) {
  return str
    .replace(/\\n/g, '\n')      // Newlines
    .replace(/\\r/g, '\r')      // Carriage returns
    .replace(/\\t/g, '\t')      // Tabs
    .replace(/\\f/g, '\f')      // Form feeds
    .replace(/\\b/g, '\b')      // Backspace
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      // Unescape unicode characters
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/\\"/g, '"')       // Quotes
    .replace(/\\\\/g, '\\');    // Backslashes must be last
}

function stringifyForStream(data) {
  const jsonStr = JSON.stringify(data);
  return escapeForStream(jsonStr);
}

function parseFromStream(str) {
  const unescaped = unescapeFromStream(str);
  return JSON.parse(unescaped);
}

console.log('Testing JSON Escape Utilities\n');

// Test problematic NBA content
const nbaTest = {
  type: 'webSearchResults',
  data: {
    query: 'What is the latest news in NBA?',
    results: [
      {
        title: 'Thunder defeat Timberwolves 117-96 in pivotal Game 4',
        content: 'MINNEAPOLIS — The Oklahoma City Thunder\tdominated the Minnesota Timberwolves\n117-96 in Game 4 of the Western Conference Finals.\r\nShai Gilgeous-Alexander led with 34 points.',
        url: 'https://example.com/nba-news',
        score: 0.95
      }
    ],
    formattedText: 'The Thunder defeated the Timberwolves[1] in Game 4[2].',
    citations: [
      { number: 1, source: { title: 'Game Report', url: 'https://example.com' } }
    ]
  }
};

console.log('Testing NBA search results with problematic characters...');
console.log('Original data has tabs, newlines, and carriage returns');

let escaped = '';
try {
  // Simulate what happens in the server
  escaped = stringifyForStream(nbaTest);
  console.log('\nEscaped length:', escaped.length);
  console.log('First 200 chars:', escaped.substring(0, 200));
  console.log('Position 732 area:', escaped.substring(712, 752));
  
  // Check for any unescaped control characters
  const controlChars = escaped.match(/[\x00-\x1F\x7F-\x9F]/g);
  if (controlChars && controlChars.length > 0) {
    console.log('\n❌ Found unescaped control characters:', controlChars.map(c => '0x' + c.charCodeAt(0).toString(16)));
  } else {
    console.log('\n✅ No unescaped control characters found');
  }
  
  // Simulate what happens in the client
  const parsed = parseFromStream(escaped);
  
  // Verify round trip
  const isEqual = JSON.stringify(parsed) === JSON.stringify(nbaTest);
  console.log('\nRound-trip test:', isEqual ? '✅ PASSED' : '❌ FAILED');
  
  if (!isEqual) {
    console.log('Expected:', JSON.stringify(nbaTest).substring(0, 200));
    console.log('Got:', JSON.stringify(parsed).substring(0, 200));
  }
  
} catch (error) {
  console.log('\n❌ Error during testing:', error.message);
  if (error.message.includes('position')) {
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      console.log('Error position:', pos);
      console.log('Characters around error:', escaped.substring(pos - 20, pos + 20));
    }
  }
}

// Test edge cases
console.log('\n\nTesting edge cases...');

const edgeCases = [
  { name: 'Null byte', data: { text: 'Hello\x00World' } },
  { name: 'Bell character', data: { text: 'Alert\x07Sound' } },
  { name: 'Escape character', data: { text: 'Color\x1B[31mRed\x1B[0m' } },
  { name: 'Form feed', data: { text: 'Page\x0CBreak' } },
  { name: 'Mixed quotes', data: { text: 'He said "Hello" and she said \'Hi\'' } },
  { name: 'Unicode emoji', data: { text: '🏀 NBA 🏆' } }
];

edgeCases.forEach(testCase => {
  try {
    const escaped = stringifyForStream(testCase.data);
    const parsed = parseFromStream(escaped);
    const passed = JSON.stringify(parsed) === JSON.stringify(testCase.data);
    console.log(`${testCase.name}: ${passed ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`${testCase.name}: ❌ (${e.message})`);
  }
});

console.log('\nDone!');