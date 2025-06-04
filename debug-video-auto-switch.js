#!/usr/bin/env node

// Debug script to test video generation auto-switch

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Video Auto-Switch Issue\n');

// Check 1: Verify chat API route changes
console.log('1. Checking chat API route for video marker injection...');
const chatRoute = fs.readFileSync(path.join(__dirname, 'app/api/chat/route.ts'), 'utf8');

// Check for videoGenerationData variable
if (chatRoute.includes('let videoGenerationData: any = null')) {
  console.log('✅ videoGenerationData variable found');
} else {
  console.log('❌ videoGenerationData variable NOT found');
}

// Check for marker injection
if (chatRoute.includes('if (videoGenerationData)') && chatRoute.includes('[VIDEO_GENERATION_STARTED]')) {
  console.log('✅ Video marker injection code found');
  
  // Count injection points
  const injectionCount = (chatRoute.match(/controller\.enqueue.*VIDEO_GENERATION_STARTED/g) || []).length;
  console.log(`   Found ${injectionCount} injection points`);
} else {
  console.log('❌ Video marker injection code NOT found');
}

// Check 2: Verify chat interface handling
console.log('\n2. Checking chat interface for video marker handling...');
const chatInterface = fs.readFileSync(path.join(__dirname, 'components/chat-interface.tsx'), 'utf8');

if (chatInterface.includes('onVideoGenerationStart?.()')) {
  console.log('✅ onVideoGenerationStart callback found');
} else {
  console.log('❌ onVideoGenerationStart callback NOT found');
}

// Check 3: Verify page.tsx callback
console.log('\n3. Checking page.tsx for callback implementation...');
const pageFile = fs.readFileSync(path.join(__dirname, 'app/page.tsx'), 'utf8');

if (pageFile.includes('onVideoGenerationStart={() => setActiveCanvasTab("video")}')) {
  console.log('✅ onVideoGenerationStart callback properly connected');
} else {
  console.log('❌ onVideoGenerationStart callback NOT properly connected');
}

// Check 4: Test video detection regex
console.log('\n4. Testing video marker regex...');
const testContent = `
I'm generating a video for you!

[VIDEO_GENERATION_STARTED]
{
  "id": "test-123",
  "status": "generating",
  "prompt": "test video"
}
[/VIDEO_GENERATION_STARTED]
`;

const regex = /\[VIDEO_GENERATION_STARTED\]([\s\S]*?)\[\/VIDEO_GENERATION_STARTED\]/;
const match = testContent.match(regex);

if (match) {
  console.log('✅ Regex matches test content');
  try {
    const data = JSON.parse(match[1]);
    console.log('✅ JSON parsing successful:', data);
  } catch (e) {
    console.log('❌ JSON parsing failed:', e.message);
  }
} else {
  console.log('❌ Regex does NOT match test content');
}

console.log('\n📋 Summary:');
console.log('- Video marker injection: Check chat API logs for [VIDEO] messages');
console.log('- Auto-switch: Check browser console for "Switching to video tab" message');
console.log('- If markers are missing, the AI response might not include them');
console.log('\nTo test: Type "Generate a video of a sunset" and watch the console logs');