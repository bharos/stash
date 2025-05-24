import { generateFundraiserUrl, createDonationIntent } from '../../../src/app/utils/donationUtils';
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

    // Get donation details from request
    let { nonprofitId, nonprofitName, amount, isPremium = false } = req.body;
    
    if (!nonprofitId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }
    
    // Validate minimum donation amount
    // Every.org requires minimum $10 for donations
    if (amount < 10) {
      return res.status(400).json({ 
        error: 'Minimum donation amount is $10' 
      });
    }

    // List of verified nonprofit IDs that we know work with Every.org
    const verifiedNonprofits = [
      'wildlife-conservation-network',
      'doctors-without-borders-usa',
      'against-malaria-foundation-usa',
      'givedirectly',
      'electronic-frontier-foundation',
      'code-for-america',
      'wikimedia-foundation',
      'khan-academy',
      'water-org',
      'direct-relief'
    ];
    
    // Create variables for the final values to avoid reassignment issues
    let finalNonprofitId = nonprofitId;
    let finalNonprofitName = nonprofitName;
    
    // Check if the provided nonprofit ID is in our verified list, use a default if not
    if (!verifiedNonprofits.includes(nonprofitId)) {
      console.warn(`Unverified nonprofit ID: ${nonprofitId}`);
      res.status(400).json({
        error: 'Unverified nonprofit ID.'
      });
    }
    
    // Create donation intent
    const intentResult = await createDonationIntent(
      user.id, 
      finalNonprofitId,
      finalNonprofitName,
      amount,
      isPremium // Pass premium status
    );
    
    // Generate fundraiser URL
    const fundraiserUrl = generateFundraiserUrl(finalNonprofitId, {
      amount: amount,
      reference: intentResult.reference,
      isPremium: isPremium // Include premium status in the URL metadata
    });
    
    // Return the redirect URL to the client
    const response = { 
      success: true, 
      donationUrl: fundraiserUrl,
      reference: intentResult.reference,
      message: "Please complete your donation and then submit your donation ID for verification",
      verificationRequired: true
    }
    console.log('Response:', response);
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Donation fundraiser error:', error);
    
    // Handle duplicate reference errors more gracefully
    if (error.code === '23505' && error.message?.includes('donation_reference')) {
      // If we get a duplicate reference, we can try to find the existing reference
      // and return that instead of creating a new one
      try {
        // Generate fundraiser URL even if intent creation failed
        const fundraiserUrl = generateFundraiserUrl(finalNonprofitId, {
          amount: amount
        });
        
        // Find the existing donation intent for this user
        const { data: existingIntent } = await supabase
          .from('donation_intents')
          .select('donation_reference')
          .eq('user_id', user.id)
          .eq('nonprofit_id', finalNonprofitId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (existingIntent) {
          return res.status(200).json({ 
            success: true, 
            donationUrl: fundraiserUrl,
            reference: existingIntent.donation_reference,
            message: "Using your existing donation reference. Please complete your donation.",
            verificationRequired: true
          });
        }
      } catch (secondaryError) {
        console.error('Error handling duplicate reference:', secondaryError);
      }
      
      // If we couldn't recover from the duplicate, provide a more helpful error
      return res.status(409).json({ 
        error: 'A donation is already in progress. Please complete it or try again later.' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to process donation request' });
  }
}
