import supabase from '../../src/app/utils/supabaseClient';
import { createNotificationAndEmail } from '../../src/app/utils/notificationUtils';

export default async function handler(req, res) {
  // Only handle GET and POST requests
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication for all requests
    const token = req.headers['authorization']?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle GET request - Fetch notifications for the user
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30); // Limit to most recent 30 notifications
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Mark retrieved notifications as seen
      const notificationIds = data.map(n => n.id);
      if (notificationIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ seen: true })
          .in('id', notificationIds);
      }

      return res.status(200).json({ notifications: data });
    }

    // Handle POST request - Create a new notification
    if (req.method === 'POST') {
      // For manual testing, POST can create a notification
      // In real use, notifications will be created by other endpoints
      const { type, contentId, contentType, recipientId, emailData } = req.body;
      
      if (!type || !contentId || !contentType || !recipientId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create notification
      const notification = {
        user_id: recipientId,
        type,
        content_id: contentId.toString(), // Ensure content_id is a string
        content_type: contentType,
        actor_id: user.id,
        actor_username: req.body.actorUsername || '',
        seen: false,
        emailed: false
      };

      // Use the utility function to create notification and send email
      if (emailData) {
        await createNotificationAndEmail(notification, emailData, recipientId, type, token);
        return res.status(201).json({ success: true, message: 'Notification created and email sent' });
      } else {
        // Just create the notification without email
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification)
          .select();
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ notification: data[0] });
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}