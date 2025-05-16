// Complete end-to-end donation flow test with actual database interaction
require('dotenv').config({ path: '.env.local' });
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get test user ID from arguments or use default test ID
const testUserId = process.argv[2] || '00000000-0000-0000-0000-000000000001';

// Donation details for testing
const amount = 10; // $10.00
const nonprofitId = 'wildlife-conservation-network';
const nonprofitName = 'Wildlife Conservation Network';
const donationReference = `test_${nanoid(8)}`;

// Function to calculate donation rewards
function calculatePremiumDays(amount) {
  // Minimum donation amount is now $10
  return 30;
}

// Function to process a donation and grant premium access
async function processDonation() {
  console.log('===== DONATION FLOW TEST =====');
  console.log(`Donation amount: $${amount.toFixed(2)}`);
  console.log(`Nonprofit: ${nonprofitName} (${nonprofitId})`);
  console.log(`Reference: ${donationReference}`);
  console.log(`User ID: ${testUserId}`);
  
  try {
    // Step 1: Insert donation intent record
    console.log('\nStep 1: Creating donation intent record...');
    
    const { data: intentData, error: intentError } = await supabase
      .from('donation_intents')
      .insert({
        user_id: testUserId,
        nonprofit_id: nonprofitId,
        amount,
        status: 'pending',
        donation_reference: donationReference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (intentError) {
      if (intentError.code === '23503') {
        console.error(`Error: User ID ${testUserId} doesn't exist in the database.`);
        console.error('Please provide a valid user ID as argument: node scripts/full-donation-test.js <valid-user-id>');
        return;
      }
      throw intentError;
    }
    
    console.log(`Created donation intent with ID: ${intentData.id}`);
    
    // Step 2: Calculate premium rewards
    const premiumDays = calculatePremiumDays(amount);
    const premiumEndDate = new Date();
    premiumEndDate.setDate(premiumEndDate.getDate() + premiumDays);
    
    // Award 300 coins for $10 donation + 30 per additional dollar
    let bonusTokens = 300; // Base 300 coins for a $10 donation
    
    // Add 30 coins per dollar for any amount above $10
    if (amount > 10) {
      bonusTokens += Math.floor((amount - 10) * 30);
    }
    
    console.log('\nStep 2: Calculated rewards');
    console.log(`- Premium days: ${premiumDays}`);
    console.log(`- Premium until: ${premiumEndDate.toISOString()}`);
    console.log(`- Bonus tokens: ${bonusTokens}`);
    
    // Step 3: Simulate webhook payload
    console.log('\nStep 3: Creating webhook payload...');
    const webhookPayload = {
      event: 'donation.completed',
      data: {
        donationId: `mock_${donationReference}`,
        reference: donationReference,
        status: 'SUCCEEDED',
        amount: amount * 100, // Convert to cents
        currency: 'USD',
        nonprofitId,
        nonprofitName,
        metadata: {
          userId: testUserId,
          source: 'stash_premium_access'
        }
      }
    };
    
    // Sign the webhook payload
    const webhookSecret = process.env.EVERY_ORG_WEBHOOK_SECRET || 'test_webhook_secret';
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(JSON.stringify(webhookPayload));
    const signature = hmac.digest('hex');
    
    console.log(`Webhook signature: ${signature.substring(0, 10)}...${signature.substring(signature.length - 10)}`);
    
    // Step 4: Call webhook endpoint
    console.log('\nStep 4: Sending webhook to endpoint...');
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/every-org`;
    console.log(`Webhook URL: ${webhookUrl}`);
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Every-Signature': signature
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`Webhook response status: ${webhookResponse.status}`);
    
    try {
      const responseData = await webhookResponse.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      const responseText = await webhookResponse.text();
      console.log('Response text:', responseText);
    }
    
    // Step 5: Check donation status
    console.log('\nStep 5: Checking donation status...');
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/donations/status?reference=${donationReference}`;
    console.log(`Status URL: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();
    
    console.log('Donation status:', JSON.stringify(statusData, null, 2));
    
    // Step 6: Check user tokens
    console.log('\nStep 6: Checking user tokens...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('premium_until, tokens')
      .eq('user_id', testUserId)
      .single();
      
    if (tokenError) {
      console.log('No token data found:', tokenError.message);
    } else {
      console.log('User token data:', JSON.stringify(tokenData, null, 2));
      
      // Calculate if premium is active
      const isPremium = new Date(tokenData.premium_until) > new Date();
      console.log(`Premium status: ${isPremium ? 'ACTIVE' : 'INACTIVE'}`);
      
      if (isPremium) {
        const daysRemaining = Math.ceil((new Date(tokenData.premium_until) - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`Days remaining: ${daysRemaining}`);
      }
    }
    
    console.log('\nStep 7: Success page URL');
    console.log(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donation/success?ref=${donationReference}`);
    
    console.log('\n=============================');
    console.log('✅ Full donation test complete');
    
  } catch (error) {
    console.error('Error in donation test flow:', error);
  }
}

processDonation();
