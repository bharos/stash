import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { commentId } = req.body;
  const token = req.headers.authorization?.split(' ')[1]; // Extract JWT token

  if (!commentId || !token) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized. Not logged in?' });
    }
    const userId = user.id; // Extract authenticated user ID

    // Check if the user already liked the comment
    const { data: existingLike, error: likeError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      throw likeError;
    }

    if (existingLike) {
      // Unlike (Remove entry)
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Decrement likes count for the comment
      await supabase.rpc('decrement_comment_likes', { comment_id: commentId });

      return res.status(200).json({ liked: false });
    } else {
        console.log("like comment ", commentId);
      // Like (Add entry)
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }]);

      if (insertError) throw insertError;

      // Increment likes count for the comment
      const { data, error } = await supabase.rpc('increment_comment_likes', { comment_id: commentId });
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
