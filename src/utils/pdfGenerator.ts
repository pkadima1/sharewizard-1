/**
 * Revolutionary Professional PDF Generator Utility
 * 
 * Creates publication-quality PDFs with:
 * - Perfect content structure and flow
 * - Revolutionary typography hierarchy
 * - Smart page breaks and content optimization
 * - Enhanced readability and visual hierarchy
 * - Production-ready formatting
 */

import { LongformContent } from '@/hooks/useLongformContent';
import { formatBlogContent } from './blogFormatter';

export interface PDFTemplate {
  name: string;
  description: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margins: [number, number, number, number]; // top, right, bottom, left in mm
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  spacing: {
    paragraphSpacing: number;
    headingSpacing: number;
    sectionSpacing: number;
  };
  typography: {
    h1Size: number;
    h2Size: number;
    h3Size: number;
    h4Size: number;
    bodySize: number;
  };
  // Revolutionary enhancements
  contentOptimization: {
    maxLineLength: number;
    optimalParagraphWidth: number;
    headingBreakStrategy: 'page' | 'section' | 'smart';
    listIndentation: number;
    blockquoteStyle: 'modern' | 'classic' | 'minimal' | 'clean' | 'highlight';
  };
  readability: {
    contrastRatio: number;
    fontSmoothing: boolean;
    letterSpacing: number;
    wordSpacing: number;
  };
}

export const PDF_TEMPLATES: Record<string, PDFTemplate> = {
  business: {
    name: 'Business Professional',
    description: 'Clean, corporate-style document perfect for business reports and whitepapers',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 11,
    lineHeight: 1.4,
    margins: [20, 20, 20, 20],
    colors: {
      primary: '#1a202c',
      secondary: '#4a5568',
      text: '#2d3748',
      background: '#ffffff',
      accent: '#3182ce'
    },
    spacing: {
      paragraphSpacing: 8,
      headingSpacing: 12,
      sectionSpacing: 16
    },
    typography: {
      h1Size: 18,
      h2Size: 16,
      h3Size: 14,
      h4Size: 12,
      bodySize: 11
    },
    contentOptimization: {
      maxLineLength: 65,
      optimalParagraphWidth: 85,
      headingBreakStrategy: 'smart',
      listIndentation: 20,
      blockquoteStyle: 'highlight'
    },
    readability: {
      contrastRatio: 4.5,
      fontSmoothing: true,
      letterSpacing: 0,
      wordSpacing: 0
    }
  },
  academic: {
    name: 'Academic Research',
    description: 'Formal academic style with proper citations and research formatting',
    fontFamily: 'Times New Roman, serif',
    fontSize: 12,
    lineHeight: 1.5,
    margins: [25, 25, 25, 25],
    colors: {
      primary: '#1a202c',
      secondary: '#4a5568',
      text: '#2d3748',
      background: '#ffffff',
      accent: '#2b6cb0'
    },
    spacing: {
      paragraphSpacing: 10,
      headingSpacing: 14,
      sectionSpacing: 20
    },
    typography: {
      h1Size: 16,
      h2Size: 14,
      h3Size: 13,
      h4Size: 12,
      bodySize: 12
    },
    contentOptimization: {
      maxLineLength: 70,
      optimalParagraphWidth: 90,
      headingBreakStrategy: 'section',
      listIndentation: 25,
      blockquoteStyle: 'highlight'
    },
    readability: {
      contrastRatio: 4.8,
      fontSmoothing: true,
      letterSpacing: 0,
      wordSpacing: 0
    }
  },
  creative: {
    name: 'Creative Modern',
    description: 'Contemporary design with modern typography and visual hierarchy',
    fontFamily: 'Georgia, serif',
    fontSize: 11,
    lineHeight: 1.6,
    margins: [18, 18, 18, 18],
    colors: {
      primary: '#2d3748',
      secondary: '#4a5568',
      text: '#2d3748',
      background: '#ffffff',
      accent: '#805ad5'
    },
    spacing: {
      paragraphSpacing: 8,
      headingSpacing: 12,
      sectionSpacing: 16
    },
    typography: {
      h1Size: 20,
      h2Size: 16,
      h3Size: 14,
      h4Size: 12,
      bodySize: 11
    },
    contentOptimization: {
      maxLineLength: 60,
      optimalParagraphWidth: 80,
      headingBreakStrategy: 'smart',
      listIndentation: 18,
      blockquoteStyle: 'highlight'
    },
    readability: {
      contrastRatio: 4.2,
      fontSmoothing: true,
      letterSpacing: 0,
      wordSpacing: 0
    }
  }
};

