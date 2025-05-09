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
      // Get user's token transaction history
      try {
        const { limit = 10, offset = 0 } = req.query;
        
        // First, get total count
        const { count, error: countError } = await supabase
          .from('token_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (countError) {
          console.error('Error counting transactions:', countError);
          return res.status(500).json({ error: 'Error retrieving transaction data' });
        }
        
        // Then get paginated results
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
          console.error('Error fetching token transactions:', error);
          return res.status(500).json({ error: 'Error retrieving transaction data' });
        }

        return res.status(200).json({ 
          transactions: data,
          total: count
        });
      } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    case 'POST':
      // Internal API: Add a new transaction record
      // This should be called by other API endpoints, not directly by clients
      const { amount, transaction_type, description, source, reference_id } = req.body;

      if (!amount || !transaction_type || !description || !source) {
        return res.status(400).json({ 
          error: 'Missing required fields. Required: amount, transaction_type, description, source' 
        });
      }

      if (!['earn', 'spend'].includes(transaction_type)) {
        return res.status(400).json({ 
          error: 'Invalid transaction_type. Must be "earn" or "spend"' 
        });
      }

      try {
        const { data, error } = await supabase
          .from('token_transactions')
          .insert([{
            user_id: user.id,
            amount,
            transaction_type,
            description,
            source,
            reference_id: reference_id || null
          }]);

        if (error) {
          console.error('Error recording transaction:', error);
          return res.status(500).json({ error: 'Failed to record token transaction' });
        }

        return res.status(201).json({ message: 'Transaction recorded successfully' });
      } catch (err) {
        console.error('Unexpected error during POST request:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
