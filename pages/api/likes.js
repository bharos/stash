import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { experienceId } = req.body;
  const token = req.headers.authorization?.split(' ')[1]; // Extract JWT token

  if (!experienceId || !token) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Verify JWT token with Supabase
    const {  data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized. Not logged in?' });
    }
    const userId = user.id; // Extract authenticated user ID
    // Check if the user already liked the experience
    const { data: existingLike, error: likeError } = await supabase
      .from('user_likes')
      .select('*')
      .eq('experience_id', experienceId)
      .eq('user_id', userId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      throw likeError;
    }

    if (existingLike) {
      // Unlike (Remove entry)
      const { error: deleteError } = await supabase
        .from('user_likes')
        .delete()
        .eq('experience_id', experienceId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Decrement likes count
      await supabase.rpc('decrement_likes', { exp_id: experienceId });

      return res.status(200).json({ liked: false });
    } else {
      // Like (Add entry)
      const { error: insertError } = await supabase
        .from('user_likes')
        .insert([{ experience_id: experienceId, user_id: userId }]);

      if (insertError) throw insertError;
      // Increment likes count
      const { data, error } = await supabase.rpc('increment_likes', { exp_id: experienceId });
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
