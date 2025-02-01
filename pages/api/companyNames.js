import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  try {
    console.log('Fetching company names...');  // Log to see when the query starts
    
    // Query the company_names table
    const { data, error } = await supabase
      .from('company_names')
      .select('name');  // Assuming 'names' is the column in your table

    if (error) {
      console.error('Error fetching data:', error);  // Log any error from Supabase
      return res.status(500).json({ error: error.message });
    }

    // Log the data that is returned from the query
    console.log('Fetched company names:', data);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No company names found' });
    }

    // Return the fetched data
    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);  // Log any unexpected error
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
