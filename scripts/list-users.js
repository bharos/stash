// List users from the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  try {
    console.log('Fetching users from the database...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No users found');
      return;
    }
    
    console.log('Found users:');
    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'} - UUID: ${user.id}`);
    });
    
    console.log('\nYou can use these UUIDs for testing:');
    console.log(`Example: node scripts/setup-test-donation.js ${data[0].id}`);
    
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

listUsers();
