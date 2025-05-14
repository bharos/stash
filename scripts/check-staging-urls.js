// Script to check valid nonprofit URLs for the Every.org staging environment
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
// const open = require('open'); // Commented out since it's not installed

// Setting NODE_ENV to 'development' to simulate development environment
process.env.NODE_ENV = 'development';

// Import the donation utils (adjust path if needed)
const { generateFundraiserUrl } = require('../src/app/utils/donationUtils');

// List of nonprofits we want to check
const nonprofits = [
  'wildlife-conservation-network',
  'doctors-without-borders-usa',
  'against-malaria-foundation-usa',
  'givedirectly',
  'electronic-frontier-foundation',
  'code-for-america',
  'wikimedia-foundation',
  'khan-academy',
  'water-org',
  'direct-relief'
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
  
  // Check both URL formats for each nonprofit
  for (const nonprofitId of nonprofits) {
    // Check our app's fundraiser URL generator
    const fundraiserUrl = generateFundraiserUrl(nonprofitId, { amount: 10 });
    const result1 = await checkUrl(fundraiserUrl);
    results.push(result1);
    
    // Also check the direct staging URL format
    const directUrl = `https://staging.every.org/donate/${nonprofitId}?amount=10`;
    const result2 = await checkUrl(directUrl);
    results.push(result2);
  }
  
  // Summarize results
  console.log('\nResults Summary:');
  console.log('===============');
  
  const validUrls = results.filter(r => r.valid);
  console.log(`Found ${validUrls.length} valid URLs out of ${results.length} checked.`);
  
  if (validUrls.length > 0) {
    console.log('\nValid URLs:');
    validUrls.forEach(r => console.log(`- ${r.url}`));
    
    // Optionally open the first valid URL in the browser for testing
    console.log('\nOpening first valid URL in browser...');
    // Uncomment the next line to automatically open the URL
    // open(validUrls[0].url);
  }
}

main().catch(console.error);
