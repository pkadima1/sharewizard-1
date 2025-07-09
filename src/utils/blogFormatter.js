/**
 * Blog Content Formatter Utility
 * 
 * Professional content formatting system for mobile-first, modern reading experience:
 * 1. Complete schema markup removal and content cleaning
 * 2. Mobile-first responsive typography with perfect hierarchy
 * 3. Modern color scheme with light blue accents and dark mode support
 * 4. Professional spacing and organization for optimal readability
 * 5. Enhanced UX elements: reading progress, estimated time, proper contrast
 * 6. Production-ready styling for downloads and sharing
 */

/**
 * Main content formatter - transforms raw content into production-ready display
 * 
 * @param {string} content - Raw blog content with potential schema markup
 * @param {Object} options - Formatting options
 * @param {boolean} options.darkMode - Enable dark mode styling
 * @param {boolean} options.mobileFirst - Optimize for mobile-first experience
 * @param {string} options.accentColor - Primary accent color (default: light blue)
 * @returns {string} - Beautifully formatted, production-ready content
 */
export const formatBlogContent = (content, options = {}) => {
  if (!content) return '';
  
  const {
    darkMode = false,
    mobileFirst = true,
    accentColor = '#60a5fa', // Light blue accent
    enhancedReadability = true,
    removeFirstH1 = false, // NEW: Option to remove first H1 heading
    titleToRemove = null   // NEW: Specific title to remove
  } = options;
  
  // Deep content cleaning - remove all technical markup
  let cleanedContent = cleanSchema(content);
  
  // Remove duplicate titles if specified
  if (removeFirstH1 || titleToRemove) {
    if (titleToRemove) {
      // Remove specific title (comprehensive approach)
      const normalizeTitle = (text) => text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const normalizedTitle = normalizeTitle(titleToRemove);
      
      // Remove all H1 tags that match the title
      const escapedTitle = titleToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanedContent = cleanedContent.replace(new RegExp(`<h1[^>]*>\\s*${escapedTitle}\\s*</h1>`, 'gi'), '');
      
      // Remove markdown H1 headers that match
      cleanedContent = cleanedContent.replace(new RegExp(`^#\\s+${escapedTitle}\\s*$`, 'gim'), '');
      
      // Check first line for title match
      const lines = cleanedContent.split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine && normalizeTitle(firstLine) === normalizedTitle) {
          lines.shift();
          cleanedContent = lines.join('\n');
        }
      }
    } else if (removeFirstH1) {
      // Remove any first H1 heading
      cleanedContent = cleanedContent.replace(/^(<h1[^>]*>.*?<\/h1>|#\s+.*?)(\n|$)/i, '');
    }
    
    // Clean up whitespace
    cleanedContent = cleanedContent.replace(/^\s+/, '');
  }
  
  // Process text for perfect readability - break up walls of text
  cleanedContent = processTextForReadability(cleanedContent);
  
  // Apply modern typography hierarchy
  cleanedContent = enhanceModernHeadings(cleanedContent, { darkMode, accentColor });
  
  // Professional content spacing and organization
  cleanedContent = applyModernSpacing(cleanedContent, { darkMode });
  
  // Enhanced list formatting with beautiful styling
  cleanedContent = enhanceModernLists(cleanedContent, { darkMode, accentColor });
  
  // Beautiful blockquotes and callouts
  cleanedContent = enhanceModernBlockquotes(cleanedContent, { darkMode, accentColor });
  
  // Add reading enhancement features
  if (enhancedReadability) {
    cleanedContent = addReadingEnhancements(cleanedContent, { darkMode });
  }
  
  return cleanedContent;
};

/**
 * Advanced schema and markup cleaning - removes all technical content
 */
