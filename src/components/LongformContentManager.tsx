import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  Calendar, 
  FileText, 
  Clock, 
  TrendingUp,
  Copy,
  ExternalLink,
  ChevronDown,
  FileEdit,
  Share2
} from 'lucide-react';
import { LongformContent } from '@/hooks/useLongformContent';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { 
  exportToGoogleDocs, 
  exportToOneDriveWord,
  createGoogleDocsService 
} from '@/services/googleDocsService';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { formatBlogContent, generateModernArticle } from '@/utils/blogFormatter';

interface LongformContentManagerProps {
  content: LongformContent[];
  loading: boolean;
  error: string | null;
}

const LongformContentManager: React.FC<LongformContentManagerProps> = ({
  content,
  loading,
  error
}) => {
  const [selectedContent, setSelectedContent] = useState<LongformContent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation('longform');

  // Mobile-optimized preview detection
  const [isMobileView, setIsMobileView] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
     minute: '2-digit'
   });
 };

 const getContentTypeColor = (type: string) => {
   const colors = {
     'blog-article': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
     'newsletter': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
     'case-study': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
     'guide': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
     'thought-piece': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
   };
   return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
 };

 const downloadContent = (content: LongformContent, format: 'markdown' | 'html' | 'txt' | 'pdf' | 'gdoc' | 'word') => {
   let fileContent = '';
   let fileName = '';
   let mimeType = '';

   const sanitizedTitle = content.inputs.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();

   switch (format) {
     case 'markdown':
       fileContent = content.content;
       fileName = `${sanitizedTitle}.md`;
       mimeType = 'text/markdown';
       break;
     case 'html':
       // Use enhanced formatter for better HTML output
       const formattedContent = formatBlogContent(content.content, {
         darkMode: false,
         mobileFirst: true,
         enhancedReadability: true,
         titleToRemove: content.inputs.topic // Remove duplicate title
       });
       
       fileContent = `<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>${content.inputs.topic}</title>
   <style>
       body { 
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
         max-width: 800px; 
         margin: 0 auto; 
         padding: 20px; 
         line-height: 1.6; 
         color: #333;
       }
       h1, h2, h3 { color: #2563eb; margin-top: 2em; margin-bottom: 0.5em; }
       h1 { font-size: 2.25em; }
       h2 { font-size: 1.875em; }
       h3 { font-size: 1.5em; }
       p { margin-bottom: 1.25em; }
       .article-header { text-align: center; margin-bottom: 3em; border-bottom: 2px solid #e5e7eb; padding-bottom: 2em; }
       .article-title { color: #1e40af; font-size: 2.5em; margin-bottom: 0.5em; }
       .article-meta { color: #6b7280; font-size: 0.875em; }
   </style>
</head>
<body>
   <div class="article-header">
     <h1 class="article-title">${content.inputs.topic}</h1>
     <div class="article-meta">
       ${content.metadata.actualWordCount} words • ${content.metadata.estimatedReadingTime} min read
     </div>
   </div>
   <div class="article-content">
     ${formattedContent}
   </div>
</body>
</html>`;
       fileName = `${sanitizedTitle}.html`;
       mimeType = 'text/html';
       break;
     case 'txt':
       // Strip markdown formatting for plain text
       fileContent = content.content
         .replace(/^#+\s*/gm, '')
         .replace(/\*\*(.*?)\*\*/g, '$1')
         .replace(/\*(.*?)\*/g, '$1')
         .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
       fileName = `${sanitizedTitle}.txt`;
       mimeType = 'text/plain';
       break;
     case 'pdf':
       downloadAsPDF(content);
       return;
     case 'gdoc':
       exportToGoogleDocsNew(content);
       return;
     case 'word':
       exportToOneDriveWordNew(content);
       return;
   }

   const blob = new Blob([fileContent], { type: mimeType });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = fileName;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);

   toast({
     title: "Download started",
     description: `${fileName} has been downloaded successfully.`,
   });
 };

 const downloadAsPDF = (content: LongformContent) => {
   const sanitizedTitle = content.inputs.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();
   
   // Enhanced markdown to HTML conversion with better typography
   let htmlContent = content.content
     // First, handle code blocks to prevent interference
     .replace(/```([\s\S]*?)```/gim, (match, code) => {
       return `<pre class="pdf-code-block"><code class="pdf-code">${code.trim()}</code></pre>`;
     })
     // Headers with improved typography hierarchy
     .replace(/^# (.*$)/gim, '<h1 class="pdf-h1">$1</h1>')
     .replace(/^## (.*$)/gim, '<h2 class="pdf-h2">$1</h2>')
     .replace(/^### (.*$)/gim, '<h3 class="pdf-h3">$1</h3>')
     .replace(/^#### (.*$)/gim, '<h4 class="pdf-h4">$1</h4>')
     .replace(/^##### (.*$)/gim, '<h5 class="pdf-h5">$1</h5>')
     .replace(/^###### (.*$)/gim, '<h6 class="pdf-h6">$1</h6>')
     // Enhanced text formatting with proper nesting
     .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="pdf-bold"><em class="pdf-italic">$1</em></strong>')
     .replace(/\*\*(.*?)\*\*/gim, '<strong class="pdf-bold">$1</strong>')
     .replace(/\*(.*?)\*/gim, '<em class="pdf-italic">$1</em>')
     .replace(/~~(.*?)~~/gim, '<del class="pdf-strikethrough">$1</del>')
     .replace(/`(.*?)`/gim, '<code class="pdf-code">$1</code>')
     // Links with proper styling
     .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="pdf-link">$1</a>')
     // Blockquotes (before lists to avoid conflicts)
     .replace(/^> (.*$)/gim, '<blockquote class="pdf-blockquote">$1</blockquote>')
     // Horizontal rules
     .replace(/^---+$/gim, '<hr class="pdf-divider">')
     .replace(/^\*\*\*+$/gim, '<hr class="pdf-divider">')
     // Lists with proper spacing
     .replace(/^\* (.*$)/gim, '<li class="pdf-list-item">$1</li>')
     .replace(/^- (.*$)/gim, '<li class="pdf-list-item">$1</li>')
     .replace(/^\+ (.*$)/gim, '<li class="pdf-list-item">$1</li>')
     .replace(/^\d+\. (.*$)/gim, '<li class="pdf-list-item-numbered">$1</li>')
     // Tables (basic support)
     .replace(/\|(.+)\|/gim, (match) => {
       const cells = match.split('|').filter(cell => cell.trim()).map(cell => `<td class="pdf-table-cell">${cell.trim()}</td>`).join('');
       return `<tr class="pdf-table-row">${cells}</tr>`;
     });

   // Split into paragraphs and process each one
   const paragraphs = htmlContent.split(/\n\s*\n/);
   const processedParagraphs = paragraphs.map(paragraph => {
     const trimmed = paragraph.trim();
     if (!trimmed) return '';
     
     // Skip if already a block element
     if (trimmed.match(/^<(h[1-6]|blockquote|pre|ul|ol|table|hr|li)/i)) {
       return trimmed;
     }
     
     // Convert single line breaks to <br> within paragraphs
     const withBreaks = trimmed.replace(/\n/g, '<br>');
     
     // Wrap in paragraph if not already a block element
     return `<p class="pdf-paragraph">${withBreaks}</p>`;
   });

   const processedContent = processedParagraphs.join('\n')
     // Handle consecutive list items
     .replace(/(<li class="pdf-list-item">.*?<\/li>)(\s*<li class="pdf-list-item">.*?<\/li>)*/gims, (match) => {
       return `<ul class="pdf-list">${match}</ul>`;
     })
     .replace(/(<li class="pdf-list-item-numbered">.*?<\/li>)(\s*<li class="pdf-list-item-numbered">.*?<\/li>)*/gims, (match) => {
       return `<ol class="pdf-list-numbered">${match}</ol>`;
     })
     // Handle tables
     .replace(/(<tr class="pdf-table-row">.*?<\/tr>)(\s*<tr class="pdf-table-row">.*?<\/tr>)*/gims, (match) => {
       return `<table class="pdf-table"><tbody>${match}</tbody></table>`;
     })
     // Clean up any remaining standalone list items
     .replace(/<li class="pdf-list-item">(.*?)<\/li>/g, '<ul class="pdf-list"><li class="pdf-list-item">$1</li></ul>')
     .replace(/<li class="pdf-list-item-numbered">(.*?)<\/li>/g, '<ol class="pdf-list-numbered"><li class="pdf-list-item-numbered">$1</li></ol>')
     // Clean up any nested paragraph tags within block elements
     .replace(/<(blockquote|li)[^>]*>.*?<p class="pdf-paragraph">(.*?)<\/p>.*?<\/\1>/gims, (match, tag, content) => {
       return match.replace(/<p class="pdf-paragraph">(.*?)<\/p>/g, '$1');
     });

   const element = document.createElement('div');
   element.innerHTML = `
     <div class="pdf-container">
       <style>
         * {
           box-sizing: border-box;
           margin: 0;
           padding: 0;
         }
         
         .pdf-container {
           font-family: 'Georgia', 'Times New Roman', serif;
           width: 100%;
           min-height: 100vh;
           margin: 0;
           padding: 40pt 30pt;
           line-height: 1.8;
           color: #1a1a1a;
           background: #ffffff;
           font-size: 11pt;
           box-sizing: border-box;
         }
         
         @media screen and (max-width: 768px) {
           .pdf-container {
             padding: 20pt 15pt;
             font-size: 10pt;
           }
         }
         
         /* Typography Scale - Mobile First */
         .pdf-h1 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 24pt;
           font-weight: 700;
           color: #1a365d;
           margin: 0 0 16pt 0;
           line-height: 1.2;
           letter-spacing: -0.3pt;
           text-align: left;
           page-break-after: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h1 {
             font-size: 28pt;
             margin: 0 0 20pt 0;
             letter-spacing: -0.5pt;
           }
         }
         
         .pdf-h2 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 18pt;
           font-weight: 600;
           color: #2c5282;
           margin: 24pt 0 12pt 0;
           line-height: 1.3;
           letter-spacing: -0.2pt;
           border-bottom: 1pt solid #e2e8f0;
           padding-bottom: 6pt;
           page-break-after: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h2 {
             font-size: 22pt;
             margin: 30pt 0 16pt 0;
             border-bottom: 2pt solid #e2e8f0;
             padding-bottom: 8pt;
           }
         }
         
         .pdf-h3 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 14pt;
           font-weight: 600;
           color: #3c4858;
           margin: 18pt 0 10pt 0;
           line-height: 1.4;
           page-break-after: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h3 {
             font-size: 18pt;
             margin: 24pt 0 12pt 0;
           }
         }
         
         .pdf-h4 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 12pt;
           font-weight: 600;
           color: #4a5568;
           margin: 14pt 0 8pt 0;
           line-height: 1.4;
           page-break-after: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h4 {
             font-size: 14pt;
             margin: 18pt 0 10pt 0;
           }
         }
         
         .pdf-h5 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 11pt;
           font-weight: 600;
           color: #5a6472;
           margin: 12pt 0 6pt 0;
           line-height: 1.4;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h5 {
             font-size: 12pt;
             margin: 14pt 0 8pt 0;
           }
         }
         
         .pdf-h6 {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 10pt;
           font-weight: 600;
           color: #6b7280;
           margin: 10pt 0 5pt 0;
           line-height: 1.4;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-h6 {
             font-size: 11pt;
             margin: 12pt 0 6pt 0;
           }
         }
         
         /* Body Text - Mobile First */
         .pdf-paragraph {
           margin: 0 0 12pt 0;
           line-height: 1.7;
           font-size: 11pt;
           color: #2d3748;
           text-align: justify;
           orphans: 2;
           widows: 2;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-paragraph {
             margin: 0 0 16pt 0;
             line-height: 1.8;
             font-size: 12pt;
           }
         }
         
         /* Enhanced Text Formatting */
         .pdf-bold {
           font-weight: 700;
           color: #1a202c;
         }
         
         .pdf-italic {
           font-style: italic;
           color: #4a5568;
         }
         
         .pdf-strikethrough {
           text-decoration: line-through;
           color: #6b7280;
         }
         
         .pdf-code {
           font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
           background: #f7fafc;
           color: #2d3748;
           padding: 1pt 4pt;
           border-radius: 2pt;
           font-size: 9pt;
           border: 1pt solid #e2e8f0;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-code {
             padding: 2pt 6pt;
             border-radius: 3pt;
             font-size: 10pt;
           }
         }
         
         .pdf-code-block {
           background: #f7fafc;
           border: 1pt solid #e2e8f0;
           border-radius: 4pt;
           padding: 12pt;
           margin: 12pt 0;
           overflow-x: auto;
           page-break-inside: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-code-block {
             border-radius: 6pt;
             padding: 16pt;
             margin: 16pt 0;
           }
         }
         
         .pdf-code-block .pdf-code {
           background: transparent;
           border: none;
           padding: 0;
           font-size: 9pt;
           line-height: 1.4;
           display: block;
           white-space: pre-wrap;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-code-block .pdf-code {
             font-size: 10pt;
             line-height: 1.5;
           }
         }
         
         .pdf-link {
           color: #3182ce;
           text-decoration: none;
           border-bottom: 1pt solid #3182ce;
         }
         
         .pdf-divider {
           border: none;
           height: 1pt;
           background: #e2e8f0;
           margin: 20pt 0;
           page-break-inside: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-divider {
             height: 2pt;
             margin: 32pt 0;
           }
         }
         
         /* Lists - Mobile First */
         .pdf-list, .pdf-list-numbered {
           margin: 12pt 0 12pt 18pt;
           padding: 0;
           page-break-inside: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-list, .pdf-list-numbered {
             margin: 16pt 0 16pt 24pt;
           }
         }
         
         .pdf-list-item, .pdf-list-item-numbered {
           margin: 6pt 0;
           line-height: 1.5;
           color: #2d3748;
           page-break-inside: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-list-item, .pdf-list-item-numbered {
             margin: 8pt 0;
             line-height: 1.6;
           }
         }
         
         .pdf-list {
           list-style-type: disc;
         }
         
         .pdf-list-numbered {
           list-style-type: decimal;
         }
         
         /* Tables - Mobile First */
         .pdf-table {
           width: 100%;
           border-collapse: collapse;
           margin: 16pt 0;
           font-size: 10pt;
           page-break-inside: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-table {
             margin: 20pt 0;
             font-size: 11pt;
           }
         }
         
         .pdf-table-cell {
           border: 1pt solid #e2e8f0;
           padding: 6pt 8pt;
           text-align: left;
           vertical-align: top;
           color: #2d3748;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-table-cell {
             padding: 8pt 12pt;
           }
         }
         
         .pdf-table-row:first-child .pdf-table-cell {
           background: #f7fafc;
           font-weight: 600;
           color: #1a202c;
         }
         
         /* Blockquotes - Mobile First */
         .pdf-blockquote {
           margin: 16pt 0 16pt 20pt;
           padding: 12pt 16pt;
           border-left: 3pt solid #3182ce;
           background: #f7fafc;
           font-style: italic;
           color: #4a5568;
           line-height: 1.6;
           page-break-inside: avoid;
           position: relative;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-blockquote {
             margin: 20pt 0 20pt 40pt;
             padding: 16pt 20pt;
             border-left: 4pt solid #3182ce;
             line-height: 1.7;
           }
         }
         
         .pdf-blockquote:before {
           content: '"';
           font-size: 32pt;
           color: #3182ce;
           position: absolute;
           top: -6pt;
           left: 8pt;
           font-family: Georgia, serif;
           opacity: 0.3;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-blockquote:before {
             font-size: 48pt;
             top: -10pt;
             left: 10pt;
           }
         }
         
         /* Header Section - Compact & Clean */
         .pdf-header {
           text-align: center;
           margin-bottom: 30pt;
           padding-bottom: 20pt;
           border-bottom: 2pt solid #e2e8f0;
           page-break-after: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-header {
             margin-bottom: 40pt;
             padding-bottom: 24pt;
             border-bottom: 3pt solid #e2e8f0;
           }
         }
         
         .pdf-title {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-size: 24pt;
           font-weight: 700;
           color: #1a365d;
           margin: 0 0 12pt 0;
           line-height: 1.1;
           letter-spacing: -0.4pt;
           word-wrap: break-word;
           hyphens: auto;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-title {
             font-size: 30pt;
             margin: 0 0 16pt 0;
             letter-spacing: -0.6pt;
           }
         }
         
         .pdf-subtitle {
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           color: #4a5568;
           font-size: 10pt;
           margin: 8pt 0 0 0;
           line-height: 1.3;
           font-weight: 400;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-subtitle {
             font-size: 11pt;
             margin: 10pt 0 0 0;
             line-height: 1.4;
           }
         }
         
         .pdf-meta {
           color: #718096;
           font-size: 8pt;
           margin: 12pt 0 0 0;
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           letter-spacing: 0.2pt;
           line-height: 1.3;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-meta {
             font-size: 9pt;
             margin: 16pt 0 0 0;
             letter-spacing: 0.3pt;
           }
         }
         
         .pdf-tags {
           margin-top: 16pt;
           line-height: 1.4;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-tags {
             margin-top: 20pt;
           }
         }
         
         .pdf-tag {
           display: inline-block;
           background: #edf2f7;
           color: #4a5568;
           padding: 3pt 8pt;
           border-radius: 8pt;
           font-size: 8pt;
           margin: 0 4pt 4pt 0;
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           font-weight: 500;
           border: 1pt solid #cbd5e0;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-tag {
             padding: 4pt 12pt;
             border-radius: 12pt;
             font-size: 9pt;
             margin: 0 6pt 6pt 0;
           }
         }
         
         /* Footer - Compact */
         .pdf-footer {
           margin-top: 40pt;
           padding-top: 16pt;
           border-top: 1pt solid #e2e8f0;
           text-align: center;
           page-break-before: avoid;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-footer {
             margin-top: 60pt;
             padding-top: 24pt;
           }
         }
         
         .pdf-footer-text {
           color: #a0aec0;
           font-size: 8pt;
           margin: 0;
           font-family: 'Helvetica Neue', 'Arial', sans-serif;
           letter-spacing: 0.1pt;
         }
         
         @media screen and (min-width: 768px) {
           .pdf-footer-text {
             font-size: 9pt;
             letter-spacing: 0.2pt;
           }
         }
         
         /* Page breaks and print optimizations */
         .pdf-h1, .pdf-h2, .pdf-h3, .pdf-h4 {
           page-break-after: avoid;
         }
         
         .pdf-paragraph {
           page-break-inside: avoid;
           orphans: 2;
           widows: 2;
         }
         
         .pdf-list, .pdf-blockquote, .pdf-code-block, .pdf-table {
           page-break-inside: avoid;
         }
         
         /* Print optimizations - No empty pages */
         @media print {
           .pdf-container {
             padding: 30pt 20pt;
             margin: 0;
             width: 100%;
             max-width: none;
           }
           
           .pdf-header {
             page-break-after: avoid;
             margin-bottom: 20pt;
           }
           
           .pdf-footer {
             page-break-before: avoid;
             margin-top: 30pt;
           }
           
           /* Prevent empty pages */
           html, body {
             margin: 0;
             padding: 0;
             height: auto;
           }
         }
         
         /* High-DPI display optimizations */
         @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
           .pdf-container {
             -webkit-font-smoothing: antialiased;
             -moz-osx-font-smoothing: grayscale;
           }
         }
         
         /* Content Flow Improvements */
         .pdf-content {
           width: 100%;
           margin: 0;
           padding: 0;
           border: none;
           background: transparent;
         }
         
         .pdf-content > *:first-child {
           margin-top: 0;
         }
         
         .pdf-content > *:last-child {
           margin-bottom: 0;
         }
         
         /* Ensure no unexpected borders or backgrounds */
         .pdf-content p, .pdf-content div, .pdf-content section {
           border: none;
           background: transparent;
         }
       </style>
       
       <div class="pdf-header">
         <h1 class="pdf-title">${content.inputs.topic}</h1>
         <div class="pdf-subtitle">
           Generated for ${content.inputs.audience} • ${content.inputs.industry}
         </div>
         <div class="pdf-meta">
           ${content.metadata.actualWordCount} words • ${content.metadata.estimatedReadingTime} min read<br>
           Generated on ${formatDate(content.metadata.generatedAt)} • Tone: ${content.inputs.contentTone}
         </div>
         ${content.inputs.keywords && content.inputs.keywords.length > 0 ? `
           <div class="pdf-tags">
             ${content.inputs.keywords.slice(0, 6).map((tag: string) => `
               <span class="pdf-tag">#${tag}</span>
             `).join('')}
           </div>
         ` : ''}
       </div>
       
       <div class="pdf-content">
         ${processedContent}
       </div>
       
       <div class="pdf-footer">
         <p class="pdf-footer-text">
           Generated with EngagePerfect AI • Content v${content.metadata.version || '1.0'}
         </p>
       </div>
     </div>
   `;

   const opt = {
     margin: [0.4, 0.4, 0.4, 0.4], // Compact margins for mobile-first
     filename: `${sanitizedTitle}.pdf`,
     image: { 
       type: 'jpeg', 
       quality: 0.98 
     },
     html2canvas: { 
       scale: 2, // Balanced scale for mobile performance
       useCORS: true,
       letterRendering: true,
       allowTaint: false,
       removeContainer: true,
       scrollX: 0,
       scrollY: 0,
       windowWidth: 800, // Mobile-optimized width
       windowHeight: 1200,
       backgroundColor: '#ffffff',
       logging: false,
       imageTimeout: 15000,
       ignoreElements: function(element: any) {
         // Ignore any elements that might cause rendering issues
         return element.tagName === 'SCRIPT' || 
                element.tagName === 'STYLE' ||
                element.hasAttribute('data-html2canvas-ignore');
       },
       onclone: function(clonedDoc: any) {
         // Remove any potential empty elements that cause blank pages
         const emptyElements = clonedDoc.querySelectorAll('p:empty, div:empty, br + br');
         emptyElements.forEach((el: any) => el.remove());
         
         // Remove any elements with borders that shouldn't be there
         const unwantedBorders = clonedDoc.querySelectorAll('[style*="border"]');
         unwantedBorders.forEach((el: any) => {
           if (!el.classList.contains('pdf-header') && 
               !el.classList.contains('pdf-footer') &&
               !el.classList.contains('pdf-h2') &&
               !el.classList.contains('pdf-blockquote') &&
               !el.classList.contains('pdf-table-cell')) {
             el.style.border = 'none';
           }
         });
       }
     },
     jsPDF: { 
       unit: 'in', 
       format: 'a4', 
       orientation: 'portrait',
       compress: true,
       precision: 2,
       userUnit: 1.0,
       hotfixes: ['px_scaling'],
       putOnlyUsedFonts: true, // Optimize font loading
       floatPrecision: 2 // Reduce file size
     },
     pagebreak: {
       mode: ['avoid-all', 'css'],
       before: '.pdf-header',
       after: '.pdf-footer',
       avoid: ['.pdf-header', '.pdf-blockquote', '.pdf-code-block', '.pdf-table']
     }
   };

   html2pdf().set(opt).from(element).save().then(() => {
     toast({
       title: "PDF downloaded",
       description: `${sanitizedTitle}.pdf has been downloaded successfully.`,
     });
   }).catch((error: any) => {
     console.error('PDF generation failed:', error);
     toast({
       title: "PDF generation failed",
       description: "There was an error generating the PDF. Please try again.",
       variant: "destructive",
     });
   });
 };

 const exportToGoogleDocsNew = async (content: LongformContent) => {
   try {
     await exportToGoogleDocs(content);

     toast({
       title: "🎉 Google Docs Export Started!",
       description: "File downloaded and Google Docs opened. Follow the import instructions.",
       action: (
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => window.open('https://docs.google.com/document/u/0/create', '_blank')}
           className="flex items-center gap-1"
         >
           <ExternalLink className="h-3 w-3" />
           Open Google Docs
         </Button>
       ),
     });

   } catch (error) {
     console.error('Google Docs export error:', error);
     toast({
       title: "Export Error",
       description: "Failed to prepare Google Docs export. Please try again.",
       variant: "destructive",
     });
   }
 };

 const exportToOneDriveWordNew = async (content: LongformContent) => {
   try {
     await exportToOneDriveWord(content);

     toast({
       title: "📄 OneDrive Word Export Started!",
       description: "Word document downloaded and OneDrive opened. Follow the upload instructions.",
       action: (
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => window.open('https://office.live.com/start/Word.aspx', '_blank')}
           className="flex items-center gap-1"
         >
           <ExternalLink className="h-3 w-3" />
           Open OneDrive
         </Button>
       ),
     });

   } catch (error) {
     console.error('OneDrive Word export error:', error);
     toast({
       title: "Export Error",
       description: "Failed to prepare OneDrive Word export. Please try again.",
       variant: "destructive",
     });
   }
 };

 const copyToClipboard = (content: LongformContent) => {
   // Detect language from content
   const isfrench = content.content.includes('Cependant') ||
                    content.content.includes('Par ailleurs') ||
                    content.content.includes('En effet') ||
                    content.content.includes('français') ||
                    content.inputs.topic.toLowerCase().includes('français');
   const language = isfrench ? 'fr' : 'en';
   
   // Format content with clean, neutral styling for clipboard
   const cleanContent = formatBlogContent(content.content, {
     darkMode: false, // Always use light mode for clean copying
     accentColor: '#000000', // Use black for clean copying
     mobileFirst: false, // Use standard sizing for documents
     enhancedReadability: true,
     titleToRemove: content.inputs.topic
   }).replace(/color:\s*[^;]+;/g, 'color: #000000;') // Ensure all text is black
    .replace(/background[^;]*;/g, '') // Remove all backgrounds
    .replace(/box-shadow[^;]*;/g, ''); // Remove all shadows
   
   // Generate complete article with clean, neutral styling
   const metadata = {
     title: content.inputs.topic,
     author: 'AI Content Creator',
     readingTime: `${content.metadata.estimatedReadingTime} min read`,
     publishDate: formatDate(content.metadata.generatedAt),
     tags: content.inputs.keywords?.slice(0, 5) || []
   };
   
   // Create clean HTML for copying with neutral colors
   const cleanFormattedContent = generateCleanCopyContent(cleanContent, metadata, language);

   // Try to copy as rich HTML first, fallback to plain text
   if (navigator.clipboard && navigator.clipboard.write) {
     const blob = new Blob([cleanFormattedContent], { type: 'text/html' });
     const clipboardItem = new ClipboardItem({
       'text/html': blob,
       'text/plain': new Blob([content.content], { type: 'text/plain' })
     });
     
     navigator.clipboard.write([clipboardItem]).then(() => {
       toast({
         title: t('contentManager.copy.success'),
         description: t('contentManager.copy.description'),
       });
     }).catch(() => {
       // Fallback to plain text
       navigator.clipboard.writeText(content.content);
       toast({
         title: t('contentManager.actions.copy'),
         description: t('contentManager.copy.fallback'),
       });
     });
   } else {
     // Fallback for older browsers
     navigator.clipboard.writeText(content.content);
     toast({
       title: t('contentManager.actions.copy'),
       description: t('contentManager.copy.error'),
     });
   }
 };

 // Clean copy content generator - neutral colors, no backgrounds
 const generateCleanCopyContent = (content: string, metadata: any, language: string) => {
   // Use dynamic translation based on detected language
   const authorLabel = language === 'fr' ? 'Auteur' : 'Author';
   const readingTimeLabel = language === 'fr' ? 'Temps de lecture' : 'Reading Time';
   const publishedLabel = language === 'fr' ? 'Publié le' : 'Published';
   
   return `
     <div style="
       max-width: 800px;
       margin: 0 auto;
       padding: 20px;
       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
       background: transparent;
       color: #000000;
       line-height: 1.6;
     ">
       <header style="
         text-align: center;
         margin-bottom: 30px;
         padding-bottom: 20px;
         border-bottom: 1px solid #cccccc;
       ">
         <h1 style="
           font-size: 28px;
           font-weight: bold;
           color: #000000;
           margin: 0 0 15px 0;
           line-height: 1.2;
         ">${metadata.title}</h1>
         <div style="
           color: #666666;
           font-size: 14px;
           margin-top: 10px;
         ">
           <span>${authorLabel}: ${metadata.author}</span> • 
           <span>${readingTimeLabel}: ${metadata.readingTime}</span> • 
           <span>${publishedLabel}: ${metadata.publishDate}</span>
         </div>
         ${metadata.tags.length > 0 ? `
           <div style="margin-top: 15px;">
             ${metadata.tags.map((tag: string) => `
               <span style="
                 background: #f0f0f0;
                 color: #333333;
                 padding: 4px 12px;
                 border-radius: 15px;
                 font-size: 12px;
                 margin: 0 4px;
                 border: 1px solid #cccccc;
               ">#${tag}</span>
             `).join('')}
           </div>
         ` : ''}
       </header>
       
       <main style="
         font-size: 16px;
         line-height: 1.7;
         color: #000000;
       ">
         <div style="
           color: #000000;
         ">
           ${content.replace(/color:\s*[^;]+;/g, 'color: #000000;')}
         </div>
       </main>
     </div>
   `;
 };

 const getContentPreview = (content: string, maxLength: number = 150) => {
   // Clean the content first using our formatter (without full styling)
   const cleanedContent = formatBlogContent(content, { 
     darkMode: false, 
     mobileFirst: false,
     enhancedReadability: false,
     removeFirstH1: true // Remove first H1 for cleaner preview
   });
   
   // Strip HTML tags for preview text
   const textOnly = cleanedContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
   
   if (textOnly.length <= maxLength) return textOnly;
   return textOnly.substring(0, maxLength) + '...';
 };

 const openPreview = (content: LongformContent) => {
   setSelectedContent(content);
   setPreviewOpen(true);
 };

 // Memoized formatted content for modern preview
 const formattedPreviewContent = useMemo(() => {
   if (!selectedContent) return '';
   
   // Detect dark mode (you can replace this with your theme context)
   const isDarkMode = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
   
   // Detect language from content or use default
   const isfrench = selectedContent.content.includes('Cependant') ||
                    selectedContent.content.includes('Par ailleurs') ||
                    selectedContent.content.includes('En effet') ||
                    selectedContent.content.includes('français') ||
                    selectedContent.inputs.topic.toLowerCase().includes('français');
   const language = isfrench ? 'fr' : 'en';
   
   // Format content with modern styling
   const cleanContent = formatBlogContent(selectedContent.content, {
     darkMode: isDarkMode,
     accentColor: '#60a5fa', // Light blue accent matching your brand
     mobileFirst: true,
     enhancedReadability: true,
     titleToRemove: selectedContent.inputs.topic // Remove duplicate title
   });
   
   // Generate complete article with metadata
   const metadata = {
     title: selectedContent.inputs.topic,
     author: 'AI Content Creator',
     readingTime: `${selectedContent.metadata.estimatedReadingTime} min read`,
     publishDate: formatDate(selectedContent.metadata.generatedAt),
     tags: selectedContent.inputs.keywords?.slice(0, 5) || []
   };
   
   return generateModernArticle(cleanContent, metadata, {
     darkMode: isDarkMode,
     accentColor: '#60a5fa',
     showMetadata: true,
     includeProgress: false, // Disable in modal
     hideDuplicateTitle: true, // Hide duplicate titles
     language: language // Dynamic language detection
   });
 }, [selectedContent]);

 if (loading) {
   return (
     <div className="space-y-4">
       {[1, 2, 3].map((i) => (
         <Card key={i} className="p-6">
           <div className="animate-pulse">
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
             <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
             <div className="flex gap-2 mb-3">
               <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
               <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
             </div>
             <div className="flex gap-2">
               <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
               <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
             </div>
           </div>
         </Card>
       ))}
     </div>
   );
 }

 if (error) {
   return (
     <Card className="p-6">
       <div className="text-center text-red-600 dark:text-red-400">
         <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
         <h3 className="text-lg font-medium mb-2">{t('contentManager.status.errorLoading')}</h3>
         <p className="text-sm">{error}</p>
       </div>
     </Card>
   );
 }

 if (content.length === 0) {
   return (
     <Card className="p-6">
       <div className="text-center text-gray-500 dark:text-gray-400">
         <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
         <h3 className="text-lg font-medium mb-2">{t('contentManager.status.empty')}</h3>
         <p className="text-sm mb-4">{t('contentManager.status.createFirst')}</p>
         <Button onClick={() => window.location.href = '/longform'}>
           {t('contentManager.status.startCreating')}
         </Button>
       </div>
     </Card>
   );
 }

 return (
   <div className="space-y-4">
     {content.map((item) => (
       <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
         <div className="flex justify-between items-start mb-4">
           <div className="flex-1">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
               {item.inputs.topic}
             </h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
               {item.inputs.audience} • {item.inputs.industry}
             </p>
             
             <div className="flex flex-wrap gap-2 mb-3">
               <Badge className={getContentTypeColor(item.inputs.contentType)}>
                 {item.inputs.contentType.replace('-', ' ')}
               </Badge>
               <Badge variant="outline" className="flex items-center gap-1">
                 <Clock className="h-3 w-3" />
                 {item.metadata.estimatedReadingTime} min read
               </Badge>
               <Badge variant="outline" className="flex items-center gap-1">
                 <FileText className="h-3 w-3" />
                 {item.metadata.actualWordCount.toLocaleString()} words
               </Badge>
               {item.metadata.contentQuality.seoOptimized && (
                 <Badge variant="outline" className="flex items-center gap-1">
                   <TrendingUp className="h-3 w-3" />
                   SEO Optimized
                 </Badge>
               )}
             </div>

             <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1">
                 <Calendar className="h-3 w-3" />
                 {formatDate(item.metadata.generatedAt)}
               </span>
               <span>Tone: {item.inputs.contentTone}</span>
               <span>v{item.metadata.version}</span>
             </div>

             {/* Content Preview */}
             <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
               <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                 {getContentPreview(item.content)}
               </p>
             </div>
           </div>
         </div>

         <div className="flex flex-wrap gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={() => openPreview(item)}
             className="flex items-center gap-1"
           >
             <Eye className="h-4 w-4" />
             {t('contentManager.actions.preview')}
           </Button>
           
           <Button
             variant="outline"
             size="sm"
             onClick={() => copyToClipboard(item)}
             className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300"
             title="Copy clean, formatted content with black text (perfect for documents)"
           >
             <Copy className="h-4 w-4" />
             {t('contentManager.actions.copyClean')}
           </Button>

           {/* Collaborative Export Buttons */}
           <Button
             variant="outline"
             size="sm"
             onClick={() => downloadContent(item, 'gdoc')}
             className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
           >
             <FileEdit className="h-4 w-4" />
             {t('contentManager.export.gdocs')}
           </Button>
           
           <Button
             variant="outline"
             size="sm"
             onClick={() => downloadContent(item, 'word')}
             className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
           >
             <FileEdit className="h-4 w-4" />
             {t('contentManager.export.word')}
           </Button>

           {/* Regular Download Options */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-1"
               >
                 <Download className="h-4 w-4" />
                 {t('contentManager.actions.download')}
                 <ChevronDown className="h-3 w-3" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => downloadContent(item, 'markdown')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('contentManager.export.markdown')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'html')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('contentManager.export.html')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'txt')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('contentManager.export.txt')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'pdf')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('contentManager.export.pdf')}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => downloadContent(item, 'gdoc')}>
                 <Share2 className="h-4 w-4 mr-2" />
                 {t('contentManager.export.gdocs')} (Collaborative)
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'word')}>
                 <Share2 className="h-4 w-4 mr-2" />
                 {t('contentManager.export.word')} (Collaborative)
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </Card>
     ))}

     {/* Modern Preview Dialog - Production Ready */}
     <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
       <DialogContent className={`${isMobileView ? 'max-w-[95vw] max-h-[95vh] m-2' : 'max-w-5xl max-h-[90vh]'} overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border-0 rounded-2xl transition-all duration-300`}>
         <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
           <DialogTitle className="flex items-center justify-between text-xl font-bold text-slate-900 dark:text-slate-100">
             <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
               {selectedContent?.inputs.topic}
             </span>
             <div className={`flex ${isMobileView ? 'flex-col gap-2' : 'gap-3'}`}>
               <Button
                 variant="outline"
                 size={isMobileView ? "sm" : "sm"}
                 onClick={() => selectedContent && copyToClipboard(selectedContent)}
                 className={`flex items-center ${isMobileView ? 'justify-center gap-2 w-full' : 'gap-2'} bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300 shadow-sm transition-all duration-200`}
                 title="Copy clean, formatted content with black text (perfect for documents)"
               >
                 <Copy className="h-4 w-4" />
                 {t('contentManager.actions.copyClean')}
               </Button>
               
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button
                     variant="outline"
                     size={isMobileView ? "sm" : "sm"}
                     className={`flex items-center ${isMobileView ? 'justify-center gap-2 w-full' : 'gap-2'} bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300 shadow-sm transition-all duration-200`}
                   >
                     <Download className="h-4 w-4" />
                     {t('contentManager.actions.export')}
                     <ChevronDown className="h-3 w-3" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'gdoc')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     {t('contentManager.export.gdocs')} (Collaborative)
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'word')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     {t('contentManager.export.word')} (Collaborative)
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'markdown')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('contentManager.export.markdown')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'html')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('contentManager.export.html')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'txt')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('contentManager.export.txt')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'pdf')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('contentManager.export.pdf')}
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>
           </DialogTitle>
           <DialogDescription>
             {selectedContent && (
               <div className="flex flex-wrap gap-3 mt-3">
                 <Badge className={`${getContentTypeColor(selectedContent.inputs.contentType)} px-3 py-1 text-xs font-medium rounded-full shadow-sm`}>
                   {selectedContent.inputs.contentType.replace('-', ' ')}
                 </Badge>
                 <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                   📊 {selectedContent.metadata.actualWordCount.toLocaleString()} {t('contentManager.metadata.words')}
                 </Badge>
                 <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                   ⏱️ {selectedContent.metadata.estimatedReadingTime} {t('contentManager.metadata.minRead')}
                 </Badge>
                 <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                   🎯 {selectedContent.inputs.contentTone} tone
                 </Badge>
               </div>
             )}
           </DialogDescription>
         </DialogHeader>
         
         {/* Modern Article Preview with Beautiful Formatting */}
         <div className={`overflow-y-auto ${isMobileView ? 'max-h-[75vh]' : 'max-h-[70vh]'} bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isMobileView ? 'p-3' : 'p-6'} rounded-lg`}>
           {selectedContent && (
             <div 
               className={`max-w-none ${isMobileView ? 'prose prose-sm' : 'prose prose-lg'} dark:prose-invert prose-headings:text-blue-900 dark:prose-headings:text-blue-100 prose-a:text-blue-600 dark:prose-a:text-blue-400`}
               dangerouslySetInnerHTML={{ __html: formattedPreviewContent }}
               style={{
                 fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                 lineHeight: '1.8',
                 color: 'inherit',
                 fontSize: isMobileView ? '14px' : 'inherit'
               }}
             />
           )}
         </div>
       </DialogContent>
     </Dialog>
   </div>
 );
};

export default LongformContentManager;

