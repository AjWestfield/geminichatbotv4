// Debug the parsing issue

// Simulate what happens
const webSearchResults = {
  query: 'What is the latest news in NBA?',
  results: [{
    title: 'Thunder defeat Timberwolves 117-96 in pivotal Game 4',
    content: 'MINNEAPOLIS — The Oklahoma City Thunder\tdominated the Minnesota Timberwolves\n117-96 in Game 4 of the Western Conference Finals.\r\nShai Gilgeous-Alexander led with 34 points.',
    url: 'https://example.com/nba-news',
    score: 0.95
  }]
};

// Server side
function stringifyForStream(data) {
  const jsonStr = JSON.stringify(data);
  return escapeForStream(jsonStr);
}

function escapeForStream(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/[\b]/g, '\\b')
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x7F-\x9F]/g, (char) => {
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
}

// Client side
function unescapeFromStream(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\f/g, '\f')
    .replace(/\\b/g, '\b')
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    })
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseFromStream(str) {
  const unescaped = unescapeFromStream(str);
  return JSON.parse(unescaped);
}

// Test the full flow
const searchPayload = {
  type: 'webSearchResults',
  data: webSearchResults
};

console.log('=== SERVER SIDE ===');
const escaped = stringifyForStream(searchPayload);
console.log('Escaped length:', escaped.length);
console.log('Position 200-210:', escaped.substring(200, 210));
console.log('Char codes at 200-210:', 
  Array.from(escaped.substring(200, 210)).map(c => c.charCodeAt(0)));

// This is what would be sent in the stream
const streamData = `[WEB_SEARCH_RESULTS]${escaped}[/WEB_SEARCH_RESULTS]`;
console.log('\nStream data length:', streamData.length);

console.log('\n=== CLIENT SIDE ===');
// Extract the content (simulating the regex match)
const match = streamData.match(/\[WEB_SEARCH_RESULTS\]([\s\S]*?)\[\/WEB_SEARCH_RESULTS\]/);
if (match) {
  const extractedData = match[1];
  console.log('Extracted data length:', extractedData.length);
  console.log('Position 200-210:', extractedData.substring(200, 210));
  
  try {
    // Try to parse
    const parsed = parseFromStream(extractedData);
    console.log('\n✅ Successfully parsed!');
    console.log('Query:', parsed.data.query);
    console.log('First result title:', parsed.data.results[0].title);
  } catch (error) {
    console.log('\n❌ Parse error:', error.message);
    
    // Debug the exact position
    if (error.message.includes('position')) {
      const posMatch = error.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.log('\nError at position:', pos);
        console.log('Context:', extractedData.substring(pos - 20, pos + 20));
        
        // Try unescaping to see what happens
        console.log('\nAfter unescape:');
        const unescaped = unescapeFromStream(extractedData);
        console.log('Position around error:', unescaped.substring(pos - 20, pos + 20));
        console.log('Char at position:', unescaped.charAt(pos), 'Code:', unescaped.charCodeAt(pos));
      }
    }
  }
}