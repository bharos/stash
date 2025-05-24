#!/usr/bin/env node

// Simple script to generate and print Every.org donation URLs 
// that are confirmed to work with the staging environment

console.log('======= EVERY.ORG WORKING URLs =======');

// Test nonprofit IDs
const nonprofitIds = [
  'direct-relief',
  'wildlife-conservation-network',
  'doctors-without-borders-usa',
  'khan-academy'
];

const amounts = [10, 25];
const environments = ['staging', 'production'];

// Print all possible formats
for (const env of environments) {
  console.log(`\n${env.toUpperCase()} URLs:`);
  console.log('---------------------------');
  
  const domain = env === 'staging' ? 'staging.every.org' : 'www.every.org';
  
  for (const id of nonprofitIds) {
    for (const amount of amounts) {
      // The URL format that works with fragment
      console.log(`${amount}: https://${domain}/${id}#/donate/card?amount=${amount}&frequency=ONCE`);
    }
    console.log('');
  }
}

console.log('\nINSTRUCTIONS:');
console.log('1. Copy one of the URLs above');
console.log('2. Paste it into your browser');
console.log('3. It should load the Every.org donation page correctly\n');
