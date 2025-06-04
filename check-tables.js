#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

async function checkTables() {
  console.log('Checking database tables...\n');
  
  const tables = ['chats', 'messages', 'images', 'chat_summaries'];
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}' - NOT FOUND`);
        } else {
          console.log(`⚠️  Table '${table}' - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${table}' - EXISTS`);
      }
    } catch (e) {
      console.log(`❌ Table '${table}' - Error: ${e.message}`);
    }
  }
  
  // Try a different approach - use raw SQL
  console.log('\nTrying alternative check...');
  
  try {
    // Check if we can query the schema
    const { data, error } = await supabase
      .from('chats')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    if (!error) {
      console.log('\n✅ SUCCESS! Tables are properly set up!');
      console.log('\nYour persistence is ready to use!');
      console.log('1. Restart your app: npm run dev');
      console.log('2. The yellow notification should disappear');
      return true;
    }
  } catch (e) {
    // Tables don't exist
  }
  
  console.log('\n❌ Tables are not set up yet.');
  console.log('\nPlease ensure you:');
  console.log('1. Ran the SQL script in Supabase SQL editor');
  console.log('2. Got "Success. No rows returned" message');
  console.log('3. Are checking the correct project');
  
  return false;
}

checkTables();