const cleanSchema = (content) => {
  let cleaned = content
    // Remove JSON-LD schema markup entirely
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '')
    
    // Remove code block markers and technical formatting
    .replace(/```(?:html|json|javascript)?/g, '')
    .replace(/```/g, '')
    
    // Remove HTML comments and processing instructions
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '');

  // Convert markdown-style formatting to HTML if needed
  cleaned = convertMarkdownToHTML(cleaned);
  
  // Ensure proper paragraph structure
  cleaned = ensureProperParagraphs(cleaned);
  
  // Clean up excessive whitespace
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
    
  return cleaned;
};

/**
 * Convert markdown-style formatting to proper HTML
 */
const convertMarkdownToHTML = (content) => {
  return content
    // Convert markdown headings to HTML
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Convert markdown bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert markdown lists
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    
    // Convert markdown links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Convert markdown blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
};

/**
 * Ensure proper paragraph structure for readability
 */
const ensureProperParagraphs = (content) => {
  // Split content into lines and process
  let lines = content.split('\n');
  let processedLines = [];
  let inList = false;
  let listItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (inList) {
        // Close current list
        processedLines.push(wrapListItems(listItems));
        listItems = [];
        inList = false;
      }
      processedLines.push('');
      continue;
    }
    
    // Handle list items
    if (line.startsWith('<li>')) {
      if (!inList) {
        inList = true;
      }
      listItems.push(line);
      continue;
    }
    
    // If we were in a list and this isn't a list item, close the list
    if (inList) {
      processedLines.push(wrapListItems(listItems));
      listItems = [];
      inList = false;
    }
    
    // Handle headings (already converted)
    if (line.match(/^<h[1-6]>/)) {
      processedLines.push(line);
      continue;
    }
    
    // Handle blockquotes (already converted)
    if (line.startsWith('<blockquote>')) {
      processedLines.push(line);
      continue;
    }
    
    // Wrap regular text in paragraphs
    if (!line.startsWith('<') || line.startsWith('<strong>') || line.startsWith('<em>') || line.startsWith('<a ')) {
      processedLines.push(`<p>${line}</p>`);
    } else {
      processedLines.push(line);
    }
  }
  
  // Close any remaining list
  if (inList) {
    processedLines.push(wrapListItems(listItems));
  }
  
  return processedLines.join('\n\n');
};

/**
 * Wrap list items in appropriate list tags
 */
const wrapListItems = (items) => {
  if (items.length === 0) return '';
  
  // Check if it should be ordered or unordered list
  // For now, default to unordered lists
  return `<ul>\n${items.join('\n')}\n</ul>`;
};

/**
 * Modern heading hierarchy with mobile-first responsive design
 */
const enhanceModernHeadings = (content, { darkMode, accentColor }) => {
  const headingStyles = {
    h1: {
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '800',
      color: darkMode ? '#f8fafc' : '#1e293b',
      marginTop: 'clamp(2rem, 5vw, 3rem)',
      marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
      borderBottom: `3px solid ${accentColor}`,
      paddingBottom: '0.75rem',
      background: darkMode 
        ? `linear-gradient(135deg, ${accentColor}22, transparent)`
        : `linear-gradient(135deg, ${accentColor}08, transparent)`,
      padding: '1rem 1.5rem 0.75rem',
      borderRadius: '0.5rem 0.5rem 0 0',
      position: 'relative'
    },
    h2: {
      fontSize: 'clamp(1.625rem, 4vw, 2.25rem)',
      fontWeight: '700',
      color: darkMode ? '#e2e8f0' : '#334155',
      marginTop: 'clamp(2.5rem, 4vw, 3.5rem)',
      marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
      lineHeight: '1.3',
      letterSpacing: '-0.02em',
      position: 'relative',
      paddingLeft: '1rem',
      borderLeft: `4px solid ${accentColor}`,
      background: darkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.8)',
      padding: '0.75rem 1rem',
      borderRadius: '0 0.5rem 0.5rem 0'
    },
    h3: {
      fontSize: 'clamp(1.375rem, 3.5vw, 1.875rem)',
      fontWeight: '600',
      color: darkMode ? '#cbd5e1' : '#475569',
      marginTop: 'clamp(2rem, 3vw, 2.5rem)',
      marginBottom: 'clamp(0.5rem, 1.5vw, 1rem)',
      lineHeight: '1.4',
      position: 'relative',
      paddingLeft: '0.75rem',
      borderLeft: `2px solid ${accentColor}66`
    },
    h4: {
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
      fontWeight: '600',
      color: darkMode ? '#94a3b8' : '#64748b',
      marginTop: 'clamp(1.5rem, 2.5vw, 2rem)',
      marginBottom: 'clamp(0.5rem, 1vw, 0.75rem)',
      lineHeight: '1.4'
    }
  };
  
  let enhanced = content;
  
  Object.entries(headingStyles).forEach(([tag, styles]) => {
    const styleString = Object.entries(styles)
      .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    enhanced = enhanced.replace(
      new RegExp(`<${tag}([^>]*)>(.*?)</${tag}>`, 'gi'),
      `<${tag}$1 style="${styleString}">$2</${tag}>`
    );
  });
  
  return enhanced;
};

