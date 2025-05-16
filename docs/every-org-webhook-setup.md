# Every.org Partner Webhook Integration

This document provides information about setting up and using Every.org's partner webhook functionality with the Stash donation system.

## Webhook Integration Process

1. **Request Partner Status**:
   - Contact Every.org at partners@every.org
   - Use the template in `everyorg-webhook-request-template.md`
   - Request a webhook_token for your implementation

2. **Environment Setup**:
   - Add the provided webhook_token to `.env.local` and any production environment variables
   - Example: `EVERY_ORG_WEBHOOK_TOKEN=your_token_here`

3. **Webhook Verification**:
   - The webhook handler in `/pages/api/webhooks/every-org.js` verifies webhook signatures
   - Ensure the `EVERY_ORG_WEBHOOK_SECRET` is properly set
   - Uncomment the signature verification code in production

## How the Webhook Flow Works

1. User selects a nonprofit and donation amount in Stash
2. Stash creates a donation intent and calls Every.org's donation/checkout API
3. User completes donation on Every.org's site
4. Every.org sends a webhook notification to our webhook endpoint
5. Stash verifies the donation and grants premium access based on amount

## Webhook Payload Structure

Every.org sends a JSON payload with donation details:

```json
{
  "event": "donation.completed",
  "data": {
    "donationId": "string",
    "reference": "string",
    "status": "SUCCEEDED",
    "amount": 1000, // cents
    "nonprofitId": "nonprofit-slug",
    "nonprofitName": "Nonprofit Name"
  }
}
```

## Testing the Webhook

For testing purposes, you can use the script in `scripts/trigger-webhook-test.js` to simulate webhook calls.

## Troubleshooting

- Verify that your webhook endpoint is publicly accessible
- Check that the webhook signature is being correctly validated
- Ensure your `EVERY_ORG_WEBHOOK_SECRET` matches the one provided by Every.org
- Look for webhook-related errors in your server logs

## Production Considerations

- Always enable signature verification in production
- Consider implementing retries for failed webhook processing
- Monitor webhook failures and implement alerting
- Ensure your webhook endpoint can handle high traffic if needed
