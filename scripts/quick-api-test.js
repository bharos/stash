// Simple test for Every.org API connectivity
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

(async () => {
  console.log('Testing Every.org API connection...');
  console.log('API Key available:', !!process.env.EVERY_ORG_API_KEY);
  console.log('API Key first 5 chars:', process.env.EVERY_ORG_API_KEY ? process.env.EVERY_ORG_API_KEY.substring(0, 5) : 'N/A');
  console.log('APP URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  try {
    // Try using API key in URL parameter instead of Authorization header
    const apiKey = process.env.EVERY_ORG_API_KEY;
    const response = await fetch(`https://partners.every.org/v0.2/browse/nonprofits?causes=animals&limit=1&apiKey=${apiKey}`);
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! First nonprofit:', data.nonprofits?.[0]?.name);
    } else {
      // Clone the response before reading
      const responseClone = response.clone();
      try {
        const data = await response.json();
        console.log('Error response (JSON):', data);
      } catch (jsonError) {
        try {
          const text = await responseClone.text();
          console.log('Error response (text):', text);
        } catch (textError) {
          console.log('Could not read response body');
        }
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
})();
