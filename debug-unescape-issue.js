// Debug the unescape issue

// The problem: we're converting escape sequences to literal characters
// But JSON.parse needs them to remain as escape sequences

const testStr = 'Thunder\\tdominated';
console.log('Test string:', testStr);
console.log('Length:', testStr.length);

// Our current unescape converts \t to literal tab
const wrongUnescape = testStr.replace(/\\t/g, '\t');
console.log('\nWrong unescape:', wrongUnescape);
console.log('Contains literal tab?', wrongUnescape.includes('\t'));

// Try to parse JSON with literal tab
try {
  JSON.parse(`"${wrongUnescape}"`);
  console.log('✅ JSON.parse succeeded (unexpected)');
} catch (e) {
  console.log('❌ JSON.parse failed:', e.message);
}

// The correct approach: we need to handle the double escaping differently
console.log('\n=== Understanding the problem ===');

// What we have after escapeForStream
const afterEscape = '{\"content\":\"Thunder\\\\tdominated\"}';
console.log('After escape:', afterEscape);

// Our unescape function
function wrongUnescapeFromStream(str) {
  return str
    .replace(/\\n/g, '\n')      // This is WRONG for JSON
    .replace(/\\t/g, '\t')      // This is WRONG for JSON
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Correct unescape function
function correctUnescapeFromStream(str) {
  return str
    .replace(/\\"/g, '"')       // Unescape quotes
    .replace(/\\\\/g, '\\');    // Unescape backslashes
  // Do NOT unescape \n, \t, etc - leave them for JSON.parse
}

console.log('\nUsing wrong unescape:');
const wrongResult = wrongUnescapeFromStream(afterEscape);
console.log('Result:', wrongResult);
try {
  JSON.parse(wrongResult);
  console.log('✅ Parsed successfully');
} catch (e) {
  console.log('❌ Parse failed:', e.message);
}

console.log('\nUsing correct unescape:');
const correctResult = correctUnescapeFromStream(afterEscape);
console.log('Result:', correctResult);
try {
  const parsed = JSON.parse(correctResult);
  console.log('✅ Parsed successfully');
  console.log('Content:', parsed.content);
} catch (e) {
  console.log('❌ Parse failed:', e.message);
}