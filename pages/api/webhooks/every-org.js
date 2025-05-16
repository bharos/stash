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
    
    // Verify webhook signature from Every.org if present
    const signature = req.headers['x-every-signature'];
    
    // Check if we're in development mode or a preview deployment
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          process.env.VERCEL_ENV === 'preview';
    
    // If we have a webhook secret and a signature header is provided, validate it
    if (process.env.EVERY_ORG_WEBHOOK_SECRET && signature) {
      // Create HMAC using webhook secret
      const hmac = crypto.createHmac('sha256', process.env.EVERY_ORG_WEBHOOK_SECRET);
      hmac.update(JSON.stringify(req.body));
      const calculatedSignature = hmac.digest('hex');
      
      console.log('Validating webhook signature...');
      console.log('Provided signature:', signature);
      console.log('Calculated signature (first 10 chars):', calculatedSignature.substring(0, 10) + '...');
      
      if (signature !== calculatedSignature) {
        console.error('Invalid webhook signature');
        if (!isDevelopment) {
          // In production, reject invalid signatures
          return res.status(401).json({ error: 'Invalid signature' });
        } else {
          // In development, log the error but continue (for testing)
          console.warn('Invalid signature, but continuing because we are in development mode');
        }
      } else {
        console.log('Webhook signature valid');
      }
    } else {
      console.warn('No signature validation performed - either missing signature header or webhook secret');
      // Allow webhooks without signatures in development/preview mode or for tests
      if (!isDevelopment && !req.headers['x-webhook-test']) {
        console.warn('Missing signature in production mode - this could be dangerous');
      } else {
        console.log('Skipping signature validation in development/preview mode or test request');
      }
    }
    
    // Log webhook details for debugging
    console.log('Received webhook from Every.org:', {
      event: req.body.event,
      reference: req.body.data?.reference,
      status: req.body.data?.status,
      amount: req.body.data?.amount
    });
    
    // Process the webhook payload
    const {
      event,
      data: {
        reference,
        status,
        amount,
        nonprofitId,
        nonprofitName
      }
    } = req.body;
    
    // Only process completed donations
    if (event === 'donation.completed' && status === 'SUCCEEDED') {
      // Find the donation intent in your database
      const { data: donationIntent, error } = await supabase
        .from('donation_intents')
        .select('user_id, amount')
        .eq('donation_reference', reference)
        .single();
        
      if (error || !donationIntent) {
        console.error('Donation intent not found:', error);
        return res.status(404).json({ error: 'Donation reference not found' });
      }
      
      const { user_id } = donationIntent;
      
      // Calculate donation amount in dollars
      const donationAmountUSD = amount / 100; // Convert from cents
      
      // Calculate premium duration based on donation amount
      const premiumDays = calculatePremiumDays(donationAmountUSD);
      const premiumEnd = new Date();
      premiumEnd.setDate(premiumEnd.getDate() + premiumDays);
      
      // Update user premium status in user_tokens
      const { data: userData, error: userError } = await supabase
        .from('user_tokens')
        .select('premium_until, tokens')
        .eq('user_id', user_id)
        .single();

      // Calculate the new premium end date
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
      if (donationAmountUSD > 10) {
        bonusTokens += Math.floor((donationAmountUSD - 10) * 30);
      }
      
      const newTokens = currentTokens + bonusTokens;

      // Update or insert user_tokens record
      const tokenData = {
        user_id,
        premium_until: newPremiumEnd.toISOString(),
        tokens: newTokens,
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
          donation_id: req.body.data.donationId || reference,
          nonprofit_id: nonprofitId,
          nonprofit_name: nonprofitName,
          amount: donationAmountUSD,
          donation_reference: reference,
          premium_days: premiumDays,
          premium_until: newPremiumEnd.toISOString(),
          created_at: new Date().toISOString()
        });

      if (recordError) {
        console.error('Error recording donation:', recordError);
      }

      // Add to token transactions
      const { error: txnError } = await supabase
        .from('token_transactions')
        .insert({
          user_id,
          amount: bonusTokens,
          transaction_type: 'donation_bonus',
          description: `Received ${bonusTokens} tokens for donating $${donationAmountUSD} to ${nonprofitName || 'a nonprofit'}`,
          reference_type: 'donation',
          reference_id: reference
        });
        
      if (txnError) {
        console.error('Error creating token transaction:', txnError);
      }
      
      // Log complete donation process for debugging
      console.log(`===== Donation Completed =====`);
      console.log(`- User: ${user_id}`);
      console.log(`- Reference: ${reference}`);
      console.log(`- Amount: $${donationAmountUSD}`);
      console.log(`- Charity: ${nonprofitName} (${nonprofitId})`);
      console.log(`- Premium days: ${premiumDays}`);
      console.log(`- Premium until: ${newPremiumEnd.toISOString()}`);
      console.log(`- Bonus tokens: ${bonusTokens}`);
      console.log(`============================`);
      
      // Send success response with details
      return res.status(200).json({ 
        success: true, 
        message: 'Donation processed successfully',
        premiumDays,
        premiumUntil: newPremiumEnd.toISOString(),
        bonusTokens
      });
    } else {
      // For other event types, just acknowledge receipt
      console.log(`Received Every.org webhook: ${event}, status: ${status}`);
      return res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('Error processing donation webhook:', error);
    return res.status(500).json({ error: 'Failed to process donation' });
  }
}