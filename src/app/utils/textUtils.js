import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content, strips HTML tags, and truncates text to a specified length
 * @param {string} html - The HTML content to process
 * @param {number} maxLength - Maximum length of the output text (default: 100)
 * @returns {string} Processed text content
 */
export const sanitizeAndStripHTML = (html, maxLength = 100) => {
  if (!html) return '';
  // First sanitize the HTML
  const sanitized = DOMPurify.sanitize(html);
  // Then strip HTML tags and decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = sanitized;
  const text = div.textContent || div.innerText || '';
  // Truncate the text if it's longer than maxLength
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}; 