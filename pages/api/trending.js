
import supabase from '../../src/app/utils/supabaseClient';


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get pagination parameters from the request
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit; // Calculate offset

    console.log('page ', page, 'offset ', offset, 'limit ', limit);
    // Fetch trending posts from Supabase with pagination
    const { data, error } = await supabase
      .from('trending')
      .select('*')
      .order('trending_score', { ascending: false }) // Sort by highest trending score
      .range(offset, offset + limit - 1); // Apply pagination

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
