// This script tests the Every.org donation checkout API
// Run with: node scripts/test-endpoint.js

const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

async function testEndpoint() {
  // Get API key from environment
  const apiKey = process.env.EVERY_ORG_API_KEY;
  
  if (!apiKey) {
    console.error('Missing EVERY_ORG_API_KEY in environment variables');
    process.exit(1);
  }

  // Test data
  const testPayload = {
    nonprofitId: 'wildlife-conservation-network',
    name: 'Wildlife Conservation Network',
    amount: 1000, // $10.00 in cents
    currency: 'USD',
    reference: 'test-' + Date.now(),
    description: 'API test donation',
    onCompleteRedirectUrl: 'https://example.com/success',
    onCancelRedirectUrl: 'https://example.com/cancel',
    metadata: {
      source: 'api_test'
    }
  };

  console.log('Test payload:', JSON.stringify(testPayload, null, 2));

  // Try both endpoints
  const endpoints = [
    'https://partners.every.org/v0.2/donation/checkout',
    'https://partners.every.org/v0.2/donate/checkout'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const url = `${endpoint}?apiKey=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      console.log(`Status code: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SUCCESS! Response:', JSON.stringify(data, null, 2));
        
        if (data.donationUrl) {
          console.log(`\nDonation URL: ${data.donationUrl}`);
          console.log(`This endpoint is working correctly: ${endpoint}`);
        } else {
          console.log('Warning: Response does not contain donationUrl field');
        }
      } else {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        console.error(`Error from ${endpoint}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${endpoint}:`, error.message);
    }
  }
}

testEndpoint().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
