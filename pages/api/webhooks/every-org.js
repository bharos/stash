import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for webhook operations
// This ensures we have proper permissions to update user data
let supabase;

// First try to use the admin client if available
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} else {
  // Fall back to the regular client if no service key is available
  // This might have limited permissions
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using regular client with limited permissions');
  supabase = require('../../../src/app/utils/supabaseClient').default;
}

// Function to calculate premium days based on donation amount
function calculatePremiumDays(amount) {
  // Every.org minimum donation is now $10 which gives 30 days
  return 30;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Log environment information for debugging
    console.log(`========== Every.org Webhook Received ==========`);
    console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`);
    console.log(`Vercel Environment: ${process.env.VERCEL_ENV || 'not on Vercel'}`);
    console.log(`Deployment URL: ${process.env.VERCEL_URL || 'unknown'}`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Log the full request for debugging during initial setup
    console.log('Webhook request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Webhook request body:', JSON.stringify(req.body, null, 2));
    
    // Log webhook details for debugging
    console.log('Received webhook from Every.org:', {
      chargeId: req.body.chargeId,
      partnerDonationId: req.body.partnerDonationId,
      amount: req.body.amount,
      toNonprofit: req.body.toNonprofit
    });
    
    // Extract the required fields from the webhook payload
    const {
      chargeId,
      partnerDonationId,
      amount,
      netAmount,
      toNonprofit,
      partnerMetadata
    } = req.body;
    
    // Extract the reference from partnerDonationId or partnerMetadata
    const reference = partnerDonationId || (partnerMetadata?.reference);
    
    // Only process donations with a reference
    if (reference && toNonprofit) {
      // Find the donation intent in your database
      const { data: donationIntent, error } = await supabase
        .from('donation_intents')
        .select('user_id, amount, is_premium_user')
        .eq('donation_reference', reference)
        .single();
        
      if (error || !donationIntent) {
        console.error('Donation intent not found:', error);
        return res.status(404).json({ error: 'Donation reference not found' });
      }
      
      const { user_id } = donationIntent;
      const wasPremiumUser = donationIntent?.is_premium_user || false;
      
      // Parse donation amount in dollars from the webhook payload
      const donationAmountUSD = parseFloat(amount);
      
      // Extract nonprofit details from the webhook payload
      const nonprofitId = toNonprofit.slug;
      const nonprofitName = toNonprofit.name;
      
      // Calculate premium duration based on donation amount and premium status
      let premiumDays = 0;
      if (!wasPremiumUser && donationAmountUSD >= 10) {
        // Only give premium days if they weren't already premium
        premiumDays = calculatePremiumDays(donationAmountUSD);
      }
      
      const premiumEnd = new Date();
      if (premiumDays > 0) {
        premiumEnd.setDate(premiumEnd.getDate() + premiumDays);
      }
      
      // Update user premium status in user_tokens
      const { data: userData, error: userError } = await supabase
        .from('user_tokens')
        .select('premium_until, coins')
        .eq('user_id', user_id)
        .single();

      // Calculate the new premium end date
      let newPremiumEnd = new Date();
      let currentCoins = 0;
      
      if (!userError && userData) {
        currentCoins = userData.coins || 0;
        
        if (wasPremiumUser) {
          // If user was premium at donation time, don't modify their premium status
          // Just keep whatever premium_until they currently have
          if (userData.premium_until) {
            newPremiumEnd = new Date(userData.premium_until);
          }
        } else if (premiumDays > 0) {
          // For non-premium users who qualify for premium, give them premium days
          // starting from today (or extend their current premium if they have it)
          if (userData.premium_until && new Date(userData.premium_until) > new Date()) {
            // If they somehow already have premium, extend it
            newPremiumEnd = new Date(userData.premium_until);
            newPremiumEnd.setDate(newPremiumEnd.getDate() + premiumDays);
          } else {
            // Otherwise give them premium starting today
            // Make sure we're giving them a date that includes the premium days
            newPremiumEnd = new Date();
            newPremiumEnd.setDate(newPremiumEnd.getDate() + premiumDays);
          }
        }
      }

      // Calculate bonus coins based on premium status
      let bonusCoins = 0;
      
      if (wasPremiumUser) {
        // Premium users get 30 coins per dollar for entire donation amount
        if (donationAmountUSD >= 10) {
          bonusCoins = Math.floor(donationAmountUSD * 30);
        }
      } else {
        // Non-premium users only get coins for amounts above $10
        if (donationAmountUSD > 10) {
          bonusCoins = Math.floor((donationAmountUSD - 10) * 30);
        }
      }
      
      const newCoins = currentCoins + bonusCoins;

      // Update or insert user_tokens record
      const tokenData = {
        user_id,
        premium_until: newPremiumEnd.toISOString(),
        coins: newCoins,
        updated_at: new Date().toISOString()
      };

      const tokenResult = await supabase
        .from('user_tokens')
        .upsert(tokenData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (tokenResult.error) {
        console.error('Error updating premium status:', tokenResult.error);
        return res.status(500).json({ error: 'Failed to update premium status' });
      }

      // Update donation intent status to completed
      const { error: updateError } = await supabase
        .from('donation_intents')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('donation_reference', reference);
      
      // Record the completed donation
      const { error: recordError } = await supabase
        .from('donation_records')
        .insert({
          user_id,
          donation_id: chargeId || reference,
          nonprofit_id: nonprofitId,
          nonprofit_name: nonprofitName,
          amount: donationAmountUSD,
          donation_reference: reference,
          premium_days: premiumDays,
          premium_until: newPremiumEnd.toISOString(),
          token_amount: bonusCoins,
          is_premium_user: wasPremiumUser,
          created_at: new Date().toISOString()
        });

      if (recordError) {
        console.error('Error recording donation:', recordError);
      }

      // Add to token transactions for the bonus coins (if any)
      if (bonusCoins > 0) {
        const { error: txnError } = await supabase
          .from('token_transactions')
          .insert({
            user_id,
            amount: bonusCoins,
            transaction_type: 'earn',
            description: `Received ${bonusCoins} coins for donating $${donationAmountUSD} to ${nonprofitName || 'a nonprofit'}`,
            source: 'donation_bonus',
            reference_id: null
          });
          
        if (txnError) {
          console.error('Error creating token transaction:', txnError);
        }
      }
      
      // Add a transaction entry for premium status if premium days were granted
      if (premiumDays > 0) {
        const { error: premiumTxnError } = await supabase
          .from('token_transactions')
          .insert({
            user_id,
            amount: 0, // No coins exchanged for this transaction
            transaction_type: 'earn',
            description: `Received ${premiumDays} days of premium status for donating $${donationAmountUSD} to ${nonprofitName || 'a nonprofit'}`,
            source: 'premium_status',
            reference_id: null
          });
          
        if (premiumTxnError) {
          console.error('Error creating premium status transaction:', premiumTxnError);
        }
      }
      
      // Log complete donation process for debugging
      console.log(`===== Donation Completed =====`);
      console.log(`- User: ${user_id}`);
      console.log(`- Was Premium: ${wasPremiumUser ? 'Yes' : 'No'}`);
      console.log(`- Reference: ${reference}`);
      console.log(`- Amount: $${donationAmountUSD}`);
      console.log(`- Charity: ${nonprofitName} (${nonprofitId})`);
      console.log(`- Premium days: ${premiumDays}`);
      console.log(`- Premium until: ${newPremiumEnd.toISOString()}`);
      console.log(`- Bonus coins: ${bonusCoins}`);
      console.log(`============================`);
      
      // Send success response with details
      return res.status(200).json({ 
        success: true, 
        message: 'Donation processed successfully',
        premiumDays,
        premiumUntil: newPremiumEnd.toISOString(),
        bonusCoins
      });
    } else {
      // If no reference found, just acknowledge receipt
      console.log(`Received Every.org webhook without valid reference`);
      return res.status(200).json({ received: true, message: 'No valid reference found' });
    }
  } catch (error) {
    console.error('Error processing donation webhook:', error);
    return res.status(500).json({ error: 'Failed to process donation' });
  }
}