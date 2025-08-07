/**
 * contentFormatter.ts - Global Blog Content Formatting Utilities
 * 
 * Purpose: Centralized content formatting functions for consistent blog display
 * Features: Markdown to HTML conversion, special block handling, responsive styling
 */

export interface ContentFormatterOptions {
  preview?: boolean; // If true, applies smaller spacing for previews
  maxPreviewLength?: number; // Maximum length for content previews
}

/**
 * Format blog content for display with proper HTML styling
 * Handles markdown conversion and special block formatting
 */
export const formatBlogContent = (content: string, options: ContentFormatterOptions = {}): string => {
  const { preview = false } = options;
  
  // Base spacing classes - smaller for previews, larger for full content
  const spacing = preview 
    ? {
        h1: 'text-2xl font-bold mb-4 text-gray-900 dark:text-white',
        h2: 'text-xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-100',
        h3: 'text-lg font-semibold mb-2 mt-4 text-gray-700 dark:text-gray-200',
        paragraph: 'mb-4 leading-relaxed text-gray-700 dark:text-gray-300',
        blockquote: 'p-3 my-4 rounded-r-lg',
        list: 'list-disc list-inside mb-4 space-y-1 ml-4',
        listItem: 'mb-1'
      }
    : {
        h1: 'text-3xl font-bold mb-6 text-gray-900 dark:text-white leading-tight',
        h2: 'text-2xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-100',
        h3: 'text-xl font-semibold mb-3 mt-6 text-gray-700 dark:text-gray-200',
        paragraph: 'mb-6 leading-relaxed text-gray-700 dark:text-gray-300 text-lg',
        blockquote: 'p-4 my-6 rounded-r-lg',
        list: 'list-disc list-inside mb-6 space-y-2 ml-4',
        listItem: 'mb-2'
      };

  return content
    // Main headings
    .replace(/^# (.*$)/gim, `<h1 class="${spacing.h1}">$1</h1>`)
    .replace(/^## (.*$)/gim, `<h2 class="${spacing.h2}">$1</h2>`)
    
    // Special handling for #### blocks (4 hashes) - convert to styled blockquotes
    .replace(/^#### (Fun Fact|Caution|Note|Tip|Warning|Important):\s*(.+)$/gim, (match, type, text) => {
      const typeColors = getBlockTypeColors();
      const colorClass = typeColors[type] || typeColors['Note'];
      const labelSize = preview ? 'text-xs' : 'text-sm';
      const textSize = preview ? 'text-sm' : '';
      
      return `<blockquote class="border-l-4 ${colorClass} ${spacing.blockquote}">
        <div class="flex items-start gap-2">
          <strong class="font-semibold ${labelSize} uppercase tracking-wide">${type}:</strong>
          <span class="flex-1 ${textSize}">${text}</span>
        </div>
      </blockquote>`;
    })
    
    // Special handling for ### blocks (3 hashes) - convert to styled blockquotes
    .replace(/^### (Fun Fact|Caution|Note|Tip|Warning|Important):\s*(.+)$/gim, (match, type, text) => {
      const typeColors = getBlockTypeColors();
      const colorClass = typeColors[type] || typeColors['Note'];
      const labelSize = preview ? 'text-xs' : 'text-sm';
      const textSize = preview ? 'text-sm' : '';
      
      return `<blockquote class="border-l-4 ${colorClass} ${spacing.blockquote}">
        <div class="flex items-start gap-2">
          <strong class="font-semibold ${labelSize} uppercase tracking-wide">${type}:</strong>
          <span class="flex-1 ${textSize}">${text}</span>
        </div>
      </blockquote>`;
    })
    
    // Regular #### headings (4 hashes) that don't match the special pattern
    .replace(/^#### ((?!(?:Fun Fact|Caution|Note|Tip|Warning|Important):).*)$/gim, `<h4 class="${spacing.h3}">$1</h4>`)
    
    // Regular ### headings that don't match the special pattern
    .replace(/^### ((?!(?:Fun Fact|Caution|Note|Tip|Warning|Important):).*)$/gim, `<h3 class="${spacing.h3}">$1</h3>`)
    
    // Text formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Lists
    .replace(/^\* (.+)$/gm, `<li class="${spacing.listItem}">$1</li>`)
    .replace(/^- (.+)$/gm, `<li class="${spacing.listItem}">$1</li>`)
    .replace(/(<li>.*?<\/li>\s*)+/gm, `<ul class="${spacing.list}">$&</ul>`)
    
    // Paragraphs - split by double newlines and wrap non-HTML content
    .split('\n\n')
    .map(para => {
      para = para.trim();
      if (para && !para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('<li') && !para.startsWith('<blockquote')) {
        return `<p class="${spacing.paragraph}">${para}</p>`;
      }
      return para;
    })
    .join('\n');
};

/**
 * Get color classes for different block types
 */
const getBlockTypeColors = (): Record<string, string> => ({
  'Fun Fact': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  'Caution': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  'Warning': 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  'Note': 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
  'Tip': 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  'Important': 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200'
});

/**
 * Get a plain text preview of content with specified max length
 */
export const getContentPreview = (content: string, maxLength: number = 200): string => {
  const plainText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[#*_`]/g, '') // Remove markdown symbols
    .replace(/^\s*####?\s*(Fun Fact|Caution|Note|Tip|Warning|Important):\s*/gim, '') // Remove special block prefixes
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
};

/**
 * Format content specifically for preview mode (smaller spacing, truncation)
 */
export const formatBlogContentPreview = (content: string, maxLength?: number): string => {
  let formattedContent = formatBlogContent(content, { preview: true });
  
  if (maxLength) {
    // For previews, we might want to truncate the HTML content too
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (textContent.length > maxLength) {
      // If content is too long, show the plain text preview instead
      return `<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">${getContentPreview(content, maxLength)}</p>`;
    }
  }
  
  return formattedContent;
};

/**
 * Validate if content contains special formatting blocks
 */
export const hasSpecialBlocks = (content: string): boolean => {
  return /^####?\s*(Fun Fact|Caution|Note|Tip|Warning|Important):/gim.test(content);
};

/**
 * Extract all special blocks from content
 */
export const extractSpecialBlocks = (content: string): Array<{ type: string; text: string }> => {
  const blocks: Array<{ type: string; text: string }> = [];
  const regex = /^####?\s*(Fun Fact|Caution|Note|Tip|Warning|Important):\s*(.+)$/gim;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      type: match[1],
      text: match[2]
    });
  }
  
  return blocks;
};
