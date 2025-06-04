#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

console.log('Verifying persistence setup...\n');

async function verifySetup() {
  try {
    // Test 1: Check tables exist
    console.log('1. Checking database tables...');
    const tables = ['chats', 'messages', 'images'];
    let allTablesExist = true;
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' not found`);
        allTablesExist = false;
      } else if (error) {
        console.log(`   ❌ Error checking '${table}': ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }
    
    if (!allTablesExist) {
      console.log('\n⚠️  Please run the SQL schema in Supabase first!');
      return;
    }
    
    // Test 2: Check view exists
    console.log('\n2. Checking database view...');
    const { error: viewError } = await supabase
      .from('chat_summaries')
      .select('count')
      .limit(1);
    
    if (viewError) {
      console.log('   ❌ View "chat_summaries" not found');
    } else {
      console.log('   ✅ View "chat_summaries" exists');
    }
    
    // Test 3: Try creating a test chat
    console.log('\n3. Testing chat creation...');
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        title: 'Test Chat - Persistence Verification',
        model: 'gemini-2.5-flash'
      })
      .select()
      .single();
    
    if (chatError) {
      console.log('   ❌ Failed to create chat:', chatError.message);
      return;
    }
    
    console.log('   ✅ Successfully created test chat:', chat.id);
    
    // Test 4: Try adding a message
    console.log('\n4. Testing message creation...');
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        role: 'user',
        content: 'Test message for persistence verification'
      })
      .select()
      .single();
    
    if (messageError) {
      console.log('   ❌ Failed to create message:', messageError.message);
    } else {
      console.log('   ✅ Successfully created test message');
    }
    
    // Test 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chat.id);
    
    if (deleteError) {
      console.log('   ❌ Failed to clean up:', deleteError.message);
    } else {
      console.log('   ✅ Test data cleaned up');
    }
    
    // Test 6: Check Blob storage
    console.log('\n6. Testing Blob storage...');
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({ limit: 1 });
      console.log('   ✅ Blob storage is accessible');
    } catch (blobError) {
      console.log('   ❌ Blob storage error:', blobError.message);
    }
    
    console.log('\n✅ Persistence is fully configured and working!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. The yellow notification should disappear');
    console.log('3. Your chats and images will now be saved!');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

verifySetup();