/**
 * Professional content spacing with perfect reading rhythm
 */
const applyModernSpacing = (content, { darkMode }) => {
  const paragraphStyle = {
    marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
    lineHeight: '1.75',
    color: darkMode ? '#e2e8f0' : '#374151',
    fontSize: 'clamp(1rem, 2vw, 1.125rem)',
    textAlign: 'left', // Changed from justify to left for better readability
    wordBreak: 'break-word',
    maxWidth: '65ch', // Optimal reading width
    margin: '0 auto clamp(1rem, 2.5vw, 1.5rem) auto'
  };
  
  const styleString = Object.entries(paragraphStyle)
    .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  // First, ensure content has proper structure
  let processedContent = ensureReadableStructure(content);
  
  return processedContent
    // Enhanced paragraph spacing
    .replace(/<\/p>\s*<p/g, '</p>\n\n<p')
    
    // Perfect spacing around lists
    .replace(/<\/(ul|ol)>\s*<p/g, '</$1>\n\n<p')
    .replace(/<\/p>\s*<(ul|ol)/g, '</p>\n\n<$1')
    
    // Enhanced paragraph styling
    .replace(/<p([^>]*)>(.*?)<\/p>/gi, `<p$1 style="${styleString}">$2</p>`)
    
    // Add breathing room around headings
    .replace(/<\/h([1-6])>\s*<p/g, '</h$1>\n\n<p')
    .replace(/<\/p>\s*<h([1-6])/g, '</p>\n\n<h$1')
    
    // Ensure blockquotes have proper spacing
    .replace(/<\/blockquote>\s*<p/g, '</blockquote>\n\n<p')
    .replace(/<\/p>\s*<blockquote/g, '</p>\n\n<blockquote');
};

/**
 * Ensure content has readable structure by breaking up walls of text
 */
const ensureReadableStructure = (content) => {
  // If content is just one long paragraph without breaks, intelligently break it up
  if (content.includes('<p>') && !content.includes('</p>\n\n<p>')) {
    // Look for natural break points
    content = content.replace(/(\. )([A-Z][^.]{50,})/g, '$1</p>\n\n<p>$2');
    
    // Break after questions
    content = content.replace(/(\? )([A-Z][^?]{50,})/g, '$1</p>\n\n<p>$2');
    
    // Break after exclamations
    content = content.replace(/(! )([A-Z][^!]{50,})/g, '$1</p>\n\n<p>$2');
    
    // Break before common transition words/phrases
    const transitions = [
      'However,', 'Moreover,', 'Furthermore,', 'Additionally,', 'Meanwhile,', 
      'In addition,', 'On the other hand,', 'Nevertheless,', 'Consequently,',
      'Therefore,', 'Thus,', 'As a result,', 'For example,', 'For instance,'
    ];
    
    transitions.forEach(transition => {
      const regex = new RegExp(`([.!?] )(${transition})`, 'g');
      content = content.replace(regex, '$1</p>\n\n<p>$2');
    });
  }
  
  return content;
};

