import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { experience_id, comment, username, parent_comment_id } = req.body;
    
    // Basic validation to ensure required data exists
    if (!experience_id || !comment || !username) {
      return res.status(400).json({ error: 'Experience ID, comment, and username are required.' });
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
        return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
      }
  
      // If parent_comment_id is provided, ensure it belongs to the same experience_id
      if (parent_comment_id) {
        const { data: parentComment, error: parentError } = await supabase
          .from('comments')
          .select('id, experience_id')
          .eq('id', parent_comment_id)
          .single();
  
        if (parentError || !parentComment) {
          return res.status(400).json({ error: 'Invalid parent comment ID.' });
        }
  
        if (parentComment.experience_id !== experience_id) {
          return res.status(400).json({ error: 'Parent comment does not belong to the specified experience.' });
        }
      }
  
      // Insert the comment/reply into the comments table
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          experience_id,
          comment,
          user_id: user.id,
          username,
          parent_comment_id: parent_comment_id || null // Set to NULL if it's a top-level comment
        }])
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
  
    if (!experience_id) {
      return res.status(400).json({ error: 'Experience ID is required.' });
    }
  
    try {
      // Fetch experience to determine OP (Original Poster)
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .select('user_id')
        .eq('id', experience_id)
        .single();
  
      if (experienceError || !experience) {
        return res.status(404).json({ error: 'Experience not found.' });
      }
  
      // Fetch all comments for the experience in one query
      const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          comment,
          created_at,
          username,
          parent_comment_id,
          likes
        `)
        .eq('experience_id', experience_id)
        .order('created_at', { ascending: false });
  
      if (commentError) {
        return res.status(500).json({ error: commentError.message });
      }
  
      console.log(comments)
      // Organize comments into a nested structure
      const commentMap = new Map();
      const topLevelComments = [];
  
      comments.forEach((comment) => {
        comment.is_op = comment.user_id === experience.user_id;
        comment.replies = [];
  
        commentMap.set(comment.id, comment);
      });

      comments.forEach((comment) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          topLevelComments.push(comment);
        }
      });
  
      res.status(200).json({ comments: topLevelComments });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
