import { submitDonationProof, grantPremiumForDonation } from '../../../src/app/utils/donationUtils';
import supabase from '../../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['authorization']?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing' });
  }

  try {
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get verification details from request
    const { 
      donationId, 
      reference, 
      amount, 
      nonprofitId, 
      receiptUrl,
      autoVerify // If true, bypass verification and grant premium immediately (for testing)
    } = req.body;
    
    if (!donationId || !reference || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First check if this donation reference exists for this user
    const { data: intent, error: intentError } = await supabase
      .from('donation_intents')
      .select('*')
      .eq('donation_reference', reference)
      .eq('user_id', user.id)
      .single();
      
    if (intentError || !intent) {
      return res.status(404).json({ error: 'Donation reference not found for this user' });
    }
    
    // Auto-verification (for testing or manual approval paths)
    if (autoVerify && process.env.ALLOW_AUTO_VERIFY === 'true') {
      // Grant premium access immediately
      const result = await grantPremiumForDonation(
        user.id,
        amount,
        reference,
        null // nonprofit_name is not in the donation_intents table
      );
      
      // Update the intent status
      await supabase
        .from('donation_intents')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          donation_id: donationId
        })
        .eq('donation_reference', reference);
      
      return res.status(200).json({
        success: true,
        message: 'Donation verified and premium access granted',
        premiumDays: result.premium.days,
        premiumUntil: result.premium.until,
        bonusTokens: result.tokens.bonus
      });
    }
    
    // For normal flow, submit for verification
    const result = await submitDonationProof(
      user.id,
      donationId,
      reference,
      amount,
      nonprofitId || intent.nonprofit_id,
      receiptUrl
    );
    
    return res.status(200).json({
      success: true,
      message: 'Donation submitted for verification. Premium access will be granted once verified.',
      verificationId: result.verification.id
    });
  } catch (error) {
    console.error('Donation verification error:', error);
    return res.status(500).json({ error: 'Failed to process verification request' });
  }
}
