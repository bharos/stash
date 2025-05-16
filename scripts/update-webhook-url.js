#!/usr/bin/env node

/**
 * This script generates an email template for updating Every.org with your 
 * stable Vercel webhook URL.
 */

// Get the Vercel URL from command line argument or prompt for it
const vercelUrl = process.argv[2] || ''; 

if (!vercelUrl) {
  console.log('\nWelcome to the Every.org Webhook URL Update Helper\n');
  console.log('Usage: node update-webhook-url.js <your-vercel-url>');
  console.log('Example: node update-webhook-url.js webhook-testing-stash.vercel.app\n');
  process.exit(1);
}

// Format the complete webhook URL
const webhookUrl = `https://${vercelUrl}/api/webhooks/every-org`;

// Generate the email template
const emailTemplate = `
Subject: Webhook URL Update for Stash App - Staging Environment

Hello Every.org Support,

I'd like to update our webhook URL for the staging environment. This is a stable Vercel URL that 
will replace the previous ngrok URL I provided.

Details:
- Previous URL: [Your previous ngrok URL]
- New Webhook URL: ${webhookUrl}

This webhook URL should be used for receiving donation completion events from the Every.org 
staging environment.

Please let me know when this update has been completed so we can test the full donation flow.

Thank you!
`;

console.log('\n================ EMAIL TEMPLATE ================\n');
console.log(emailTemplate);
console.log('===============================================\n');
console.log('Instructions:');
console.log('1. Copy the email template above');
console.log('2. Send it to Every.org support');
console.log('3. Wait for confirmation that they\'ve updated your webhook URL');
console.log('4. Test a complete donation flow\n');
console.log('For more information, see docs/vercel-webhook-setup.md');
