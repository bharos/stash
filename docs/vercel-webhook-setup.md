# Setting Up a Stable Webhook URL with Vercel

When integrating with Every.org, having a stable webhook URL is essential. This document outlines how to configure a consistent webhook endpoint using Vercel.

## Why a Stable URL?

Every.org needs to register your webhook URL in their system. If the URL changes frequently (as with ngrok free tier), you'll need to constantly update it with their support team.

## Option 1: Dedicated Preview Branch

1. Create a dedicated branch for webhook testing:
   ```bash
   git checkout -b webhook-testing
   git push origin webhook-testing
   ```

2. Vercel will automatically create a preview deployment with a stable URL like:
   ```
   webhook-testing-your-project.vercel.app
   ```

3. This URL will remain the same as long as the branch exists, even as you make updates to the code.

4. Your webhook URL will be:
   ```
   https://webhook-testing-your-project.vercel.app/api/webhooks/every-org
   ```

## Option 2: Staging Environment

1. In your Vercel dashboard, navigate to your project settings
2. Go to "Environment Variables" and create a staging environment
3. Configure it to deploy from a specific branch
4. This will give you a dedicated URL like `staging-your-project.vercel.app`

## Option 3: Custom Domain

For a more professional setup:

1. In your Vercel project settings, go to "Domains"
2. Add a custom domain like `staging.yourapp.com` or `webhooks.yourapp.com`
3. Configure DNS settings as instructed by Vercel
4. Share this custom domain with Every.org

## Environment Variables

Ensure your staging/preview environment has all the necessary environment variables:

- `EVERY_ORG_WEBHOOK_SECRET` - The shared secret for validating webhook signatures
- `SUPABASE_URL` and `SUPABASE_KEY` - For database access
- Set `NODE_ENV` appropriately

## Testing Your Webhook

Once deployed, test that your webhook endpoint is accessible:

```bash
curl -X POST \
  https://your-vercel-deployment-url.vercel.app/api/webhooks/every-org \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Test: true" \
  -d '{"event":"test", "data":{"status":"TESTING"}}'
```

## Sharing with Every.org

Email Every.org support with:

```
Subject: Webhook URL Update for Stash App - Staging Environment

Hello Every.org Support,

Please update the webhook URL for our application's staging environment:

Webhook URL: https://your-vercel-deployment-url.vercel.app/api/webhooks/every-org

Thank you!
```

## Benefits Over ngrok

- No URL changes - register once with Every.org
- No session timeouts
- Better monitoring and logging
- Proper SSL/TLS certificates
- Ability to test the complete donation flow
