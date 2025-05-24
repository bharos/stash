# Testing Every.org Integration

## Staging Environment

Every.org provides a staging environment for testing donations without spending real money. In development mode, the application automatically uses:

1. `api-staging.every.org` for API requests (instead of `partners.every.org`)
2. `staging.every.org/donate/[nonprofit-id]` for direct donation URLs (instead of `www.every.org/[nonprofit-id]/f/[fundraiser-id]`)

**Important**: The staging environment uses a different URL structure than production. For direct links in staging, use:
```
https://staging.every.org/donate/nonprofit-id?amount=10
```

If you're getting "not found" errors, make sure you're using this format in the staging environment.

## Test Credit Card Details

When testing in the staging environment, use the following test credit card:

```
Credit card #: 4242 4242 4242 4242
Expiration date: 04/42
CVC code: 242
Zip code: 42424
```

## Testing Webhook Flow

You can test the webhook flow without setting up a development webhook by using the included test scripts:

1. **Create a test donation**:
   ```
   node scripts/create-test-donation.js <USER_ID>
   ```

2. **Simulate a webhook**:
   ```
   node scripts/test-webhook.js
   ```

3. **Test the donation creation API endpoint**:
   ```
   node scripts/test-donation-creation.js
   ```

## Complete End-to-End Testing

For a complete end-to-end test:

1. Start your development server
2. Make a donation using the staging environment and test credit card
3. For testing webhook functionality, use the test-webhook.js script

This approach lets you test the entire donation flow without setting up a development webhook or spending real money.
