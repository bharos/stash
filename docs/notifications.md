# Notification System

Stash includes a notification system that keeps users informed about activities on their posts and comments. The system sends email notifications and maintains an in-app notification center.

## Features

- Notifications for new comments on posts
- Notifications for replies to comments
- Notifications for likes on posts and comments
- Email delivery using SendGrid
- In-app notification bell with unread count
- Notification preferences customization
- Configurable email frequency (immediate, daily digest, weekly digest)

## How It Works

The notification system consists of several components:

1. Database tables for storing notifications and user preferences
2. API endpoints for creating and retrieving notifications
3. Email delivery service using SendGrid
4. In-app notification UI components

## Setup

1. **Database**: Run the migration to create the notification tables:
```bash
# In local development
npx supabase migration up

# In production
# (Migration will run automatically when deployed)
```

2. **SendGrid API Key**: Sign up for a [SendGrid](https://sendgrid.com) account and get an API key. Add this key to your `.env.local` file:
```
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_email@example.com
```

3. **Email Sender**: Verify your sender email address with SendGrid to ensure emails can be sent.

## Testing

To test the notification system:

1. **Test Notification API**: Use the `/api/notifications` endpoint to create test notifications:
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "comment",
    "contentId": "123",
    "contentType": "experience",
    "recipientId": "user-id-to-notify",
    "actorUsername": "testuser",
    "emailData": {
      "postTitle": "Test Post",
      "commenterName": "Test User",
      "commentText": "This is a test comment",
      "postUrl": "/experience/123"
    }
  }'
```

2. **Email Testing**: For local development, you can check SendGrid's Activity Feed to verify emails are sent correctly without actually delivering them to users.

3. **UI Testing**: Log in with two different accounts:
   - Use one account to create a post
   - Use the second account to comment on that post
   - Switch back to the first account and check the notification bell

## User Experience

- Users see a notification bell in the sidebar when logged in
- The bell shows a count of unread notifications
- Clicking the bell takes users to their notification list
- Users can customize notification preferences in their profile settings
- Users can unsubscribe from all emails using a toggle in profile settings

## Notification Types

- `comment`: When someone comments on a user's post
- `reply`: When someone replies to a user's comment
- `post_like`: When someone likes a user's post
- `comment_like`: When someone likes a user's comment

## Email Templates

Email templates are defined in `src/app/utils/emailUtils.js` and include:
- Comment notification emails
- Reply notification emails
- Like notification emails
- Daily and weekly digest emails

The digest emails include these features:
- Categorized sections for comments, replies, and likes
- Limited to 10 items per category to prevent overly long emails
- "View all" links when there are more notifications than shown
- Both HTML and plain text versions

## Email Frequency Options

Users can choose how often they receive email notifications:

1. **Immediate**: Emails are sent as events happen (default)
2. **Daily Digest**: A single email with all notifications from the past day
3. **Weekly Digest**: A single email with all notifications from the past week

## Digest Email Setup

To send digest emails, you need to set up scheduled jobs that call the `/api/digestEmails` endpoint:

1. **Add API Key**: Add a secure API key to your environment variables:
```
DIGEST_API_KEY=your_secure_random_string
```

2. **Set up Cron Jobs**: Configure cron jobs to trigger the digest emails:

For daily digests (example using cron on Linux/Unix):
```bash
# Run at 9:00 AM every day
0 9 * * * curl -X POST https://yourdomain.com/api/digestEmails \
  -H "x-api-key: your_secure_random_string" \
  -H "Content-Type: application/json" \
  -d '{"digestType": "daily"}'
```

For weekly digests (example using cron on Linux/Unix):
```bash
# Run at 9:00 AM every Monday
0 9 * * 1 curl -X POST https://yourdomain.com/api/digestEmails \
  -H "x-api-key: your_secure_random_string" \
  -H "Content-Type: application/json" \
  -d '{"digestType": "weekly"}'
```

If using a service like Vercel, you can use their Cron Jobs feature to schedule these calls.

## Testing Digest Emails

To test the digest email functionality:

1. **Apply Database Migration**: Make sure the migrations are applied to add the `email_frequency` column:
```bash
npx supabase migration up
```

2. **Create Test Notifications**: Use the test API endpoint to create sample notifications with specific frequencies:
```bash
# Create test notifications for daily digest
curl -X POST http://localhost:3000/api/testDigestNotifications \
  -H "x-api-key: your_digest_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "frequency": "daily",
    "count": 5
  }'

# Create test notifications for weekly digest
curl -X POST http://localhost:3000/api/testDigestNotifications \
  -H "x-api-key: your_digest_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "frequency": "weekly",
    "count": 5
  }'
```

3. **Trigger Digest Processing**: Manually trigger the digest email processing:
```bash
# Process daily digest
curl -X POST http://localhost:3000/api/digestEmails \
  -H "x-api-key: your_digest_api_key" \
  -H "Content-Type: application/json" \
  -d '{"digestType": "daily"}'

# Process weekly digest
curl -X POST http://localhost:3000/api/digestEmails \
  -H "x-api-key: your_digest_api_key" \
  -H "Content-Type: application/json" \
  -d '{"digestType": "weekly"}'
```

4. **Verify Email Delivery**: Check SendGrid activity or your email inbox to confirm the digest emails were sent correctly.

## Future Improvements

- Add web push notifications for real-time alerts
- Add more granular notification settings (e.g., by category or importance)
- Implement notification read/unread toggle
- Add rich-media content to email templates
