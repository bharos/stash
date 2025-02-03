import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  try {
    let allData = [];
    let from = 0;
    let to = 999;  // Fetch 1000 records per request
    let fetchMore = true;

    // Get the total count of rows first
    const { count, error: countError } = await supabase
      .from('company_names')
      .select('id', { count: 'exact', head: true });  // Just get count, not the data

    if (countError) {
      console.error('Error fetching count:', countError);  // Log any error from count query
      return res.status(500).json({ error: countError.message });
    }

    // Loop to fetch all data in chunks of 1000
    while (fetchMore) {
      const { data, error } = await supabase
        .from('company_names')
        .select('name, featured')  // Include 'feature' column to prioritize featured companies
        .range(from, to);  // Fetch data in chunks

      if (error) {
        console.error('Error fetching data:', error);  // Log any error from Supabase
        return res.status(500).json({ error: error.message });
      }

      allData = [...allData, ...data];

      if (allData.length >= count) {
        fetchMore = false;  // Stop fetching when we've reached the total count
      } else {
        from = to + 1;
        to = to + 1000;  // Move to the next range of 1000 rows
      }
    }

    // Sort the data so that featured companies (feature = TRUE) are at the top
    allData.sort((a, b) => {
      if (a.featured && !b.featured) return -1;  // a comes before b if a is featured
      if (!a.featured && b.featured) return 1;   // b comes before a if b is featured
      return 0;  // If both are the same, keep original order
    });

    // Log the data that is returned from the query
    console.log('Fetched company names size:', allData.length);

    if (!allData || allData.length === 0) {
      return res.status(404).json({ error: 'No company names found' });
    }

    // Return the fetched data
    return res.status(200).json(allData);
  } catch (err) {
    console.error('Unexpected error:', err);  // Log any unexpected error
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