/**
 * Modern list formatting with beautiful visual hierarchy
 */
const enhanceModernLists = (content, { darkMode, accentColor }) => {
  const listStyles = {
    ul: {
      margin: 'clamp(1.5rem, 3vw, 2rem) auto',
      paddingLeft: 'clamp(1.5rem, 4vw, 2.5rem)',
      maxWidth: '65ch',
      background: darkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(248, 250, 252, 0.6)',
      borderRadius: '0.75rem',
      padding: 'clamp(1rem, 2vw, 1.5rem)',
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: darkMode 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    ol: {
      margin: 'clamp(1.5rem, 3vw, 2rem) auto',
      paddingLeft: 'clamp(1.5rem, 4vw, 2.5rem)',
      maxWidth: '65ch',
      background: darkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(248, 250, 252, 0.6)',
      borderRadius: '0.75rem',
      padding: 'clamp(1rem, 2vw, 1.5rem)',
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: darkMode 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      counterReset: 'custom-counter'
    },
    li: {
      marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)',
      lineHeight: '1.7',
      color: darkMode ? '#e2e8f0' : '#374151',
      fontSize: 'clamp(1rem, 2vw, 1.125rem)',
      position: 'relative',
      paddingLeft: '0.5rem'
    }
  };
  
  const ulStyle = Object.entries(listStyles.ul)
    .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
    
  const olStyle = Object.entries(listStyles.ol)
    .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
    
  const liStyle = Object.entries(listStyles.li)
    .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  return content
    // Enhanced unordered lists
    .replace(/<ul([^>]*)>/gi, `<ul$1 style="${ulStyle}">`)
    
    // Enhanced ordered lists
    .replace(/<ol([^>]*)>/gi, `<ol$1 style="${olStyle}">`)
    
    // Beautiful list items with custom styling
    .replace(/<li([^>]*)>(.*?)<\/li>/gi, `<li$1 style="${liStyle}">$2</li>`)
    
    // Perfect indentation for nested content
    .replace(/<ul([^>]*)>\s*<li/g, '<ul$1>\n    <li')
    .replace(/<ol([^>]*)>\s*<li/g, '<ol$1>\n    <li')
    .replace(/<\/li>\s*<li/g, '</li>\n    <li')
    .replace(/<\/li>\s*<\/ul/g, '</li>\n</ul')
    .replace(/<\/li>\s*<\/ol/g, '</li>\n</ol');
};

/**
 * Elegant blockquotes and callout boxes
 */
const enhanceModernBlockquotes = (content, { darkMode, accentColor }) => {
  const blockquoteStyle = {
    borderLeft: `6px solid ${accentColor}`,
    background: darkMode 
      ? `linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(51, 65, 85, 0.2))`
      : `linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6))`,
    margin: 'clamp(2rem, 4vw, 3rem) auto',
    padding: 'clamp(1.5rem, 3vw, 2rem)',
    fontStyle: 'italic',
    fontSize: 'clamp(1.125rem, 2.2vw, 1.25rem)',
    lineHeight: '1.8',
    color: darkMode ? '#cbd5e1' : '#475569',
    borderRadius: '0 1rem 1rem 0',
    maxWidth: '65ch',
    position: 'relative',
    boxShadow: darkMode 
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '::before': `content: '"'; position: absolute; top: -0.5rem; left: 1rem; font-size: 4rem; color: ${accentColor}66; font-family: serif;`
  };
  
  const styleString = Object.entries(blockquoteStyle)
    .filter(([prop]) => !prop.startsWith('::'))
    .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  return content
    .replace(/<blockquote([^>]*)>(.*?)<\/blockquote>/gi, 
      `<blockquote$1 style="${styleString}">$2</blockquote>`);
};

