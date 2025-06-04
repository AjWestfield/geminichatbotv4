#!/usr/bin/env node

/**
 * Test Video Detection Logic
 *
 * This script tests the video detection patterns to ensure they work correctly
 */

console.log('🔍 Testing Video Detection Logic');
console.log('=================================\n');

// Test the exact scenario from the terminal
const testMessage = "Animate the image so that the woman stands up and is walking towards the camera";
const testFileUri = "https://generativelanguage.googleapis.com/v1beta/files/y97s6h40kpgw";
const testFileMimeType = "image/jpeg";

console.log('Test Input:');
console.log(`Message: "${testMessage}"`);
console.log(`File URI: ${testFileUri}`);
console.log(`MIME Type: ${testFileMimeType}`);
console.log('');

// Test the patterns manually
const lowerMessage = testMessage.toLowerCase();
const hasUploadedImage = testFileUri && testFileMimeType?.startsWith('image/');

console.log('Detection Logic:');
console.log(`Lowercase message: "${lowerMessage}"`);
console.log(`Has uploaded image: ${hasUploadedImage}`);
console.log('');

// Image-to-video patterns
const imageToVideoPatterns = [
  /animate\s+(?:this|the)\s+image/i,
  /make\s+(?:this|the)\s+image\s+move/i,
  /turn\s+(?:this|the)\s+image\s+into\s+(?:a\s+)?video/i,
  /create\s+(?:an?\s+)?animation\s+from\s+(?:this|the)\s+image/i,
  /animate\s+(?:this|it)/i,
  /make\s+(?:this|it)\s+move/i,
  /bring\s+(?:this|the)\s+image\s+to\s+life/i,
  /add\s+motion\s+to\s+(?:this|the)\s+image/i
];

console.log('Testing Image-to-Video Patterns:');
if (hasUploadedImage) {
  for (let i = 0; i < imageToVideoPatterns.length; i++) {
    const pattern = imageToVideoPatterns[i];
    const matches = pattern.test(testMessage);
    console.log(`Pattern ${i} (${pattern.source}): ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);

    if (matches) {
      console.log(`🎯 DETECTION SUCCESS! Pattern ${i} matched the message.`);
      break;
    }
  }

  // Test general animation pattern
  const generalAnimationMatch = testMessage.match(/animate|animation|move|motion|video/i);
  console.log(`General animation pattern (/animate|animation|move|motion|video/i): ${generalAnimationMatch ? '✅ MATCH' : '❌ NO MATCH'}`);

  if (generalAnimationMatch) {
    console.log(`🎯 FALLBACK SUCCESS! General animation pattern matched.`);
  }
} else {
  console.log('❌ No uploaded image detected, skipping image-to-video patterns');
}

console.log('');

// Test what the actual detection function should return
if (hasUploadedImage && (imageToVideoPatterns[0].test(testMessage) || testMessage.match(/animate|animation|move|motion|video/i))) {
  console.log('✅ EXPECTED RESULT: VideoGenerationRequest');
  console.log({
    type: 'image-to-video',
    prompt: testMessage,
    imageUri: testFileUri,
    duration: 5,
    aspectRatio: '16:9',
    model: 'standard',
    negativePrompt: ''
  });
} else {
  console.log('❌ EXPECTED RESULT: null');
}

console.log('');
console.log('🧪 Test Complete!');
console.log('');
console.log('If patterns match but detection still fails, check:');
console.log('1. Debug logs in the browser console');
console.log('2. Network tab for API calls');
console.log('3. Backend console for detection logs');
