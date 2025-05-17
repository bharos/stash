import supabase from '../../src/app/utils/supabaseClient';
import { createNotificationAndEmail } from '../../src/app/utils/notificationUtils';

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

      // Create notification for the comment owner
      try {
        // Get comment details including owner and parent experience
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .select('user_id, username, experience_id')
          .eq('id', commentId)
          .single();
          
        if (!commentError && commentData) {
          // Don't notify if liking own comment
          if (commentData.user_id !== userId) {
            // Get the experience details to build the URL and title
            const { data: experienceData } = await supabase
              .from('experiences')
              .select('type, company_name, slug')
              .eq('id', commentData.experience_id)
              .single();
              
            // Get post title based on experience type
            let postTitle;
            if (experienceData?.type === 'general_post') {
              const { data: postData } = await supabase
                .from('general_posts')
                .select('title')
                .eq('experience_id', commentData.experience_id)
                .single();
                
              postTitle = postData?.title || 'General Post';
            } else {
              postTitle = experienceData?.company_name || 'Interview Experience';
            }
            
            // Get user's username for the notification
            const { data: userData } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', userId)
              .single();
              
            const username = userData?.username || 'A user';
            
            // Generate post URL
            const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/experience/${commentData.experience_id}/${experienceData?.slug || ''}`;
            
            // Create notification object
            const notification = {
              user_id: commentData.user_id,
              type: 'comment_like',
              content_id: commentId.toString(), // Convert to string for storing in the notification
              content_type: 'comment',
              actor_id: userId,
              actor_username: username,
              seen: false,
              emailed: false
            };
            
            // Create notification and send email
            await createNotificationAndEmail(
              notification,
              {
                contentType: 'comment',
                likerUsername: username,
                count: 1,
                postTitle,
                postUrl
              },
              commentData.user_id,
              'comment_like',
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
