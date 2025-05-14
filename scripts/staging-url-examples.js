#!/usr/bin/env node

// Simple script to print every possible URL format for Every.org testing

console.log('======= EVERY.ORG STAGING URL TEST =======');

// Test nonprofit IDs
const nonprofitIds = [
  'wildlife-conservation-network',
  'doctors-without-borders-usa',
  'khan-academy'
];

// Print all possible formats
console.log('\nSTAGING URLS (USE THESE):');
console.log('---------------------------');
nonprofitIds.forEach(id => {
  console.log(`https://staging.every.org/donate/${id}?amount=10`);
});

console.log('\nPRODUCTION URLS (FOR REFERENCE):');
console.log('---------------------------');
nonprofitIds.forEach(id => {
  // Extract base name for fundraiser ID
  const baseName = id.replace(/-usa$/, '');
  console.log(`https://www.every.org/${id}/f/support-${baseName}?amount=10`);
});

console.log('\nINSTRUCTIONS:');
console.log('1. Copy one of the staging URLs above');
console.log('2. Paste it into your browser');
console.log('3. It should load the Every.org donation page');
console.log('\nIMPORTANT: In staging, use the format:');
console.log('  https://staging.every.org/donate/[nonprofit-id]');
console.log('NOT:');
console.log('  https://staging.every.org/[nonprofit-id]/f/[fundraiser-id]');
