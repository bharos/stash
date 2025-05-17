import supabase from '../../src/app/utils/supabaseClient';
import { createNotificationAndEmail } from '../../src/app/utils/notificationUtils';

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

      // Create notification for the post owner
      try {
        // Get experience details including owner
        const { data: experienceData, error: experienceError } = await supabase
          .from('experiences')
          .select('user_id, company_name, slug, type')
          .eq('id', experienceId)
          .single();
          
        if (!experienceError && experienceData) {
          // Don't notify if liking own post
          if (experienceData.user_id !== userId) {
            // Get the post title based on experience type
            let postTitle;
            if (experienceData.type === 'general_post') {
              const { data: postData } = await supabase
                .from('general_posts')
                .select('title')
                .eq('experience_id', experienceId)
                .single();
                
              postTitle = postData?.title || 'General Post';
            } else {
              postTitle = experienceData.company_name || 'Interview Experience';
            }
            
            // Get user's name for the notification
            const { data: userData } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', userId)
              .single();
              
            const username = userData?.username || 'A user';
            
            // Generate post URL
            const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/experience/${experienceId}/${experienceData.slug || ''}`;
            
            // Create notification object
            const notification = {
              user_id: experienceData.user_id,
              type: 'post_like',
              content_id: experienceId.toString(), // Convert to string
              content_type: 'post',
              actor_id: userId,
              actor_username: username,
              seen: false,
              emailed: false
            };
            
            // Create notification and send email
            await createNotificationAndEmail(
              notification,
              {
                contentType: 'post',
                likerUsername: username,
                count: 1,
                postTitle,
                postUrl
              },
              experienceData.user_id,
              'post_like',
              token
            );
          }
        }
      } catch (notificationError) {
        // Log but don't fail the request if notification fails
        console.error('Error creating notification:', notificationError);
      }

      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
