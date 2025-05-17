import supabase from '../../src/app/utils/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../src/app/utils/emailUtils';

/**
 * This API endpoint is intended to be called by a cron job
 * to send digest emails (daily or weekly) based on user preferences.
 * 
 * Security is implemented in multiple layers:
 * 1. Vercel cron jobs are authenticated by the 'authorization' header with CRON_SECRET
 * 2. Manual API calls require a valid API key in the x-api-key header
 */
export default async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authorization header for Vercel Cron authentication
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  // Check for valid cron secret in authorization header
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  
  // If not authenticated via CRON_SECRET, check for API key
  if (!hasCronAuth) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.DIGEST_API_KEY;
    
    if (!apiKey || apiKey.replace(/-/g, '') !== validApiKey?.replace(/-/g, '')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Get digest type from query parameter or body
    const digestType = req.query.digestType || (req.body && req.body.digestType);
    
    // Validate digest type
    if (!digestType || !['daily', 'weekly'].includes(digestType)) {
      return res.status(400).json({ error: 'Invalid digest type. Must be "daily" or "weekly"' });
    }

    // Get all pending notifications for users with this digest preference
    const { data: pendingNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        content_id,
        content_type,
        actor_username,
        created_at,
        email_frequency
      `)
      .eq('email_frequency', digestType)
      .eq('emailed', false)
      .order('created_at', { ascending: false });

    if (notificationsError) {
      console.error('Error fetching pending notifications:', notificationsError);
      return res.status(500).json({ error: 'Error fetching pending notifications' });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return res.status(200).json({ message: `No pending ${digestType} digest notifications found` });
    }

    // Group notifications by user
    const notificationsByUser = {};
    pendingNotifications.forEach(notification => {
      if (!notificationsByUser[notification.user_id]) {
        notificationsByUser[notification.user_id] = [];
      }
      notificationsByUser[notification.user_id].push(notification);
    });

    // Create an admin Supabase client to access user emails
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Count of successfully sent digest emails
    let successCount = 0;
    let errorCount = 0;

    // Get user data and prepare email content for each user
    for (const userId of Object.keys(notificationsByUser)) {
      // Get the user's email using admin API
      const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user?.email) {
        console.error(`Error getting user ${userId} email:`, userError || 'No email found');
        errorCount++;
        continue;
      }

      const userEmail = userData.user.email;
      const userNotifications = notificationsByUser[userId];
      
      // Skip if no notifications for this user
      if (!userNotifications.length) continue;

      // Create email content based on notifications
      const subject = `Your ${digestType} digest from Stash`;
      const { htmlContent, textContent } = generateDigestEmail(userNotifications, digestType);
      
      // Send the email
      const emailResult = await sendEmail(
        userEmail,
        subject,
        textContent,
        htmlContent
      );

      if (emailResult.success) {
        // Mark notifications as emailed
        const notificationIds = userNotifications.map(n => n.id);
        await supabase
          .from('notifications')
          .update({ emailed: true })
          .in('id', notificationIds);
        
        successCount++;
        console.log(`Digest email sent to ${userEmail}`);
      } else {
        console.error(`Failed to send digest email to ${userEmail}:`, emailResult.error);
        errorCount++;
      }
    }

    return res.status(200).json({ 
      message: `Processed ${digestType} digest emails`, 
      stats: {
        totalUsers: Object.keys(notificationsByUser).length,
        successCount,
        errorCount
      }
    });
  } catch (error) {
    console.error('Error processing digest emails:', error);
    return res.status(500).json({ error: 'Error processing digest emails' });
  }
}

/**
 * Generate HTML and text content for digest email
 */
function generateDigestEmail(notifications, digestType) {
  const period = digestType === 'daily' ? 'day' : 'week';
  
  // Limits for each notification type to prevent overly long emails
  const MAX_ITEMS_PER_CATEGORY = 10;
  const MAX_TOTAL_ITEMS = 30;
  
  // Group notifications by type for better organization
  const commentNotifications = notifications.filter(n => n.type === 'comment');
  const replyNotifications = notifications.filter(n => n.type === 'reply');
  const likeNotifications = notifications.filter(n => 
    n.type === 'post_like' || n.type === 'comment_like'
  );
  
  // Count total notifications
  const totalCount = commentNotifications.length + replyNotifications.length + likeNotifications.length;
  
  // Limit each category (we limit comments least aggressively since they're most important)
  const limitedComments = commentNotifications.slice(0, MAX_ITEMS_PER_CATEGORY);
  const limitedReplies = replyNotifications.slice(0, MAX_ITEMS_PER_CATEGORY);
  const limitedLikes = likeNotifications.slice(0, MAX_ITEMS_PER_CATEGORY);
  
  // Track if we had to limit any categories
  const hasMoreComments = commentNotifications.length > limitedComments.length;
  const hasMoreReplies = replyNotifications.length > limitedReplies.length;
  const hasMoreLikes = likeNotifications.length > limitedLikes.length;
  
  // Generate HTML content
  let htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c5282; }
          h2 { color: #4a5568; margin-top: 20px; }
          .notification { padding: 10px; border-bottom: 1px solid #edf2f7; }
          .timestamp { color: #718096; font-size: 12px; }
          .more-items { background-color: #f7fafc; font-style: italic; }
          .cta-button { 
            display: inline-block; 
            background-color: #4299e1; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 5px; 
            text-decoration: none; 
            margin-top: 20px;
          }
          footer { margin-top: 30px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your ${period}'s activity on Stash</h1>
          <p>Here's a summary of what happened this ${period}:</p>
  `;
  
  // Add comments section if there are any
  if (commentNotifications.length > 0) {
    htmlContent += `<h2>New Comments (${commentNotifications.length})</h2>`;
    limitedComments.forEach(notification => {
      // Create direct link to the post where the comment was made
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      
      htmlContent += `
        <div class="notification">
          <p><strong>${notification.actor_username || 'Someone'}</strong> commented on your ${notification.content_type}. <a href="${contentUrl}">View comment</a></p>
          <p class="timestamp">${new Date(notification.created_at).toLocaleString()}</p>
        </div>
      `;
    });
    if (hasMoreComments) {
      htmlContent += `
        <div class="notification more-items">
          <p>+ ${commentNotifications.length - limitedComments.length} more comments. <a href="${process.env.NEXT_PUBLIC_APP_URL}">View on Stash</a></p>
        </div>
      `;
    }
  }
  
  // Add replies section if there are any
  if (replyNotifications.length > 0) {
    htmlContent += `<h2>Replies to Your Comments (${replyNotifications.length})</h2>`;
    limitedReplies.forEach(notification => {
      // Create direct link to the post or experience where the reply was made
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      
      htmlContent += `
        <div class="notification">
          <p><strong>${notification.actor_username || 'Someone'}</strong> replied to your comment. <a href="${contentUrl}">View reply</a></p>
          <p class="timestamp">${new Date(notification.created_at).toLocaleString()}</p>
        </div>
      `;
    });
    if (hasMoreReplies) {
      htmlContent += `
        <div class="notification more-items">
          <p>+ ${replyNotifications.length - limitedReplies.length} more replies. <a href="${process.env.NEXT_PUBLIC_APP_URL}">View on Stash</a></p>
        </div>
      `;
    }
  }
  
  // Add likes section if there are any
  if (likeNotifications.length > 0) {
    htmlContent += `<h2>New Likes (${likeNotifications.length})</h2>`;
    limitedLikes.forEach(notification => {
      // Define the content type for display
      const contentType = notification.type === 'post_like' ? 'post' : 'comment';
      
      // Create direct link to the liked content
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      
      htmlContent += `
        <div class="notification">
          <p><strong>${notification.actor_username || 'Someone'}</strong> liked your ${contentType}. <a href="${contentUrl}">View ${contentType}</a></p>
          <p class="timestamp">${new Date(notification.created_at).toLocaleString()}</p>
        </div>
      `;
    });
    if (hasMoreLikes) {
      htmlContent += `
        <div class="notification more-items">
          <p>+ ${likeNotifications.length - limitedLikes.length} more likes. <a href="${process.env.NEXT_PUBLIC_APP_URL}">View on Stash</a></p>
        </div>
      `;
    }
  }
  
  // Add CTA and footer
  htmlContent += `
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="cta-button">Visit Stash</a>
          
          <footer>
            <p>This email was sent based on your notification preferences. 
            You can update your preferences on the Stash website.</p>
            <p>&copy; ${new Date().getFullYear()} Stash. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  `;
  
  // Generate plain text content as fallback
  let textContent = `Your ${period}'s activity on Stash\n\n`;
  textContent += `Here's a summary of what happened this ${period}:\n\n`;
  
  if (commentNotifications.length > 0) {
    textContent += `New Comments (${commentNotifications.length}):\n`;
    limitedComments.forEach(notification => {
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      textContent += `- ${notification.actor_username || 'Someone'} commented on your ${notification.content_type}. (${new Date(notification.created_at).toLocaleString()})\n  View comment: ${contentUrl}\n`;
    });
    if (hasMoreComments) {
      textContent += `+ ${commentNotifications.length - limitedComments.length} more comments. View on Stash: ${process.env.NEXT_PUBLIC_APP_URL}\n`;
    }
    textContent += '\n';
  }
  
  if (replyNotifications.length > 0) {
    textContent += `Replies to Your Comments (${replyNotifications.length}):\n`;
    limitedReplies.forEach(notification => {
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      textContent += `- ${notification.actor_username || 'Someone'} replied to your comment. (${new Date(notification.created_at).toLocaleString()})\n  View reply: ${contentUrl}\n`;
    });
    if (hasMoreReplies) {
      textContent += `+ ${replyNotifications.length - limitedReplies.length} more replies. View on Stash: ${process.env.NEXT_PUBLIC_APP_URL}\n`;
    }
    textContent += '\n';
  }
  
  if (likeNotifications.length > 0) {
    textContent += `New Likes (${likeNotifications.length}):\n`;
    limitedLikes.forEach(notification => {
      const contentType = notification.type === 'post_like' ? 'post' : 'comment';
      // Add direct link to the liked content
      const contentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/experience/${notification.content_id}`;
      textContent += `- ${notification.actor_username || 'Someone'} liked your ${contentType}. (${new Date(notification.created_at).toLocaleString()})\n  View ${contentType}: ${contentUrl}\n`;
    });
    if (hasMoreLikes) {
      textContent += `+ ${likeNotifications.length - limitedLikes.length} more likes. View on Stash: ${process.env.NEXT_PUBLIC_APP_URL}\n`;
    }
    textContent += '\n';
  }
  
  textContent += `Visit Stash: ${process.env.NEXT_PUBLIC_APP_URL}\n\n`;
  textContent += `This email was sent based on your notification preferences. You can update your preferences on the Stash website.\n`;
  textContent += `© ${new Date().getFullYear()} Stash. All rights reserved.`;
  
  return { htmlContent, textContent };
}
