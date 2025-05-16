// Script to check for available test data in the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataAvailability() {
  console.log('Checking database for available test data...');
  
  try {
    // Check for users
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);
      
    if (userError) {
      console.error('Error fetching users:', userError);
    } else {
      console.log(`\nFound ${users?.length || 0} users:`);
      if (users?.length) {
        users.forEach((user, i) => {
          console.log(`${i + 1}. ${user.email || 'No Email'} - ID: ${user.id}`);
        });
      } else {
        console.log('No users found in the database.');
      }
    }
    
    // Check for auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ limit: 5 });
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      console.log(`\nFound ${authUsers?.users?.length || 0} auth users:`);
      if (authUsers?.users?.length) {
        authUsers.users.forEach((user, i) => {
          console.log(`${i + 1}. ${user.email || 'No Email'} - ID: ${user.id}`);
        });
      } else {
        console.log('No auth users found in the database.');
      }
    }
    
    // Check for donation tables
    const tables = ['donation_intents', 'donation_records', 'user_tokens', 'token_transactions'];
    
    console.log('\nChecking donation-related tables:');
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`- ${table}: Error - ${error.message}`);
        } else {
          console.log(`- ${table}: ${count} records`);
        }
      } catch (e) {
        console.log(`- ${table}: Error - ${e.message}`);
      }
    }
    
    console.log('\nDatabase environment information:');
    console.log(`- Supabase URL: ${supabaseUrl}`);
    console.log(`- Using service role key: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    console.log(`- App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
    console.log(`- Every.org API key exists: ${!!process.env.EVERY_ORG_API_KEY}`);
    console.log(`- Every.org webhook secret exists: ${!!process.env.EVERY_ORG_WEBHOOK_SECRET}`);
    
    console.log('\nNext steps for testing:');
    if (users?.length) {
      console.log(`1. Run full donation test with a user ID:`);
      console.log(`   node scripts/full-donation-test.js ${users[0].id}`);
    } else {
      console.log('1. Create test user in Supabase dashboard');
      console.log('2. Run full donation test with the created user ID');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkDataAvailability();
