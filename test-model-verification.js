#!/usr/bin/env node

// Test script to verify each AI model is correctly routed and responds

const models = [
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash-exp',
  'Claude Sonnet 4'
];

async function testModel(model) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing model: ${model}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Please tell me which AI model you are. Just respond with your model name and version.`
          }
        ],
        model: model
      })
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Response: ${text.substring(0, 200)}...`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('\nStreaming response:');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      // Parse SSE format
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            const content = JSON.parse(line.substring(2));
            process.stdout.write(content);
            fullResponse += content;
          } catch (e) {
            // Not JSON, might be raw text
            process.stdout.write(line);
          }
        }
      }
    }
    
    console.log('\n\n✅ Model test completed successfully');
    console.log(`Full response length: ${fullResponse.length} characters`);
    
  } catch (error) {
    console.error(`❌ Error testing model ${model}:`, error.message);
  }
}

async function runTests() {
  console.log('Model Verification Test');
  console.log('======================');
  console.log('This test will verify each model is correctly routed and responds appropriately.');
  console.log('\nMake sure the development server is running on port 3001.');
  console.log('Run: npm run dev\n');
  
  // Wait a moment for user to see instructions
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  for (const model of models) {
    await testModel(model);
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\nAll tests completed!');
  console.log('\nExpected results:');
  console.log('- Gemini models should identify as Gemini (Flash/Pro)');
  console.log('- Claude Sonnet 4 should identify as Claude');
  console.log('\nCheck the server logs for detailed routing information.');
}

runTests().catch(console.error);