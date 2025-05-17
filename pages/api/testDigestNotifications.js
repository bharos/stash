import supabase from '../../src/app/utils/supabaseClient';
import { createClient } from '@supabase/supabase-js';

/**
 * Test API endpoint to create sample notifications for testing digest emails
 * This should only be used in development environments
 */
export default async function handler(req, res) {
  // Only allow POST requests with proper API key for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key to prevent unauthorized use
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.DIGEST_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { userId, frequency, count = 3 } = req.body;
    
    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!frequency || !['daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be "daily" or "weekly"' });
    }

    // Verify user exists
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.id) {
      return res.status(400).json({ error: 'User not found' });
    }
    console.log('User found:', userData.user.id);

    // Create test notifications
    const testNotifications = [];
    
    // Create comment notifications
    for (let i = 0; i < Math.max(Math.floor(count / 3), 1); i++) {
      console.log('Creating comment notification ' + i);
      testNotifications.push({
        user_id: userId,
        type: 'comment',
        content_id: `test-post-${Date.now()}-${i}`,
        content_type: 'experience',
        actor_id: userId, // Use the same userId as a valid actor
        actor_username: 'TestUser',
        seen: false,
        emailed: false,
        email_frequency: frequency
      });
    }
    
    // Create reply notifications
    for (let i = 0; i < Math.max(Math.floor(count / 3), 1); i++) {
      console.log('Creating reply notification ' + i);
      testNotifications.push({
        user_id: userId,
        type: 'reply',
        content_id: `test-comment-${Date.now()}-${i}`,
        content_type: 'comment',
        actor_id: userId, // Use the same userId as a valid actor
        actor_username: 'TestUser',
        seen: false,
        emailed: false,
        email_frequency: frequency
      });
    }
    
    // Create like notifications
    for (let i = 0; i < Math.max(Math.floor(count / 3), 1); i++) {
      console.log('Creating like notification ' + i);
      testNotifications.push({
        user_id: userId,
        type: 'post_like',
        content_id: `test-post-${Date.now()}-${i}`,
        content_type: 'experience',
        actor_id: userId, // Use the same userId as a valid actor
        actor_username: 'TestUser',
        seen: false,
        emailed: false,
        email_frequency: frequency
      });
    }
    console.log('Test notifications:', testNotifications);
    // Insert test notifications
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();
    
    if (error) {
      console.error('Error creating test notifications:', error);
      
      // Special case for when the column doesn't exist yet
      if (error.message && error.message.includes('column "email_frequency" does not exist')) {
        return res.status(500).json({ 
          error: 'The email_frequency column does not exist in the notifications table. Run the migration first!',
          hint: 'Run: npx supabase migration up'
        });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    // Update user's notification frequency preference
    const { error: settingsError } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        email_frequency: frequency,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (settingsError) {
      console.warn('Could not update user notification settings:', settingsError);
    }
    
    return res.status(201).json({ 
      message: `Created ${data.length} test notifications with ${frequency} frequency for user ${userId}`,
      notificationIds: data.map(n => n.id)
    });
  } catch (error) {
    console.error('Error in test digest notifications:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
