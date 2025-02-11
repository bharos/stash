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
  
      // Fetch the experience to ensure it exists and belongs to the current user
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .select('user_id')
        .eq('id', experience_id)
        .single();

      if (experienceError || !experience) {
        return res.status(404).json({ error: 'Experience not found.' });
      }
      // Check if the user is the OP (Original Poster)
      const isOp = experience.user_id === user.id;

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
  
    // Add required fields like 'is_op' and 'replies'
    newComment.is_op = isOp;
    newComment.replies = []; // Initialize 'replies' as an empty array

      res.status(200).json({ message: 'Comment added successfully', comment: newComment });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    const { comment_id, new_comment_text } = req.body;
  
    // Basic validation to ensure required data exists
    if (!comment_id || !new_comment_text) {
      return res.status(400).json({ error: 'Comment ID and new comment text are required.' });
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
  
      // Fetch the comment to ensure it exists and belongs to the current user
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select('id, user_id, experience_id, parent_comment_id')
        .eq('id', comment_id)
        .single();
  
      if (commentError || !comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }
  
      if (comment.user_id !== user.id) {
        return res.status(403).json({ error: 'You can only edit your own comments.' });
      }
  
      // Update the comment's text
      const { data, error: updateError } = await supabase
        .from('comments')
        .update({ comment: new_comment_text }) // Update the comment text
        .eq('id', comment_id)
        .select();
  
      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
  
      const updatedComment = data[0]; // Get the updated comment
  
      // Add required fields dynamically (don't overwrite replies or is_op)
      updatedComment.replies = []; // Leave replies as they are in the database
  
      res.status(200).json({ message: 'Comment updated successfully', comment: updatedComment });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    const { comment_id } = req.body;

    // Basic validation to ensure required data exists
    if (!comment_id) {
      return res.status(400).json({ error: 'Comment ID is required.' });
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

      // Fetch only the user_id for the comment to ensure it exists and belongs to the current user
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', comment_id)
        .single();

      if (commentError || !comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }

      if (comment.user_id !== user.id) {
        return res.status(403).json({ error: 'You can only delete your own comments.' });
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment_id);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }

      res.status(200).json({ message: 'Comment deleted successfully' });

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
  
    // Extract the user ID from the authorization token
    const token = req.headers['authorization']?.split('Bearer ')[1];
    let userId = null;
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user?.id) {
        return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
      }
      userId = user.id;
      }
      
      if (userId) {
        const commentIds = comments.map(comment => comment.id);
  
        const { data: userLikes, error: userLikeError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', userId);
  
        if (userLikeError) {
          return res.status(500).json({ error: userLikeError.message });
        }
        
        // Convert userLikes array to a Set for quick lookup
        const likedCommentIds = new Set(userLikes.map(like => like.comment_id));
        // Update each comment with the `user_liked` and `posted_by_user` flag
        comments.forEach(comment => {
          comment.user_liked = likedCommentIds.has(comment.id);
        });
        comments.forEach(comment => {
          comment.posted_by_user = comment.user_id === userId;
        });
      } else {
        // If no userId, set user_liked and posted_by_user to false for all comments
        comments.forEach(comment => {
          comment.user_liked = false;
        });
        comments.forEach(comment => {
          comment.posted_by_user = false;
        });
      }

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
