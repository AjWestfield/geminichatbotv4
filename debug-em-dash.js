// Debug em dash character
const emDash = '—';
console.log('Em dash character:', emDash);
console.log('Char code:', emDash.charCodeAt(0));
console.log('Hex:', emDash.charCodeAt(0).toString(16));
console.log('Is it in range 0x7F-0x9F?', emDash.charCodeAt(0) >= 0x7F && emDash.charCodeAt(0) <= 0x9F);

// Test the escaping
const testStr = 'MINNEAPOLIS — The Oklahoma City Thunder';
console.log('\nOriginal:', testStr);

// Test JSON.stringify
const jsonStr = JSON.stringify(testStr);
console.log('JSON.stringify:', jsonStr);

// Check if the em dash needs escaping
console.log('\nTesting if em dash causes JSON parsing issues:');
try {
  const parsed = JSON.parse(jsonStr);
  console.log('✅ JSON.parse works fine with em dash');
} catch (e) {
  console.log('❌ JSON.parse failed:', e.message);
}

// Test with escaped version
const escaped = testStr.replace(/—/g, '\\u2014');
console.log('\nManually escaped:', JSON.stringify(escaped));

// The real issue might be with how we're escaping other characters
const problematicStr = 'MINNEAPOLIS — The Oklahoma\tCity Thunder\ndefeated';
console.log('\nProblematic string with tab and newline:');
console.log('Original:', JSON.stringify(problematicStr));

// Test our escape function
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

const jsonified = JSON.stringify(problematicStr);
console.log('\nJSON stringified:', jsonified);

const escaped2 = escapeForStream(jsonified);
console.log('Escaped for stream:', escaped2);

// Check position 203
console.log('\nChecking around position 203:');
console.log('Chars 180-220:', escaped2.substring(180, 220));
console.log('Char at 203:', escaped2.charAt(203), 'Code:', escaped2.charCodeAt(203));