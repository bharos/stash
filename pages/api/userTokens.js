import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.id) {
    return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
  }

  switch (method) {
    case 'GET':
      // Get user's token/coin balance
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('coins, premium_until')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user tokens:', error);
          return res.status(500).json({ error: 'Error retrieving token data' });
        }

        // If no records found, return default values
        if (!data) {
          return res.status(200).json({ coins: 0, premium_until: null });
        }

        return res.status(200).json(data);
      } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    case 'POST':
      // Handle spending coins for premium access
      const { action, amount } = req.body;

      if (!action || !amount) {
        return res.status(400).json({ error: 'Action and amount are required' });
      }

      try {
        // Get current user tokens
        const { data: userData, error: userError } = await supabase
          .from('user_tokens')
          .select('coins, premium_until')
          .eq('user_id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error fetching user tokens:', userError);
          return res.status(500).json({ error: 'Error retrieving token data' });
        }

        // If no user_tokens record exists, create one with default values
        let currentCoins = 0;
        let currentPremiumUntil = null;

        if (userData) {
          currentCoins = userData.coins;
          currentPremiumUntil = userData.premium_until;
        }

        if (action === 'spend') {
          // Check if user has enough coins
          if (currentCoins < amount) {
            return res.status(400).json({ error: 'Not enough coins' });
          }

          let premiumDays = 0;
          if (amount === 100) {
            premiumDays = 7; // 1 week
          } else if (amount === 300) {
            premiumDays = 30; // 30 days (1 month)
          } else {
            return res.status(400).json({ error: 'Invalid amount for premium access' });
          }

          // Check if user already has premium
          const now = new Date();
          if (currentPremiumUntil && new Date(currentPremiumUntil) > now) {
            return res.status(400).json({ error: 'You already have an active premium subscription. Please wait until it expires before purchasing again.' });
          }
          
          // Calculate new premium_until date
          let newPremiumUntil = new Date();
          newPremiumUntil.setDate(newPremiumUntil.getDate() + premiumDays);

          // Update user tokens
          const { error: updateError } = await supabase
            .from('user_tokens')
            .upsert([{
              user_id: user.id,
              coins: currentCoins - amount,
              premium_until: newPremiumUntil.toISOString()
            }], { 
              onConflict: 'user_id' // Specify the constraint to use for conflict detection
            });

          if (updateError) {
            console.error('Error updating user tokens:', updateError);
            return res.status(500).json({ error: 'Error updating token data' });
          }
          
          // Record the transaction in the ledger
          try {
            const premiumDuration = amount === 100 ? '1 week' : '30 days';
            const { data: transactionData, error: transactionError } = await supabase
              .from('token_transactions')
              .insert([{
                user_id: user.id,
                amount: amount, // Keep as positive since we're using transaction_type
                transaction_type: 'spend',
                description: `Premium access purchased (${premiumDuration})`,
                source: 'premium_purchase',
                reference_id: null // No need for a reference ID here
              }])
              .select();
              
            if (transactionError) {
              console.error('Error recording transaction:', transactionError);
              console.log('Transaction error details:', JSON.stringify(transactionError));
            } else {
              console.log("Successfully recorded premium purchase transaction:", transactionData);
            }
          } catch (transactionError) {
            console.error('Error recording transaction:', transactionError);
            // Continue anyway since the main functionality succeeded
          }

          return res.status(200).json({
            message: 'Premium access purchased successfully',
            coins: currentCoins - amount,
            premium_until: newPremiumUntil.toISOString()
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }
      } catch (err) {
        console.error('Unexpected error during POST request:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
