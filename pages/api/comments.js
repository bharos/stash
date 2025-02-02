import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { experience_id, comment } = req.body;
    
    // Basic validation to ensure required data exists
    if (!experience_id || !comment) {
      return res.status(400).json({ error: 'Experience ID and comment are required.' });
    }

    try {
    // Extract the token from the Authorization header
    const token = req.headers['authorization']?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing.' });
    }

    // Use the token to fetch the user data securely from Supabase Auth server
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'User not authenticated. Are you signed in ?' });
    }
      // Insert the comment into the comments table, including the user_id
      const { data, error } = await supabase
        .from('comments')
        .insert([{ experience_id, comment, user_id: user.id }])  // Add user_id here
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const newComment = data[0]; // Get the newly inserted comment

      res.status(200).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    const { experience_id } = req.query;

    // Basic validation to ensure experience_id exists
    if (!experience_id) {
      return res.status(400).json({ error: 'Experience ID is required.' });
    }

    try {
      // Fetch the comments related to the experience_id along with the username from profiles
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          id, 
          comment, 
          created_at, 
          username:profiles(username)
        `)
        .eq('experience_id', experience_id)
        .order('created_at', { ascending: false }); // Order by timestamp DESC

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
