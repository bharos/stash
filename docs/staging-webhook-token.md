# Staging Webhook Token Documentation

**IMPORTANT**: This file should be kept secure and not committed to version control.

## Staging Environment

- **Webhook Token**: `c568380b7b28caa6bbb34fd6`
- **Environment**: Staging
- **Webhook URL**: https://staging.stashdb.fyi/api/webhooks/every-org
- **Test Endpoint**: https://staging.stashdb.fyi/api/webhooks/staging-test

## How to Use

The webhook token is used for authenticating requests from Every.org's staging environment. It should be included in the `Authorization` header of webhook requests:

```
Authorization: Bearer c568380b7b28caa6bbb34fd6
```

## Testing

You can test the webhook using either:

1. The Node.js script:
   ```bash
   node scripts/test-staging-webhook.js
   ```

2. The shell script:
   ```bash
   ./scripts/test-staging-webhook.sh
   ```

3. Or directly with curl:
   ```bash
   curl -X POST "https://staging.stashdb.fyi/api/webhooks/staging-test" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer c568380b7b28caa6bbb34fd6" \
     -d '{"event":"test","data":{"message":"Test webhook"}}'
   ```

## Token Security

- Keep this token private and secure
- Do not expose it in client-side code
- Ensure it is only used for the staging environment
- Rotate the token periodically for better security
