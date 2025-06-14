/**
 * Blog Content Formatter Utility
 * 
 * This utility enhances blog content formatting by:
 * 1. Removing visible HTML/JSON-LD schema tags from the rendered content
 * 2. Improving heading hierarchy and readability 
 * 3. Enhancing content structure with proper spacing and organization
 */

/**
 * Process blog content for display by removing schema markup and improving formatting
 * 
 * @param {string} content - The raw blog content with potential schema markup
 * @returns {string} - Clean, formatted blog content ready for display
 */
export const formatBlogContent = (content) => {
  if (!content) return '';
  
  // Remove JSON-LD schema markup section entirely (script tag and contents)
  let cleanedContent = content.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  
  // Remove any "```html" or other code block markers that might appear
  cleanedContent = cleanedContent.replace(/```html/g, '');
  cleanedContent = cleanedContent.replace(/```/g, '');
  
  // Remove any remaining HTML comment tags
  cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');
  
  // Improve heading structure with proper hierarchy and spacing
  cleanedContent = enhanceHeadings(cleanedContent);
  
  // Add proper spacing between sections
  cleanedContent = improveContentSpacing(cleanedContent);
  
  // Enhance list formatting
  cleanedContent = enhanceListFormatting(cleanedContent);
  
  return cleanedContent;
};

/**
 * Enhance heading structure with proper hierarchy and styling
 * 
 * @param {string} content - The blog content
 * @returns {string} - Content with enhanced heading structure
 */
const enhanceHeadings = (content) => {
  // Add more spacing before headings for better visual hierarchy
  let enhanced = content
    // Ensure h1 has proper styling and spacing
    .replace(/<h1([^>]*)>(.*?)<\/h1>/gi, '<h1$1 style="font-size: 2.2rem; margin-top: 2rem; margin-bottom: 1.5rem; color: #2c3e50; font-weight: 700; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem;">$2</h1>')
    
    // Enhance h2 headings for better subsection visibility
    .replace(/<h2([^>]*)>(.*?)<\/h2>/gi, '<h2$1 style="font-size: 1.8rem; margin-top: 2.5rem; margin-bottom: 1.2rem; color: #34495e; font-weight: 600;">$2</h2>')
    
    // Style h3 for better hierarchy
    .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, '<h3$1 style="font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #2c3e50; font-weight: 600;">$2</h3>')
    
    // Add styling to h4 for better visibility
    .replace(/<h4([^>]*)>(.*?)<\/h4>/gi, '<h4$1 style="font-size: 1.3rem; margin-top: 1.8rem; margin-bottom: 0.8rem; color: #2c3e50; font-weight: 600;">$2</h4>');
    
  return enhanced;
};

/**
 * Improve spacing between content sections
 * 
 * @param {string} content - The blog content
 * @returns {string} - Content with improved spacing
 */
const improveContentSpacing = (content) => {
  return content
    // Add more space between paragraphs
    .replace(/<\/p>\s*<p/g, '</p>\n\n<p')
    
    // Add space after lists
    .replace(/<\/(ul|ol)>\s*<p/g, '</$1>\n\n<p')
    
    // Add space before lists
    .replace(/<\/p>\s*<(ul|ol)/g, '</p>\n\n<$1')
    
    // Improve paragraph readability
    .replace(/<p([^>]*)>(.*?)<\/p>/gi, '<p$1 style="margin-bottom: 1.2rem; line-height: 1.7; color: #2c3e50;">$2</p>');
};

/**
 * Enhance list formatting for better readability
 * 
 * @param {string} content - The blog content
 * @returns {string} - Content with enhanced list formatting
 */
const enhanceListFormatting = (content) => {
  return content
    // Style unordered lists
    .replace(/<ul([^>]*)>/gi, '<ul$1 style="margin: 1.5rem 0; padding-left: 2.5rem;">')
    
    // Style ordered lists
    .replace(/<ol([^>]*)>/gi, '<ol$1 style="margin: 1.5rem 0; padding-left: 2.5rem;">')
    
    // Style list items
    .replace(/<li([^>]*)>(.*?)<\/li>/gi, '<li$1 style="margin-bottom: 0.8rem; line-height: 1.6;">$2</li>')
    
    // Add slight indentation for nested lists
    .replace(/<ul([^>]*)>\s*<li/g, '<ul$1>\n    <li')
    .replace(/<ol([^>]*)>\s*<li/g, '<ol$1>\n    <li')
    .replace(/<\/li>\s*<li/g, '</li>\n    <li')
    .replace(/<\/li>\s*<\/ul/g, '</li>\n</ul')
    .replace(/<\/li>\s*<\/ol/g, '</li>\n</ol');
};

/**
 * Format blockquotes for better visual appeal
 * 
 * @param {string} content - The blog content
 * @returns {string} - Content with enhanced blockquotes
 */
export const enhanceBlockquotes = (content) => {
  return content
    .replace(/<blockquote([^>]*)>(.*?)<\/blockquote>/gi, 
      '<blockquote$1 style="border-left: 4px solid #3498db; background: #f8f9fa; margin: 1.5rem 0; padding: 1.2rem 1.5rem; font-style: italic; color: #34495e;">$2</blockquote>');
};
