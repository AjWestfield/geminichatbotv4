#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

if (!REPLICATE_API_KEY) {
  console.error('❌ REPLICATE_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ Replicate API key found');
console.log('\n📹 Kling v1.6 Video Generation Test');
console.log('=====================================\n');

async function testKlingVideo() {
  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A woman walking her dog down a tree-lined street, golden hour lighting',
        duration: 5,
        aspectRatio: '16:9',
        model: 'standard',
        cfg_scale: 0.5,
        negativePrompt: ''
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.error);
      return;
    }

    console.log('✅ Video generation response:', JSON.stringify(data, null, 2));
    
    if (data.status === 'succeeded' && data.output) {
      console.log('\n🎉 Video generated successfully!');
      console.log('Video URL:', data.output);
      console.log('\nYou can view the video at the URL above.');
    } else if (data.status === 'generating' && data.id) {
      console.log('\n⏳ Video generation started!');
      console.log('Prediction ID:', data.id);
      console.log('\nPoll the endpoint with ?id=' + data.id + ' to check status');
      
      // Poll for completion
      console.log('\nPolling for completion...');
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`http://localhost:3000/api/generate-video?id=${data.id}`);
        const statusData = await statusResponse.json();
        
        console.log(`Attempt ${attempts + 1}: ${statusData.status}`);
        
        if (statusData.status === 'succeeded' && statusData.output) {
          console.log('\n🎉 Video generated successfully!');
          console.log('Video URL:', statusData.output);
          break;
        } else if (statusData.status === 'failed') {
          console.error('\n❌ Video generation failed:', statusData.error);
          break;
        }
        
        attempts++;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testKlingVideo();