import supabase from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, generateCommentNotificationEmail, generateReplyNotificationEmail, generateLikeNotificationEmail } from './emailUtils';

/**
 * Create a notification and send email if user preferences allow
 * 
 * @param {object} notification - Notification data
 * @param {object} emailData - Data for email template
 * @param {string} recipientId - User ID of recipient
 * @param {string} notificationType - Type of notification
 * @param {string} token - Authentication token (optional)
 */
export async function createNotificationAndEmail(notification, emailData, recipientId, notificationType, token) {
  try {
    // Insert notification into database
    const { data, error: notificationError } = await supabase
      .from('notifications')
      .insert(notification)
      .select();
    
    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return;
    }

    // If we don't have the recipient's email, we can't send an email notification
    let userEmail;
    
    // Create a new client with service role to access auth data
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get recipient's email using service role access
    try {
      const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(recipientId);
      
      if (userError) {
        console.error('Error getting recipient:', userError);
        return;
      }
      
      if (!userData?.user?.email) {
        console.log(`No email found for user ${recipientId}`);
        return;
      }
      
      userEmail = userData.user.email;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return;
    }

    // Get user's notification settings from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_unsubscribed')
      .eq('user_id', recipientId)
      .single();
    
    // Check if user is unsubscribed from all emails
    if (!profileError && profileData?.is_unsubscribed) {
      console.log(`User ${recipientId} has unsubscribed from all emails`);
      return;
    }

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', recipientId)
      .single();
    
    // Default to sending emails if no settings found
    let shouldSendEmail = true;
    
    if (!settingsError && settings) {
      // Check if user wants to receive this type of notification
      switch (notificationType) {
        case 'comment':
          shouldSendEmail = settings.email_new_comments;
          break;
        case 'reply':
          shouldSendEmail = settings.email_comment_replies;
          break;
        case 'post_like':
          shouldSendEmail = settings.email_post_likes;
          break;
        case 'comment_like':
          shouldSendEmail = settings.email_comment_likes;
          break;
        default:
          shouldSendEmail = true;
      }
    }

    // If user settings say not to send, stop here
    if (!shouldSendEmail) {
      console.log(`User ${recipientId} has opted out of ${notificationType} emails`);
      return;
    }
    
    // Determine which email template to use
    let emailTemplate;
    let subject;
    
    switch (notificationType) {
      case 'comment':
        subject = `New comment on your post: "${emailData.postTitle}"`;
        emailTemplate = generateCommentNotificationEmail(emailData);
        break;
      case 'reply':
        subject = `New reply to your comment on "${emailData.postTitle}"`;
        emailTemplate = generateReplyNotificationEmail(emailData);
        break;
      case 'post_like':
      case 'comment_like':
        subject = `Your ${notificationType === 'post_like' ? 'post' : 'comment'} received a like!`;
        emailTemplate = generateLikeNotificationEmail(emailData);
        break;
      default:
        console.error('Invalid notification type');
        return;
    }

    // Send the email only if we have a valid recipient email
    if (userEmail) {
      const result = await sendEmail(
        userEmail,
        subject,
        emailTemplate.text,
        emailTemplate.html
      );

      if (result.success) {
        // Mark notification as emailed
        await supabase
          .from('notifications')
          .update({ emailed: true })
          .eq('id', data[0].id);
        
        console.log(`Email sent to ${userEmail} for ${notificationType} notification`);
      } else {
        console.error('Failed to send email:', result.error);
      }
    } else {
      console.log(`Email not sent for notification ID ${data[0].id} - no recipient email available`);
    }
  } catch (error) {
    console.error('Error in createNotificationAndEmail:', error);
  }
}