/**
 * Advanced reading enhancements for optimal UX
 */
const addReadingEnhancements = (content, { darkMode }) => {
  // Add subtle animations and micro-interactions
  const enhancedContent = content
    // Add smooth focus states for accessibility
    .replace(/<(h[1-6]|p|li|blockquote)([^>]*style="[^"]*")([^>]*)>/gi, 
      '<$1$2; transition: all 0.2s ease; scroll-margin-top: 2rem$3>')
    
    // Enhance link styling for better UX
    .replace(/<a([^>]*)href="([^"]*)"([^>]*)>(.*?)<\/a>/gi, 
      `<a$1href="$2"$3 style="color: ${darkMode ? '#60a5fa' : '#3b82f6'}; text-decoration: none; border-bottom: 2px solid transparent; transition: all 0.2s ease; padding: 0.125rem 0.25rem; border-radius: 0.25rem;" 
      onmouseover="this.style.borderBottomColor='${darkMode ? '#60a5fa' : '#3b82f6'}'; this.style.backgroundColor='${darkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'}'" 
      onmouseout="this.style.borderBottomColor='transparent'; this.style.backgroundColor='transparent'">$4</a>`);
  
  return enhancedContent;
};

/**
 * Enhanced blockquotes formatter (legacy export for compatibility)
 * 
 * @param {string} content - The blog content
 * @returns {string} - Content with enhanced blockquotes
 */
export const enhanceBlockquotes = (content, options = {}) => {
  const { darkMode = false, accentColor = '#60a5fa' } = options;
  return enhanceModernBlockquotes(content, { darkMode, accentColor });
};

/**
 * Generate complete article with modern styling container
 * 
 * @param {string} content - The formatted content
 * @param {Object} metadata - Article metadata
 * @param {Object} options - Styling options
 * @returns {string} - Complete article with container styling
 */
