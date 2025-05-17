// Email utility functions using SendGrid

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send an email notification to a user
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text - Plain text email content
 * @param {string} html - HTML email content
 * @returns {Promise} - Promise that resolves with SendGrid response
 */
export async function sendEmail(to, subject, text, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set. Cannot send email.');
    return { error: 'Email service not configured' };
  }

  const msg = {
    to,
    from: {
      email: process.env.EMAIL_FROM,
      name: 'Stash Team'
    },
    subject,
    text,
    html,
  };

  try {
    const response = await sgMail.send(msg);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: 'Failed to send email' };
  }
}

/**
 * Generate email template for new comment notification
 * 
 * @param {object} data - Data for email template
 * @returns {object} - Object containing text and html versions of the email
 */
export function generateCommentNotificationEmail(data) {
  const { postTitle, commenterUsername, commentText, postUrl } = data;

  const text = `
    Hi there!

    ${commenterUsername} commented on your post "${postTitle}":

    "${commentText.substring(0, 150)}${commentText.length > 150 ? '...' : ''}"

    View the comment here: ${postUrl}

    Best,
    The Stash Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568;">New Comment on Your Post</h2>
      <p><strong>${commenterUsername}</strong> commented on your post "<strong>${postTitle}</strong>":</p>
      <div style="border-left: 4px solid #e2e8f0; padding-left: 15px; margin: 15px 0; color: #4a5568;">
        "${commentText.substring(0, 150)}${commentText.length > 150 ? '...' : ''}"
      </div>
      <p>
        <a href="${postUrl}" style="background-color: #4299e1; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
          View Comment
        </a>
      </p>
      <p style="color: #718096; font-size: 0.9em; margin-top: 30px;">
        You're receiving this because you opted in to notifications for your posts on Stash.
        <br>
        To unsubscribe, update your <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}">notification preferences</a>.
      </p>
    </div>
  `;

  return { text, html };
}

/**
 * Generate email template for comment reply notification
 * 
 * @param {object} data - Data for email template
 * @returns {object} - Object containing text and html versions of the email
 */
export function generateReplyNotificationEmail(data) {
  const { postTitle, replierUsername, replyText, postUrl } = data;

  const text = `
    Hi there!

    ${replierUsername} replied to your comment on the post "${postTitle}":

    "${replyText.substring(0, 150)}${replyText.length > 150 ? '...' : ''}"

    View the reply here: ${postUrl}

    Best,
    The Stash Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568;">New Reply to Your Comment</h2>
      <p><strong>${replierUsername}</strong> replied to your comment on the post "<strong>${postTitle}</strong>":</p>
      <div style="border-left: 4px solid #e2e8f0; padding-left: 15px; margin: 15px 0; color: #4a5568;">
        "${replyText.substring(0, 150)}${replyText.length > 150 ? '...' : ''}"
      </div>
      <p>
        <a href="${postUrl}" style="background-color: #4299e1; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
          View Reply
        </a>
      </p>
      <p style="color: #718096; font-size: 0.9em; margin-top: 30px;">
        You're receiving this because you opted in to notifications for replies to your comments on Stash.
        <br>
        To unsubscribe, update your <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}">notification preferences</a>.
      </p>
    </div>
  `;

  return { text, html };
}

/**
 * Generate email template for likes notification
 * 
 * @param {object} data - Data for email template
 * @returns {object} - Object containing text and html versions of the email
 */
export function generateLikeNotificationEmail(data) {
  const { contentType, likerUsername, count, postTitle, postUrl } = data;
  
  const likeText = contentType === 'post' ? 'post' : 'comment';
  const title = `${count > 1 ? `${count} people` : `${likerUsername}`} liked your ${likeText}`;

  const text = `
    Hi there!
    
    ${count > 1 ? `${count} people including ${likerUsername}` : likerUsername} liked your ${likeText} ${contentType === 'post' ? `"${postTitle}"` : `on "${postTitle}"`}.
    
    View it here: ${postUrl}
    
    Best,
    The Stash Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568;">${title}</h2>
      <p>
        ${count > 1 ? 
          `<strong>${count} people</strong> including <strong>${likerUsername}</strong>` : 
          `<strong>${likerUsername}</strong>`} liked your ${likeText} ${contentType === 'post' ? 
            `"<strong>${postTitle}</strong>"` : 
            `on the post "<strong>${postTitle}</strong>"`}.
      </p>
      <p>
        <a href="${postUrl}" style="background-color: #4299e1; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
          View ${contentType === 'post' ? 'Post' : 'Comment'}
        </a>
      </p>
      <p style="color: #718096; font-size: 0.9em; margin-top: 30px;">
        You're receiving this because you opted in to notifications for likes on Stash.
        <br>
        To unsubscribe, update your <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}">notification preferences</a>.
      </p>
    </div>
  `;

  return { text, html };
}
