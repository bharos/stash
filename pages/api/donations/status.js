import supabase from '../../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get donation reference from query params
  const { reference } = req.query;
  
  if (!reference) {
    return res.status(400).json({ error: 'Missing donation reference' });
  }
  
  try {
    console.log(`Checking status for donation reference: ${reference}`);
    
    // Fetch donation intent
    const { data, error } = await supabase
      .from('donation_intents')
      .select('*')
      .eq('donation_reference', reference)
      .single();
    
    if (error) {
      console.error('Error fetching donation status:', error);
      return res.status(404).json({ error: 'Donation reference not found' });
    }
    
    console.log(`Found donation intent with status: ${data.status}`);
    
    // If donation is completed, also fetch donation record for more details
    let premiumInfo = null;
    if (data.status === 'completed') {
      const { data: recordData, error: recordError } = await supabase
        .from('donation_records')
        .select('premium_days, premium_until, tokens_granted')
        .eq('donation_reference', reference)
        .single();
        
      if (!recordError && recordData) {
        premiumInfo = recordData;
        console.log('Found premium info:', premiumInfo);
      }
    }
    
    return res.status(200).json({
      status: data.status,
      amount: data.amount,
      created_at: data.created_at,
      completed_at: data.completed_at,
      nonprofit_id: data.nonprofit_id,
      // Use nonprofit_name from premiumInfo if available, since it's not in donation_intents
      nonprofit_name: premiumInfo?.nonprofit_name || null,
      premium_days: premiumInfo?.premium_days,
      premium_until: premiumInfo?.premium_until,
      tokens_granted: premiumInfo?.tokens_granted
    });
  } catch (err) {
    console.error('Unexpected error checking donation status:', err);
    return res.status(500).json({ error: 'Unexpected error occurred' });
  }
}