export const generateModernArticle = (content, metadata = {}, options = {}) => {
  const {
    darkMode = false,
    accentColor = '#60a5fa',
    showMetadata = true,
    includeProgress = true,
    hideDuplicateTitle = true, // NEW: Hide duplicate titles
    language = 'en' // NEW: Language support
  } = options;
  
  const {
    title = 'Article Title',
    author = 'Content Creator',
    readingTime = '5 min read',
    publishDate = new Date().toLocaleDateString(),
    tags = []
  } = metadata;

  // Remove duplicate H1 titles from content if they match the metadata title
  let cleanContent = content;
  if (hideDuplicateTitle && title) {
    // Create a more flexible title matching that handles various formats
    const normalizeTitle = (text) => text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    const normalizedTitle = normalizeTitle(title);
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Remove all H1 tags (most comprehensive approach)
    cleanContent = cleanContent.replace(/<h1[^>]*>.*?<\/h1>/gi, '');
    
    // Remove any remaining H1-style markdown headers at the start
    cleanContent = cleanContent.replace(/^#\s+.*$/gm, '');
    
    // Remove standalone title text at the beginning (exact match)
    const exactTitlePattern = new RegExp(`^\\s*${escapedTitle}\\s*\n`, 'i');
    cleanContent = cleanContent.replace(exactTitlePattern, '');
    
    // Remove title-like text at the beginning (flexible matching)
    const lines = cleanContent.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine && normalizeTitle(firstLine) === normalizedTitle) {
        lines.shift(); // Remove the first line
        cleanContent = lines.join('\n');
      }
    }
    
    // Clean up any extra whitespace at the beginning
    cleanContent = cleanContent.replace(/^\s+/, '');
  }
  
  // Localization strings
  const strings = {
    en: {
      author: 'Author',
      readingTime: 'Reading Time',
      publishedOn: 'Published',
      createdWith: 'Created with EngagePerfect AI • Production-ready content formatting'
    },
    fr: {
      author: 'Auteur',
      readingTime: 'Temps de lecture',
      publishedOn: 'Publié le',
      createdWith: 'Créé avec EngagePerfect AI • Formatage de contenu prêt pour la production'
    }
  };
  
  const t = strings[language] || strings.en;
  
  const containerStyle = `
    max-width: min(90vw, 900px);
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3rem);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: ${darkMode ? '#0f172a' : '#ffffff'};
    color: ${darkMode ? '#e2e8f0' : '#1e293b'};
    border-radius: 1rem;
    box-shadow: ${darkMode 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
      : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'};
    position: relative;
    overflow: hidden;
    line-height: 1.7;
  `;
  
  const headerStyle = `
    text-align: center;
    margin-bottom: clamp(2rem, 5vw, 4rem);
    padding-bottom: 2rem;
    border-bottom: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
    position: relative;
  `;
  
  const titleStyle = `
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 900;
    margin: 0 0 1.5rem 0;
    color: ${darkMode ? '#f8fafc' : '#1e293b'};
    line-height: 1.1;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
  `;
  
  const metadataStyle = `
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(0.75rem, 2vw, 1.5rem);
    margin-top: 1.5rem;
    font-size: clamp(0.8rem, 1.8vw, 0.9rem);
    color: ${darkMode ? '#94a3b8' : '#64748b'};
  `;
  
  const progressBarStyle = includeProgress ? `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 4px; background: ${darkMode ? '#1e293b' : '#f1f5f9'}; z-index: 1000;">
      <div id="reading-progress" style="height: 100%; background: linear-gradient(90deg, ${accentColor}, ${accentColor}88); width: 0%; transition: width 0.1s ease;"></div>
    </div>
    <script>
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        document.getElementById('reading-progress').style.width = Math.min(scrollPercent, 100) + '%';
      });
    </script>
  ` : '';
  
  return `
    ${progressBarStyle}
    <article style="${containerStyle}">
      ${showMetadata ? `
        <header style="${headerStyle}">
          <h1 style="${titleStyle}">${title}</h1>
          <div style="${metadataStyle}">
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
              </svg>
              <span>${t.author}: ${author}</span>
            </span>
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
              <span>${readingTime}</span>
            </span>
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z"/>
              </svg>
              <span>${t.publishedOn}: ${publishDate}</span>
            </span>
          </div>
          ${tags.length > 0 ? `
            <div style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;">
              ${tags.map(tag => `
                <span style="background: ${accentColor}22; color: ${accentColor}; padding: 0.375rem 0.875rem; border-radius: 9999px; font-size: clamp(0.7rem, 1.5vw, 0.8rem); font-weight: 500; border: 1px solid ${accentColor}33;">#${tag}</span>
              `).join('')}
            </div>
          ` : ''}
        </header>
      ` : ''}
      
      <main style="font-size: clamp(1.1rem, 2.5vw, 1.3rem); line-height: 1.8; color: ${darkMode ? '#e2e8f0' : '#374151'};">
        ${cleanContent}
      </main>
      
      <footer style="margin-top: clamp(3rem, 6vw, 5rem); padding-top: 2rem; border-top: 1px solid ${darkMode ? '#334155' : '#e2e8f0'}; text-align: center; color: ${darkMode ? '#64748b' : '#94a3b8'}; font-size: clamp(0.8rem, 1.8vw, 0.9rem);">
        <p>${t.createdWith}</p>
      </footer>
    </article>
  `;
};

/**
 * Generate mobile-optimized reading experience
 * 
 * @param {string} content - The content to format
 * @param {Object} options - Mobile-specific options
 * @returns {string} - Mobile-optimized content
 */
export const generateMobileOptimized = (content, options = {}) => {
  const mobileOptions = {
    ...options,
    mobileFirst: true,
    enhancedReadability: true,
    // Mobile-specific font sizing
    baseFontSize: 'max(16px, 4.5vw)', // Never smaller than 16px for accessibility
    lineHeight: '1.6', // Tighter for mobile
    maxWidth: '95vw'
  };
  
  return formatBlogContent(content, mobileOptions);
};

