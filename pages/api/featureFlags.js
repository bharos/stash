import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      const { feature } = req.query; // Expect 'feature' as the query parameter

      if (!feature) {
        return res.status(400).json({ error: 'Feature name is required' });
      }

      try {
        // Fetch feature flag status from Supabase
        const { data, error } = await supabase
          .from('feature_flags')
          .select('status')
          .eq('feature', feature)
          .single();

        if (error) {
          console.error('Error fetching feature flag:', error.message);
          
          if (error.code === 'PGRST116') { // No matching rows
            return res.status(404).json({ error: 'Feature flag not found' });
          }
          return res.status(500).json({ error: 'Error retrieving feature flag' });
        }

        return res.status(200).json({ status: data?.status });
      } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
