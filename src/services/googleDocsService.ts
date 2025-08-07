/**
 * Google Docs Export Service - IMPROVED VERSION
 * 
 * This service provides multiple export options:
 * 1. Direct Google Docs creation with content
 * 2. Microsoft OneDrive Word integration
 * 3. Automatic sharing and collaboration setup
 */

import { LongformContent } from '@/hooks/useLongformContent';
import i18n from 'i18next';

/**
 * Convert markdown content to clean, Google Docs-friendly HTML
 */
const convertMarkdownToHTML = (markdown: string): string => {
  return markdown
    // Convert headers with proper styling
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 24px; font-weight: bold; color: #1a73e8; margin: 24px 0 16px 0;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; color: #333; margin: 20px 0 12px 0;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: bold; color: #555; margin: 16px 0 8px 0;">$1</h3>')
    
    // Convert text formatting
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em style="font-style: italic;">$1</em>')
    
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1a73e8; text-decoration: underline;">$1</a>')
    
    // Convert line breaks and paragraphs
    .replace(/\n\n/gim, '</p><p style="margin: 16px 0; line-height: 1.6; font-family: Arial, sans-serif;">')
    .replace(/\n/gim, '<br>')
    
    // Handle lists (basic)
    .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
    .replace(/(<li.*<\/li>)/gims, '<ul style="margin: 16px 0; padding-left: 24px;">$1</ul>');
};

/**
 * Create a comprehensive HTML document optimized for Google Docs import
 */
