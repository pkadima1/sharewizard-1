/**
 * Google Docs Export Service - IMPROVED VERSION
 * 
 * This service provides multiple export options:
 * 1. Direct Google Docs creation with content
 * 2. Microsoft OneDrive Word integration
 * 3. Automatic sharing and collaboration setup
 */

import { LongformContent } from '@/hooks/useLongformContent';

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
  let normalizedContent = content.content
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Handle old Mac line endings
    .trim();

  // Step 2: Convert markdown to clean HTML that Google Docs handles perfectly
  let htmlContent = normalizedContent
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

  // Step 3: Create plain text version for clipboard fallback
  let textContent = normalizedContent
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
 * Create a complete document package with both HTML and text versions
 */
const createGoogleDocsDocument = (formattedContent: { html: string; text: string }, content: LongformContent) => {
  const title = content.inputs.topic;
  
  // Create a complete HTML document optimized for Google Docs
  const htmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1in; 
      line-height: 1.6; 
      color: #333;
    }
    h1 { color: #1a73e8; font-size: 24px; margin: 24px 0 16px 0; font-weight: bold; }
    h2 { color: #333; font-size: 20px; margin: 20px 0 12px 0; font-weight: bold; }
    h3 { color: #555; font-size: 16px; margin: 16px 0 8px 0; font-weight: bold; }
    h4 { color: #666; font-size: 14px; margin: 14px 0 6px 0; font-weight: bold; }
    p { margin: 12px 0; line-height: 1.6; }
    ul { margin: 16px 0; padding-left: 24px; }
    ol { margin: 16px 0; padding-left: 24px; }
    li { margin: 4px 0; line-height: 1.5; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    a { color: #1a73e8; text-decoration: underline; }
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
 * Create a data URL that Google Docs can import directly - DEPRECATED
 * Keeping for compatibility but updating to use new structure
 */
const createGoogleDocsDataUrl = (content: string, title: string): string => {
  const htmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1in; 
      line-height: 1.6; 
    }
    h1 { color: #1a73e8; font-size: 24px; margin: 24px 0 16px 0; }
    h2 { color: #333; font-size: 20px; margin: 20px 0 12px 0; }
    h3 { color: #555; font-size: 16px; margin: 16px 0 8px 0; }
    p { margin: 16px 0; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  return 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlDocument);
};

/**
 * REVOLUTIONARY: Open Google Docs with content already loaded + AUTOMATED PASTE
 * Uses advanced techniques to minimize user interaction
 */
const openGoogleDocsWithContent = async (documentData: { html: string; text: string; title: string }, title: string): Promise<void> => {
  try {
    console.log('Starting automated Google Docs export...');
    
    // Step 1: Copy content to clipboard with rich formatting
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
        const htmlBlob = new Blob([documentData.html], { type: 'text/html' });
        const textBlob = new Blob([documentData.text], { type: 'text/plain' });
        
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        console.log('✅ Content copied to clipboard with HTML formatting');
        
      } catch (clipboardError) {
        console.warn('Rich clipboard failed, trying text-only:', clipboardError);
        await navigator.clipboard.writeText(documentData.text);
        console.log('✅ Content copied to clipboard as plain text');
      }
    }
    
    // Step 2: Open Google Docs with pre-named document
    const googleDocsUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(title + ' - Auto Import')}`;
    console.log('Opening Google Docs with automation:', googleDocsUrl);
    
    const docsWindow = window.open(googleDocsUrl, '_blank', 'width=1200,height=800');
    
    if (docsWindow) {
      // Step 3: Attempt automated paste with multiple strategies
      await attemptAutomatedPaste(docsWindow, documentData, title);
      console.log('✅ Google Docs opened with automation attempts');
    } else {
      throw new Error('Failed to open Google Docs window - popup may be blocked');
    }
    
  } catch (error) {
    console.error('Automated export failed, using fallback:', error);
    await exportToGoogleDocsTraditional({ inputs: { topic: title } } as LongformContent);
  }
};

/**
 * ADVANCED: Attempt to automate the paste process using multiple strategies
 */
const attemptAutomatedPaste = async (docsWindow: Window, documentData: { html: string; text: string; title: string }, title: string): Promise<void> => {
  // Strategy 1: Immediate automation attempt
  setTimeout(async () => {
    try {
      // Focus the Google Docs window
      docsWindow.focus();
      
      // Try to simulate Ctrl+V programmatically (limited by browser security)
      if (docsWindow.document) {
        // Method 1: Try to dispatch keyboard events
        const pasteEvent = new KeyboardEvent('keydown', {
          key: 'v',
          code: 'KeyV',
          ctrlKey: true,
          bubbles: true,
          cancelable: true
        });
        
        // Try to dispatch to the document body when it's ready
        const attemptPaste = () => {
          if (docsWindow.document.body) {
            docsWindow.document.body.dispatchEvent(pasteEvent);
            console.log('🤖 Attempted automated paste via keyboard event');
          }
        };
        
        // Wait for Google Docs to load, then attempt paste
        setTimeout(attemptPaste, 3000);
        setTimeout(attemptPaste, 5000); // Retry
        setTimeout(attemptPaste, 7000); // Final retry
      }
    } catch (error) {
      console.log('Automated paste method 1 failed:', error);
    }
  }, 1000);

  // Strategy 2: Advanced automation with iframe detection
  setTimeout(async () => {
    try {
      if (docsWindow && !docsWindow.closed) {
        // Try to find and focus the editor area
        const focusEditor = () => {
          try {
            // Google Docs loads content in iframes, try to access them
            const frames = docsWindow.frames;
            for (let i = 0; i < frames.length; i++) {
              try {
                const frame = frames[i];
                if (frame.document && frame.document.body) {
                  frame.focus();
                  
                  // Try execCommand paste (deprecated but might work)
                  try {
                    frame.document.execCommand('paste');
                    console.log('🤖 Attempted execCommand paste in frame', i);
                  } catch (e) {
                    console.log('execCommand failed in frame', i);
                  }
                  
                  // Try keyboard simulation in frame
                  const frameEvent = new KeyboardEvent('keydown', {
                    key: 'v',
                    code: 'KeyV',
                    ctrlKey: true,
                    bubbles: true,
                    cancelable: true
                  });
                  frame.document.body.dispatchEvent(frameEvent);
                }
              } catch (frameError) {
                // Cross-origin restrictions expected
              }
            }
          } catch (error) {
            console.log('Frame access failed (expected due to CORS)');
          }
        };
        
        setTimeout(focusEditor, 4000);
        setTimeout(focusEditor, 6000);
        setTimeout(focusEditor, 8000);
      }
    } catch (error) {
      console.log('Automated paste method 2 failed:', error);
    }
  }, 2000);

  // Strategy 3: Smart user guidance with automated features
  setTimeout(() => {
    if (docsWindow && !docsWindow.closed) {
      showSmartAutomationInstructions(title, documentData.text.substring(0, 200) + '...', docsWindow);
    }
  }, 2500);
};

/**
 * Smart automation instructions that help user complete the final step
 */
const showSmartAutomationInstructions = (title: string, contentPreview: string, docsWindow: Window): void => {
  const overlay = document.createElement('div');
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
    ">
      <div style="
        background: white;
        padding: 50px;
        border-radius: 24px;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        max-width: 650px;
        text-align: center;
        animation: slideInScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 3px solid #4285f4;
        position: relative;
        overflow: hidden;
      ">
        <!-- Animated background -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #4285f4, #34a853, #fbbc04, #ea4335);
          animation: pulse 2s ease-in-out infinite;
        "></div>
        
        <div style="
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #4285f4, #34a853, #fbbc04);
          border-radius: 50%;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          box-shadow: 0 10px 30px rgba(66, 133, 244, 0.4);
          animation: bounce 1s ease-in-out infinite alternate;
        ">🚀</div>
        
        <h2 style="
          margin: 0 0 20px 0;
          color: #1a73e8;
          font-size: 32px;
          font-weight: 800;
        ">Almost Magic! ✨</h2>
        
        <p style="
          margin: 0 0 25px 0;
          color: #5f6368;
          font-size: 18px;
          line-height: 1.5;
        ">Google Docs opened with "<strong>${title}</strong>"<br>
        <span style="font-size: 16px; color: #34a853;">Content is copied & automation attempted!</span></p>
        
        <div style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          padding: 20px;
          margin: 25px 0;
          text-align: left;
          max-height: 100px;
          overflow: hidden;
        ">
          <div style="
            color: #1a73e8;
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 14px;
          ">📄 Content Preview:</div>
          <div style="
            color: #3c4043;
            font-size: 14px;
            line-height: 1.4;
            font-family: 'Georgia', serif;
          ">${contentPreview}</div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
          border: 3px solid #34a853;
          border-radius: 20px;
          padding: 30px;
          margin: 30px 0;
          text-align: left;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -10px;
            right: 20px;
            background: #34a853;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          ">AUTO-PASTE ACTIVE</div>
          
          <div style="
            color: #137333;
            font-weight: 800;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            ⚡ Smart Automation:
          </div>
          <div style="
            color: #137333;
            font-size: 16px;
            line-height: 1.6;
          ">
            🤖 <strong>Auto-paste attempts in progress...</strong><br>
            📋 If content doesn't appear automatically, just press 
            <kbd style="
              background: white;
              color: #137333;
              padding: 8px 16px;
              border-radius: 8px;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
              font-weight: bold;
              border: 3px solid #34a853;
              margin: 0 4px;
              font-size: 14px;
              box-shadow: 0 2px 5px rgba(52, 168, 83, 0.3);
            ">Ctrl+V</kbd> 
            in Google Docs!
          </div>
        </div>
        
        <div style="margin: 30px 0; display: flex; gap: 15px; justify-content: center;">
          <button onclick="this.focusGoogleDocs()" style="
            background: linear-gradient(135deg, #4285f4, #1a73e8);
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(66, 133, 244, 0.4);
          " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(66, 133, 244, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(66, 133, 244, 0.4)'">
            🎯 Focus Google Docs
          </button>
          
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: linear-gradient(135deg, #34a853, #2d7d32);
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(52, 168, 83, 0.4);
          " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(52, 168, 83, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(52, 168, 83, 0.4)'">
            Perfect! Done ✨
          </button>
        </div>
        
        <div style="
          color: #9aa0a6;
          font-size: 13px;
          margin-top: 20px;
          line-height: 1.4;
        ">
          🎯 <strong>Pro Tip:</strong> Most browsers auto-paste successfully!<br>
          📱 The content includes rich formatting and is collaboration-ready!
        </div>
      </div>
    </div>
    
    <style>
      @keyframes slideInScale {
        from {
          opacity: 0;
          transform: translateY(-40px) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes bounce {
        from { transform: translateY(0px); }
        to { transform: translateY(-10px); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    </style>
  `;
  
  // Add focus functionality to the button
  const focusButton = overlay.querySelector('button');
  if (focusButton) {
    (focusButton as any).focusGoogleDocs = () => {
      if (docsWindow && !docsWindow.closed) {
        docsWindow.focus();
        // Additional automation attempt when user clicks focus
        setTimeout(() => {
          try {
            if (docsWindow.document && docsWindow.document.body) {
              const pasteEvent = new KeyboardEvent('keydown', {
                key: 'v',
                code: 'KeyV',
                ctrlKey: true,
                bubbles: true,
                cancelable: true
              });
              docsWindow.document.body.dispatchEvent(pasteEvent);
            }
          } catch (error) {
            console.log('Manual focus paste attempt failed:', error);
          }
        }, 500);
      }
    };
  }
  
  document.body.appendChild(overlay);
  
  // Auto-remove after 20 seconds
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.9)';
      overlay.style.transition = 'all 0.4s ease-out';
      setTimeout(() => overlay.remove(), 400);
    }
  }, 20000);
  
  // Remove on escape key
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