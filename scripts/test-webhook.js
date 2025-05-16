// Test script to simulate an Every.org webhook event from the staging environment
// This allows you to test your webhook handler without registering a real webhook URL
// or making an actual donation on the staging environment
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const crypto = require('crypto');
const { nanoid } = require('nanoid');

console.log('===== EVERY.ORG STAGING WEBHOOK SIMULATOR =====');
console.log('This script simulates a webhook from Every.org\'s staging environment');
console.log('Use this for testing when you don\'t have a publicly accessible webhook URL');

// Function to create a mock webhook payload
function createMockWebhookPayload(reference = null) {
  // Generate a random reference if none provided
  const donationReference = reference || `test_${nanoid(8)}`;
  
  return {
    event: 'donation.completed',
    data: {
      id: `mock_donation_${nanoid(6)}`,
      reference: donationReference,
      status: 'SUCCEEDED',
      amount: 1000, // $10.00 in cents
      currency: 'USD',
      nonprofitId: 'wildlife-conservation-network',
      nonprofitName: 'Wildlife Conservation Network',
      createdAt: new Date().toISOString(),
      metadata: {
        userId: process.env.TEST_USER_ID || 'test-user-123',
        source: 'stash_premium_access'
      }
    }
  };
}

// Function to sign the payload with the webhook secret
function signPayload(payload) {
  const secret = process.env.EVERY_ORG_WEBHOOK_SECRET;
  
  if (!secret) {
    console.warn('Warning: No webhook secret defined in .env.local');
    return 'mock_signature_123';
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Function to create donation intent in the database first
async function createDonationIntent(reference, userId = 'test-user-123') {
  try {
    console.log(`Creating donation intent for reference: ${reference} and user: ${userId}`);
    
    // Call the donations create API to set up the intent
    const createResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/donations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock_token_for_${userId}`
      },
      body: JSON.stringify({
        nonprofitId: 'wildlife-conservation-network',
        nonprofitName: 'Wildlife Conservation Network',
        amount: 10,
        testMode: true,
        userId: userId,
        donationReference: reference
      })
    });
    
    if (!createResponse.ok) {
      console.warn('Failed to create donation intent, but continuing with webhook test');
      try {
        const errorData = await createResponse.json();
        console.warn('API Error:', errorData);
      } catch (e) {
        console.warn('API Error (non-JSON):', await createResponse.text());
      }
    } else {
      console.log('Successfully created donation intent');
    }
  } catch (error) {
    console.error('Error creating donation intent:', error);
    console.log('Continuing with webhook test anyway...');
  }
}

// Function to send the mock webhook
async function sendMockWebhook(reference) {
  // First create donation intent
  await createDonationIntent(reference);
  
  // Then create and send webhook
  const payload = createMockWebhookPayload(reference);
  const signature = signPayload(payload);
  
  console.log('Sending mock webhook to your endpoint...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signature);
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/every-org`;
    
    console.log(`Sending to: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Every-Signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response JSON:', responseJson);
    } catch (e) {
      // Not JSON, which is fine
    }
    
    if (response.ok) {
      console.log('Success! Webhook was processed successfully.');
    } else {
      console.log('Error: Webhook was not processed successfully.');
    }
  } catch (error) {
    console.error('Error sending mock webhook:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const reference = args[0]; // Optional donation reference

// Execute
sendMockWebhook(reference);
