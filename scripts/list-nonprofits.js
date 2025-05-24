// Script to list popular nonprofits from Every.org
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

(async () => {
  console.log('Fetching popular nonprofits from Every.org...');
  console.log('API Key available:', !!process.env.EVERY_ORG_API_KEY);
  console.log('API Key first 5 chars:', process.env.EVERY_ORG_API_KEY ? process.env.EVERY_ORG_API_KEY.substring(0, 5) : 'N/A');
  
  try {
    const apiKey = process.env.EVERY_ORG_API_KEY;
    
    // First, let's fetch popular causes
    console.log('\n=== Popular Causes ===');
    const causesResponse = await fetch(`https://partners.every.org/v0.2/browse/causes?apiKey=${apiKey}`);
    
    if (causesResponse.ok) {
      const causesData = await causesResponse.json();
      console.log(`Found ${causesData.causes?.length || 0} causes`);
      
      if (causesData.causes && causesData.causes.length > 0) {
        // Display list of causes
        causesData.causes.slice(0, 10).forEach((cause, index) => {
          console.log(`${index + 1}. ${cause.name} (${cause.slug})`);
        });
        
        // Now fetch nonprofits for some popular causes
        const popularCauses = ['animals', 'education', 'health', 'environment', 'humanitarian'];
        
        for (const cause of popularCauses) {
          console.log(`\n=== Nonprofits for "${cause}" ===`);
          const nonprofitsResponse = await fetch(
            `https://partners.every.org/v0.2/browse/nonprofits?causes=${cause}&limit=5&apiKey=${apiKey}`
          );
          
          if (nonprofitsResponse.ok) {
            const nonprofitsData = await nonprofitsResponse.json();
            
            if (nonprofitsData.nonprofits && nonprofitsData.nonprofits.length > 0) {
              nonprofitsData.nonprofits.forEach((nonprofit, index) => {
                console.log(`${index + 1}. ${nonprofit.name}`);
                console.log(`   ID: ${nonprofit.ein || nonprofit.id || 'N/A'}`);
                console.log(`   Slug: ${nonprofit.slug}`);
                console.log(`   Description: ${nonprofit.description?.substring(0, 100)}...`);
                console.log('   ----------------');
              });
              
              // Add code samples for using these nonprofits
              console.log('\n=== Code Sample for First Nonprofit ===');
              const sampleNonprofit = nonprofitsData.nonprofits[0];
              console.log(`
// To use in DonationComponent.js:
const sampleCharity = {
  id: '${sampleNonprofit.slug}',
  name: '${sampleNonprofit.name}',
  category: '${cause}'
};

// Sample API request to Every.org:
fetch('https://partners.every.org/v0.2/donation/checkout?apiKey=YOUR_API_KEY', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nonprofitId: '${sampleNonprofit.slug}',
    name: '${sampleNonprofit.name}',
    amount: 1000, // $10.00 in cents
    currency: 'USD',
    reference: 'donation_123',
    description: 'Donation for premium access',
    onCompleteRedirectUrl: 'http://localhost:3000/donation/success?ref=donation_123',
    onCancelRedirectUrl: 'http://localhost:3000/donation/cancel?ref=donation_123'
  })
})
              `);
            } else {
              console.log(`No nonprofits found for cause "${cause}"`);
            }
          } else {
            console.log(`Failed to fetch nonprofits for cause "${cause}"`);
          }
        }
      }
    } else {
      console.error('Failed to fetch causes');
      const responseClone = causesResponse.clone();
      try {
        const data = await causesResponse.json();
        console.error('Error response (JSON):', data);
      } catch (jsonError) {
        try {
          const text = await responseClone.text();
          console.error('Error response (text):', text);
        } catch (textError) {
          console.error('Could not read response body');
        }
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
})();
