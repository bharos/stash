# Automated Donation Verification with Every.org Webhooks

This document explains how the automated webhook verification works and how to test it.

## How It Works

When a user makes a donation through your Every.org integration, the verification happens automatically:

1. User clicks "Donate" in the Stash app
2. A donation intent is created in your database with a unique reference
3. User is redirected to Every.org to complete the donation
4. After successful donation, Every.org sends a webhook to your endpoint
5. Your webhook handler:
   - Verifies the webhook signature
   - Finds the donation reference in your database
   - Awards premium access and tokens to the user
   - No manual verification needed!

## The Manual Verification Fallback

The manual verification form (DonationVerification.js) is only needed in rare cases:
- If the webhook fails to reach your server
- If the user donates directly on Every.org without using your donation link
- During development/testing without an actual webhook

## Testing the Webhook Flow

To test the automated webhook flow:

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Create a test donation intent**
   ```bash
   # Replace USER_ID with an actual user ID from your database
   node scripts/create-test-donation.js USER_ID
   ```
   This will output a donation reference like `stash-12345678-abc123`.

3. **Simulate a webhook from Every.org**
   ```bash
   # Use the reference from step 2
   node scripts/test-webhook.js stash-12345678-abc123
   ```

4. **Check the database for updates**
   ```bash
   # Open the Supabase dashboard to check:
   # - donation_intents (status should be 'completed')
   # - user_tokens (should have premium_until updated)
   # - token_transactions (should have new transaction for donation bonus)
   ```

## Production Webhook Configuration

For production, make sure:

1. Your webhook endpoint is publicly accessible
2. You've enabled strict signature validation (uncommented in every-org.js)
3. All required environment variables are set:
   ```
   EVERY_ORG_API_KEY=your_api_key
   EVERY_ORG_WEBHOOK_SECRET=your_webhook_secret
   EVERY_ORG_WEBHOOK_TOKEN=e71db07a8ecdea69eea81bf0
   ```
4. You've registered your webhook URL in the Every.org Partners portal:
   ```
   https://your-production-domain.com/api/webhooks/every-org
   ```

## Common Issues and Solutions

- **Webhook not being received**: Check network/firewall settings
- **Signature validation fails**: Ensure webhook secret matches in your code and Every.org dashboard
- **Donation reference not found**: The donation intent might not exist in your database
- **User not getting premium**: Check webhook handler logs for errors

## Monitoring Webhook Performance

To ensure webhooks are working properly:

1. Log all incoming webhooks with timestamps
2. Implement health checks to verify webhook processing
3. Set up alerts for failed webhook processing
4. Track metrics on webhook success rate and response time

With proper setup, users should automatically receive their premium access and tokens within seconds of completing a donation, with no manual verification needed!
