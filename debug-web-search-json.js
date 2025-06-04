#!/usr/bin/env node

// Debug script to understand the JSON parsing issue

const { escapeForStream, unescapeFromStream } = require('./lib/json-escape-utils');

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
      },
      {
        title: 'NBA Draft 2024: Top prospects and team needs',
        url: 'https://www.theringer.com/nba/2024/5/24/nba-draft-preview',
        content: 'As the playoffs continue, NBA teams are also focusing on the upcoming draft. Several franchises are eyeing potential game-changers who could reshape their rosters for years to come.',
        score: 0.85,
        published_date: '2024-05-24'
      },
      {
        title: 'Trade rumors: 76ers exploring options for roster upgrade',
        url: 'https://www.philadelphia.com/sixers/trade-rumors-2024',
        content: 'PHILADELPHIA — The 76ers are reportedly exploring trade options to strengthen their roster. Sources indicate the team is looking to add another star player to complement Joel Embiid.',
        score: 0.82,
        published_date: '2024-05-23'
      }
    ],
    images: [
      {
        url: 'https://images.nba.com/thunder-win.jpg',
        description: 'Thunder celebrate Game 4 victory'
      },
      {
        url: 'https://images.espn.com/knicks-pacers.jpg',
        description: 'Knicks vs Pacers Game 5 preview'
      }
    ],
    formattedText: 'Based on the latest NBA news[1], the playoffs are in full swing with the Thunder defeating the Timberwolves[2] and the Knicks preparing for Game 5[3].',
    citations: [
      { number: 1, source: { title: 'NBA Playoffs Update', url: 'https://nba.com' } },
      { number: 2, source: { title: 'Thunder Win', url: 'https://nba.com/thunder' } },
      { number: 3, source: { title: 'Knicks Preview', url: 'https://espn.com/knicks' } }
    ],
    responseTime: 8.78
  }
};

console.log('Testing Web Search JSON Handling\n');

// Step 1: JSON.stringify
const jsonStr = JSON.stringify(testData);
console.log('1. JSON.stringify length:', jsonStr.length);
console.log('   Contains literal newlines?', jsonStr.includes('\n'));
console.log('   Contains literal tabs?', jsonStr.includes('\t'));
console.log('   Position 1550 area:', jsonStr.substring(1530, 1570));

// Step 2: Escape for stream
const escaped = escapeForStream(jsonStr);
console.log('\n2. After escapeForStream length:', escaped.length);
console.log('   First 100 chars:', escaped.substring(0, 100));
console.log('   Position 1550 area:', escaped.substring(1530, 1570));

// Check for any literal newlines that might break SSE
const newlineIndex = escaped.indexOf('\n');
if (newlineIndex > -1) {
  console.log('   ⚠️  Found literal newline at position:', newlineIndex);
  console.log('   Context:', escaped.substring(newlineIndex - 20, newlineIndex + 20));
}

// Step 3: Simulate SSE transport
const sseData = `0:"[WEB_SEARCH_RESULTS]${escaped}[/WEB_SEARCH_RESULTS]"\n`;
console.log('\n3. SSE data length:', sseData.length);

// Check if SSE format is valid
const sseLines = sseData.split('\n');
console.log('   SSE lines count:', sseLines.length);
if (sseLines.length > 2) {
  console.log('   ⚠️  Multiple lines detected! SSE format may be broken.');
  console.log('   Line 1 length:', sseLines[0].length);
  console.log('   Line 2 preview:', sseLines[1].substring(0, 50));
}

// Step 4: Extract and parse
const extractMatch = sseData.match(/\[WEB_SEARCH_RESULTS\]([\s\S]*?)\[\/WEB_SEARCH_RESULTS\]/);
if (extractMatch) {
  const extracted = extractMatch[1];
  console.log('\n4. Extracted data length:', extracted.length);
  
  // Step 5: Unescape
  const unescaped = unescapeFromStream(extracted);
  console.log('\n5. After unescape length:', unescaped.length);
  console.log('   Position 1550 area:', unescaped.substring(1530, 1570));
  
  // Try to parse
  try {
    const parsed = JSON.parse(unescaped);
    console.log('\n✅ Successfully parsed!');
    console.log('   Type:', parsed.type);
    console.log('   Results count:', parsed.data.results.length);
  } catch (error) {
    console.log('\n❌ Parse error:', error.message);
    
    if (error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        console.log('\nError at position:', pos);
        console.log('Context:', unescaped.substring(pos - 30, pos + 30));
        console.log('Marker: ', ' '.repeat(30) + '^');
        
        // Check what character is at that position
        console.log('Char at error:', unescaped.charAt(pos));
        console.log('Char code:', unescaped.charCodeAt(pos));
        
        // Try to find the issue
        const beforeError = unescaped.substring(0, pos);
        const openBraces = (beforeError.match(/{/g) || []).length;
        const closeBraces = (beforeError.match(/}/g) || []).length;
        const openBrackets = (beforeError.match(/\[/g) || []).length;
        const closeBrackets = (beforeError.match(/\]/g) || []).length;
        
        console.log('\nStructure analysis before error:');
        console.log('Open braces:', openBraces, 'Close braces:', closeBraces);
        console.log('Open brackets:', openBrackets, 'Close brackets:', closeBrackets);
        console.log('Imbalance: braces =', openBraces - closeBraces, ', brackets =', openBrackets - closeBrackets);
      }
    }
  }
}

// Test with actual failing data size
console.log('\n\nTesting with larger dataset...');
// Add more content to reach the failing size
const largeData = { ...testData };
largeData.data.results = [];
for (let i = 0; i < 20; i++) {
  largeData.data.results.push({
    title: `NBA News Item ${i + 1}: Latest updates from around the league including trades and signings`,
    url: `https://example.com/news/${i}`,
    content: `Detailed news content ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. The NBA continues to deliver exciting moments as teams battle for playoff positioning. Players are giving their all on the court, showcasing incredible talent and determination.`,
    score: 0.9 - (i * 0.01),
    published_date: '2024-05-25'
  });
}

const largeJson = JSON.stringify(largeData);
console.log('Large JSON length:', largeJson.length);

// Test the large data
try {
  const largeEscaped = escapeForStream(largeJson);
  const largeUnescaped = unescapeFromStream(largeEscaped);
  JSON.parse(largeUnescaped);
  console.log('✅ Large dataset parsed successfully');
} catch (error) {
  console.log('❌ Large dataset failed:', error.message);
}