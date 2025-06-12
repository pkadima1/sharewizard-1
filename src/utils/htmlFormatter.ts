/**
 * HTML Formatting Utilities for Longform Content
 * 
 * Provides professional HTML formatting with modern styling and typography
 * for better UX/UI when copying content to clipboard
 */

import { LongformContent } from '@/hooks/useLongformContent';

/**
 * Convert markdown content to beautifully formatted HTML with professional styling
 */
export const convertMarkdownToStyledHTML = (markdown: string, includeCSS: boolean = true): string => {
  // Enhanced markdown to HTML conversion with comprehensive formatting
  let htmlContent = markdown
    // Convert headers with professional hierarchy
    .replace(/^# (.*$)/gim, '<h1 class="content-h1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="content-h2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="content-h3">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="content-h4">$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5 class="content-h5">$1</h5>')
    
    // Convert text formatting with semantic emphasis
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="content-bold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="content-italic">$1</em>')
    .replace(/~~(.*?)~~/gim, '<del class="content-strikethrough">$1</del>')
    .replace(/`(.*?)`/gim, '<code class="content-code">$1</code>')
    
    // Convert links with enhanced styling
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="content-link" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Convert blockquotes with styling
    .replace(/^> (.+)$/gim, '<blockquote class="content-blockquote">$1</blockquote>')
    
    // Convert lists with proper structure
    .replace(/^\* (.+)$/gim, '<li class="content-li">$1</li>')
    .replace(/^(\d+)\. (.+)$/gim, '<li class="content-li-numbered">$2</li>')
    
    // Convert line breaks and paragraphs
    .replace(/\n\n/gim, '</p><p class="content-paragraph">')
    .replace(/\n/gim, '<br>');

  // Wrap orphaned list items in proper ul/ol tags
  htmlContent = htmlContent
    .replace(/(<li class="content-li">.*?<\/li>)/gims, '<ul class="content-ul">$1</ul>')
    .replace(/(<li class="content-li-numbered">.*?<\/li>)/gims, '<ol class="content-ol">$1</ol>');

  // Wrap content in paragraphs if it doesn't start with a block element
  if (!htmlContent.match(/^<(h[1-6]|div|p|ul|ol|blockquote)/)) {
    htmlContent = `<p class="content-paragraph">${htmlContent}</p>`;
  }

  // Add CSS if requested
  if (includeCSS) {
    const css = getContentCSS();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formatted Content</title>
    <style>${css}</style>
</head>
<body>
    <div class="content-container">
        ${htmlContent}
    </div>
</body>
</html>`;
  }

  return htmlContent;
};

/**
 * Create a complete formatted HTML document with metadata and styling
 */
export const createFormattedHTMLDocument = (content: LongformContent): string => {
  const formattedContent = convertMarkdownToStyledHTML(content.content, false);
  const css = getContentCSS();
  
  // Format metadata
  const metadata = content.metadata;
  const inputs = content.inputs;
  
  const createdDate = metadata.generatedAt && metadata.generatedAt.toDate 
    ? metadata.generatedAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${inputs.topic}</title>
    <meta name="description" content="${metadata.metaDescription || `Professional content about ${inputs.topic}`}">
    <meta name="keywords" content="${inputs.keywords.join(', ')}">
    <meta name="author" content="EngagePerfect AI">
    <style>${css}</style>
</head>
<body>
    <div class="document-container">
        <!-- Document Header -->
        <header class="document-header">
            <h1 class="document-title">${inputs.topic}</h1>
            <div class="document-meta">
                <span class="meta-item">📊 ${metadata.actualWordCount} words</span>
                <span class="meta-item">⏱️ ${metadata.estimatedReadingTime} min read</span>
                <span class="meta-item">📅 ${createdDate}</span>
                ${metadata.readingLevel ? `<span class="meta-item">🎯 ${metadata.readingLevel} level</span>` : ''}
            </div>
            ${inputs.keywords.length > 0 ? `
            <div class="keywords-section">
                <span class="keywords-label">Keywords:</span>
                ${inputs.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
            </div>` : ''}
        </header>

        <!-- Main Content -->
        <main class="content-main">
            ${formattedContent}
        </main>

        <!-- Document Footer -->
        <footer class="document-footer">
            <div class="footer-content">
                <div class="generated-info">
                    <p>Generated with <strong>EngagePerfect AI</strong></p>
                    <p class="version-info">Content v${metadata.version} • ${inputs.contentType} • ${inputs.contentTone} tone</p>
                </div>
                <div class="content-stats">
                    <div class="stat-item">
                        <span class="stat-label">Target Audience:</span>
                        <span class="stat-value">${inputs.audience}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Industry:</span>
                        <span class="stat-value">${inputs.industry}</span>
                    </div>
                    ${metadata.contentPersonality ? `
                    <div class="stat-item">
                        <span class="stat-label">Writing Style:</span>
                        <span class="stat-value">${metadata.contentPersonality}</span>
                    </div>` : ''}
                </div>
            </div>
        </footer>
    </div>
</body>
</html>`;
};

/**
 * Generate professional CSS styling for formatted content
 */
const getContentCSS = (): string => {
  return `
    /* Reset and base styles */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.7;
        color: #2c3e50;
        background-color: #ffffff;
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    /* Document container */
    .document-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
        background: white;
        box-shadow: 0 0 30px rgba(0,0,0,0.1);
        border-radius: 8px;
    }

    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Document header */
    .document-header {
        text-align: center;
        border-bottom: 3px solid #3498db;
        padding-bottom: 30px;
        margin-bottom: 40px;
    }

    .document-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 15px;
        line-height: 1.2;
    }

    .document-meta {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
    }

    .meta-item {
        background: #ecf0f1;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        color: #34495e;
        font-weight: 500;
    }

    .keywords-section {
        margin-top: 20px;
    }

    .keywords-label {
        font-weight: 600;
        color: #7f8c8d;
        margin-right: 10px;
    }

    .keyword-tag {
        display: inline-block;
        background: #3498db;
        color: white;
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        margin: 0 5px 5px 0;
        font-weight: 500;
    }

    /* Typography styles */
    .content-h1 {
        font-size: 2.2rem;
        font-weight: 700;
        color: #2c3e50;
        margin: 40px 0 20px 0;
        line-height: 1.3;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
    }

    .content-h2 {
        font-size: 1.8rem;
        font-weight: 600;
        color: #34495e;
        margin: 35px 0 18px 0;
        line-height: 1.3;
    }

    .content-h3 {
        font-size: 1.4rem;
        font-weight: 600;
        color: #34495e;
        margin: 30px 0 15px 0;
        line-height: 1.4;
    }

    .content-h4 {
        font-size: 1.2rem;
        font-weight: 600;
        color: #34495e;
        margin: 25px 0 12px 0;
        line-height: 1.4;
    }

    .content-h5 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #34495e;
        margin: 20px 0 10px 0;
        line-height: 1.4;
    }

    .content-paragraph {
        margin: 0 0 20px 0;
        text-align: justify;
        color: #2c3e50;
    }

    .content-bold {
        font-weight: 700;
        color: #2c3e50;
    }

    .content-italic {
        font-style: italic;
        color: #34495e;
    }

    .content-strikethrough {
        text-decoration: line-through;
        color: #7f8c8d;
    }

    .content-code {
        background: #f8f9fa;
        color: #e74c3c;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        border: 1px solid #e9ecef;
    }

    /* Links */
    .content-link {
        color: #3498db;
        text-decoration: none;
        border-bottom: 1px solid #3498db;
        transition: all 0.3s ease;
        font-weight: 500;
    }

    .content-link:hover {
        color: #2980b9;
        border-bottom-color: #2980b9;
        background-color: #ebf3fd;
        padding: 2px 4px;
        border-radius: 3px;
    }

    /* Blockquotes */
    .content-blockquote {
        border-left: 4px solid #3498db;
        background: #f8f9fa;
        margin: 25px 0;
        padding: 20px 25px;
        font-style: italic;
        color: #34495e;
        border-radius: 0 8px 8px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* Lists */
    .content-ul, .content-ol {
        margin: 20px 0;
        padding-left: 30px;
    }

    .content-li, .content-li-numbered {
        margin: 8px 0;
        color: #2c3e50;
        line-height: 1.6;
    }

    .content-ul .content-li {
        list-style-type: disc;
    }

    .content-ol .content-li-numbered {
        list-style-type: decimal;
    }

    /* Content main area */
    .content-main {
        margin-bottom: 50px;
    }

    /* Document footer */
    .document-footer {
        border-top: 2px solid #ecf0f1;
        padding-top: 30px;
        margin-top: 50px;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 30px;
    }

    .footer-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        align-items: start;
    }

    .generated-info {
        text-align: left;
    }

    .generated-info p {
        margin: 5px 0;
        color: #34495e;
    }

    .version-info {
        font-size: 0.9rem;
        color: #7f8c8d;
    }

    .content-stats {
        text-align: right;
    }

    .stat-item {
        margin: 8px 0;
        font-size: 0.9rem;
    }

    .stat-label {
        font-weight: 600;
        color: #7f8c8d;
    }

    .stat-value {
        color: #34495e;
        margin-left: 8px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .document-container {
            padding: 20px 15px;
            margin: 10px;
        }

        .document-title {
            font-size: 2rem;
        }

        .content-h1 {
            font-size: 1.8rem;
        }

        .content-h2 {
            font-size: 1.5rem;
        }

        .document-meta {
            flex-direction: column;
            align-items: center;
        }

        .footer-content {
            grid-template-columns: 1fr;
            gap: 20px;
        }

        .content-stats {
            text-align: left;
        }
    }

    /* Print styles */
    @media print {
        .document-container {
            box-shadow: none;
            max-width: none;
            margin: 0;
            padding: 20px;
        }

        .content-link {
            color: #2c3e50;
            text-decoration: underline;
        }

        .keyword-tag {
            background: #ecf0f1;
            color: #2c3e50;
        }
    }

    /* Accessibility improvements */
    .content-link:focus {
        outline: 2px solid #3498db;
        outline-offset: 2px;
    }

    /* Enhanced readability */
    .content-paragraph:first-letter {
        font-size: 1.1em;
        font-weight: 600;
    }

    /* Smooth scrolling for anchor links */
    html {
        scroll-behavior: smooth;
    }
  `;
};

/**
 * Create a copyable text with enhanced formatting for clipboard
 */
export const createCopyableHTML = (content: LongformContent): string => {
  return createFormattedHTMLDocument(content);
};

/**
 * Create a simple inline HTML version for basic copy needs
 */
export const createInlineHTML = (markdown: string): string => {
  return convertMarkdownToStyledHTML(markdown, false);
};
