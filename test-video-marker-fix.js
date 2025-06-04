#!/usr/bin/env node

// Test video generation marker preservation

async function testVideoGeneration() {
  console.log('Testing video generation marker preservation...\n');
  
  // Simulate a video generation request
  const testMessage = "Generate a video of a sunset over the ocean";
  
  console.log('1. Test message:', testMessage);
  
  // Test the marker format
  const videoData = {
    id: "test-video-123",
    status: "generating",
    prompt: "a sunset over the ocean",
    duration: 5,
    aspectRatio: "16:9",
    model: "standard"
  };
  
  const videoMarker = `[VIDEO_GENERATION_STARTED]
${JSON.stringify(videoData, null, 2)}
[/VIDEO_GENERATION_STARTED]`;
  
  console.log('\n2. Video marker format:');
  console.log(videoMarker);
  
  // Test escaping for SSE
  const escapedMarker = videoMarker.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  console.log('\n3. Escaped marker for SSE:');
  console.log(escapedMarker);
  
  // Test regex matching
  const testContent = `I'm generating a video for you!

${videoMarker}

The video will be ready soon.`;
  
  const videoMatch = testContent.match(/\[VIDEO_GENERATION_STARTED\]([\s\S]*?)\[\/VIDEO_GENERATION_STARTED\]/);
  
  if (videoMatch) {
    console.log('\n4. Regex match successful!');
    try {
      const parsed = JSON.parse(videoMatch[1]);
      console.log('Parsed data:', parsed);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  } else {
    console.error('\n4. Regex match failed!');
  }
  
  // Test the cleaning logic
  const toolCallRegex = /\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g;
  const videoTriggerRegex = /\[VIDEO_GENERATION_TRIGGER\][\s\S]*?\[\/VIDEO_GENERATION_TRIGGER\]/g;
  
  let cleanedResponse = testContent;
  cleanedResponse = cleanedResponse.replace(toolCallRegex, '');
  cleanedResponse = cleanedResponse.replace(videoTriggerRegex, '');
  
  console.log('\n5. After cleaning (should still have VIDEO_GENERATION_STARTED):');
  console.log(cleanedResponse);
  console.log('\nContains VIDEO_GENERATION_STARTED:', cleanedResponse.includes('[VIDEO_GENERATION_STARTED]'));
}

testVideoGeneration();