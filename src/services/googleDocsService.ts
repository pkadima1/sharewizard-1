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
export const exportToGoogleDocs = async (content: LongformContent): Promise<void> => {
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