// Manual Donation Verification Flow

/**
 * Since webhooks may not be available for non-partner applications,
 * this alternate approach requires users to provide proof of their donation.
 * 
 * The flow works as follows:
 * 
 * 1. User visits your fundraiser page on Every.org
 * 2. After donation, Every.org emails them a receipt
 * 3. User submits their receipt or donation ID to your system
 * 4. You verify the donation manually or with limited API access
 * 5. Grant premium access upon verification
 * 
 * This file contains utility functions to support this workflow.
 */

import supabase from '../../../src/app/utils/supabaseClient';

/**
 * Generates a direct fundraiser link for donations
 * 
 * @param {string} nonprofitId - The nonprofit's slug on Every.org
 * @param {object} options - Additional options
 * @returns {string} The fundraiser URL
 */
export function generateFundraiserUrl(nonprofitId, options = {}) {
  // List of verified nonprofit IDs that we know work with Every.org
  const verifiedNonprofits = {
    'wildlife-conservation-network': 'support-wildlife-conservation',
    'doctors-without-borders-usa': 'support-doctors-without-borders',
    'against-malaria-foundation-usa': 'fight-malaria',
    'givedirectly': 'support-direct-cash-transfers',
    'electronic-frontier-foundation': 'support-digital-rights',
    'code-for-america': 'support-civic-tech',
    'wikimedia-foundation': 'support-free-knowledge',
    'khan-academy': 'support-khan-academy',
    'water-org': 'support-water-access',
    'direct-relief': 'support-disaster-relief'
  };

  // Default to Khan Academy if the nonprofit isn't in our list
  const fundraiserId = verifiedNonprofits[nonprofitId] || 'support-khan-academy';
  const defaultNonprofitId = verifiedNonprofits[nonprofitId] ? nonprofitId : 'khan-academy';
  
  // Construct the URL with any suggested amount
  // For staging environment in development mode
  const domain = process.env.NODE_ENV === 'development' ? 'staging.every.org' : 'www.every.org';
  
  // The staging environment has a completely different URL structure than production
  let url;
  
  // Fixed URL structure for development/staging
  if (process.env.NODE_ENV === 'development') {
    // Staging format with #/donate/card fragment - this is the format that works!
    url = `https://staging.every.org/${defaultNonprofitId}#/donate/card`;
    console.log('Using staging URL format:', url);
  } else {
    // Production format also uses #/donate/card fragment
    url = `https://www.every.org/${defaultNonprofitId}#/donate/card`;
  }
    
  // For the #/donate/card format, pre-filled amounts work differently
  if (options.amount) {
    // In this fragment-based URL format, we need to add amount differently
    url += `?amount=${options.amount}&frequency=ONCE`;
  }
  
  return url;
}

/**
 * Store a user's donation intent for manual verification
 * 
 * @param {string} userId - The user's ID
 * @param {string} nonprofitId - The nonprofit organization ID
 * @param {string} nonprofitName - The nonprofit organization name (not stored in DB, but used for display)
 * @param {number} amount - The intended donation amount
 * @returns {Promise<object>} The created donation intent record
 */
export async function createDonationIntent(userId, nonprofitId, nonprofitName, amount) {
  try {
    // Generate a unique reference for the user to include in their donation
    // Add timestamp to ensure uniqueness for repeated donations by the same user
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string
    const reference = `stash-${userId.substring(0, 8)}-${timestamp}`;
    
    // Create a donation intent record
    const { data, error } = await supabase
      .from('donation_intents')
      .insert({
        user_id: userId,
        nonprofit_id: nonprofitId,
        // Note: nonprofit_name is not stored in donation_intents table, only in donation_records
        amount,
        status: 'pending',
        donation_reference: reference,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      reference,
      intent: data
    };
  } catch (error) {
    console.error('Error creating donation intent:', error);
    throw error;
  }
}

/**
 * Store donation proof submitted by user for verification
 * 
 * @param {string} userId - User ID
 * @param {string} donationId - ID from Every.org donation receipt
 * @param {string} reference - The reference code for this donation
 * @param {number} amount - Donation amount in dollars
 * @param {string} nonprofitId - Nonprofit ID 
 * @param {string} receiptUrl - Optional URL to receipt image
 * @returns {Promise<object>} Result of the operation
 */
export async function submitDonationProof(userId, donationId, reference, amount, nonprofitId, receiptUrl) {
  try {
    // Update the donation intent
    await supabase
      .from('donation_intents')
      .update({
        status: 'verification_submitted',
        donation_id: donationId,
        updated_at: new Date().toISOString()
      })
      .eq('donation_reference', reference)
      .eq('user_id', userId);
    
    // Create verification request
    const { data, error } = await supabase
      .from('donation_verification')
      .insert({
        user_id: userId,
        donation_reference: reference,
        donation_id: donationId, 
        amount,
        nonprofit_id: nonprofitId,
        receipt_url: receiptUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      verification: data
    };
  } catch (error) {
    console.error('Error submitting donation proof:', error);
    throw error;
  }
}

/**
 * Grant premium access based on verified donation
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Donation amount in dollars
 * @param {string} reference - Donation reference
 * @param {string} nonprofitName - Name of nonprofit
 * @returns {Promise<object>} Premium access details
 */
export async function grantPremiumForDonation(userId, amount, reference, nonprofitName) {
  try {
    // Calculate premium days based on donation amount
    const premiumDays = amount >= 10 ? 30 : 7;
    const premiumEnd = new Date();
    premiumEnd.setDate(premiumEnd.getDate() + premiumDays);
    
    // Get current user tokens data
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('premium_until, tokens')
      .eq('user_id', userId)
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
    if (amount > 10) {
      bonusTokens += Math.floor((amount - 10) * 30);
    }
    
    const newTokens = currentTokens + bonusTokens;
    
    // Update user_tokens
    await supabase
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
      
    // Get the nonprofit ID from the donation intent
    const { data: intentData, error: intentError } = await supabase
      .from('donation_intents')
      .select('nonprofit_id')
      .eq('donation_reference', reference)
      .single();
      
    const nonprofitId = intentData?.nonprofit_id || 'unknown';
      
    // Record the donation
    await supabase
      .from('donation_records')
      .insert({
        user_id: userId,
        donation_id: reference, // Using reference as donation_id for manual verifications
        donation_reference: reference,
        nonprofit_id: nonprofitId,
        nonprofit_name: nonprofitName || 'Unknown Nonprofit',
        amount,
        premium_days: premiumDays,
        premium_until: newPremiumEnd.toISOString(),
        created_at: new Date().toISOString()
      });
      
    // Add token transaction record
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: bonusTokens,
        transaction_type: 'donation_bonus',
        description: `Received ${bonusTokens} tokens for donating $${amount} to ${nonprofitName || 'a nonprofit'}`,
        reference_type: 'donation',
        reference_id: reference
      });
    
    return {
      success: true,
      premium: {
        days: premiumDays,
        until: newPremiumEnd.toISOString()
      },
      tokens: {
        bonus: bonusTokens,
        total: newTokens
      }
    };
  } catch (error) {
    console.error('Error granting premium access:', error);
    throw error;
  }
}
