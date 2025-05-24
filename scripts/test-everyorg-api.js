// Test script to verify Every.org API connectivity
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testEveryOrgConnection() {
  console.log('\n=== Every.org API Connection Test ===\n');
  
  // Check environment variables
  console.log('Checking environment variables:');
  const apiKey = process.env.EVERY_ORG_API_KEY;
  const webhookSecret = process.env.EVERY_ORG_WEBHOOK_SECRET; 
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  console.log(`API Key present: ${apiKey ? '✓' : '✗'}`);
  console.log(`Webhook Secret present: ${webhookSecret ? '✓' : '✗'}`);
  console.log(`App URL: ${appUrl || 'NOT SET'}`);
  
  if (!apiKey) {
    console.error('\nERROR: Missing EVERY_ORG_API_KEY in .env.local');
    console.log('Please add EVERY_ORG_API_KEY=your_api_key to your .env.local file');
    return;
  }
  
  // Test API connectivity
  console.log('\nTesting API connectivity...');
  
  try {
    // We'll use a simple API call to test connectivity
    // This is just to verify the API is reachable and credentials work
    // Try using API key in URL query parameter instead of authorization header
    // This is more common for public/client keys
    const testResponse = await fetch(`https://partners.every.org/v0.2/browse/nonprofits?causes=animals&limit=1&apiKey=${apiKey}`);
    
    // Log response status
    console.log(`API Response Status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('API connection successful! Sample response data:');
      console.log(JSON.stringify(data, null, 2).substring(0, 300) + '...');
      
      // Verify redirect URLs
      console.log('\nVerifying redirect URLs:');
      if (!appUrl) {
        console.error('⚠️ NEXT_PUBLIC_APP_URL is not set. Donations will fail.');
      } else {
        const successUrl = `${appUrl}/donation/success?ref=test`;
        const cancelUrl = `${appUrl}/donation/cancel?ref=test`;
        console.log(`Success URL: ${successUrl}`);
        console.log(`Cancel URL: ${cancelUrl}`);
        
        // Basic URL validation
        const validUrl = /^https?:\/\/.+/;
        if (!validUrl.test(appUrl)) {
          console.error(`⚠️ Warning: NEXT_PUBLIC_APP_URL (${appUrl}) doesn't appear to be a valid URL.`);
        }
      }
    } else {
      console.error('API connection failed!');
      try {
        // Clone the response before reading the body
        const responseClone = testResponse.clone();
        const errorText = await responseClone.text();
        console.error(`Error: ${errorText}`);
      } catch (err) {
        console.error('Could not read error response:', err.message);
      }
    }
  } catch (error) {
    console.error('Error connecting to Every.org API:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testEveryOrgConnection();
