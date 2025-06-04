#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('Testing Supabase connection...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials');
  process.exit(1);
}

// Validate URL format
try {
  const url = new URL(supabaseUrl);
  console.log('\n✅ URL format is valid');
  console.log('Host:', url.host);
  console.log('Protocol:', url.protocol);
} catch (e) {
  console.error('\n❌ Invalid URL format:', e.message);
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Try a simple query
async function testConnection() {
  try {
    console.log('\nTesting connection...');
    
    // Try to query the auth schema (always exists)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection error:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Session data:', data);
    }
    
    // Try to check if tables exist
    console.log('\nChecking for tables...');
    const { error: tableError } = await supabase
      .from('chats')
      .select('count')
      .limit(1)
      .single();
    
    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('⚠️  Tables not found - this is expected for first setup');
        console.log('   You need to create the tables using the SQL schema');
      } else {
        console.log('❌ Table query error:', tableError.message);
      }
    } else {
      console.log('✅ Tables already exist!');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();