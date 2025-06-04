#!/usr/bin/env node

// Debug script with inline functions to understand the JSON parsing issue

// Inline escape utilities
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

// Simulate a large web search result similar to what's failing
const testData = {
  type: 'webSearchResults',
  data: {
    query: 'What is the latest news in NBA?',
    answer: 'The NBA playoffs are heating up with exciting matchups in both conferences.',
    results: [
      {
        title: 'Thunder defeat Timberwolves 117-96 in Game 4',
        url: 'https://www.nba.com/news/thunder-timberwolves-game-4',
        content: 'MINNEAPOLIS — The Oklahoma City Thunder dominated the Minnesota Timberwolves 117-96 in Game 4 of the Western Conference Finals. Shai Gilgeous-Alexander led the Thunder with 34 points, while the Timberwolves struggled offensively throughout the game.',
        score: 0.95,
        published_date: '2024-05-25'
      },
      {
        title: 'Knicks prepare for crucial Game 5 against Pacers',
        url: 'https://www.espn.com/nba/story/_/id/40206789',
        content: 'NEW YORK — The New York Knicks are gearing up for a pivotal Game 5 against the Indiana Pacers in the Eastern Conference Finals. With the series tied 2-2, both teams understand the importance of securing a victory.',
        score: 0.92,
        published_date: '2024-05-25'
      },
      {
        title: 'Celtics\' Jayson Tatum: "We\'re ready for the challenge"',
        url: 'https://www.boston.com/sports/celtics/tatum-interview',
        content: 'BOSTON — Jayson Tatum expressed confidence in the Celtics\' preparation for the upcoming playoffs. "We\'ve worked hard all season for this moment," Tatum said in a recent interview.',
        score: 0.88,
        published_date: '2024-05-24'
      }
    ],
    images: [
      {
        url: 'https://images.nba.com/thunder-win.jpg',
        description: 'Thunder celebrate Game 4 victory'
      }
    ],
    formattedText: 'Based on the latest NBA news[1], the playoffs are in full swing[2].',
    citations: [
      { number: 1, source: { title: 'NBA Playoffs Update', url: 'https://nba.com' } },
      { number: 2, source: { title: 'Thunder Win', url: 'https://nba.com/thunder' } }
    ],
    responseTime: 8.78
  }
};

console.log('Testing Web Search JSON Handling\n');

// Step 1: JSON.stringify
const jsonStr = JSON.stringify(testData);
console.log('1. JSON.stringify length:', jsonStr.length);
console.log('   Sample:', jsonStr.substring(0, 100) + '...');

// Find position 1550 if it exists
if (jsonStr.length > 1550) {
  console.log('   Position 1550 area:', jsonStr.substring(1530, 1570));
  console.log('   Char at 1550:', jsonStr.charAt(1550), 'Code:', jsonStr.charCodeAt(1550));
}

// Step 2: Escape for stream
const escaped = escapeForStream(jsonStr);
console.log('\n2. After escapeForStream length:', escaped.length);

// Check for problematic characters
console.log('   Contains unescaped quotes?', /(?<!\\)"/.test(escaped.substring(1, escaped.length - 1)));
console.log('   Contains literal newlines?', escaped.includes('\n'));
console.log('   Contains literal carriage returns?', escaped.includes('\r'));

// Step 3: Test round trip
console.log('\n3. Testing round trip...');
try {
  const unescaped = unescapeFromStream(escaped);
  console.log('   Unescaped length:', unescaped.length);
  console.log('   Matches original?', unescaped === jsonStr);
  
  if (unescaped !== jsonStr) {
    // Find first difference
    for (let i = 0; i < Math.min(jsonStr.length, unescaped.length); i++) {
      if (jsonStr[i] !== unescaped[i]) {
        console.log('   First difference at position:', i);
        console.log('   Original:', jsonStr.substring(i - 10, i + 10));
        console.log('   Unescaped:', unescaped.substring(i - 10, i + 10));
        break;
      }
    }
  }
  
  // Try to parse
  const parsed = JSON.parse(unescaped);
  console.log('   ✅ Successfully parsed!');
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Step 4: Test with position 1550 specifically
console.log('\n4. Creating data that will have content at position 1550...');

// Build a string that will be exactly the right size
let customData = {
  type: 'webSearchResults',
  data: {
    query: 'Test query',
    results: []
  }
};

// Add results until we get close to position 1550
while (JSON.stringify(customData).length < 1600) {
  customData.data.results.push({
    title: 'Test article with some content',
    content: 'This is test content that helps us reach the target position. ' + 'x'.repeat(50),
    url: 'https://example.com/test',
    score: 0.9
  });
}

const customJson = JSON.stringify(customData);
console.log('   Custom JSON length:', customJson.length);
if (customJson.length > 1550) {
  console.log('   Position 1550:', customJson.substring(1540, 1560));
  console.log('   Char at 1550:', customJson.charAt(1550), 'Code:', customJson.charCodeAt(1550));
}

// Test escaping this
try {
  const customEscaped = escapeForStream(customJson);
  const customUnescaped = unescapeFromStream(customEscaped);
  JSON.parse(customUnescaped);
  console.log('   ✅ Custom data parsed successfully');
} catch (error) {
  console.log('   ❌ Custom data error:', error.message);
}

// Step 5: Test SSE format issues
console.log('\n5. Testing SSE format edge cases...');

// Test data with quotes in specific positions
const edgeCaseData = {
  type: 'webSearchResults',
  data: {
    query: 'Test with "quotes" and other chars',
    results: [{
      title: 'Article with "quoted text" in title',
      content: 'Content with various characters: "quotes", \'single quotes\', back\\slash, and more.',
      special: 'Line 1\nLine 2\rLine 3\r\nLine 4'
    }]
  }
};

try {
  const edgeJson = JSON.stringify(edgeCaseData);
  console.log('   Edge case JSON sample:', edgeJson.substring(0, 150));
  
  const edgeEscaped = escapeForStream(edgeJson);
  const edgeUnescaped = unescapeFromStream(edgeEscaped);
  
  // Check if unescaping is correct
  console.log('   Unescaped correctly?', edgeUnescaped === edgeJson);
  
  JSON.parse(edgeUnescaped);
  console.log('   ✅ Edge cases handled correctly');
} catch (error) {
  console.log('   ❌ Edge case error:', error.message);
  console.log('   Error details:', error);
}