# Every.org Donation Integration for Stash App

This integration connects Stash with Every.org to provide users with premium access benefits in exchange for donations to non-profit organizations, while complying with H1B visa restrictions.

## Features

- Users can donate $10+ to any nonprofit on Every.org
- Donation benefits:
  - $10+ donation: 30 days of premium access
  - All donations: 300 coins base + 30 coins for each dollar above $10
- Full donation tracking and history
- Secure webhook handling with signature verification
- Success and cancel pages with status checking
- Mobile-responsive donation UI
- Fallback to verified nonprofits for reliability

## Architecture

The donation flow consists of the following components:

1. **Frontend Components**:
   - `DonationComponent.js` - Main UI for selecting a charity and donation amount
   - `ContentPaywall.js` - Integrated donation option in the content paywall
   - Success/cancel pages for post-donation flows

2. **API Endpoints**:
   - `/api/donations/create.js` - Creates a donation intent and redirects to Every.org checkout
   - `/api/donations/status.js` - Checks the status of a donation
   - `/api/webhooks/every-org.js` - Processes webhooks from Every.org when donations complete

3. **Database Tables**:
   - **donation_intents**: Tracks initiated donations (pending status)
   - **donation_records**: Stores completed donations
   - **user_tokens**: Manages premium membership status
   - **token_transactions**: Records bonus tokens awarded from donations

### API Endpoints

- **/api/donations/create**: Initiates donation and redirects to Every.org checkout
- **/api/donations/status**: Checks status of a donation by reference
- **/api/webhooks/every-org**: Processes webhooks from Every.org
- **/api/donations**: Retrieves donation history for current user

### Frontend Components

- **DonationComponent.js**: Main donation UI with charity selection and amount input
- **ContentPaywall.js**: Updated with donation tab alongside post and premium options
- **Success/Cancel Pages**: Handle post-donation user experience

## Donation Flow

### 1. Initiating a Donation

The donation flow begins when a user selects a non-profit and an amount in the DonationComponent:

1. The frontend calls `/api/donations/create` with:
   - Selected non-profit's ID
   - Donation amount
   - User's authentication token

2. The server:
   - Validates the user and inputs
   - Creates a donation intent record in the database
   - Calls Every.org's API to create a checkout URL
   - Returns the checkout URL to the client

3. The client redirects the user to the Every.org checkout page

### 2. Donation Completion

After completing the donation on Every.org:

1. Every.org redirects the user back to Stash's success page `/donation/success?ref=[reference]`
2. Every.org also sends a webhook notification to `/api/webhooks/every-org`

### 3. Webhook Processing

When the webhook is received:

1. The server validates the webhook signature
2. Finds the corresponding donation intent in the database
3. Updates the user's premium membership status based on the donation amount
4. Awards bonus tokens to the user (50 base + 10 per dollar donated)
5. Creates a donation record in the `donation_records` table
6. Records the token transaction in `token_transactions`
7. Updates the donation intent status to "completed"

## Testing

For testing the donation integration, these scripts are available:

- `scripts/test-everyorg-api.js` - Tests basic API connectivity
- `scripts/list-nonprofits.js` - Lists valid non-profits from Every.org
- `scripts/test-donation-creation.js` - Tests donation checkout creation
- `scripts/test-webhook.js` - Simulates a webhook from Every.org
- `scripts/create-test-donation.js` - Creates a complete test donation flow

Before production deployment:
1. Test with sandbox API credentials
2. Verify premium days are correctly awarded
3. Check token awards are processed
4. Test both success and failure flows
5. Verify webhook signature verification

## Known Valid Nonprofits

The following nonprofit IDs are confirmed to work with Every.org:

- wildlife-conservation-network
- doctors-without-borders-usa
- against-malaria-foundation-usa
- givedirectly
- electronic-frontier-foundation
- code-for-america
- wikimedia-foundation
- khan-academy
- water-org
- direct-relief

## Troubleshooting

### Common Issues:

1. **"Not found" error from Every.org API**:
   - Ensure you're using a valid nonprofit ID from the verified list above
   - If issues persist, the API will fall back to a known working nonprofit

2. **Webhook not processing**:
   - Check webhook signature verification is properly configured
   - Temporarily disable signature verification during testing
   - Use the `test-webhook.js` script to simulate webhook events

3. **Missing premium access after donation**:
   - Check if the webhook was properly received and processed
   - Verify the database records in `donation_records` and `user_tokens`
   - Use the `create-test-donation.js` script to manually test the flow

## Compliance

This integration complies with H1B visa restrictions on monetization:
- All funds go directly to nonprofits
- Stash does not receive any financial compensation
- Premium access is provided as a gift in exchange for charitable donations
- Using an established donation platform (Every.org) to process payments

See `docs/every-org-setup.md` for detailed setup and configuration instructions.

## Testing Scripts

For testing and debugging the donation flow, several scripts are available in the `scripts/` directory:

```bash
# Test basic API connectivity to Every.org
node scripts/test-everyorg-api.js

# List valid nonprofits from Every.org
node scripts/list-nonprofits.js

# Test donation checkout URL creation
node scripts/test-donation-creation.js

# Run a complete donation test with a specific user ID
node scripts/full-donation-test.js <user-id>

# Simulate a donation webhook from Every.org
node scripts/test-webhook.js <donation-reference>

# Create a test donation record directly in the database
node scripts/create-test-donation.js <user-id>
```
