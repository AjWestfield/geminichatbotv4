#!/usr/bin/env node

// Test script to diagnose image persistence issues

async function testImagePersistence() {
  console.log('Testing image persistence...\n');

  // Test environment configuration
  console.log('=== Environment Check ===');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Not set');
  console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✓ Set' : '✗ Not set');
  console.log('\n');

  // Test saving an uploaded image
  console.log('=== Testing Image Save ===');
  
  const testImage = {
    id: `test-${Date.now()}`,
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    prompt: 'Test uploaded image',
    timestamp: new Date(),
    quality: 'standard',
    style: 'vivid',
    size: '1024x1024',
    model: 'uploaded',
    isUploaded: true,
    isGenerating: false
  };

  try {
    const response = await fetch('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImage,
        // Note: no chatId provided (simulating the issue)
      }),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✓ Image save API call successful');
      
      // Check if it was actually persisted
      if (result.image && result.image.created_at) {
        console.log('✓ Image appears to be persisted to database');
      } else {
        console.log('✗ Image may not have been persisted (no created_at timestamp)');
      }
    } else {
      console.log('\n✗ Image save API call failed');
    }
  } catch (error) {
    console.error('\n✗ Error calling API:', error.message);
  }
}

// Run the test
console.log('Make sure the development server is running (npm run dev)\n');
testImagePersistence().catch(console.error);