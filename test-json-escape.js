#!/usr/bin/env node

// Test script for JSON escaping/unescaping utilities
const { escapeForStream, unescapeFromStream, stringifyForStream, parseFromStream } = require('./lib/json-escape-utils');

console.log('Testing JSON Escape Utilities\n');

// Test data with various problematic characters
const testCases = [
  {
    name: 'Basic text',
    data: { message: 'Hello World' }
  },
  {
    name: 'Quotes and backslashes',
    data: { message: 'He said "Hello" and used \\ backslash' }
  },
  {
    name: 'Newlines and tabs',
    data: { message: 'Line 1\nLine 2\tTabbed' }
  },
  {
    name: 'All control characters',
    data: { 
      message: 'Test\x00null\x01soh\x02stx\x03etx\x04eot\x05enq\x06ack\x07bell\x08bs\x09tab\x0Alf\x0Bvt\x0Cff\x0Dcr\x0Eso\x0Fsi\x10dle\x11dc1\x12dc2\x13dc3\x14dc4\x15nak\x16syn\x17etb\x18can\x19em\x1Asub\x1Besc\x1Cfs\x1Dgs\x1Ers\x1Fus'
    }
  },
  {
    name: 'Unicode characters',
    data: { message: 'Emoji: 😀 Chinese: 你好 Special: €£¥' }
  },
  {
    name: 'Mixed problematic content',
    data: { 
      title: 'Test "Article"',
      content: 'Line 1\nLine 2\r\nLine 3\tTabbed\x00Null byte',
      special: '\x1B[31mRed text\x1B[0m'
    }
  },
  {
    name: 'NBA search results simulation',
    data: {
      type: 'webSearchResults',
      data: {
        query: 'NBA news',
        results: [
          {
            title: 'Thunder defeat Timberwolves 117-96',
            content: 'Oklahoma City Thunder\tdefeated\nMinnesota Timberwolves\r\nin Game 4'
          }
        ]
      }
    }
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('Original:', JSON.stringify(testCase.data));
  
  try {
    // Test stringifyForStream and parseFromStream
    const escaped = stringifyForStream(testCase.data);
    console.log('Escaped length:', escaped.length);
    console.log('Escaped sample:', escaped.substring(0, 100) + (escaped.length > 100 ? '...' : ''));
    
    const parsed = parseFromStream(escaped);
    const isEqual = JSON.stringify(parsed) === JSON.stringify(testCase.data);
    
    if (isEqual) {
      console.log('✅ PASSED: Round-trip successful');
      passed++;
    } else {
      console.log('❌ FAILED: Data mismatch after round-trip');
      console.log('Expected:', JSON.stringify(testCase.data));
      console.log('Got:', JSON.stringify(parsed));
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED with error:', error.message);
    failed++;
  }
  
  console.log('---\n');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);

// Test specific edge cases
console.log('\nEdge Case Tests:');

// Test double escaping
const doubleEscapeTest = '{"test": "value with \\"quotes\\" and \\n newline"}';
console.log('Double escape test input:', doubleEscapeTest);
try {
  const unescaped = unescapeFromStream(doubleEscapeTest);
  console.log('Unescaped:', unescaped);
  const parsed = JSON.parse(unescaped);
  console.log('✅ Double escape handled correctly');
} catch (e) {
  console.log('❌ Double escape failed:', e.message);
}

process.exit(failed > 0 ? 1 : 0);