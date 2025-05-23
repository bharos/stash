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
  
  // Determine if we should use staging environment
  const useStaging = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
                     process.env.USE_STAGING_SERVICES === 'true';
  
  // Use appropriate domain based on environment
  const domain = useStaging ? 'staging.every.org' : 'www.every.org';
  
  // Log which environment we're using
  console.log(`Using ${useStaging ? 'staging' : 'production'} environment for Every.org`);
  
  // The staging environment has a completely different URL structure than production
  let url;
  
  // Create the donation URL with the proper domain
  url = `https://${domain}/${defaultNonprofitId}#/donate/card`;
  
  if (useStaging) {
    console.log('Using staging URL format:', url);
  }
    
  // For the #/donate/card format, pre-filled amounts work differently
  if (options.amount) {
    // In this fragment-based URL format, we need to add amount differently
    url += `?amount=${options.amount}&frequency=ONCE`;
  } else {
    // Add a question mark if no amount is specified
    url += '?frequency=ONCE';
  }
  
  // Generate a reference if not provided
  // Require reference to be provided
if (!options.reference) {
  console.error('Missing donation reference in generateFundraiserUrl');
  throw new Error('Donation reference is required. Create a donation intent first.');
}
const reference = options.reference;
  
  // Add partner_donation_id for tracking this specific donation
  url += `&partner_donation_id=${encodeURIComponent(reference)}`;
  
  // Add partner_id to identify your platform (stashdb)
  const partnerId = process.env.NEXT_PUBLIC_EVERY_ORG_PARTNER_ID || 'stashdb';
  url += `&partner_id=${encodeURIComponent(partnerId)}`;
  
  // Add metadata that will be sent back to you in the webhook
  const metadata = {
    userId: options.userId || 'anonymous',
    source: 'stashdb',
    nonprofitId,
    amount: options.amount,
    reference: reference,
    isPremium: options.isPremium || false, // Include premium status in metadata
    environment: useStaging ? 'staging' : 'production'
  };
  const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString('base64');
  url += `&partner_metadata=${encodeURIComponent(encodedMetadata)}`;
  
  // Include webhook token if available - this tells Every.org to send webhook notifications
  if (process.env.EVERY_ORG_WEBHOOK_TOKEN) {
    url += `&webhook_token=${encodeURIComponent(process.env.EVERY_ORG_WEBHOOK_TOKEN)}`;
    console.log('Added webhook token to URL');
  } else {
    console.log('No webhook token available in environment variables');
  }
  
  // Request donor information (optional)
  url += `&share_info=true&require_share_info=true`;
  
  // Add designation if provided
  if (options.designation) {
    url += `&designation=${encodeURIComponent(options.designation)}`;
  }
  
  // Log the generated URL for debugging (hiding sensitive parts)
  console.log(`Generated Every.org donation URL: ${url.split('?')[0]}?[params]`);
  console.log(`URL includes: partner_id, partner_donation_id, partner_metadata, webhook_token: ${process.env.EVERY_ORG_WEBHOOK_TOKEN ? 'yes' : 'no'}`);
  
  return url;
}

/**
 * Store a user's donation intent for manual verification
 * 
 * @param {string} userId - The user's ID
 * @param {string} nonprofitId - The nonprofit organization ID
 * @param {string} nonprofitName - The nonprofit organization name (not stored in DB, but used for display)
 * @param {number} amount - The intended donation amount
 * @param {boolean} isPremium - Whether the user already has premium status
 * @returns {Promise<object>} The created donation intent record
 */
export async function createDonationIntent(userId, nonprofitId, nonprofitName, amount, isPremium = false) {
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
        is_premium_user: isPremium, // Store premium status
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
 * Grant premium access and/or tokens based on verified donation
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Donation amount in dollars
 * @param {string} reference - Donation reference
 * @param {string} nonprofitName - Name of nonprofit
 * @returns {Promise<object>} Premium access and tokens details
 */
export async function grantPremiumForDonation(userId, amount, reference, nonprofitName) {
  try {
    // First get the donation intent to check if user was already premium
    const { data: donationIntent, error: intentError } = await supabase
      .from('donation_intents')
      .select('nonprofit_id, is_premium_user')
      .eq('donation_reference', reference)
      .single();
    
    if (intentError) {
      console.error('Error retrieving donation intent:', intentError);
    }
    
    const wasPremiumUser = donationIntent?.is_premium_user || false;
    const nonprofitIdFromIntent = donationIntent?.nonprofit_id || 'unknown';
    
    // Get current user tokens data
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('premium_until, tokens')
      .eq('user_id', userId)
      .single();

    // Calculate the new premium end date
    let newPremiumEnd = new Date();
    let currentTokens = 0;
    let premiumDays = 0;
    
    // Initialize current tokens and premium status
    if (!userError && userData) {
      currentTokens = userData.tokens || 0;
      
      if (userData.premium_until && new Date(userData.premium_until) > new Date()) {
        // User already has premium, keep their current end date
        newPremiumEnd = new Date(userData.premium_until);
      }
    }
    
    // Calculate premium days ONLY for non-premium users
    if (!wasPremiumUser && amount >= 10) {
      // Only give premium days if they weren't already premium
      premiumDays = amount >= 10 ? 30 : 7;
      
      // Update premium end date for non-premium users
      if (premiumDays > 0) {
        if (!userError && userData && userData.premium_until && new Date(userData.premium_until) > new Date()) {
          // If user already has premium, extend it
          newPremiumEnd = new Date(userData.premium_until);
          newPremiumEnd.setDate(newPremiumEnd.getDate() + premiumDays);
        } else {
          // Otherwise set new premium end date from today
          newPremiumEnd = new Date();
          newPremiumEnd.setDate(newPremiumEnd.getDate() + premiumDays);
        }
      }
    }
    
    // Calculate bonus tokens based on premium status
    let bonusTokens = 0;
    
    if (wasPremiumUser) {
      // Premium users get 30 coins per dollar for entire donation amount
      // Only award coins if minimum donation amount is met
      if (amount >= 10) {
        bonusTokens = Math.floor(amount * 30);
      }
    } else {
      // Non-premium users get standard premium days for $10
      // Plus 30 coins per dollar above $10
      if (amount >= 10) {
        // For amounts above 10, calculate bonus tokens
        if (amount > 10) {
          bonusTokens = Math.floor((amount - 10) * 30);
        }
      }
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
      
    // Record the donation with token amount
    await supabase
      .from('donation_records')
      .insert({
        user_id: userId,
        donation_id: reference, // Using reference as donation_id for manual verifications
        donation_reference: reference,
        nonprofit_id: nonprofitIdFromIntent,
        nonprofit_name: nonprofitName || 'Unknown Nonprofit',
        amount,
        premium_days: premiumDays,
        premium_until: newPremiumEnd.toISOString(),
        token_amount: bonusTokens,
        is_premium_user: wasPremiumUser,
        created_at: new Date().toISOString()
      });
      
    // Add token transaction record if tokens were awarded
    if (bonusTokens > 0) {
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
    }
    
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
