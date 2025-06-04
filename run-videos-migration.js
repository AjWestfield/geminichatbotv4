const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase credentials not found. Skipping migration.');
    console.log('To enable database persistence, add SUPABASE_URL and SUPABASE_ANON_KEY to your .env.local file.');
    return;
  }

  console.log('Running videos table migration...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read the migration SQL
    const sqlPath = path.join(__dirname, 'lib', 'database', 'add-videos-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If the RPC function doesn't exist, try a different approach
      console.log('Direct SQL execution not available. Attempting alternative method...');
      
      // Create videos table
      const { error: createError } = await supabase
        .from('videos')
        .select('id')
        .limit(1);

      if (createError && createError.code === '42P01') {
        console.log('Videos table does not exist. Please run the following SQL in your Supabase dashboard:');
        console.log('\n' + sql + '\n');
        console.log('You can run this SQL in the SQL Editor at: https://supabase.com/dashboard/project/_/sql');
      } else if (!createError) {
        console.log('Videos table already exists!');
      } else {
        console.error('Error checking videos table:', createError);
      }
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (error) {
    console.error('Migration error:', error);
    console.log('\nPlease run the following SQL manually in your Supabase dashboard:');
    const sqlPath = path.join(__dirname, 'lib', 'database', 'add-videos-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('\n' + sql + '\n');
  }
}

runMigration();