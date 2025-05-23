# Setting Up Every.org Staging Webhooks

This document provides instructions for configuring and using Every.org's staging webhooks with our staging environment.

## Overview

Every.org provides a staging environment for testing webhook integrations before deploying to production. This allows us to validate the donation flow without processing real donations.

## Prerequisites

1. Every.org staging webhook token (contact Every.org partners team to obtain)
2. Staging environment deployed (e.g., https://staging.stashdb.fyi/)

## Setup Steps

### 1. Configure Environment Variables

Add the following environment variables to your staging deployment:

```
EVERY_ORG_WEBHOOK_TOKEN=your_staging_webhook_token
NEXT_PUBLIC_ENVIRONMENT=staging
```

In Vercel, you can add these through the dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables" 
3. Add the variables with the appropriate values
4. Link them to your preview/staging environment only

### 2. Configure Webhook URL

Provide Every.org with your staging webhook URL:

```
https://staging.stashdb.fyi/api/webhooks/every-org
```

### 3. Testing the Webhook

You can test the webhook integration using the provided script:

```bash
node scripts/test-staging-webhook.js
```

This script sends test payloads to verify that your webhook endpoints are properly configured.

## Webhook Payload Format

Every.org will send webhooks with the following structure:

```json
{
  "event": "donation.completed",
  "data": {
    "donationId": "don_123456789",
    "reference": "stash-user123-abc123",
    "status": "SUCCEEDED",
    "amount": 1500, // $15.00 in cents
    "nonprofitId": "khan-academy",
    "nonprofitName": "Khan Academy"
  }
}
```

## Authentication

The staging webhook uses token-based authentication via the `Authorization` header:

```
Authorization: Bearer your_staging_webhook_token
```

Our webhook handler validates this token before processing the webhook.

## Troubleshooting

If webhooks are not being properly received:

1. Verify that the `EVERY_ORG_WEBHOOK_TOKEN` is correctly set in your environment variables
2. Check that the webhook URL provided to Every.org matches your staging webhook endpoint
3. Review logs for any authentication or processing errors
4. Use the test script to simulate webhooks and debug issues

## Next Steps

1. After successful testing in staging, transition to production by updating the webhook URL and token
2. Update environment settings to use production values
3. Verify that webhooks are properly received in the production environment
