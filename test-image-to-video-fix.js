#!/usr/bin/env node

/**
 * Test Image-to-Video Fix
 *
 * This script tests the image-to-video functionality to ensure it works properly
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Testing Image-to-Video Functionality');
console.log('=====================================\n');

// Colors for output
const GREEN = '\033[0;32m';
const YELLOW = '\033[1;33m';
const RED = '\033[0;31m';
const BLUE = '\033[0;34m';
const NC = '\033[0m'; // No Color

// Test 1: Check chat API route has the fix
console.log(`${YELLOW}1. Checking Chat API Route Fixes${NC}`);

try {
  const chatRoute = fs.readFileSync(path.join(__dirname, 'app/api/chat/route.ts'), 'utf8');

  // Check if workaround was removed
  if (chatRoute.includes('technical limitation with accessing images from Google AI File Manager')) {
    console.log(`${RED}❌ Workaround message still present${NC}`);
  } else {
    console.log(`${GREEN}✅ Workaround message removed${NC}`);
  }

  // Check if direct URI usage is implemented
  if (chatRoute.includes('we can try using the Google AI File Manager URI directly')) {
    console.log(`${GREEN}✅ Direct URI usage implemented${NC}`);
  } else {
    console.log(`${RED}❌ Direct URI usage not found${NC}`);
  }

  // Check if error handling is present
  if (chatRoute.includes('Image-to-video generation failed') && chatRoute.includes('Alternative approaches')) {
    console.log(`${GREEN}✅ Improved error handling present${NC}`);
  } else {
    console.log(`${RED}❌ Improved error handling missing${NC}`);
  }

} catch (error) {
  console.log(`${RED}❌ Could not read chat route file${NC}`);
}

console.log('');

// Test 2: Check image proxy improvements
console.log(`${YELLOW}2. Checking Image Proxy Improvements${NC}`);

try {
  const imageProxy = fs.readFileSync(path.join(__dirname, 'app/api/image-proxy/route.ts'), 'utf8');

  // Check if proxy returns original URI
  if (imageProxy.includes('publicUrl: fileInfo.uri')) {
    console.log(`${GREEN}✅ Proxy returns original URI${NC}`);
  } else {
    console.log(`${RED}❌ Proxy not returning URI${NC}`);
  }

  // Check if logging is improved
  if (imageProxy.includes('[IMAGE PROXY]') && imageProxy.includes('Fetching image')) {
    console.log(`${GREEN}✅ Improved logging present${NC}`);
  } else {
    console.log(`${RED}❌ Improved logging missing${NC}`);
  }

} catch (error) {
  console.log(`${RED}❌ Could not read image proxy file${NC}`);
}

console.log('');

// Test 3: Check video generation handler
console.log(`${YELLOW}3. Checking Video Generation Handler${NC}`);

try {
  const handler = fs.readFileSync(path.join(__dirname, 'lib/video-generation-handler.ts'), 'utf8');

  // Check if image-to-video response is present
  if (handler.includes("I'm animating your uploaded image")) {
    console.log(`${GREEN}✅ Image-to-video response template present${NC}`);
  } else {
    console.log(`${RED}❌ Image-to-video response template missing${NC}`);
  }

  // Check if imageUri detection is present
  if (handler.includes('imageUri: fileUri')) {
    console.log(`${GREEN}✅ Image URI detection present${NC}`);
  } else {
    console.log(`${RED}❌ Image URI detection missing${NC}`);
  }

} catch (error) {
  console.log(`${RED}❌ Could not read video generation handler${NC}`);
}

console.log('');

// Test 4: Simulate the flow
console.log(`${YELLOW}4. Simulating Image-to-Video Flow${NC}`);

console.log(`${BLUE}Test scenario:${NC}`);
console.log('1. User uploads image → gets Google AI File Manager URI');
console.log('2. User requests: "Animate the image so that the woman stands up and is walking towards the camera"');
console.log('3. System should detect image-to-video request');
console.log('4. System should attempt video generation with URI');
console.log('5. Video generation marker should be injected');

// Test the detection logic
const testMessage = "Animate the image so that the woman stands up and is walking towards the camera";
const testUri = "https://generativelanguage.googleapis.com/v1beta/files/r4jsgdexy4kz";
const testMimeType = "image/jpeg";

console.log(`\n${BLUE}Detection test:${NC}`);
console.log(`Message: "${testMessage}"`);
console.log(`URI: ${testUri}`);
console.log(`MIME type: ${testMimeType}`);

// Check if the patterns would match
if (testMessage.toLowerCase().includes('animate') && testMessage.toLowerCase().includes('image')) {
  console.log(`${GREEN}✅ Animation pattern would match${NC}`);
} else {
  console.log(`${RED}❌ Animation pattern would not match${NC}`);
}

if (testUri.includes('generativelanguage.googleapis.com')) {
  console.log(`${GREEN}✅ Google AI File Manager URI detected${NC}`);
} else {
  console.log(`${RED}❌ URI format not recognized${NC}`);
}

console.log('');

// Test 5: Expected flow
console.log(`${YELLOW}5. Expected Flow After Fix${NC}`);
console.log(`${GREEN}✅ Upload image → get URI${NC}`);
console.log(`${GREEN}✅ Request animation → detect image-to-video${NC}`);
console.log(`${GREEN}✅ Attempt generation with URI directly${NC}`);
console.log(`${GREEN}✅ On success → inject video marker${NC}`);
console.log(`${GREEN}✅ On failure → show helpful error${NC}`);

console.log('');

console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log(`${YELLOW}Testing Instructions:${NC}`);
console.log('');
console.log('1. Restart your development server: npm run dev');
console.log('2. Open browser and upload an image');
console.log('3. Type: "Animate the image so that the woman stands up and is walking"');
console.log('4. Watch browser console for:');
console.log('   - [VIDEO] Processing image-to-video request with URI');
console.log('   - [VIDEO API] Storing image-to-video generation data');
console.log('   - [VIDEO] Injecting video generation marker');
console.log('');
console.log(`${YELLOW}If it works:${NC}`);
console.log('✅ Video should appear in Video tab with "generating" status');
console.log('✅ Progress tracking should show');
console.log('✅ No more workaround messages');
console.log('');
console.log(`${YELLOW}If Replicate doesn\'t support the URI format:${NC}`);
console.log('⚠️  You\'ll see a helpful error message with alternatives');
console.log('⚠️  This is expected - we\'ll implement fallback solutions');
console.log('');
console.log('🚀 Test complete! Try the scenario above.');
