#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

if (!REPLICATE_API_KEY) {
  console.error('❌ REPLICATE_API_KEY not found in .env.local');
  console.log('\nTo use video generation:');
  console.log('1. Sign up at https://replicate.com');
  console.log('2. Get your API token from https://replicate.com/account/api-tokens');
  console.log('3. Add to .env.local: REPLICATE_API_KEY=your_token_here');
  process.exit(1);
}

console.log('✅ Replicate API token found');
console.log('\n📹 Video Generation Test');
console.log('========================\n');

async function testVideoGeneration() {
  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A serene lake with mountains in the background, golden hour lighting',
        duration: 5,
        aspectRatio: '16:9',
        model: 'standard'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Video generation started!');
    console.log('Prediction ID:', result.id);
    console.log('Status:', result.status);
    console.log('\nThis typically takes 2-5 minutes to complete.');
    console.log('Check the video tab in your app to see the progress.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your dev server is running (npm run dev)');
    console.log('2. Your Replicate API token is valid');
    console.log('3. You have credits in your Replicate account');
  }
}

// Only run if server is likely running
fetch('http://localhost:3000')
  .then(() => {
    console.log('✅ Dev server is running\n');
    testVideoGeneration();
  })
  .catch(() => {
    console.error('❌ Dev server is not running');
    console.log('Please run: npm run dev');
  });