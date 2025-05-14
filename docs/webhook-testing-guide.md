# Testing Every.org Webhooks in the Staging Environment

## The Challenge

When testing with Every.org's staging environment, you need a publicly accessible webhook URL that Every.org's staging servers can reach. Your local development server typically isn't accessible from the internet, making webhook testing difficult.

## Solution Options

### Option 1: Use a Vercel Preview Deployment (Recommended)

Since this project is deployed on Vercel, the easiest way to get a stable webhook URL is to use a dedicated preview deployment:

1. See the detailed instructions in [Vercel Webhook Setup](./vercel-webhook-setup.md)
2. This provides a stable URL that doesn't change between testing sessions
3. Use the script at `scripts/update-webhook-url.js` to generate an email template for Every.org

### Option 2: Use a Webhook Forwarding Service

Tools like ngrok or localtunnel create a secure tunnel to your local server, exposing it to the internet temporarily:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js development server
npm run dev

# In another terminal, create a tunnel to your webhook endpoint
ngrok http 3000
```

This will give you a URL like `https://a1b2c3d4.ngrok.io` that forwards to your local server.

You would then:
1. Send this URL + `/api/webhooks/every-org` to Every.org support
2. They'll register it in their staging environment
3. You can now receive real-time webhooks from the staging environment

### Option 2: Deploy to a Development Environment

If you have a development or staging server:

1. Deploy your code with the webhook handler to that environment
2. Provide that webhook URL to Every.org support
3. Test with the staging environment

### Option 3: Use the Webhook Simulation Script

If options 1 and 2 aren't feasible, you can continue using our webhook simulation script that bypasses the need for an actual webhook from Every.org:

```bash
# First create a donation intent in your database
node scripts/create-test-donation.js <USER_ID>

# Then simulate a webhook for that donation
node scripts/test-webhook.js <REFERENCE_ID>
```

## Setting Up ngrok for Webhook Testing

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Start your development server**:
   ```bash
   npm run dev
   ```

3. **Start ngrok to create a tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Get your public URL**:
   The ngrok terminal will show a URL like `https://a1b2c3d4.ngrok.io`

5. **Send to Every.org support**:
   Email Every.org support with:
   ```
   Please register this development webhook URL with your staging environment:
   https://a1b2c3d4.ngrok.io/api/webhooks/every-org
   ```

6. **Test the entire flow**:
   - Make a donation on the staging environment
   - Watch your webhook endpoint receive the notification
   - Verify premium access is granted automatically

## Important Notes

1. The ngrok URL will change each time you restart ngrok unless you have a paid account.
2. You'll need to update the URL with Every.org each time it changes.
3. Always use HTTPS URLs for security, even in development.
4. Make sure your webhook handler properly validates signatures even in development.
