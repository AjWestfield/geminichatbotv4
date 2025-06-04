#!/usr/bin/env node

// Test script to verify the streaming format fix

import { formatSSEMessage, cleanStreamContent } from './lib/stream-formatter.js';

console.log('Testing SSE Stream Format Fix\n');

// Test cases
const testCases = [
  {
    name: 'Simple text',
    type: 0,
    data: 'Hello, world!',
    expected: 'data: 0:"Hello, world!"\n\n'
  },
  {
    name: 'Text with quotes',
    type: 0,
    data: 'He said "Hello"',
    expected: 'data: 0:"He said \\"Hello\\""\n\n'
  },
  {
    name: 'Text with newlines',
    type: 0,
    data: 'Line 1\nLine 2\nLine 3',
    expected: 'data: 0:"Line 1\\nLine 2\\nLine 3"\n\n'
  },
  {
    name: 'Text with special characters',
    type: 0,
    data: 'Tab:\t Backslash:\\ Quote:" Newline:\n',
    expected: 'data: 0:"Tab:\\t Backslash:\\\\ Quote:\\" Newline:\\n"\n\n'
  },
  {
    name: 'Tool call object',
    type: 9,
    data: { toolCallId: 'test-123', toolName: 'web_search', args: { query: 'AI news' } },
    expected: 'data: 9:{"toolCallId":"test-123","toolName":"web_search","args":{"query":"AI news"}}\n\n'
  },
  {
    name: 'Finish message',
    type: 'd',
    data: { finishReason: 'stop' },
    expected: 'data: d:{"finishReason":"stop"}\n\n'
  },
  {
    name: 'Error message',
    type: 3,
    data: 'An error occurred',
    expected: 'data: 3:"An error occurred"\n\n'
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach(test => {
  try {
    const result = formatSSEMessage(test.type, test.data);
    if (result === test.expected) {
      console.log(`✅ ${test.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Expected: ${JSON.stringify(test.expected)}`);
      console.log(`   Got:      ${JSON.stringify(result)}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Test AI SDK compatibility by simulating parseDataStreamPart
console.log('\n--- Testing AI SDK Compatibility ---');

function simulateParseDataStreamPart(line) {
  if (!line.startsWith('data: ')) {
    throw new Error('Invalid stream format');
  }
  
  const data = line.slice(6).trim(); // Remove 'data: '
  const colonIndex = data.indexOf(':');
  
  if (colonIndex === -1) {
    throw new Error('Invalid code data');
  }
  
  const code = data.slice(0, colonIndex);
  const value = data.slice(colonIndex + 1);
  
  // Try to parse the value
  try {
    const parsed = JSON.parse(value);
    return { code, value: parsed };
  } catch (error) {
    throw new Error(`Failed to parse stream string. Invalid code data: ${error.message}`);
  }
}

// Test parsing
console.log('\nTesting stream parsing:');
const streamTests = [
  formatSSEMessage(0, 'Hello, world!').trim(),
  formatSSEMessage(0, 'Text with "quotes" and\nnewlines').trim(),
  formatSSEMessage(9, { toolCallId: 'test', toolName: 'search' }).trim(),
  formatSSEMessage('d', { finishReason: 'stop' }).trim()
];

streamTests.forEach((stream, i) => {
  try {
    const parsed = simulateParseDataStreamPart(stream);
    console.log(`✅ Parse test ${i + 1}: SUCCESS - Code: ${parsed.code}, Value type: ${typeof parsed.value}`);
  } catch (error) {
    console.log(`❌ Parse test ${i + 1}: FAILED - ${error.message}`);
    console.log(`   Stream: ${stream}`);
  }
});

process.exit(failed > 0 ? 1 : 0);
