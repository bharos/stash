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
      // Get user's donation history
      try {
        const { data, error } = await supabase
          .from('donation_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching donation history:', error);
          return res.status(500).json({ error: 'Failed to fetch donation history' });
        }

        return res.status(200).json({ donations: data });
      } catch (err) {
        console.error('Unexpected error during GET request:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}