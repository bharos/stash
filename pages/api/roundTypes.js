import supabase from '../../src/app/utils/supabaseClient';


export default async function handler(req, res) {
  try {
    // Query the round_types table
    const { data, error } = await supabase
      .from('round_types')
      .select('name');

    if (error) {
      console.error('Error fetching data:', error);  // Log any error from Supabase
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No round types found' });
    }

    // Return the fetched data
    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);  // Log any unexpected error
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
