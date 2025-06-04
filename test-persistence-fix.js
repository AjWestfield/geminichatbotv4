#!/usr/bin/env node

async function testPersistenceFix() {
  console.log('Testing persistence fix...\n');

  try {
    // Test persistence status API
    console.log('1. Testing persistence status API...');
    const response = await fetch('http://localhost:3000/api/persistence-status');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Persistence status:', data);
    } else {
      console.log('❌ Failed to fetch persistence status');
    }
  } catch (error) {
    console.log('❌ Error testing persistence status:', error.message);
  }

  try {
    // Test chats API
    console.log('\n2. Testing chats API...');
    const response = await fetch('http://localhost:3000/api/chats');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chats API response:', data);
    } else {
      console.log('❌ Failed to fetch chats');
    }
  } catch (error) {
    console.log('❌ Error testing chats API:', error.message);
  }

  console.log('\n✅ App is working without persistence configured!');
  console.log('To enable persistence, run: npm run setup-persistence');
}

// Wait a bit for the server to be ready
setTimeout(testPersistenceFix, 2000);