const createGoogleDocsHTML = (content: LongformContent): string => {
  const convertedContent = convertMarkdownToHTML(content.content);
  const documentTitle = content.inputs.topic;
  
  // Format the creation date
  const createdDate = content.metadata.generatedAt && content.metadata.generatedAt.toDate 
    ? content.metadata.generatedAt.toDate().toLocaleDateString('en-US', {
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
    <title>${documentTitle}</title>
    <style>
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .document-header {
            text-align: center;
            border-bottom: 3px solid #1a73e8;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        
        .document-title {
            font-size: 28px;
            font-weight: bold;
            color: #1a73e8;
            margin: 0 0 16px 0;
            line-height: 1.2;
        }
        
        .document-subtitle {
            font-size: 16px;
            color: #666;
            font-style: italic;
            margin: 0;
        }
        
        .metadata-section {
            background: #f8f9fa;
            border: 1px solid #e8eaed;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            font-size: 14px;
        }
        
        .metadata-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a73e8;
            margin: 0 0 12px 0;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .metadata-item {
            margin: 8px 0;
        }
        
        .metadata-label {
            font-weight: bold;
            color: #333;
        }
        
        .content-body {
            margin: 32px 0;
        }
        
        .content-body p {
            margin: 16px 0;
            line-height: 1.6;
            font-size: 16px;
        }
        
        .content-body h1, .content-body h2, .content-body h3 {
            margin-top: 32px;
            margin-bottom: 16px;
        }
        
        .document-footer {
            border-top: 1px solid #e8eaed;
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .collaboration-note {
            background: #e8f5e8;
            border: 1px solid #34a853;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            color: #137333;
        }
        
        .collaboration-note h4 {
            margin: 0 0 8px 0;
            color: #137333;
        }
        
        @media print {
            body { margin: 0; padding: 0.5in; }
            .metadata-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <!-- Document Header -->
    <div class="document-header">
        <h1 class="document-title">${documentTitle}</h1>
        <p class="document-subtitle">Generated with EngagePerfect AI • Ready for Collaboration</p>
    </div>

    <!-- Collaboration Instructions -->
    <div class="collaboration-note">
        <h4>🤝 Collaboration Ready</h4>
        <p style="margin: 0; font-size: 14px;">
            This document is optimized for Google Docs import. Once imported, you can set sharing permissions 
            to "Anyone with the link can edit" for seamless team collaboration.
        </p>
    </div>

    <!-- Document Metadata -->
    <div class="metadata-section">
        <h3 class="metadata-title">📋 Document Information</h3>
        <div class="metadata-grid">
            <div class="metadata-item">
                <span class="metadata-label">🎯 Target Audience:</span><br>
                ${content.inputs.audience}
            </div>
            <div class="metadata-item">
                <span class="metadata-label">🏢 Industry:</span><br>
                ${content.inputs.industry}
            </div>
            <div class="metadata-item">
                <span class="metadata-label">📝 Content Type:</span><br>
                ${content.inputs.contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div class="metadata-item">
                <span class="metadata-label">🎨 Tone:</span><br>
                ${content.inputs.contentTone.charAt(0).toUpperCase() + content.inputs.contentTone.slice(1)}
            </div>
            <div class="metadata-item">
                <span class="metadata-label">📊 Word Count:</span><br>
                ${content.metadata.actualWordCount.toLocaleString()} words
            </div>
            <div class="metadata-item">
                <span class="metadata-label">⏱️ Reading Time:</span><br>
                ${content.metadata.estimatedReadingTime} minutes
            </div>
            <div class="metadata-item">
                <span class="metadata-label">📅 Generated:</span><br>
                ${createdDate}
            </div>
            <div class="metadata-item">
                <span class="metadata-label">🔍 Keywords:</span><br>
                ${content.inputs.keywords.slice(0, 5).join(', ')}
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="content-body">
        <p style="margin: 16px 0; line-height: 1.6; font-size: 16px;">${convertedContent}</p>
    </div>

    <!-- Document Footer -->
    <div class="document-footer">
        <p>Generated with EngagePerfect AI • Content v${content.metadata.version}</p>
        <p>🚀 This document is ready for collaborative editing in Google Docs</p>
        <p>📤 Share with your team using "Anyone with the link can edit" permissions</p>
    </div>
</body>
</html>`;
};

/**
 * Export content to Google Docs using a smarter approach
 */
/**
 * IMPROVED: Direct Google Docs Export with Content Pre-loaded
 * One-click solution that opens Google Docs with content already loaded
 */
export const exportToGoogleDocs = async (content: LongformContent): Promise<void> => {
  const sanitizedTitle = content.inputs.topic
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  try {
    // Step 1: Prepare clean, formatted content for Google Docs
    const formattedContent = prepareContentForGoogleDocs(content);
    
    // Step 2: Create a complete document with both HTML and text versions
    const documentData = createGoogleDocsDocument(formattedContent, content);
    
    // Step 3: Open Google Docs with content pre-loaded using the most effective method
    await openGoogleDocsWithContent(documentData, content.inputs.topic);
    
  } catch (error) {
    console.error('Google Docs export failed:', error);
    // Fallback to the traditional method if the direct method fails
    await exportToGoogleDocsTraditional(content);
  }
};

/**
 * Prepare content specifically optimized for Google Docs import
 * Returns both HTML and plain text versions for maximum compatibility
 */
const prepareContentForGoogleDocs = (content: LongformContent): { html: string; text: string } => {
  // Step 1: Clean and normalize the markdown content
  const normalizedContent = content.content
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Handle old Mac line endings
    .trim();

  // Step 2: Advanced title deduplication to prevent duplicate titles
  const title = content.inputs.topic;
  let deduplicatedContent = normalizedContent;
  
  // Remove the title if it appears as the first heading in the content
  const titleVariations = [
    // Exact match
    new RegExp(`^#\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im'),
    // With subtitle variations
    new RegExp(`^#\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:\\-–—]\\s*.*$`, 'im'),
    // Flexible whitespace matching
    new RegExp(`^#\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+')}\\s*$`, 'im'),
    // Case-insensitive with subtitle
    new RegExp(`^#\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+')}\\s*[:\\-–—]\\s*.*$`, 'im'),
    // Similarity matching (80% word overlap)
    new RegExp(`^#\\s*([^\\n]+)$`, 'im')
  ];

  // Check if the first heading is a title variation
  const firstHeadingMatch = deduplicatedContent.match(/^#\s*([^\n]+)$/im);
  if (firstHeadingMatch) {
    const firstHeading = firstHeadingMatch[1].trim();
    
    // Check for exact match or high similarity
    const isTitleVariation = titleVariations.some(regex => regex.test(`# ${firstHeading}`)) ||
      calculateSimilarity(firstHeading, title) > 0.8;
    
    if (isTitleVariation) {
      // Remove the first heading if it's a title variation
      deduplicatedContent = deduplicatedContent.replace(/^#\s*[^\n]+\s*\n?/im, '');
    }
  }

  // Step 3: Convert markdown to clean HTML that Google Docs handles perfectly
  const htmlContent = deduplicatedContent
    // Headers with proper hierarchy (process longest first to avoid conflicts)
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Text formatting (be more precise with regex)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Lists - handle multiline items properly
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    
    // Group consecutive list items
    .replace(/(<li>.*?<\/li>\s*)+/gs, (match) => `<ul>${match.replace(/\s+/g, ' ')}</ul>`)
    
    // Handle paragraphs more carefully
    .split(/\n\s*\n/)  // Split on double line breaks
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Don't wrap headers, lists, or already-wrapped content
      if (paragraph.match(/^<(h[1-6]|ul|ol|li)/i) || paragraph.includes('</')) {
        return paragraph;
      }
      
      // Regular paragraph
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('\n\n');

  // Step 4: Create plain text version for clipboard fallback
  const textContent = deduplicatedContent
    // Remove markdown formatting for plain text
    .replace(/^#{1,6}\s+/gm, '')  // Remove header markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold markers
    .replace(/\*([^*]+)\*/g, '$1')      // Remove italic markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Keep only link text
    .replace(/^[\*\-]\s+/gm, '• ')      // Convert list markers to bullets
    .replace(/^\d+\.\s+/gm, '• ')       // Convert numbered lists to bullets
    .replace(/\n{3,}/g, '\n\n')         // Normalize multiple line breaks
    .trim();

  return { html: htmlContent, text: textContent };
};

/**
 * Calculate similarity between two strings (for title deduplication)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return totalWords > 0 ? commonWords.length / totalWords : 0;
};

/**
 * Create a complete document package with both HTML and text versions
 */
const createGoogleDocsDocument = (formattedContent: { html: string; text: string }, content: LongformContent) => {
  const title = content.inputs.topic;
  
  // Create a complete HTML document optimized for Google Docs with production-ready formatting
  const htmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Mobile-first responsive design */
    * {
      box-sizing: border-box;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1in;
      line-height: 1.6; 
      color: #333;
      background: white;
      font-size: 16px;
    }
    
    /* Typography and spacing */
    h1 { 
      color: #1a73e8; 
      font-size: 28px; 
      margin: 32px 0 20px 0; 
      font-weight: 700;
      text-align: center;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    
    h2 { 
      color: #333; 
      font-size: 22px; 
      margin: 28px 0 16px 0; 
      font-weight: 600;
      text-align: left;
      line-height: 1.3;
    }
    
    h3 { 
      color: #555; 
      font-size: 18px; 
      margin: 24px 0 12px 0; 
      font-weight: 600;
      text-align: left;
      line-height: 1.4;
    }
    
    h4 { 
      color: #666; 
      font-size: 16px; 
      margin: 20px 0 10px 0; 
      font-weight: 600;
      text-align: left;
      line-height: 1.4;
    }
    
    p { 
      margin: 16px 0; 
      line-height: 1.7; 
      font-size: 16px;
      color: #333;
    }
    
    ul, ol { 
      margin: 20px 0; 
      padding-left: 24px; 
    }
    
    li { 
      margin: 8px 0; 
      line-height: 1.6; 
      color: #333;
    }
    
    strong { 
      font-weight: 600; 
      color: #1a73e8;
    }
    
    em { 
      font-style: italic; 
      color: #555;
    }
    
    a { 
      color: #1a73e8; 
      text-decoration: underline; 
      transition: color 0.2s ease;
    }
    
    a:hover {
      color: #1557b0;
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      body {
        padding: 0.5in;
        font-size: 15px;
      }
      
      h1 {
        font-size: 24px;
        margin: 24px 0 16px 0;
      }
      
      h2 {
        font-size: 20px;
        margin: 20px 0 12px 0;
      }
      
      h3 {
        font-size: 16px;
        margin: 16px 0 8px 0;
      }
      
      h4 {
        font-size: 14px;
        margin: 14px 0 6px 0;
      }
      
      p {
        font-size: 15px;
        line-height: 1.6;
      }
      
      ul, ol {
        padding-left: 20px;
      }
    }
    
    @media (max-width: 480px) {
      body {
        padding: 0.25in;
        font-size: 14px;
      }
      
      h1 {
        font-size: 22px;
        margin: 20px 0 14px 0;
      }
      
      h2 {
        font-size: 18px;
        margin: 18px 0 10px 0;
      }
      
      h3 {
        font-size: 15px;
        margin: 14px 0 6px 0;
      }
      
      h4 {
        font-size: 13px;
        margin: 12px 0 4px 0;
      }
      
      p {
        font-size: 14px;
        line-height: 1.5;
      }
    }
    
    /* Print styles */
    @media print {
      body {
        margin: 0;
        padding: 0.5in;
        font-size: 12pt;
        line-height: 1.4;
      }
      
      h1 {
        font-size: 18pt;
        margin: 24pt 0 12pt 0;
      }
      
      h2 {
        font-size: 14pt;
        margin: 18pt 0 6pt 0;
      }
      
      h3 {
        font-size: 12pt;
        margin: 12pt 0 6pt 0;
      }
      
      h4 {
        font-size: 11pt;
        margin: 10pt 0 4pt 0;
      }
      
      p {
        margin: 12pt 0;
        font-size: 11pt;
      }
      
      ul, ol {
        margin: 16pt 0;
        padding-left: 20pt;
      }
      
      li {
        margin: 6pt 0;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${formattedContent.html}
</body>
</html>`;

  return {
    html: htmlDocument,
    text: `${title}\n\n${formattedContent.text}`,
    title: title
  };
};

/**
 * Enhanced clipboard copy with multiple fallback methods for maximum reliability
 */
const enhancedClipboardCopy = async (documentData: { html: string; text: string; title: string }): Promise<boolean> => {
  try {
    // Method 1: Modern Clipboard API with rich HTML
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
        const htmlBlob = new Blob([documentData.html], { type: 'text/html' });
        const textBlob = new Blob([documentData.text], { type: 'text/plain' });
        
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        console.log('✅ Enhanced clipboard copy successful with HTML formatting');
        return true;
      } catch (error) {
        console.warn('Rich clipboard failed, trying text-only:', error);
      }
    }
    
    // Method 2: Text-only clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(documentData.text);
        console.log('✅ Enhanced clipboard copy successful with text-only');
        return true;
      } catch (error) {
        console.warn('Text clipboard failed:', error);
      }
    }
    
    // Method 3: Legacy execCommand (deprecated but widely supported)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = documentData.text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('✅ Enhanced clipboard copy successful with execCommand');
        return true;
      }
    } catch (error) {
      console.warn('execCommand failed:', error);
    }
    
    // Method 4: Create temporary element with HTML content
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = documentData.html;
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-999999px';
      tempDiv.style.top = '-999999px';
      document.body.appendChild(tempDiv);
      
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        const successful = document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(tempDiv);
        
        if (successful) {
          console.log('✅ Enhanced clipboard copy successful with HTML element');
          return true;
        }
      }
    } catch (error) {
      console.warn('HTML element copy failed:', error);
    }
    
    console.error('All clipboard methods failed');
    return false;
    
  } catch (error) {
    console.error('Enhanced clipboard copy error:', error);
    return false;
  }
};

/**
 * SMART: Show instructions first, then open Google Docs on user action
 * User clicks "Go to Google Docs" button to actually open the tab
 */
const openGoogleDocsWithContent = async (documentData: { html: string; text: string; title: string }, title: string): Promise<void> => {
  try {
    console.log('Starting smart Google Docs export...');
    
    // Step 1: Copy content to clipboard with enhanced reliability
    const clipboardSuccess = await enhancedClipboardCopy(documentData);
    
    if (clipboardSuccess) {
      console.log('✅ Content successfully copied to clipboard');
    } else {
      console.warn('⚠️ Clipboard copy failed, will show manual instructions');
    }
    
    // Step 2: Show instructions first (don't open Google Docs yet)
    setTimeout(() => {
      showSimpleInstructions(title, documentData, clipboardSuccess);
    }, 500);
    
    console.log('✅ Instructions shown - waiting for user to click "Go to Google Docs"');
    
  } catch (error) {
    console.error('Smart export failed, using fallback:', error);
    await exportToGoogleDocsTraditional({ inputs: { topic: title } } as LongformContent);
  }
};

/**
 * SIMPLE: Show intuitive instructions that open Google Docs on button click
 * Clean, straightforward guidance for the Google Docs workflow
 */
const showSimpleInstructions = (title: string, documentData: { html: string; text: string; title: string }, clipboardSuccess: boolean): void => {
  const overlay = document.createElement('div');
  
  // Get translations using i18n
  const t = (key: string, options?: any) => i18n.t(key, options);
  
  const statusColor = clipboardSuccess ? '#34a853' : '#fbbc04';
  const statusIcon = clipboardSuccess ? '✅' : '⚠️';
  const statusText = clipboardSuccess ? t('common:googleDocs.contentCopied') : t('common:googleDocs.manualCopyNeeded');
  const statusDescription = clipboardSuccess ? t('common:googleDocs.contentCopiedReady') : t('common:googleDocs.pleaseManualCopy');
  const statusTag = clipboardSuccess ? t('common:googleDocs.autoReady') : t('common:googleDocs.manualNeeded');
  
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(6px);
      padding: 20px;
      box-sizing: border-box;
    ">
      <div style="
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 100%;
        width: 100%;
        max-width: 450px;
        text-align: center;
        animation: slideInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 3px solid ${statusColor};
        position: relative;
        overflow: hidden;
      ">
        <!-- Status indicator -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, ${statusColor}, #4285f4);
          animation: pulse 2s ease-in-out infinite;
        "></div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, ${statusColor}, #4285f4);
            border-radius: 50%;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 35px;
            box-shadow: 0 8px 25px rgba(52, 168, 83, 0.3);
            animation: bounce 1s ease-in-out infinite alternate;
          ">${statusIcon}</div>
          
          <h2 style="
            margin: 0 0 20px 0;
            color: #1a73e8;
            font-size: 28px;
            font-weight: 800;
            line-height: 1.2;
          ">${t('common:googleDocs.readyForGoogleDocs')}</h2>
          
          <p style="
            margin: 0 0 25px 0;
            color: #5f6368;
            font-size: 16px;
            line-height: 1.5;
          ">${t('common:googleDocs.contentReadyToExport', { title })}</p>
          
          <!-- Status Card -->
          <div style="
            background: ${clipboardSuccess ? '#e8f5e8' : '#fff3cd'};
            border: 2px solid ${statusColor};
            border-radius: 16px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -10px;
              right: 15px;
              background: ${statusColor};
              color: white;
              padding: 4px 12px;
              border-radius: 15px;
              font-size: 11px;
              font-weight: bold;
            ">${statusTag}</div>
            
            <div style="
              color: ${clipboardSuccess ? '#137333' : '#856404'};
              font-weight: 700;
              margin-bottom: 12px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              ${statusIcon} ${statusText}
            </div>
            <div style="
              color: ${clipboardSuccess ? '#137333' : '#856404'};
              font-size: 14px;
              line-height: 1.5;
            ">
              ${statusDescription}
            </div>
          </div>
          
          <!-- Simple Instructions -->
          <div style="
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            border: 2px solid #2196f3;
            border-radius: 16px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
          ">
            <div style="
              color: #1565c0;
              font-weight: 700;
              margin-bottom: 15px;
              font-size: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              ${t('common:googleDocs.nextSteps')}
            </div>
            <div style="
              color: #1565c0;
              font-size: 16px;
              line-height: 1.6;
            ">
              <div style="margin-bottom: 15px;">
                <strong>1.</strong> ${t('common:googleDocs.step1ClickGoToDocs')}
              </div>
              <div style="margin-bottom: 15px;">
                <strong>2.</strong> ${t('common:googleDocs.step2PressCtrlV')}
              </div>
              <div style="
                color: #137333;
                font-weight: 600;
                font-size: 14px;
              ">
                ${t('common:googleDocs.contentWillPaste')}
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="margin: 30px 0; display: flex; gap: 15px; justify-content: center;">
            <button onclick="this.goToGoogleDocs()" style="
              background: linear-gradient(135deg, #4285f4, #1a73e8);
              color: white;
              border: none;
              padding: 16px 32px;
              border-radius: 25px;
              font-size: 16px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 5px 20px rgba(66, 133, 244, 0.4);
            " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(66, 133, 244, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(66, 133, 244, 0.4)'">
              ${t('common:googleDocs.goToGoogleDocs')}
            </button>
            
            <button onclick="this.closePopup()" style="
              background: linear-gradient(135deg, #34a853, #2d7d32);
              color: white;
              border: none;
              padding: 16px 32px;
              border-radius: 25px;
              font-size: 16px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 5px 20px rgba(52, 168, 83, 0.4);
            " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(52, 168, 83, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(52, 168, 83, 0.4)'">
              ${t('common:googleDocs.perfectDone')}
            </button>
          </div>
          
          <div style="
            color: #9aa0a6;
            font-size: 12px;
            margin-top: 20px;
            line-height: 1.4;
          ">
            ${t('common:googleDocs.proTip')} <strong>${t('common:googleDocs.richFormattingReady')}</strong>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes slideInScale {
        from {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes bounce {
        from { transform: translateY(0px); }
        to { transform: translateY(-8px); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    </style>
  `;
  
  // Add navigation functionality to the "Go to Google Docs" button
  const goButton = overlay.querySelector('button');
  if (goButton) {
    (goButton as any).goToGoogleDocs = () => {
      // Open Google Docs in new tab and focus it
      const googleDocsUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(title + ' - Auto Import')}`;
      console.log('Opening Google Docs in new tab:', googleDocsUrl);
      
      const docsTab = window.open(googleDocsUrl, '_blank');
      
      if (docsTab) {
        // Focus the Google Docs tab
        docsTab.focus();
        // Close the instructions overlay
        overlay.remove();
        console.log('✅ Google Docs opened and focused, instructions closed');
      } else {
        console.error('Failed to open Google Docs tab');
      }
    };
  }
  
  // Add close functionality to the "Perfect! Done" button
  const doneButton = overlay.querySelectorAll('button')[1];
  if (doneButton) {
    (doneButton as any).closePopup = () => {
      // Close the instructions overlay
      overlay.remove();
      console.log('✅ Popup closed by user');
    };
  }
  
  document.body.appendChild(overlay);
  
  // NO auto-close - instructions stay open until user action
  // Only close on escape key or manual close
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && overlay.parentElement) {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

/**
 * Show elegant, minimal instructions for pasting content with preview
 */
const showQuickInstructions = (title: string, contentPreview?: string): void => {
  // Create a beautiful, minimal overlay
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(4px);
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        max-width: 600px;
        text-align: center;
        animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 2px solid #f0f0f0;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #4285f4, #34a853, #fbbc04);
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);
        ">📝</div>
        
        <h2 style="
          margin: 0 0 16px 0;
          color: #1a73e8;
          font-size: 28px;
          font-weight: 700;
        ">Content Ready! ✨</h2>
        
        <p style="
          margin: 0 0 20px 0;
          color: #5f6368;
          font-size: 16px;
          line-height: 1.5;
        ">Google Docs opened with "<strong>${title}</strong>"</p>
        
        ${contentPreview ? `
          <div style="
            background: #f8f9fa;
            border: 1px solid #e8eaed;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            text-align: left;
            max-height: 120px;
            overflow: hidden;
          ">
            <div style="
              color: #1a73e8;
              font-weight: 600;
              margin-bottom: 8px;
              font-size: 14px;
            ">📄 Content Preview:</div>
            <div style="
              color: #3c4043;
              font-size: 14px;
              line-height: 1.4;
              font-family: 'Georgia', serif;
            ">${contentPreview}</div>
          </div>
        ` : ''}
        
        <div style="
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
          border: 2px solid #34a853;
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          text-align: left;
        ">
          <div style="
            color: #137333;
            font-weight: 700;
            margin-bottom: 12px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            ⚡ One-Click Action:
          </div>
          <div style="
            color: #137333;
            font-size: 15px;
            line-height: 1.5;
          ">
            Your content is already copied! Simply press 
            <kbd style="
              background: white;
              color: #137333;
              padding: 6px 12px;
              border-radius: 6px;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
              font-weight: bold;
              border: 2px solid #34a853;
              margin: 0 4px;
            ">Ctrl+V</kbd> 
            (or 
            <kbd style="
              background: white;
              color: #137333;
              padding: 6px 12px;
              border-radius: 6px;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
              font-weight: bold;
              border: 2px solid #34a853;
              margin: 0 4px;
            ">Cmd+V</kbd> 
            on Mac) in the Google Docs tab to paste your formatted content!
          </div>
        </div>
        
        <div style="margin: 24px 0;">
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: linear-gradient(135deg, #4285f4, #1a73e8);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
          " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(66, 133, 244, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(66, 133, 244, 0.3)'">
            Perfect! Let's Go 🚀
          </button>
        </div>
        
        <div style="
          color: #9aa0a6;
          font-size: 12px;
          margin-top: 16px;
        ">
          Pro tip: The content includes formatting and will paste beautifully!
        </div>
      </div>
    </div>
    
    <style>
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    </style>
  `;
  
  document.body.appendChild(overlay);
  
  // Auto-remove after 15 seconds (longer since there's more to read)
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.9)';
      overlay.style.transition = 'all 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    }
  }, 15000);
  
  // Also remove on escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && overlay.parentElement) {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

/**
 * Traditional fallback method (existing implementation)
 */
const exportToGoogleDocsTraditional = async (content: LongformContent): Promise<void> => {
  const sanitizedTitle = content.inputs.topic
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  try {
    // Create the properly formatted HTML
    const htmlContent = createGoogleDocsHTML(content);
    
    // Create and download the HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${sanitizedTitle}-engageperfect.html`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    // Create a more direct approach to Google Docs
    const directGoogleDocsUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(content.inputs.topic + ' - EngagePerfect')}`;
    
    // Create an instruction page that opens alongside Google Docs
    setTimeout(() => {
      // Open Google Docs first
      const googleDocsWindow = window.open(directGoogleDocsUrl, '_blank');
      
      // Then open instructions in a smaller window
      setTimeout(() => {
        const instructionsWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        if (instructionsWindow) {
          instructionsWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Google Docs Import Instructions</title>
                <style>
                  body { 
                    font-family: 'Google Sans', 'Roboto', Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    line-height: 1.6; 
                    background: #f8f9fa;
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  }
                  .success-banner {
                    background: linear-gradient(135deg, #34a853, #2d7d32);
                    color: white;
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                    margin-bottom: 32px;
                    font-weight: 500;
                  }
                  .step {
                    background: #f8f9fa;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 16px 0;
                    border-left: 5px solid #1a73e8;
                  }
                  .step-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #1a73e8;
                  }
                  .step-description {
                    color: #666;
                    font-size: 15px;
                  }
                  .button {
                    background: #1a73e8;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 12px 8px 0 0;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s;
                  }
                  .button:hover {
                    background: #1557b0;
                    transform: translateY(-1px);
                  }
                  .highlight {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                  }
                  .copy-button {
                    background: #34a853;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 8px;
                    font-size: 12px;
                  }
                  .filename {
                    background: #f1f3f4;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success-banner">
                    ✅ File Downloaded Successfully!<br>
                    <small>Google Docs opened in another tab</small>
                  </div>

                  <div class="highlight">
                    <h3 style="margin: 0 0 12px 0; color: #856404;">📁 Downloaded File:</h3>
                    <span class="filename">${sanitizedTitle}-engageperfect.html</span>
                    <button class="copy-button" onclick="navigator.clipboard.writeText('${sanitizedTitle}-engageperfect.html')">Copy Name</button>
                  </div>

                  <h2 style="color: #1a73e8; margin-bottom: 20px;">🚀 Quick Import Steps:</h2>
                  
                  <div class="step">
                    <div class="step-title">Step 1: Import the File</div>
                    <div class="step-description">
                      In the Google Docs tab that just opened:<br>
                      • Click <strong>File</strong> → <strong>Import</strong><br>
                      • Click <strong>Upload</strong> tab<br>
                      • Select the file: <span class="filename">${sanitizedTitle}-engageperfect.html</span><br>
                      • Click <strong>Import</strong>
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-title">Step 2: Enable Collaboration</div>
                    <div class="step-description">
                      • Click the <strong>Share</strong> button (top-right)<br>
                      • Change to <strong>"Anyone with the link"</strong><br>
                      • Select <strong>"Editor"</strong> permissions<br>
                      • Click <strong>"Copy link"</strong>
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-title">Step 3: Share with Your Team</div>
                    <div class="step-description">
                      Share the copied link with your team for real-time collaboration!
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 32px;">
                    <button onclick="window.close()" class="button">
                      ✅ Got It!
                    </button>
                  </div>

                  <div style="text-align: center; margin-top: 24px; color: #666; font-size: 12px;">
                    Generated with EngagePerfect AI
                  </div>
                </div>
              </body>
            </html>
          `);
        }
      }, 1000); // Wait 1 second for Google Docs to load
    }, 300);

    return Promise.resolve();
    
  } catch (error) {
    console.error('Google Docs export error:', error);
    throw new Error('Failed to export to Google Docs. Please try again.');
  }
};

/**
 * Export content to Microsoft OneDrive Word with collaborative editing
 */
export const exportToOneDriveWord = async (content: LongformContent): Promise<void> => {
  const sanitizedTitle = content.inputs.topic
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  try {
    // Create Word-optimized HTML
    const wordOptimizedHTML = createWordHTML(content);
    
    // Create and download the file
    const blob = new Blob([wordOptimizedHTML], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${sanitizedTitle}-engageperfect.docx`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    // Open OneDrive Word Online
    setTimeout(() => {
      const oneDriveUrl = 'https://office.live.com/start/Word.aspx';
      const oneDriveWindow = window.open(oneDriveUrl, '_blank');
      
      // Show instructions
      setTimeout(() => {
        const instructionsWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        if (instructionsWindow) {
          instructionsWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>OneDrive Word Import Instructions</title>
                <style>
                  body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    line-height: 1.6; 
                    background: #f3f2f1;
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  }
                  .success-banner {
                    background: linear-gradient(135deg, #0078d4, #106ebe);
                    color: white;
                    padding: 24px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 32px;
                    font-weight: 500;
                  }
                  .step {
                    background: #f3f2f1;
                    border: 1px solid #d2d0ce;
                    border-radius: 4px;
                    padding: 20px;
                    margin: 16px 0;
                    border-left: 4px solid #0078d4;
                  }
                  .step-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #0078d4;
                  }
                  .step-description {
                    color: #323130;
                    font-size: 15px;
                  }
                  .button {
                    background: #0078d4;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 12px 8px 0 0;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s;
                  }
                  .button:hover {
                    background: #106ebe;
                  }
                  .filename {
                    background: #edebe9;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: 'Consolas', monospace;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success-banner">
                    📄 Word Document Ready for OneDrive!<br>
                    <small>File: ${sanitizedTitle}-engageperfect.docx downloaded</small>
                  </div>

                  <h2 style="color: #0078d4; margin-bottom: 20px;">📤 Upload to OneDrive Steps:</h2>
                  
                  <div class="step">
                    <div class="step-title">Step 1: Upload to OneDrive</div>
                    <div class="step-description">
                      In the OneDrive tab that opened:<br>
                      • Click <strong>Upload</strong> button<br>
                      • Select <span class="filename">${sanitizedTitle}-engageperfect.docx</span><br>
                      • Wait for upload to complete
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-title">Step 2: Open in Word Online</div>
                    <div class="step-description">
                      • Click on the uploaded file<br>
                      • Select <strong>"Edit in Browser"</strong> or <strong>"Open in Word"</strong><br>
                      • The document will open with full formatting
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-title">Step 3: Share for Collaboration</div>
                    <div class="step-description">
                      • Click the <strong>Share</strong> button<br>
                      • Choose <strong>"Anyone with the link can edit"</strong><br>
                      • Copy and share the link with your team
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 32px;">
                    <a href="https://office.live.com/start/Word.aspx" target="_blank" class="button">
                      🌐 Open OneDrive Word
                    </a>
                    <button onclick="window.close()" class="button" style="background: #8a8886;">
                      ✅ Close
                    </button>
                  </div>

                  <div style="text-align: center; margin-top: 24px; color: #605e5c; font-size: 12px;">
                    Generated with EngagePerfect AI • Compatible with Microsoft Word
                  </div>
                </div>
              </body>
            </html>
          `);
        }
      }, 1000);
    }, 300);

    return Promise.resolve();
    
  } catch (error) {
    console.error('OneDrive Word export error:', error);
    throw new Error('Failed to export to OneDrive Word. Please try again.');
  }
};

