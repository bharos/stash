// Simple script to test direct Every.org staging URLs
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// List of nonprofits we want to check
const nonprofits = [
  'wildlife-conservation-network',
  'doctors-without-borders-usa',
  'against-malaria-foundation-usa',
  'givedirectly',
  'electronic-frontier-foundation',
  'khan-academy',
  'wikimedia-foundation'
];

// Function to check URL validity
async function checkUrl(url) {
  try {
    console.log(`Checking URL: ${url}`);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });
    
    const status = response.status;
    console.log(`Status: ${status} ${response.statusText}`);
    
    return { url, status, valid: status >= 200 && status < 400 };
  } catch (error) {
    console.error(`Error checking ${url}: ${error.message}`);
    return { url, error: error.message, valid: false };
  }
}

async function main() {
  console.log('Checking Every.org staging URLs...');
  console.log('=================================');
  
  const results = [];
  
  // Check direct staging URLs for each nonprofit
  for (const nonprofitId of nonprofits) {
    // Test multiple URL formats to find the one that works
    const formats = [
      `https://staging.every.org/${nonprofitId}#/donate/card?amount=10&frequency=ONCE`,
      `https://staging.every.org/${nonprofitId}?amount=10&frequency=ONCE#/donate/card`,
      `https://staging.every.org/${nonprofitId}#/donate/card`,
      `https://staging.every.org/donate/${nonprofitId}?amount=10` // Old format we tried
    ];
    
    for (const url of formats) {
      const result = await checkUrl(url);
      results.push(result);
    }
  }
  
  // Summarize results
  console.log('\nResults Summary:');
  console.log('===============');
  
  const validUrls = results.filter(r => r.valid);
  console.log(`Found ${validUrls.length} valid URLs out of ${results.length} checked.`);
  
  if (validUrls.length > 0) {
    console.log('\nValid URLs:');
    validUrls.forEach(r => console.log(`- ${r.url}`));
  }
}

main().catch(console.error);
