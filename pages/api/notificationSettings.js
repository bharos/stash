import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
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

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error fetching notification settings:', error);
        return res.status(500).json({ error: 'Failed to fetch notification settings' });
      }

      // If no settings found, return default settings
      if (!data) {
        return res.status(200).json({
          email_new_comments: true,
          email_comment_replies: true,
          email_post_likes: true,
          email_comment_likes: true,
          email_frequency: 'daily',
        });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  } else if (req.method === 'POST') {
    try {
      const settings = req.body;
      
      // Validate the required fields
      const requiredFields = [
        'email_new_comments', 
        'email_comment_replies', 
        'email_post_likes', 
        'email_comment_likes',
        'email_frequency'
      ];
      
      for (const field of requiredFields) {
        if (settings[field] === undefined) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }
      
      // Validate email_frequency value
      const validFrequencies = ['immediate', 'daily', 'weekly'];
      if (!validFrequencies.includes(settings.email_frequency)) {
        return res.status(400).json({ 
          error: `Invalid value for email_frequency. Must be one of: ${validFrequencies.join(', ')}` 
        });
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_new_comments: settings.email_new_comments,
          email_comment_replies: settings.email_comment_replies,
          email_post_likes: settings.email_post_likes,
          email_comment_likes: settings.email_comment_likes,
          email_frequency: settings.email_frequency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving notification settings:', error);
        return res.status(500).json({ error: 'Failed to save notification settings' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Unexpected error saving settings:', err);
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
