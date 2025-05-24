/**
 * Utility functions for Every.org donation integration
 */

/**
 * Generates a direct donation link to Every.org
 * This is a simpler alternative to the Partners API
 * Note: This doesn't support tracking/verification as well as the API approach
 * 
 * @param {string} nonprofitId - The Every.org nonprofit slug or EIN
 * @param {Object} options - Additional options for the donation link
 * @param {number} options.amount - Optional suggested donation amount in dollars
 * @param {string} options.frequency - Optional donation frequency ('ONCE', 'MONTHLY', etc.)
 * @returns {string} The complete donation URL
 */
export function generateDonateLink(nonprofitId, options = {}) {
  if (!nonprofitId) {
    throw new Error('Nonprofit ID is required');
  }
  
  // Base URL format from documentation
  let url = `https://www.every.org/${nonprofitId}#donate`;
  
  // Add optional query parameters
  const queryParams = [];
  
  if (options.amount) {
    queryParams.push(`amount=${options.amount}`);
  }
  
  if (options.frequency) {
    queryParams.push(`frequency=${options.frequency}`);
  }
  
  // Append query parameters if any
  if (queryParams.length > 0) {
    // Replace # with ? for the first parameter
    url = url.replace('#donate', `?${queryParams.join('&')}#donate`);
  }
  
  return url;
}

/**
 * Verifies that a nonprofit ID is in our list of verified nonprofits
 * @param {string} nonprofitId - The nonprofit ID to verify
 * @returns {boolean} True if the nonprofit is verified
 */
export function isVerifiedNonprofit(nonprofitId) {
  const verifiedNonprofits = [
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
  
  return verifiedNonprofits.includes(nonprofitId);
}
