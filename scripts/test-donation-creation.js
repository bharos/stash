// Test script to verify donation creation with Every.org
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { nanoid } = require('nanoid');

(async () => {
  console.log('Testing Every.org donation creation...');
  console.log('API Key available:', !!process.env.EVERY_ORG_API_KEY);
  console.log('API Key first 5 chars:', process.env.EVERY_ORG_API_KEY ? process.env.EVERY_ORG_API_KEY.substring(0, 5) : 'N/A');
  console.log('APP URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  try {
    // Use a well-known nonprofit for the test
    const donationData = {
      nonprofitId: 'wildlife-conservation-network', // This is a known valid slug
      name: 'Wildlife Conservation Network',
      amount: 1000, // $10.00 in cents
      currency: 'USD',
      reference: `test_${nanoid(8)}`,
      description: 'Test donation for Stash premium access',
      onCompleteRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donation/success?ref=test`,
      onCancelRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donation/cancel?ref=test`
    };

    console.log('\nSending donation request with the following data:');
    console.log(JSON.stringify(donationData, null, 2));
    
    const apiKey = process.env.EVERY_ORG_API_KEY;
    // Use staging API endpoint for development, partners for production
    const domain = process.env.NODE_ENV === 'development' ? 'api-staging' : 'partners';
    const response = await fetch(`https://${domain}.every.org/v0.2/donation/checkout?apiKey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donationData)
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response Headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nSuccess! Donation URL created:');
      console.log('- Donation URL:', data.donationUrl);
      console.log('- Donation ID:', data.donationId);
      
      console.log('\nTo complete the test, visit the donation URL in your browser:');
      console.log(data.donationUrl);
    } else {
      console.log('\nAPI call failed:');
      
      // Clone the response before reading
      const responseClone = response.clone();
      try {
        const data = await response.json();
        console.error('Error response (JSON):', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        try {
          const text = await responseClone.text();
          console.error('Error response (text):', text);
        } catch (textError) {
          console.error('Could not read response body:', textError.message);
        }
      }
      
      console.log('\nTroubleshooting tips:');
      console.log('1. Verify your Every.org API key is correct');
      console.log('2. Make sure the nonprofit ID is valid');
      console.log('3. Ensure all required fields are included in the request');
      console.log('4. Check that the redirect URLs are properly formatted');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
})();
