// This script simulates an Every.org webhook call to test your webhook handler
// It sends a simulated donation.completed event to your webhook endpoint
// Run this script with: node scripts/trigger-webhook-test.js

const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config();

// Configuration - update these values as needed
const TEST_REFERENCE = 'test-' + Date.now().toString();
const WEBHOOK_URL = process.env.WEBHOOK_TEST_URL || 'http://localhost:3000/api/webhooks/every-org'; // Update this to your actual webhook URL
const AMOUNT_CENTS = 1000; // $10.00

async function triggerWebhook() {
  // Create a sample webhook payload similar to what Every.org would send
  const webhookPayload = {
    event: 'donation.completed',
    data: {
      reference: TEST_REFERENCE,
      status: 'SUCCEEDED',
      amount: AMOUNT_CENTS,
      nonprofitId: 'wildlife-conservation-network',
      nonprofitName: 'Wildlife Conservation Network',
      donationId: 'test-donation-' + Date.now(),
      donorName: 'Test Donor',
      email: 'test@example.com'
    }
  };
  
  console.log('Sending test webhook to:', WEBHOOK_URL);
  console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
  
  // Create signature if webhook secret is available
  let headers = {
    'Content-Type': 'application/json'
  };
  
  if (process.env.EVERY_ORG_WEBHOOK_SECRET) {
    const hmac = crypto.createHmac('sha256', process.env.EVERY_ORG_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(webhookPayload));
    const signature = hmac.digest('hex');
    
    headers['x-every-signature'] = signature;
    console.log('Added signature header:', signature.substring(0, 10) + '...');
  } else {
    console.warn('No EVERY_ORG_WEBHOOK_SECRET found in environment, sending without signature');
  }
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(webhookPayload)
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('Webhook test successful! Check your server logs for details.');
    } else {
      console.error('Webhook test failed with status:', response.status);
    }
  } catch (error) {
    console.error('Failed to send webhook test:', error);
  }
}

// Run the webhook test
triggerWebhook().catch(console.error);
