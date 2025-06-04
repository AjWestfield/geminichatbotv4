#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🔧 Running original_image_id fix migration...\n');

  // Check if Supabase is configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Supabase is not configured. Skipping migration.');
    console.log('   If you are using database persistence, set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local\n');
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'lib', 'database', 'fix-original-image-id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration steps:');
    console.log('1. Drop foreign key constraint on original_image_id');
    console.log('2. Change column type from UUID to TEXT');
    console.log('3. Add explanatory comment\n');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).single();

    if (error) {
      // If exec_sql doesn't exist, try running the statements individually
      console.log('⚠️  Direct SQL execution not available, trying individual statements...\n');
      
      // Note: Supabase client doesn't support DDL directly, so we need to use the dashboard
      console.log('❗ Please run the following SQL in your Supabase dashboard:\n');
      console.log('-- Copy and paste this SQL into Supabase SQL editor --');
      console.log(migrationSQL);
      console.log('-- End of SQL --\n');
      
      console.log('📌 Steps to apply the fix:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Paste the SQL above');
      console.log('4. Click "Run"\n');
      
      console.log('💡 Alternatively, you can run this command if you have Supabase CLI:');
      console.log('   supabase db execute -f lib/database/fix-original-image-id.sql\n');
      
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('   The original_image_id column now accepts text IDs.\n');

    // Check current images with original_image_id
    const { data: editedImages, error: queryError } = await supabase
      .from('images')
      .select('id, original_image_id')
      .not('original_image_id', 'is', null);

    if (!queryError && editedImages) {
      console.log(`📊 Found ${editedImages.length} edited images in the database.`);
      if (editedImages.length > 0) {
        console.log('   Sample:', editedImages[0]);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 You may need to run the migration manually in your Supabase dashboard.');
  }
}

// Run the migration
runMigration();