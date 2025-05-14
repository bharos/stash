// Quick test script for Every.org staging URLs
// Usage: NODE_ENV=development node scripts/test-staging-url.js

// Simulate development environment if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('Setting NODE_ENV to development');
}

// Function to generate URLs for testing
function generateTestUrls(nonprofitId, amount) {
  // Generate multiple URL formats to test
  return {
    // Format used in our updated code
    updatedFormat: `https://staging.every.org/donate/${nonprofitId}?amount=${amount}`,
    
    // The original format that was returning 404
    originalFormat: `https://staging.every.org/${nonprofitId}/f/support-${nonprofitId.replace(/-usa$/, '')}?amount=${amount}`,
    
    // Production format for comparison
    productionFormat: `https://www.every.org/${nonprofitId}/f/support-${nonprofitId.replace(/-usa$/, '')}?amount=${amount}`
  };
}

// Generate test URLs for the wildlife conservation network
const testNonprofitId = 'wildlife-conservation-network';
const testAmount = 10;
const urls = generateTestUrls(testNonprofitId, testAmount);

console.log('======= EVERY.ORG URL TEST =======');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('\nThe URLs we\'re now using should be:');
console.log('------------------------------');
console.log('✅ STAGING:', urls.updatedFormat);
console.log('❌ (404) PREVIOUS FORMAT:', urls.originalFormat);
console.log('(Production format for reference:', urls.productionFormat, ')');

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Copy and paste this URL into your browser:');
console.log(urls.updatedFormat);
console.log('\n2. It should open the Every.org donation page for Wildlife Conservation Network');
console.log('\n3. If you still get a 404, try a different nonprofit like "khan-academy":');
console.log(`https://staging.every.org/donate/khan-academy?amount=${testAmount}`);