export interface PDFGenerationOptions {
  template?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeTableOfContents?: boolean;
  includeMetadata?: boolean;
  pageNumbers?: boolean;
  customTitle?: string;
  customAuthor?: string;
  customDate?: string;
  // Revolutionary options
  enhancedReadability?: boolean;
  smartPageBreaks?: boolean;
  optimizedTypography?: boolean;
  contentFlowOptimization?: boolean;
}

// Revolutionary content optimization function
const optimizeContentStructure = (content: string, template: PDFTemplate): string => {
  let optimizedContent = content;

  // 1. Smart heading optimization with IDs for TOC
  optimizedContent = optimizedContent.replace(
    /^(#{1,6})\s+(.+)$|^<h([1-6])[^>]*>(.+?)<\/h[1-6]>/gm,
    (match, hashes, title, htmlLevel, htmlTitle) => {
      let level: number;
      let headingTitle: string;
      
      if (hashes) {
        // Markdown format: # Heading
        level = hashes.length;
        headingTitle = title;
      } else {
        // HTML format: <h1>Title</h1>
        level = parseInt(htmlLevel);
        headingTitle = htmlTitle;
      }
      
      const headingClass = `heading-level-${level}`;
      const breakStrategy = template.contentOptimization.headingBreakStrategy;
      const id = headingTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      let breakStyle = '';
      if (breakStrategy === 'page' && level <= 2) {
        breakStyle = 'page-break-before: always;';
      } else if (breakStrategy === 'section' && level <= 3) {
        breakStyle = 'page-break-before: always;';
      } else if (breakStrategy === 'smart' && level === 1) {
        breakStyle = 'page-break-before: always;';
      }
      
      return `<h${level} id="${id}" class="${headingClass}" style="${breakStyle}">${headingTitle}</h${level}>`;
    }
  );

  // 2. Enhanced paragraph optimization
  optimizedContent = optimizedContent.replace(
    /^([^#\n].+)$/gm,
    (match, text) => {
      if (text.trim().length === 0) return match;
      return `<p class="optimized-paragraph">${text}</p>`;
    }
  );

  // 3. Revolutionary list optimization
  optimizedContent = optimizedContent.replace(
    /^(\s*)[-*]\s+(.+)$/gm,
    (match, indent, text) => {
      const indentLevel = Math.floor(indent.length / 2);
      const marginLeft = template.contentOptimization.listIndentation * (indentLevel + 1);
      return `<li class="optimized-list-item" style="margin-left: ${marginLeft}pt;">${text}</li>`;
    }
  );

  // 4. Smart blockquote enhancement - replaced with effective UX elements
  optimizedContent = optimizedContent.replace(
    /^>\s+(.+)$/gm,
    (match, text) => {
      const style = template.contentOptimization.blockquoteStyle;
      
      // Replace blockquotes with more effective UX elements
      switch (style) {
        case 'highlight':
          // Convert to highlighted key point with better UX
          return `<div class="key-point-highlight"><strong>💡 Key Point:</strong> ${text}</div>`;
        default:
          // Default to clean italic text without visual clutter
          return `<p class="emphasized-text"><em>${text}</em></p>`;
      }
    }
  );

  // 5. Content flow optimization
  optimizedContent = optimizedContent
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\s+$/gm, '') // Remove trailing spaces
    .replace(/^\s+/gm, ''); // Remove leading spaces

  return optimizedContent;
};

// Revolutionary table of contents generator
const generateTableOfContents = (content: string, template: PDFTemplate): string => {
  const headings: Array<{ level: number; title: string; id: string }> = [];
  
  // Extract headings from content - handle both markdown and HTML
  const headingRegex = /^(#{1,6})\s+(.+)$|^<h([1-6])[^>]*id="([^"]+)"[^>]*>(.+?)<\/h[1-6]>|^<h([1-6])[^>]*>(.+?)<\/h[1-6]>/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    let level: number;
    let title: string;
    let id: string;
    
    if (match[1]) {
      // Markdown format: # Heading
      level = match[1].length;
      title = match[2].trim();
      id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    } else if (match[3] && match[4]) {
      // HTML format with ID: <h1 id="heading-id">Title</h1>
      level = parseInt(match[3]);
      title = match[5].trim();
      id = match[4];
    } else if (match[6]) {
      // HTML format without ID: <h1>Title</h1>
      level = parseInt(match[6]);
      title = match[7].trim();
      id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    } else {
      continue; // Skip if no match
    }
    
    headings.push({ level, title, id });
  }
  
  // Debug: Log found headings for troubleshooting
  if (headings.length > 0) {
    console.log('🔍 TOC Generation - Found headings:', headings.map(h => `${h.level}: ${h.title} (${h.id})`));
  } else {
    console.warn('⚠️ TOC Generation - No headings found in content');
  }
  
  if (headings.length === 0) return '';
  
  // Generate TOC HTML
  let tocHTML = `
    <div class="table-of-contents" style="
      margin: 20pt 0;
      padding: 15pt;
      background: #f8f9fa;
      border: 1pt solid #e9ecef;
      border-radius: 4pt;
      page-break-inside: avoid;
      page-break-after: avoid;
    ">
      <h2 style="
        font-size: ${template.typography.h2Size}pt;
        color: ${template.colors.primary};
        margin-bottom: 12pt;
        border-bottom: 1pt solid ${template.colors.secondary};
        padding-bottom: 4pt;
      ">Table of Contents</h2>
      <ul style="
        list-style: none;
        padding: 0;
        margin: 0;
      ">
  `;
  
  headings.forEach((heading, index) => {
    const indent = (heading.level - 1) * 12;
    const fontSize = Math.max(template.typography.bodySize - (heading.level - 1), 8);
    
    // Validate that the heading ID exists in the content
    const headingExists = content.includes(`id="${heading.id}"`) || content.includes(`#${heading.id}`);
    if (!headingExists) {
      console.warn(`⚠️ TOC Warning: Heading ID "${heading.id}" not found in content for "${heading.title}"`);
    }
    
    tocHTML += `
      <li style="
        margin: 2pt 0;
        padding-left: ${indent}pt;
        font-size: ${fontSize}pt;
        line-height: 1.4;
      ">
        <a href="#${heading.id}" style="
          color: ${template.colors.accent};
          text-decoration: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            color: ${template.colors.text};
            font-weight: ${heading.level <= 2 ? 'bold' : 'normal'};
          ">${heading.title}</span>
          <span style="
            color: ${template.colors.secondary};
            font-size: ${fontSize - 1}pt;
          ">${index + 1}</span>
        </a>
      </li>
    `;
  });
  
  tocHTML += `
      </ul>
    </div>
  `;
  
  return tocHTML;
};

// Revolutionary typography enhancement
const enhanceTypography = (content: string, template: PDFTemplate): string => {
  let enhancedContent = content;

  // 1. Smart emphasis optimization
  enhancedContent = enhancedContent
    .replace(/\*\*(.+?)\*\*/g, '<strong class="enhanced-emphasis">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="enhanced-italic">$1</em>');

  // 2. Code block enhancement
  enhancedContent = enhancedContent.replace(
    /```(\w+)?\n([\s\S]+?)\n```/g,
    (match, language, code) => {
      const langClass = language ? `language-${language}` : '';
      return `<pre class="enhanced-code-block ${langClass}"><code>${code.trim()}</code></pre>`;
    }
  );

  // 3. Inline code enhancement
  enhancedContent = enhancedContent.replace(
    /`([^`]+)`/g,
    '<code class="enhanced-inline-code">$1</code>'
  );

  // 4. Link enhancement
  enhancedContent = enhancedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="enhanced-link">$1</a>'
  );

  return enhancedContent;
};

export const generateProfessionalPDF = async (
  content: LongformContent,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const {
    template = 'business',
    includeHeader = true,
    includeFooter = true,
    includeTableOfContents = false,
    includeMetadata = true,
    pageNumbers = true,
    customTitle,
    customAuthor,
    customDate,
    enhancedReadability = true,
    smartPageBreaks = true,
    optimizedTypography = true,
    contentFlowOptimization = true
  } = options;

  const selectedTemplate = PDF_TEMPLATES[template];
  
  if (!selectedTemplate) {
    console.error('❌ Template not found:', template);
    throw new Error(`Template '${template}' not found. Available templates: ${Object.keys(PDF_TEMPLATES).join(', ')}`);
  }

  const title = customTitle || content.inputs.topic;
  const author = customAuthor || 'EngagePerfect AI';
  const date = customDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Revolutionary content formatting with enhanced readability
  let formattedContent = formatBlogContent(content.content, {
    darkMode: false,
    mobileFirst: false,
    enhancedReadability: true,
    titleToRemove: content.inputs.topic
  });

  // Apply revolutionary optimizations
  if (contentFlowOptimization) {
    formattedContent = optimizeContentStructure(formattedContent, selectedTemplate);
  }
  
  if (optimizedTypography) {
    formattedContent = enhanceTypography(formattedContent, selectedTemplate);
  }

  // Generate revolutionary PDF HTML with perfect structure
  const pdfHTML = createRevolutionaryPDFHTML(
    formattedContent,
    selectedTemplate,
    {
      title,
      author,
      date,
      wordCount: content.metadata.actualWordCount,
      readingTime: content.metadata.estimatedReadingTime,
      contentType: content.inputs.contentType,
      tone: content.inputs.contentTone,
      industry: content.inputs.industry,
      audience: content.inputs.audience
    },
    {
      includeHeader,
      includeFooter,
      includeTableOfContents,
      includeMetadata,
      pageNumbers,
      enhancedReadability,
      smartPageBreaks
    },
    formattedContent // Pass processed content for TOC generation instead of original
  );

  // Generate PDF with revolutionary settings
  await generateRevolutionaryPDFFromHTML(pdfHTML, title, selectedTemplate);
};

const createRevolutionaryPDFHTML = (
  content: string,
  template: PDFTemplate,
  metadata: {
    title: string;
    author: string;
    date: string;
    wordCount: number;
    readingTime: number;
    contentType: string;
    tone: string;
    industry: string;
    audience: string;
  },
  options: {
    includeHeader: boolean;
    includeFooter: boolean;
    includeTableOfContents: boolean;
    includeMetadata: boolean;
    pageNumbers: boolean;
    enhancedReadability: boolean;
    smartPageBreaks: boolean;
  },
  originalContent?: string
): string => {
  const {
    includeHeader,
    includeFooter,
    includeTableOfContents,
    includeMetadata,
    pageNumbers,
    enhancedReadability,
    smartPageBreaks
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <style>
    /* Optimized PDF Typography System */
    @page {
      size: A4;
      margin: ${template.margins[0]}mm ${template.margins[1]}mm ${template.margins[2]}mm ${template.margins[3]}mm;
      @bottom-center {
        content: counter(page);
        font-size: ${template.typography.bodySize - 1}pt;
        color: ${template.colors.secondary};
        font-family: ${template.fontFamily};
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Optimized Body Typography */
    body {
      font-family: ${template.fontFamily};
      font-size: ${template.fontSize}pt;
      line-height: ${template.lineHeight};
      color: ${template.colors.text};
      background: ${template.colors.background};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      max-width: ${template.contentOptimization.optimalParagraphWidth}%;
      margin: 0 auto;
      text-align: left;
      orphans: 3;
      widows: 3;
    }
    
    /* Optimized Document Header */
    .document-header {
      text-align: center;
      margin-bottom: 20pt;
      padding-bottom: 10pt;
      border-bottom: 1pt solid ${template.colors.secondary};
      page-break-after: avoid;
    }
    
    .document-title {
      font-size: ${template.typography.h1Size}pt;
      font-weight: bold;
      color: ${template.colors.primary};
      margin-bottom: 6pt;
      line-height: 1.2;
      page-break-after: avoid;
    }
    
    .document-subtitle {
      font-size: ${template.typography.h3Size}pt;
      color: ${template.colors.secondary};
      font-style: italic;
      margin-bottom: 8pt;
    }
    
    /* Optimized Metadata Section */
    .metadata-section {
      background: #f8f9fa;
      border: 1pt solid #e9ecef;
      border-radius: 2pt;
      padding: 8pt;
      margin: 10pt 0;
      font-size: ${template.typography.bodySize - 1}pt;
      page-break-inside: avoid;
    }
    
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4pt;
    }
    
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 4pt;
    }
    
    .metadata-label {
      font-weight: bold;
      color: ${template.colors.primary};
      min-width: 60pt;
    }
    
    .metadata-value {
      color: ${template.colors.text};
    }
    
    /* Optimized Typography Hierarchy */
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      color: ${template.colors.primary};
      page-break-after: avoid;
      page-break-inside: avoid;
      line-height: 1.2;
      margin: ${template.spacing.headingSpacing}pt 0 ${template.spacing.paragraphSpacing}pt 0;
    }
    
    h1 {
      font-size: ${template.typography.h1Size}pt;
      ${smartPageBreaks ? 'page-break-before: always;' : ''}
      text-align: center;
      border-bottom: 1pt solid ${template.colors.secondary};
      padding-bottom: 4pt;
    }
    
    h2 {
      font-size: ${template.typography.h2Size}pt;
      color: ${template.colors.primary};
      border-left: 2pt solid ${template.colors.accent};
      padding-left: 6pt;
    }
    
    h3 {
      font-size: ${template.typography.h3Size}pt;
      color: ${template.colors.secondary};
      border-bottom: 1pt solid ${template.colors.secondary};
      padding-bottom: 2pt;
    }
    
    h4 {
      font-size: ${template.typography.h4Size}pt;
      color: ${template.colors.secondary};
      font-style: italic;
    }
    
    /* Optimized Content Styling */
    .optimized-paragraph {
      margin-bottom: ${template.spacing.paragraphSpacing}pt;
      text-align: left;
      orphans: 2;
      widows: 2;
      page-break-inside: avoid;
      max-width: ${template.contentOptimization.maxLineLength * 0.6}em;
      margin-left: auto;
      margin-right: auto;
    }
    
    p {
      margin-bottom: ${template.spacing.paragraphSpacing}pt;
      text-align: left;
      orphans: 2;
      widows: 2;
      page-break-inside: avoid;
      max-width: ${template.contentOptimization.maxLineLength * 0.6}em;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* Optimized List Styling */
    ul, ol {
      margin: ${template.spacing.paragraphSpacing}pt 0;
      padding-left: 12pt;
      page-break-inside: avoid;
    }
    
    .optimized-list-item {
      margin-bottom: 2pt;
      line-height: ${template.lineHeight};
      page-break-inside: avoid;
    }
    
    li {
      margin-bottom: 2pt;
      line-height: ${template.lineHeight};
      page-break-inside: avoid;
    }
    
    /* Optimized Emphasis */
    .enhanced-emphasis, strong {
      font-weight: bold;
      color: ${template.colors.primary};
    }
    
    .enhanced-italic, em {
      font-style: italic;
      color: ${template.colors.secondary};
    }
    
    /* Effective UX Elements - Replacing Blockquotes */
    .key-point-highlight {
      margin: ${template.spacing.paragraphSpacing}pt 0;
      padding: 6pt 8pt;
      page-break-inside: avoid;
      background: #f0f8ff;
      border-left: 3pt solid ${template.colors.accent};
      border-radius: 2pt;
      font-size: ${template.typography.bodySize}pt;
    }
    
    .emphasized-text {
      margin-bottom: ${template.spacing.paragraphSpacing}pt;
      font-style: italic;
      color: ${template.colors.secondary};
      padding-left: 4pt;
    }
    
    /* Optimized Code Blocks */
    .enhanced-code-block {
      background: #f8f9fa;
      padding: 6pt;
      border-radius: 2pt;
      margin: ${template.spacing.paragraphSpacing}pt 0;
      border: 1pt solid #e9ecef;
      page-break-inside: avoid;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: ${template.typography.bodySize - 1}pt;
    }
    
    .enhanced-inline-code, code {
      font-family: 'Courier New', monospace;
      background: #f1f1f1;
      padding: 1pt 2pt;
      border-radius: 1pt;
      font-size: ${template.typography.bodySize - 1}pt;
      color: #d63384;
    }
    
    /* Optimized Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: ${template.spacing.paragraphSpacing}pt 0;
      page-break-inside: avoid;
      font-size: ${template.typography.bodySize - 1}pt;
    }
    
    th, td {
      border: 1pt solid #ddd;
      padding: 4pt;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background: #f8f9fa;
      font-weight: bold;
      color: ${template.colors.primary};
    }
    
    /* Optimized Links */
    .enhanced-link, a {
      color: ${template.colors.accent};
      text-decoration: underline;
      word-break: break-word;
    }
    
    /* Optimized Print Settings */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      
      p, ul, ol, .key-point-highlight, .emphasized-text, table, .metadata-section {
        page-break-inside: avoid;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .section-break {
        page-break-before: always;
      }
    }
    
    /* Optimized Content Flow */
    .document-content {
      max-width: 100%;
      margin: 0 auto;
    }
    
    /* Optimized Section Spacing */
    .content-section {
      margin-bottom: ${template.spacing.sectionSpacing}pt;
      page-break-inside: avoid;
    }
    
    /* Optimized Readability */
    ${enhancedReadability ? `
      body {
        text-rendering: optimizeLegibility;
      }
      
      .optimized-paragraph {
        text-align: left;
      }
    ` : ''}
    
    /* Table of Contents Styling */
    .table-of-contents {
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    
    .table-of-contents a {
      text-decoration: none;
      color: inherit;
    }
    
    .table-of-contents a:hover {
      color: ${template.colors.accent};
    }
    
    /* Ensure TOC links work in PDF */
    .table-of-contents a[href^="#"] {
      color: ${template.colors.accent};
    }
  </style>
</head>
<body>
  ${includeHeader ? `
    <div class="document-header">
      <h1 class="document-title">${metadata.title}</h1>
      ${metadata.contentType !== 'blog-article' ? `<div class="document-subtitle">${metadata.contentType.replace('-', ' ')}</div>` : ''}
    </div>
  ` : ''}
  
  ${includeMetadata ? `
    <div class="metadata-section">
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-label">Author:</span>
          <span class="metadata-value">${metadata.author}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Date:</span>
          <span class="metadata-value">${metadata.date}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Word Count:</span>
          <span class="metadata-value">${metadata.wordCount.toLocaleString()}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Reading Time:</span>
          <span class="metadata-value">${metadata.readingTime} minutes</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Industry:</span>
          <span class="metadata-value">${metadata.industry}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Target Audience:</span>
          <span class="metadata-value">${metadata.audience}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Content Tone:</span>
          <span class="metadata-value">${metadata.tone}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Content Type:</span>
          <span class="metadata-value">${metadata.contentType.replace('-', ' ')}</span>
        </div>
      </div>
    </div>
  ` : ''}
  
  ${includeTableOfContents ? generateTableOfContents(content, template) : ''}
  
  <div class="document-content">
    ${content}
  </div>
  
  ${includeFooter ? `
    <div style="margin-top: 20pt; padding-top: 10pt; border-top: 1pt solid #e9ecef; text-align: center; font-size: ${template.typography.bodySize - 1}pt; color: ${template.colors.secondary};">
      Generated with EngagePerfect AI • ${metadata.date}
    </div>
  ` : ''}
</body>
</html>`;
};

const generateRevolutionaryPDFFromHTML = async (html: string, title: string, template: PDFTemplate): Promise<void> => {
  const element = document.createElement('div');
  element.innerHTML = html;

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  // Revolutionary PDF generation options - Fixed empty first page issue
  const options = {
    margin: template.margins,
    filename: `${sanitizedTitle}-revolutionary-professional.pdf`,
    image: { 
      type: 'jpeg', 
      quality: 0.95
    },
    html2canvas: { 
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      backgroundColor: template.colors.background,
      logging: false,
      letterRendering: true,
      removeContainer: true, // Prevents empty first page
      foreignObjectRendering: false // Better compatibility
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
      putOnlyUsedFonts: true // Reduces file size
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'], // Better page break handling
      before: '.page-break',
      after: '.section-break',
      avoid: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'blockquote', 'table', 
        '.metadata-section', '.optimized-paragraph',
        '.enhanced-code-block', '.blockquote',
        '.table-of-contents' // Prevent TOC from breaking
      ]
    }
  };

  try {
    // Revolutionary import method with enhanced error handling
    let html2pdf;
    try {
      const module = await import('html2pdf.js');
      html2pdf = module.default || module;
    } catch (importError) {
      console.warn('Dynamic import failed, trying static import:', importError);
      // Fallback to static import if dynamic fails
      const staticModule = require('html2pdf.js');
      html2pdf = staticModule.default || staticModule;
    }

    if (!html2pdf) {
      throw new Error('html2pdf.js library could not be loaded');
    }

    // Revolutionary PDF generation with proper Promise handling
    console.log('🚀 Starting revolutionary PDF generation...');
    
    await html2pdf()
      .set(options)
      .from(element)
      .save();
    
    console.log('✅ Revolutionary PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Revolutionary PDF generation failed:', error);
    throw new Error(`Revolutionary PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAvailableTemplates = (): PDFTemplate[] => {
  return Object.values(PDF_TEMPLATES);
};

export const getTemplateByName = (name: string): PDFTemplate | null => {
  return PDF_TEMPLATES[name] || null;
};

// Helper function to get template by display name
export const getTemplateByDisplayName = (displayName: string): PDFTemplate | null => {
  const templateMap: Record<string, string> = {
    'Business Professional': 'business',
    'Academic Research': 'academic', 
    'Creative Modern': 'creative'
  };
  
  const templateKey = templateMap[displayName];
  return templateKey ? PDF_TEMPLATES[templateKey] || null : null;
};

// Helper function to get template key from display name
export const getTemplateKeyFromDisplayName = (displayName: string): string => {
  const templateMap: Record<string, string> = {
    'Business Professional': 'business',
    'Academic Research': 'academic', 
    'Creative Modern': 'creative'
  };
  return templateMap[displayName] || 'business';
}; 