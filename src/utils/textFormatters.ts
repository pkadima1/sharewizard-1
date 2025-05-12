
/**
 * Removes markdown-style formatting from text
 * @param text The text potentially containing markdown formatting
 * @returns Clean text without markdown formatting
 */
export const stripMarkdownFormatting = (text: string | undefined): string => {
  if (!text) return '';
  
  // Remove ** bold formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove * italic formatting
    .replace(/\*(.*?)\*/g, '$1')
    // Remove ## headings
    .replace(/##\s+(.*?)(?:\n|$)/g, '$1')
    // Remove ` code formatting
    .replace(/`(.*?)`/g, '$1')
    // Remove ~~ strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove > blockquotes
    .replace(/>\s+(.*?)(?:\n|$)/g, '$1');
};
