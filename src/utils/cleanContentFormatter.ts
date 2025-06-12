/**
 * Clean Content Formatter Utility
 * 
 * Creates beautifully formatted, professional content for copying to clipboard
 * that works perfectly in Google Docs, Word, and other professional editors.
 * 
 * This utility AVOIDS inline styles and focuses on clean, semantic formatting.
 */

import { LongformContent } from '@/hooks/useLongformContent';

/**
 * Create a clean, professional plain text version for copying
 * Perfect for Google Docs, Word, and other professional editors
 */
export const createCleanTextForCopy = (content: LongformContent): string => {
  const markdown = content.content;
  
  // Remove any HTML/JSON-LD schema at the beginning
  let cleanMarkdown = markdown.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  cleanMarkdown = cleanMarkdown.replace(/```html/g, '');
  cleanMarkdown = cleanMarkdown.replace(/```/g, '');
  cleanMarkdown = cleanMarkdown.replace(/<!--[\s\S]*?-->/g, '');
  
  // Convert markdown to clean, readable text with proper formatting
  const cleanText = cleanMarkdown
    // Convert headers to clean text with spacing
    .replace(/^# (.*$)/gim, '$1\n' + '='.repeat(50) + '\n')
    .replace(/^## (.*$)/gim, '\n$1\n' + '-'.repeat(30) + '\n')
    .replace(/^### (.*$)/gim, '\n$1\n')
    .replace(/^#### (.*$)/gim, '\n$1')
    
    // Convert bold and italic to clean text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    
    // Convert links to readable format
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    
    // Convert lists to clean format
    .replace(/^\* (.+)$/gm, '• $1')
    .replace(/^(\d+)\. (.+)$/gm, '$1. $2')
    
    // Convert blockquotes
    .replace(/^> (.+)$/gm, '"$1"')
    
    // Clean up extra whitespace but preserve intentional spacing
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
  
  // Add professional header
  const header = `${content.inputs.topic}\n${'='.repeat(content.inputs.topic.length)}\n\nFor: ${content.inputs.audience} | Industry: ${content.inputs.industry}\nTone: ${content.inputs.contentTone} | ${content.metadata.actualWordCount.toLocaleString()} words | ${content.metadata.estimatedReadingTime} min read\n\n`;
  
  return header + cleanText;
};

/**
 * Create beautifully formatted HTML for clipboard that renders well in all editors
 * Uses semantic HTML without inline styles for maximum compatibility
 */
export const createCleanHTMLForCopy = (content: LongformContent): string => {
  const markdown = content.content;
  
  // Remove schema and code blocks
  let cleanMarkdown = markdown.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  cleanMarkdown = cleanMarkdown.replace(/```html/g, '');
  cleanMarkdown = cleanMarkdown.replace(/```/g, '');
  cleanMarkdown = cleanMarkdown.replace(/<!--[\s\S]*?-->/g, '');
  
  // Convert markdown to clean HTML
  const htmlContent = cleanMarkdown
    // Convert headers to semantic HTML
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    
    // Convert text formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Convert blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    
    // Convert lists
    .replace(/^(\* .+(?:\n\* .+)*)/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\* /, '<li>') + '</li>').join('\n');
      return `<ul>\n${items}\n</ul>`;
    })
    .replace(/^(\d+\. .+(?:\n\d+\. .+)*)/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\d+\. /, '<li>') + '</li>').join('\n');
      return `<ol>\n${items}\n</ol>`;
    })
    
    // Convert paragraphs
    .split('\n\n')
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<ol') || paragraph.startsWith('<blockquote')) {
        return paragraph;
      }
      return `<p>${paragraph}</p>`;
    })
    .filter(p => p)
    .join('\n\n');
  
  // Create complete HTML document with clean styling
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${content.inputs.topic}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1 { font-size: 2rem; margin-bottom: 1.5rem; border-bottom: 2px solid #007acc; padding-bottom: 0.5rem; }
        h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #2c3e50; }
        h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #34495e; }
        h4 { font-size: 1.1rem; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #5d6d7e; }
        p { margin-bottom: 1.2rem; }
        ul, ol { margin: 1rem 0; padding-left: 2rem; }
        li { margin-bottom: 0.5rem; }
        blockquote { border-left: 4px solid #007acc; margin: 1.5rem 0; padding: 1rem 1.5rem; background: #f8f9fa; }
        a { color: #007acc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        strong { font-weight: 600; }
        .header { border-bottom: 1px solid #ddd; margin-bottom: 2rem; padding-bottom: 1rem; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${content.inputs.topic}</h1>
        <div class="meta">
            For: ${content.inputs.audience} | Industry: ${content.inputs.industry}<br>
            Tone: ${content.inputs.contentTone} | ${content.metadata.actualWordCount.toLocaleString()} words | ${content.metadata.estimatedReadingTime} min read
        </div>
    </div>
    
    ${htmlContent}
</body>
</html>`;
};

/**
 * Create minimal HTML for inline pasting (no document structure)
 * Perfect for pasting into web editors, CMS systems, etc.
 */
export const createInlineHTMLForCopy = (content: LongformContent): string => {
  const markdown = content.content;
  
  // Remove schema and code blocks
  let cleanMarkdown = markdown.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  cleanMarkdown = cleanMarkdown.replace(/```html/g, '');
  cleanMarkdown = cleanMarkdown.replace(/```/g, '');
  cleanMarkdown = cleanMarkdown.replace(/<!--[\s\S]*?-->/g, '');
  
  // Convert to clean HTML without document structure
  return cleanMarkdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^(\* .+(?:\n\* .+)*)/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\* /, '<li>') + '</li>').join('\n');
      return `<ul>\n${items}\n</ul>`;
    })
    .replace(/^(\d+\. .+(?:\n\d+\. .+)*)/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\d+\. /, '<li>') + '</li>').join('\n');
      return `<ol>\n${items}\n</ol>`;
    })
    .split('\n\n')
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<ol') || paragraph.startsWith('<blockquote')) {
        return paragraph;
      }
      return `<p>${paragraph}</p>`;
    })
    .filter(p => p)
    .join('\n\n');
};