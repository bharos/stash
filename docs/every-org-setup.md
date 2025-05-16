# Every.org Donation Integration Setup Guide

This guide explains how to set up the Every.org donation integration for Stash.

## Overview

The integration allows users to donate to non-profits through Every.org and receive premium membership benefits on Stash in return:
- $10+ donation: 30 days of premium access + 300 coins (base) + 30 coins for each dollar above $10

## Environment Variables

The following environment variables need to be set in your production environment:

```
EVERY_ORG_API_KEY=your_api_key
EVERY_ORG_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### How to Obtain API Keys

1. Create an account on [Every.org](https://www.every.org/)
2. Register as a developer in their [Partners Portal](https://partners.every.org/)
3. Create a new application
4. Generate an API key and webhook secret

## Webhook Configuration

In the Every.org Partners Portal, set up your webhook with the following details:

- **Webhook URL**: `https://your-production-domain.com/api/webhooks/every-org`
- **Events to receive**: 
  - `donation.completed`
  - `donation.failed` (optional)

## Redirect URLs

Configure these redirect URLs in your Every.org application settings:

- **Success URL**: `https://your-production-domain.com/donation/success?ref={reference}`
- **Cancel URL**: `https://your-production-domain.com/donation/cancel?ref={reference}`

## Testing the Integration

We've created several scripts in the `scripts/` directory to help test and debug the integration:

```bash
# Check availability of test data
node scripts/check-test-data.js

# Test basic API connectivity
node scripts/test-everyorg-api.js

# List valid nonprofits
node scripts/list-nonprofits.js

# Test donation checkout URL creation
node scripts/test-donation-creation.js

# Run a full donation flow test with user ID
node scripts/full-donation-test.js <user-id>

# Create a test donation record in the database
node scripts/create-test-donation.js <user-id>
```

## Integration Status Checklist

- [x] Database tables created and migrated
- [x] API endpoints implemented
  - [x] `/api/donations/create.js`
  - [x] `/api/donations/status.js`
  - [x] `/api/webhooks/every-org.js`
- [x] Frontend components created
  - [x] `DonationComponent.js`
  - [x] `ContentPaywall.js` donation tab
  - [x] Success and cancel pages
- [x] Testing scripts implemented
  - [x] Basic API tests
  - [x] Donation creation test
  - [x] Webhook simulation
  - [x] End-to-end flow test
- [ ] Production configuration
  - [ ] Live API keys
  - [ ] Webhook secret properly configured
  - [ ] SSL/TLS for webhook security

## Troubleshooting

### Common Issues

- **Webhook not receiving events**: Verify your webhook URL is correctly set up and accessible
- **Signature verification failing**: Double-check the webhook secret
- **Redirects not working**: Ensure NEXT_PUBLIC_BASE_URL is correctly set

### Logging

Review server logs for:
- Webhook processing errors
- Donation creation issues
- Database failures

## Compliance Notes

As per H1B visa restrictions:
- All donations go directly to the nonprofits through Every.org
- Stash does not collect any funds
- Premium access is provided as a thank-you gift for donations
