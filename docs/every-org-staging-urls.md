# Using Every.org Staging Environment

## URL Structure Differences

The Every.org staging environment uses a different URL structure than production. This document explains these differences and how to use the staging environment for testing.

## Donation Links - UPDATED

We've discovered that the Every.org staging environment requires a specific URL format with a URL fragment to work properly.

### Working URL Format (For Both Staging and Production)

#### Staging URLs that work:
```
https://staging.every.org/[nonprofit-id]#/donate/card?amount=[amount]&frequency=ONCE
```

Example:
```
https://staging.every.org/direct-relief#/donate/card?amount=10&frequency=ONCE
```

#### Production URLs that work:
```
https://www.every.org/[nonprofit-id]#/donate/card?amount=[amount]&frequency=ONCE
```

Example:
```
https://www.every.org/direct-relief#/donate/card?amount=10&frequency=ONCE
```

**Important**: The `#/donate/card` fragment is critical for the URL to work properly. This is a client-side route in the Every.org application.

## API Endpoints

### Production API
```
https://partners.every.org/v0.2/donation/checkout?apiKey=[apiKey]
```

### Staging API
```
https://api-staging.every.org/v0.2/donation/checkout?apiKey=[apiKey]
```

## How Our Code Handles This

1. In `donationUtils.js`, we check for the `NODE_ENV` variable:
   - If it's `development`, we use the staging URL format
   - Otherwise, we use the production URL format

2. In API endpoints that make direct calls to Every.org, we similarly switch between:
   - `api-staging.every.org` for development
   - `partners.every.org` for production

## Testing in the Staging Environment

When testing in the staging environment, use these test credit card details:

```
Credit card #: 4242 4242 4242 4242
Expiration date: 04/42
CVC code: 242
Zip code: 42424
```

## Verified Nonprofits for Testing

The following nonprofit IDs are confirmed to work with the staging environment:

- wildlife-conservation-network
- doctors-without-borders-usa
- against-malaria-foundation-usa
- givedirectly
- khan-academy

## Troubleshooting

1. **"Not found" error on staging URLs**: 
   - Make sure you're using the correct format: `https://staging.every.org/donate/[nonprofit-id]`
   - Do NOT include `/f/[fundraiser-id]` in staging URLs

2. **API calls failing**:
   - Check that you're using `api-staging.every.org` for the API domain
   - Verify the API key is valid for the staging environment

3. **Webhook testing**:
   - Use the `scripts/test-webhook.js` script to simulate webhooks in the staging environment
