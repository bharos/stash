/**
 * Test script for sending test webhooks to the staging environment
 * 
 * Usage:
 * node scripts/test-staging-webhook.js
 * 
 * This script simulates a webhook from Every.org to test your webhook handler in the staging environment.
 */

require('dotenv').config(); // Load environment variables

// Determine the webhook URL based on environment
const WEBHOOK_URL = process.env.STAGING_WEBHOOK_URL || 'https://staging.stashdb.fyi/api/webhooks/every-org';
const TEST_URL = process.env.STAGING_TEST_URL || 'https://staging.stashdb.fyi/api/webhooks/staging-test';
const WEBHOOK_TOKEN = process.env.EVERY_ORG_WEBHOOK_TOKEN;

if (!WEBHOOK_TOKEN) {
  console.error('❌ Missing EVERY_ORG_WEBHOOK_TOKEN in environment variables');
  process.exit(1);
}

console.log(`🔧 Testing webhook with URLs:
- Main webhook: ${WEBHOOK_URL}
- Test endpoint: ${TEST_URL}
`);

// Create a simulated donation.completed webhook payload
const simulateDonationPayload = (reference) => {
  return {
    event: 'donation.completed',
    data: {
      donationId: `test-donation-${Date.now()}`,
      reference: reference || `stash-test-${Date.now().toString(36)}`,
      status: 'SUCCEEDED',
      amount: 1500, // $15.00 in cents
      nonprofitId: 'khan-academy',
      nonprofitName: 'Khan Academy'
    }
  };
};

// Function to send a test webhook
async function sendTestWebhook(url, payload) {
  try {
    console.log(`📤 Sending test webhook to: ${url}`);
    console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response data: ${JSON.stringify(responseData, null, 2)}`);
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`❌ Error sending test webhook: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test the main webhook
async function testMainWebhook() {
  const payload = simulateDonationPayload();
  console.log('\n===== TESTING MAIN WEBHOOK =====');
  return await sendTestWebhook(WEBHOOK_URL, payload);
}

// Test the test endpoint
async function testTestEndpoint() {
  const payload = {
    event: 'test',
    data: {
      message: 'This is a test webhook',
      timestamp: new Date().toISOString()
    }
  };
  console.log('\n===== TESTING TEST ENDPOINT =====');
  return await sendTestWebhook(TEST_URL, payload);
}

// Run tests
async function runTests() {
  try {
    // First test the test endpoint
    const testResult = await testTestEndpoint();
    
    if (testResult.success) {
      console.log('✅ Test endpoint working!');
      
      // If test endpoint works, test the main webhook
      const mainResult = await testMainWebhook();
      
      if (mainResult.success) {
        console.log('✅ Main webhook working!');
      } else {
        console.log('❌ Main webhook test failed');
      }
    } else {
      console.log('❌ Test endpoint failed - check your webhook token and URL');
    }
  } catch (error) {
    console.error(`❌ Error during testing: ${error.message}`);
  }
}

// Run the tests
runTests();
