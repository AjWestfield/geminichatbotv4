#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Video Auto-Switch Issues\n');

// Fix 1: Add debug logging to chat interface
console.log('1. Adding enhanced debug logging to chat interface...');

const chatInterfacePath = path.join(__dirname, 'components/chat-interface.tsx');
let chatInterface = fs.readFileSync(chatInterfacePath, 'utf8');

// Add debug logging before the video marker check
const videoEffectStart = `  // Check messages for video generation markers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content) {`;

const enhancedVideoEffectStart = `  // Check messages for video generation markers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    console.log('[VIDEO DEBUG] Checking last message:', {
      hasMessage: !!lastMessage,
      role: lastMessage?.role,
      contentLength: lastMessage?.content?.length,
      containsMarker: lastMessage?.content?.includes('[VIDEO_GENERATION_STARTED]')
    })
    if (lastMessage?.role === 'assistant' && lastMessage.content) {`;

if (chatInterface.includes(videoEffectStart)) {
  chatInterface = chatInterface.replace(videoEffectStart, enhancedVideoEffectStart);
  console.log('✅ Added enhanced debug logging');
}

// Fix 2: Add message ID tracking to prevent duplicate processing
const videoParseSection = `          if (onGeneratedVideosChange) {
            // Check if video already exists
            const existingVideoIndex = generatedVideos.findIndex(v => v.id === newVideo.id)
            if (existingVideoIndex === -1) {
              // Add new video
              onGeneratedVideosChange([...generatedVideos, newVideo])
              // Switch to video tab when new video generation starts
              onVideoGenerationStart?.()`;

const enhancedVideoParseSection = `          if (onGeneratedVideosChange) {
            // Check if video already exists
            const existingVideoIndex = generatedVideos.findIndex(v => v.id === newVideo.id)
            if (existingVideoIndex === -1) {
              // Add new video
              console.log('[VIDEO DEBUG] Adding new video and switching tab:', newVideo.id)
              onGeneratedVideosChange([...generatedVideos, newVideo])
              // Switch to video tab when new video generation starts
              if (onVideoGenerationStart) {
                console.log('[VIDEO DEBUG] Calling onVideoGenerationStart')
                onVideoGenerationStart()
              } else {
                console.log('[VIDEO DEBUG] onVideoGenerationStart is not defined!')
              }`;

if (chatInterface.includes(videoParseSection)) {
  chatInterface = chatInterface.replace(videoParseSection, enhancedVideoParseSection);
  console.log('✅ Added debug logging for tab switch');
}

fs.writeFileSync(chatInterfacePath, chatInterface);

// Fix 3: Add debug logging to page.tsx
console.log('\n2. Adding debug logging to page.tsx...');

const pagePath = path.join(__dirname, 'app/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const videoStartCallback = `onVideoGenerationStart={() => setActiveCanvasTab("video")}`;
const enhancedVideoStartCallback = `onVideoGenerationStart={() => {
                console.log('[PAGE DEBUG] Video generation started, switching to video tab')
                setActiveCanvasTab("video")
              }}`;

if (pageContent.includes(videoStartCallback)) {
  pageContent = pageContent.replace(videoStartCallback, enhancedVideoStartCallback);
  console.log('✅ Added debug logging to page callback');
}

fs.writeFileSync(pagePath, pageContent);

// Fix 4: Ensure video generation data is properly set
console.log('\n3. Checking video generation data assignment...');

const chatRoutePath = path.join(__dirname, 'app/api/chat/route.ts');
let chatRoute = fs.readFileSync(chatRoutePath, 'utf8');

// Add debug logging after video generation data is set
const videoDataAssignment = `              // Store video generation data to inject after AI response
              videoGenerationData = {`;

const enhancedVideoDataAssignment = `              // Store video generation data to inject after AI response
              console.log('[VIDEO API] Storing video generation data for injection')
              videoGenerationData = {`;

if (chatRoute.includes(videoDataAssignment)) {
  chatRoute = chatRoute.replace(videoDataAssignment, enhancedVideoDataAssignment);
  console.log('✅ Added debug logging for video data storage');
}

fs.writeFileSync(chatRoutePath, chatRoute);

console.log('\n✅ Fixes applied! Now you can:');
console.log('1. Restart your dev server');
console.log('2. Open browser console');
console.log('3. Type "Generate a video of a sunset"');
console.log('4. Look for these debug messages:');
console.log('   - [VIDEO API] Storing video generation data');
console.log('   - [VIDEO] Injecting video generation marker');
console.log('   - [VIDEO DEBUG] Checking last message');
console.log('   - [VIDEO DEBUG] Adding new video and switching tab');
console.log('   - [PAGE DEBUG] Video generation started');
console.log('\nThis will help identify where the flow is breaking.');