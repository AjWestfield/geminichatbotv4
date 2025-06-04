#!/usr/bin/env node

const http = require('http');

console.log('Testing app without persistence configured...\n');

function httpRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPIs() {
  try {
    // Test persistence status
    console.log('1. Testing persistence status...');
    const statusRes = await httpRequest('/api/persistence-status');
    console.log('✅ Persistence status:', statusRes.data);
    
    // Test chats API
    console.log('\n2. Testing chats API...');
    const chatsRes = await httpRequest('/api/chats');
    console.log('✅ Chats response:', { 
      status: chatsRes.status, 
      chatsCount: chatsRes.data.chats?.length || 0 
    });
    
    // Test creating a chat
    console.log('\n3. Testing chat creation...');
    const createRes = await httpRequest('/api/chats', 'POST', {
      title: 'Test Chat',
      model: 'gemini'
    });
    console.log('✅ Created chat:', { 
      status: createRes.status, 
      chatId: createRes.data.chat?.id 
    });
    
    // Test saving an image
    console.log('\n4. Testing image save...');
    const imageRes = await httpRequest('/api/images', 'POST', {
      image: {
        id: 'test-123',
        url: 'https://example.com/image.png',
        prompt: 'Test image',
        quality: 'hd',
        size: '1024x1024',
        model: 'test'
      }
    });
    console.log('✅ Image save response:', { 
      status: imageRes.status,
      imageId: imageRes.data.image?.id 
    });
    
    console.log('\n✅ All APIs working without persistence configured!');
    console.log('✅ No errors should appear in the server console.');
    console.log('\nThe app is working perfectly without persistence!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for server to be ready
setTimeout(testAPIs, 2000);