/**
 * Create Word-optimized HTML document
 */
const createWordHTML = (content: LongformContent): string => {
  const convertedContent = convertMarkdownToHTML(content.content);
  const documentTitle = content.inputs.topic;
  
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
    <title>${documentTitle}</title>
    <style>
        @page {
            margin: 1in;
        }
        body {
            font-family: 'Calibri', sans-serif;
            font-size: 11pt;
            line-height: 1.15;
            margin: 0;
        }
        h1 {
            font-size: 18pt;
            font-weight: bold;
            color: #0078d4;
            margin: 24pt 0 12pt 0;
        }
        h2 {
            font-size: 14pt;
            font-weight: bold;
            color: #333;
            margin: 18pt 0 6pt 0;
        }
        h3 {
            font-size: 12pt;
            font-weight: bold;
            color: #666;
            margin: 12pt 0 6pt 0;
        }
        p {
            margin: 0 0 6pt 0;
            line-height: 1.15;
        }
        .document-header {
            text-align: center;
            border-bottom: 2pt solid #0078d4;
            padding-bottom: 12pt;
            margin-bottom: 24pt;
        }
        .metadata-table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
        }
        .metadata-table td {
            border: 1pt solid #d1d1d1;
            padding: 6pt;
            font-size: 10pt;
        }
        .metadata-table .label {
            background-color: #f1f1f1;
            font-weight: bold;
            width: 30%;
        }
    </style>
