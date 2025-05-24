// Setup test donation data directly in the database for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Extract command line arguments or generate a random UUID
const testUserId = process.argv[2] || crypto.randomUUID();

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestData() {
  try {
    console.log('Setting up test donation data...');
    console.log(`Test User ID: ${testUserId}`);
    
    // Generate unique reference ID
    const donationReference = `test_${nanoid(8)}`;
    console.log(`Donation Reference: ${donationReference}`);
    
    // Insert donation intent record
    console.log('Creating donation intent record...');
    const { data: intentData, error: intentError } = await supabase
      .from('donation_intents')
      .insert({
        user_id: testUserId,
        donation_reference: donationReference,
        nonprofit_id: 'wildlife-conservation-network',
        amount: 10.00, // $10.00
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (intentError) {
      console.error('Error creating donation intent:', intentError);
      return;
    }
    
    console.log('Successfully created donation intent record');
    console.log(`Intent ID: ${intentData.id}`);
    
    // Print webhook testing information
    console.log('\nTo test donation flow:');
    console.log('1. Check donation status:');
    console.log(`   curl "${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/donations/status?reference=${donationReference}"`);
    console.log('\n2. Simulate webhook completion:');
    console.log(`   node scripts/test-webhook.js ${donationReference}`);
    console.log('\n3. View success page:');
    console.log(`   ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donation/success?ref=${donationReference}`);
    
  } catch (err) {
    console.error('Error setting up test data:', err);
  }
}

setupTestData();