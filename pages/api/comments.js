import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { experience_id, comment } = req.body;

    // Basic validation to ensure required data exists
    if (!experience_id || !comment) {
      return res.status(400).json({ error: 'Experience ID and comment are required.' });
    }

    try {
      // Insert the comment into the comments table
      const { data, error } = await supabase
        .from('comments')
        .insert([{ experience_id, comment }])
        .select();  // Select inserted fields (id, comment, created_at)

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Assuming `data` returns an array with the inserted comment
      const newComment = data[0];

      res.status(200).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    const { experience_id } = req.query;

    console.log('experience_id:', experience_id);

    // Basic validation to ensure experience_id exists
    if (!experience_id) {
      return res.status(400).json({ error: 'Experience ID is required.' });
    }

    try {
      // Fetch the comments related to the experience_id
      const { data: comments, error } = await supabase
        .from('comments')
        .select('id, comment, created_at')
        .eq('experience_id', experience_id)
        .order('created_at', { ascending: false }); // to order by timestamp DESC

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // If no comments are found, return an empty array
      if (!comments) {
        return res.status(200).json({ comments: [] });
      }

      res.status(200).json({ comments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
