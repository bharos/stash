import { nanoid } from 'nanoid';
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
    let { nonprofitId, nonprofitName, amount } = req.body;
    
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

    // Generate a unique reference ID for this donation
    const donationReference = nanoid();
    
    // Create donation intent in your database
    const { data: intentData, error: intentError } = await supabase
      .from('donation_intents')
      .insert({
        user_id: user.id,
        nonprofit_id: nonprofitId,
        amount,
        status: 'pending',
        donation_reference: donationReference,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (intentError) {
      console.error('Error creating donation intent:', intentError);
      return res.status(500).json({ error: 'Failed to create donation intent' });
    }

    // Log the API key presence (without revealing it)
    if (!process.env.EVERY_ORG_API_KEY) {
      console.error('Missing Every.org API key in environment variables');
      return res.status(500).json({ error: 'Server configuration error (missing API key)' });
    }

    // Log the app URL being used
    console.log(`Using app URL for redirects: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'}`);

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
      console.warn(`Unverified nonprofit ID: ${nonprofitId}, using wildlife-conservation-network as fallback`);
      finalNonprofitId = 'wildlife-conservation-network';
      finalNonprofitName = 'Wildlife Conservation Network';
    }
    
    // Initialize donation with Every.org
    const apiKey = process.env.EVERY_ORG_API_KEY;
    
    // Prepare the payload
    const payload = {
      nonprofitId: finalNonprofitId,
      name: finalNonprofitName || 'Donation for Premium Access', 
      amount: amount * 100, // Convert to cents
      currency: 'USD',
      reference: donationReference,
      description: 'Donate to support this nonprofit and get premium access on Stash',
      onCompleteRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/donation/success?ref=${donationReference}`,
      onCancelRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/donation/cancel?ref=${donationReference}`,
      metadata: {
        userId: user.id,
        source: 'stash_premium_access'
      },
      // Include webhook token when it's available (you'll get this from Every.org)
      webhook_token: process.env.EVERY_ORG_WEBHOOK_TOKEN || undefined
    };
    
    console.log('Sending donation request to Every.org:', JSON.stringify(payload, null, 2));
    
    // Try both known API endpoints to maximize chance of success
    // Use staging domain for development/testing
    const domain = process.env.NODE_ENV === 'development' ? 'staging' : 'partners';
    const endpoints = [
      `https://api${process.env.NODE_ENV === 'development' ? '-staging' : ''}.every.org/v0.2/donation/checkout?apiKey=${apiKey}`,
      `https://${domain}.every.org/v0.2/donation/checkout?apiKey=${apiKey}`,
      `https://${domain}.every.org/v0.2/donate/checkout?apiKey=${apiKey}`
    ];
    
    let everyOrgResponse;
    let endpointUsed;
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      console.log(`Trying API endpoint: ${endpoint.split('?')[0]}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        console.log(`Response from ${endpoint.split('?')[0]}: ${response.status}`);
        
        if (response.ok) {
          everyOrgResponse = response;
          endpointUsed = endpoint.split('?')[0];
          console.log(`Successful endpoint: ${endpointUsed}`);
          break;
        }
      } catch (e) {
        console.error(`Error trying endpoint ${endpoint.split('?')[0]}:`, e.message);
      }
    }
    
    // If no endpoints worked, set the last response as the error response
    if (!everyOrgResponse) {
      console.error('All API endpoints failed');
      return res.status(500).json({ error: 'Failed to connect to Every.org API. Please try again later.' });
    }
    
    // Log the status code to help with debugging
    console.log(`Every.org API response status: ${everyOrgResponse.status}`);
    
    if (!everyOrgResponse.ok) {
      let errorMessage = `HTTP error ${everyOrgResponse.status}`;
      
      // Clone the response before trying to read it, so we can try multiple formats
      const responseClone = everyOrgResponse.clone();
      
      try {
        // Attempt to parse the error response as JSON
        const errorData = await everyOrgResponse.json();
        console.error('Every.org API error:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If the response isn't valid JSON, get the text instead
        try {
          const errorText = await responseClone.text();
          console.error('Every.org API error (non-JSON):', errorText);
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.error('Could not read Every.org error response:', textError);
        }
      }
      
      return res.status(500).json({ error: `Failed to initialize donation: ${errorMessage}` });
    }
    
    // Parse the successful response
    const everyOrgData = await everyOrgResponse.json();
    
    if (!everyOrgData.donationUrl) {
      throw new Error('Missing donation URL in Every.org response');
    }
    
    // Update donation intent with the Every.org donation ID if provided
    if (everyOrgData.donationId) {
      await supabase
        .from('donation_intents')
        .update({ donation_id: everyOrgData.donationId })
        .eq('id', intentData.id);
    }
    
    // Return the redirect URL to the client
    return res.status(200).json({ 
      success: true, 
      donationUrl: everyOrgData.donationUrl,
      reference: donationReference
    });
    
  } catch (error) {
    console.error('Donation creation error:', error);
    return res.status(500).json({ error: 'Failed to process donation' });
  }
}
