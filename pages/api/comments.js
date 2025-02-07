import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { experience_id, comment, username } = req.body;
    
    // Basic validation to ensure required data exists
    if (!experience_id || !comment || !username) {
      return res.status(400).json({ error: 'Experience ID, comment, username are required.' });
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
        .insert([{ experience_id, comment, user_id: user.id, username }])  // Add user_id here
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
      // Fetch the experience data to get the user_id of the person who posted the experience
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .select('user_id') // Only fetch user_id from experiences table
        .eq('id', experience_id)
        .single();
  
      if (experienceError) {
        return res.status(500).json({ error: experienceError.message });
      }
  
      if (!experience) {
        return res.status(404).json({ error: 'Experience not found.' });
      }
  
      // Fetch the comments related to the experience_id along with the username from profiles
      const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          comment, 
          created_at, 
          username
        `)
        .eq('experience_id', experience_id)
        .order('created_at', { ascending: false }); // Order by timestamp DESC
  
      if (commentError) {
        return res.status(500).json({ error: commentError.message });
      }
  
      // If no comments are found, return an empty array
      if (!comments) {
        return res.status(200).json({ comments: [] });
      }
  
      // Remove `user_id` from response and add `is_op` field to each comment based on whether the user_id matches the experience user_id
      const enrichedComments = comments.map(({ user_id, ...comment }) => ({
        ...comment,
        is_op: user_id === experience.user_id, // Check if comment's user_id matches the experience's user_id
      }));
  
      res.status(200).json({ comments: enrichedComments });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