/**
 * Advanced text processing for perfect readability - breaks up walls of text
 */
const processTextForReadability = (content) => {
  // First apply enhanced text processing
  content = enhanceTextProcessing(content);
  
  // Convert any markdown to HTML first
  content = convertMarkdownToHTML(content);
  
  // Ensure proper paragraph structure
  content = ensureProperParagraphs(content);
  
  // Handle the case where content is just one massive paragraph or wall of text
  if (content.includes('<p>') && content.includes('</p>')) {
    // Split content into individual paragraphs and process each
    content = content.replace(/<p>([^<]+)<\/p>/g, (match, text) => {
      // Skip if paragraph is already reasonably sized
      if (text.length < 300) return match;
      
      // Split long paragraphs into readable chunks
      return breakLongParagraph(text);
    });
  } else if (content.length > 500 && !content.includes('</p>') && !content.includes('<h')) {
    // Handle plain text walls
    content = breakPlainTextWall(content);
  }
  
  return content;
};

/**
 * Break a long paragraph into readable chunks
 */
const breakLongParagraph = (text) => {
  // Split into sentences (handle both English and French patterns)
  let sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ])/);
  let paragraphs = [];
  let currentParagraph = [];
  
  sentences.forEach((sentence, index) => {
    sentence = sentence.trim();
    if (!sentence) return;
    
    currentParagraph.push(sentence);
    
    // Create new paragraph every 2-3 sentences for better readability
    if (currentParagraph.length >= 2 && (
      // French transition indicators
      sentence.includes('Cependant') || 
      sentence.includes('Toutefois') || 
      sentence.includes('Par ailleurs') ||
      sentence.includes('En effet') ||
      sentence.includes('Ainsi') ||
      sentence.includes('Donc') ||
      sentence.includes('Par conséquent') ||
      // English transition indicators  
      sentence.includes('However') || 
      sentence.includes('Moreover') || 
      sentence.includes('Furthermore') ||
      sentence.includes('Additionally') ||
      sentence.includes('Therefore') ||
      sentence.includes('For example') ||
      sentence.includes('In fact') ||
      sentence.includes('On the other hand') ||
      // Force break after 3 sentences
      currentParagraph.length >= 3 ||
      // Break on long sentences
      sentence.length > 150
    )) {
      paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
      currentParagraph = [];
    }
  });
  
  // Add remaining sentences
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
  }
  
  return paragraphs.join('\n\n');
};

/**
 * Break plain text walls into structured content
 */
const breakPlainTextWall = (content) => {
  // Split by double newlines first
  let sections = content.split(/\n\s*\n/);
  
  return sections.map(section => {
    section = section.trim();
    if (!section) return '';
    
    // If section is very long, break it further
    if (section.length > 400) {
      return breakLongParagraph(section);
    } else {
      return `<p>${section}</p>`;
    }
  }).filter(Boolean).join('\n\n');
};

/**
 * Enhanced text processing with multi-language support
 */
const enhanceTextProcessing = (content) => {
  // Handle French punctuation and sentence patterns
  content = content
    // French question marks and exclamations
    .replace(/(\s+\?\s+)([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ])/g, ' ?</p>\n\n<p>$2')
    .replace(/(\s+!\s+)([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ])/g, ' !</p>\n\n<p>$2')
    
    // French transition words
    .replace(/(\.)\s+(Cependant|Toutefois|Néanmoins|Par ailleurs|En effet|En fait|D'ailleurs|Ainsi|Donc|Par conséquent)/g, '$1</p>\n\n<p>$2')
    
    // English patterns (existing)
    .replace(/(\.)\s+(However|Moreover|Furthermore|Additionally|Therefore|Thus|Nevertheless|Consequently)/g, '$1</p>\n\n<p>$2');
  
  return content;
};