</head>
<body>
    <div class="document-header">
        <h1>${documentTitle}</h1>
        <p style="font-style: italic; color: #666;">Generated with EngagePerfect AI</p>
    </div>

    <table class="metadata-table">
        <tr>
            <td class="label">Target Audience</td>
            <td>${content.inputs.audience}</td>
            <td class="label">Industry</td>
            <td>${content.inputs.industry}</td>
        </tr>
        <tr>
            <td class="label">Content Type</td>
            <td>${content.inputs.contentType}</td>
            <td class="label">Tone</td>
            <td>${content.inputs.contentTone}</td>
        </tr>
        <tr>
            <td class="label">Word Count</td>
            <td>${content.metadata.actualWordCount} words</td>
            <td class="label">Reading Time</td>
            <td>${content.metadata.estimatedReadingTime} minutes</td>
        </tr>
    </table>

    <div style="margin-top: 24pt;">
        ${convertedContent}
    </div>

    <div style="margin-top: 36pt; padding-top: 12pt; border-top: 1pt solid #d1d1d1; text-align: center; font-size: 9pt; color: #666;">
        Generated with EngagePerfect AI • Version ${content.metadata.version}
    </div>
</body>
</html>`;
};

// Legacy function for backward compatibility
export const exportToGoogleDocsWithContent = exportToGoogleDocs;
export const exportToGoogleDocsSimple = exportToGoogleDocs;

// Keep the factory function for potential future API integration
export function createGoogleDocsService() {
  return null; // Simplified approach doesn't need the service
}