// Test script to manually create a complete donation flow for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { nanoid } = require('nanoid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create a complete donation flow for testing
async function createTestDonation(userId) {
  if (!userId) {
    console.error('Please provide a user ID as an argument');
    process.exit(1);
  }

  try {
    console.log(`Creating test donation for user: ${userId}`);
    
    // Generate a unique reference
    const donationReference = `test_${nanoid(8)}`;
    
    // Step 1: Create donation intent
    console.log('Creating donation intent...');
    const { data: intentData, error: intentError } = await supabase
      .from('donation_intents')
      .insert({
        user_id: userId,
        donation_reference: donationReference,
        amount: 10.00, // $10 donation
        nonprofit_id: 'wildlife-conservation-network',
        // nonprofit_name is not stored in donation_intents table
        status: 'initiated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .single();
      
    if (intentError) {
      throw new Error(`Error creating donation intent: ${intentError.message}`);
    }
    
    console.log(`Created donation intent with reference: ${donationReference}`);
    
    // Step 2: Calculate premium days based on amount
    const amount = 10.00; // $10.00
    const premiumDays = amount >= 10 ? 30 : 7;
    
    // Step 3: Update user premium status
    console.log('Checking for existing user tokens...');
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('premium_until, tokens')
      .eq('user_id', userId)
      .single();
      
    // Calculate new premium end date
    const premiumEnd = new Date();
    premiumEnd.setDate(premiumEnd.getDate() + premiumDays);
    
    let newPremiumEnd = premiumEnd;
    let currentTokens = 0;
    
    if (!userError && userData) {
      currentTokens = userData.tokens || 0;
      
      // If user already has premium, extend it
      if (userData.premium_until && new Date(userData.premium_until) > new Date()) {
        newPremiumEnd = new Date(userData.premium_until);
        newPremiumEnd.setDate(newPremiumEnd.getDate() + premiumDays);
      }
    }
    
    // Award 300 coins for $10 donation + 30 per additional dollar
    let bonusTokens = 300; // Base 300 coins for a $10 donation
    
    // Add 30 coins per dollar for any amount above $10
    if (amount > 10) {
      bonusTokens += Math.floor((amount - 10) * 30);
    }
    
    const newTokens = currentTokens + bonusTokens;
    
    console.log(`Calculated bonus tokens: ${bonusTokens} (300 base + ${amount > 10 ? Math.floor((amount - 10) * 30) : 0} for amount above $10)`);
    
    // Update user_tokens
    console.log(`Updating user premium status, adding ${premiumDays} days and ${bonusTokens} tokens...`);
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        premium_until: newPremiumEnd.toISOString(),
        tokens: newTokens,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });
      
    if (tokenError) {
      throw new Error(`Error updating user tokens: ${tokenError.message}`);
    }
    
    // Step 4: Update donation intent status to completed
    console.log('Marking donation as completed...');
    const { error: updateError } = await supabase
      .from('donation_intents')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('donation_reference', donationReference);
      
    if (updateError) {
      throw new Error(`Error updating donation status: ${updateError.message}`);
    }
    
    // Step 5: Create donation record
    console.log('Creating donation record...');
    const { error: recordError } = await supabase
      .from('donation_records')
      .insert({
        user_id: userId,
        donation_id: `mock_${donationReference}`,
        nonprofit_id: 'wildlife-conservation-network',
        nonprofit_name: 'Wildlife Conservation Network',
        amount: amount,
        donation_reference: donationReference,
        premium_days: premiumDays,
        premium_until: newPremiumEnd.toISOString(),
        created_at: new Date().toISOString()
      });
      
    if (recordError) {
      throw new Error(`Error creating donation record: ${recordError.message}`);
    }
    
    // Step 6: Add token transaction record
    console.log('Creating token transaction record...');
    const { error: txnError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: bonusTokens,
        transaction_type: 'donation_bonus',
        description: `Received ${bonusTokens} tokens for donating $${amount} to Wildlife Conservation Network`,
        reference_type: 'donation',
        reference_id: donationReference
      });
      
    if (txnError) {
      throw new Error(`Error creating token transaction: ${txnError.message}`);
    }
    
    console.log('\n✅ Test donation completed successfully!');
    console.log(`-----------------------------------`);
    console.log(`User ID: ${userId}`);
    console.log(`Donation Reference: ${donationReference}`);
    console.log(`Amount: $${amount.toFixed(2)}`);
    console.log(`Premium Status:`);
    console.log(`- Days Added: ${premiumDays}`);
    console.log(`- Premium Until: ${newPremiumEnd.toISOString()}`);
    console.log(`- Tokens Added: ${bonusTokens}`);
    console.log(`- New Token Balance: ${newTokens}`);
    console.log(`-----------------------------------`);
    console.log(`\nTo test the success page, visit:`);
    console.log(`${process.env.NEXT_PUBLIC_APP_URL}/donation/success?ref=${donationReference}`);
    
  } catch (error) {
    console.error('Error creating test donation:', error);
  }
}

// Get the user ID from command line args
const userId = process.argv[2];
createTestDonation(userId);
