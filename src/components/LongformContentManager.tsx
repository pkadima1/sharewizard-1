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

  // Fallback translation function for critical UI elements
  const getTranslation = (key: string, fallback: string) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  // Debug: Check if translations are loading properly
  React.useEffect(() => {
    // Test a few key translations to see if they're working
    const testKeys = [
      'contentManager.metadata.minRead',
      'contentManager.actions.preview',
      'contentManager.export.gdocs'
    ];
    
    testKeys.forEach(key => {
      const translation = t(key);
      if (translation === key) {
        console.warn(`❌ Translation missing for key: ${key}`);
      } else {
        console.log(`✅ Translation found for key: ${key} -> ${translation}`);
      }
    });
  }, [t]);

  // Mobile-optimized preview detection
  const [isMobileView, setIsMobileView] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown';
    // Handle Firestore timestamp or regular date
    const date = (timestamp as { toDate?: () => Date }).toDate ? 
      (timestamp as { toDate: () => Date }).toDate() : 
      new Date(timestamp as string | number | Date);
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
     case 'html': {
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
     }
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
       // Try improved PDF generation first, fallback to alternative if needed
       try {
         downloadAsPDF(content);
       } catch (error) {
         console.warn('Primary PDF generation failed, trying alternative method:', error);
         downloadAsPDFAlternative(content);
       }
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
     title: getTranslation('contentManager.download.started', 'Téléchargement commencé'),
     description: getTranslation('contentManager.download.success', `${fileName} a été téléchargé avec succès.`),
   });
 };

 const downloadAsPDF = (content: LongformContent) => {
   const sanitizedTitle = content.inputs.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();
   
   // Use the same HTML generation logic as the HTML download but optimized for PDF
   const formattedContent = formatBlogContent(content.content, {
     darkMode: false,
     mobileFirst: true,
     enhancedReadability: true,
     titleToRemove: content.inputs.topic
   });
   
   // Create PDF-optimized HTML structure
   const pdfHtml = `<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>${content.inputs.topic}</title>
   <style>
       * {
         box-sizing: border-box;
         margin: 0;
         padding: 0;
       }
       
       body { 
         font-family: Georgia, 'Times New Roman', serif;
         max-width: 100%;
         margin: 0;
         padding: 15mm;
         line-height: 1.6;
         color: #333;
         background: #ffffff;
         font-size: 11pt;
       }
       
       h1, h2, h3, h4, h5, h6 { 
         color: #2563eb;
         margin-top: 1.5em;
         margin-bottom: 0.5em;
         page-break-after: avoid;
         font-family: Arial, Helvetica, sans-serif;
       }
       
       h1 { font-size: 1.8em; margin-top: 0; }
       h2 { font-size: 1.5em; }
       h3 { font-size: 1.3em; }
       h4 { font-size: 1.1em; }
       
       p { 
         margin-bottom: 1em;
         orphans: 2;
         widows: 2;
         text-align: left;
       }
       
       ul, ol {
         margin: 0.8em 0;
         padding-left: 1.5em;
       }
       
       li {
         margin-bottom: 0.3em;
         line-height: 1.5;
       }
       
       strong { font-weight: bold; }
       em { font-style: italic; }
       
       blockquote {
         margin: 1em 0;
         padding: 0.8em 1em;
         border-left: 3pt solid #2563eb;
         background: #f8f9fa;
         font-style: italic;
       }
       
       code {
         font-family: 'Courier New', monospace;
         background: #f1f1f1;
         padding: 2pt 4pt;
         border-radius: 2pt;
         font-size: 0.9em;
       }
       
       pre {
         background: #f8f9fa;
         padding: 1em;
         border-radius: 4pt;
         margin: 1em 0;
         overflow-x: auto;
         border: 1pt solid #e9ecef;
       }
       
       pre code {
         background: transparent;
         padding: 0;
       }
       
       table {
         width: 100%;
         border-collapse: collapse;
         margin: 1em 0;
       }
       
       th, td {
         border: 1pt solid #ddd;
         padding: 8pt;
         text-align: left;
       }
       
       th {
         background: #f8f9fa;
         font-weight: bold;
       }
       
       hr {
         border: none;
         height: 1pt;
         background: #ddd;
         margin: 2em 0;
       }
       
       a {
         color: #2563eb;
         text-decoration: underline;
       }
       
       /* Print optimizations */
       @media print {
         body {
           padding: 0;
           margin: 0;
         }
       }
   </style>
</head>
<body>
   ${formattedContent}
</body>
</html>`;

   // Create a temporary element with the PDF-optimized HTML
   const element = document.createElement('div');
   element.innerHTML = pdfHtml;

   const opt = {
     margin: [8, 8, 8, 8],
     filename: `${sanitizedTitle}.pdf`,
     image: { 
       type: 'jpeg', 
       quality: 0.88
     },
     html2canvas: { 
       scale: 1.2,
       useCORS: true,
       allowTaint: false,
       windowWidth: 794,
       windowHeight: 1123,
       backgroundColor: '#ffffff',
       logging: false,
       letterRendering: true
     },
     jsPDF: { 
       unit: 'mm',
       format: 'a4', 
       orientation: 'portrait',
       compress: true
     },
     pagebreak: {
       mode: ['css'],
       avoid: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
     }
   };

   html2pdf().set(opt).from(element).save().then(() => {
     console.log('PDF generated from HTML content successfully');
     toast({
       title: getTranslation('contentManager.download.pdfTitle', 'PDF propre téléchargé'),
       description: getTranslation('contentManager.download.pdfSuccess', `${sanitizedTitle}.pdf a été téléchargé avec succès.`),
     });
   }).catch((error: unknown) => {
     console.error('PDF generation failed:', error);
     const errorMessage = error instanceof Error ? error.message : 'PDF generation failed';
     toast({
       title: getTranslation('contentManager.download.pdfError', 'Échec de la génération PDF'),
       description: getTranslation('contentManager.download.pdfErrorDesc', 'Il y a eu une erreur lors de la génération du PDF. Veuillez réessayer.'),
       variant: "destructive",
     });
   });
 };

 // Alternative PDF generation - Optimized for print efficiency
 const downloadAsPDFAlternative = async (content: LongformContent) => {
   const sanitizedTitle = content.inputs.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();
   
   try {
     // Use the same HTML formatting as the HTML download for perfect consistency
     const formattedContent = formatBlogContent(content.content, {
       darkMode: false,
       mobileFirst: true,
       enhancedReadability: true,
       titleToRemove: content.inputs.topic
     });
     
     const element = document.createElement('div');
     element.innerHTML = `
       <div class="pdf-container-alt">
         <style>
           .pdf-container-alt { 
             font-family: Arial, Helvetica, sans-serif; 
             line-height: 1.35; 
             font-size: 10pt; 
             max-width: 100%; 
             margin: 0; 
             padding: 12mm;
             color: #333;
             height: auto;
             box-sizing: border-box;
           }
           h1 { 
             font-size: 14pt;
             font-weight: bold;
             margin: 12pt 0 6pt 0;
             page-break-after: avoid;
             page-break-inside: avoid;
             color: #2c3e50;
             line-height: 1.2;
           }
           h2 { 
             font-size: 12pt;
             font-weight: bold;
             margin: 10pt 0 5pt 0;
             page-break-after: avoid;
             page-break-inside: avoid;
             color: #34495e;
             line-height: 1.2;
           }
           h3 { 
             font-size: 11pt;
             font-weight: bold;
             margin: 8pt 0 4pt 0;
             page-break-after: avoid;
             page-break-inside: avoid;
             color: #34495e;
             line-height: 1.2;
           }
           h4 { 
             font-size: 10pt;
             font-weight: bold;
             margin: 6pt 0 3pt 0;
             page-break-after: avoid;
             page-break-inside: avoid;
             color: #4a5568;
           }
           p { 
             orphans: 2; 
             widows: 2; 
             margin: 0 0 6pt 0;
             text-align: left;
             line-height: 1.35;
             page-break-inside: avoid;
           }
           ul, ol {
             margin: 4pt 0;
             padding-left: 15pt;
             page-break-inside: avoid;
           }
           li {
             margin-bottom: 2pt;
             line-height: 1.3;
             page-break-inside: avoid;
           }
           strong {
             font-weight: bold;
           }
           em {
             font-style: italic;
           }
           /* Tight spacing for efficiency */
           h1 + p, h2 + p, h3 + p, h4 + p {
             margin-top: 0;
           }
           p + h1 { margin-top: 10pt; }
           p + h2 { margin-top: 8pt; }
           p + h3 { margin-top: 6pt; }
           p + h4 { margin-top: 4pt; }
           /* Compact list spacing */
           ul + p, ol + p, p + ul, p + ol {
             margin-top: 4pt;
           }
           /* Remove excessive breaks */
           br {
             line-height: 0.5;
           }
           /* Efficient content sections */
           .content-section {
             page-break-inside: avoid;
             margin-bottom: 8pt;
           }
           .content-section:last-child {
             margin-bottom: 0;
           }
         </style>
         <div class="content-body">
           ${formattedContent}
         </div>
       </div>
     `;

     const optAlt = {
       margin: [8, 8, 8, 8], // Smaller margins for more content
       filename: `${sanitizedTitle}-alt.pdf`,
       image: { type: 'jpeg', quality: 0.85 },
       html2canvas: { 
         scale: 1.5, // Lower scale for efficiency
         windowWidth: 794,  // A4 width in pixels at 96 DPI
         windowHeight: 1123, // A4 height in pixels at 96 DPI
         backgroundColor: '#ffffff',
         logging: false,
         useCORS: true
       },
       jsPDF: { 
         unit: 'mm', 
         format: 'a4', 
         orientation: 'portrait',
         compress: true
       },
       pagebreak: { 
         mode: ['css', 'legacy'],
         avoid: ['h1', 'h2', 'h3', 'h4', 'ul', 'ol', '.content-section']
       }
     };

     console.log('Generating efficient alternative PDF...');
     await html2pdf().set(optAlt).from(element).save();
     
     toast({
       title: getTranslation('contentManager.download.pdfTitle', 'PDF propre téléchargé'),
       description: getTranslation('contentManager.download.pdfSuccess', `${sanitizedTitle}-alt.pdf a été téléchargé avec succès.`),
     });
   } catch (error) {
     console.error('Alternative PDF generation failed:', error);
     // Fallback to original method
     downloadAsPDF(content);
   }
 };

 // Helper function to format content efficiently for print - NO CHUNKING
 const formatContentForPrint = (content: string): string => {
   // Split content into sections by headers to add logical breaks
   const sections = content.split(/(?=^#+ )/gm).filter(section => section.trim());
   
   return sections.map(section => {
     // Process each section as a cohesive unit
     const formattedSection = section
       // Headers
       .replace(/^# (.*$)/gim, '<h1>$1</h1>')
       .replace(/^## (.*$)/gim, '<h2>$1</h2>')
       .replace(/^### (.*$)/gim, '<h3>$1</h3>')
       .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
       // Text formatting
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>')
       // Lists - improved handling
       .replace(/^\* (.+)$/gm, '<li>$1</li>')
       .replace(/^- (.+)$/gm, '<li>$1</li>')
       .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
       // Group consecutive list items into ul tags
       .replace(/(<li>.*?<\/li>\s*)+/gm, '<ul>$&</ul>')
       // Convert line breaks to paragraphs efficiently
       .split('\n\n')
       .map(para => {
         para = para.trim();
         if (!para) return '';
         // Don't wrap headers or lists in paragraphs
         if (para.match(/^<(h[1-6]|ul)/)) return para;
         // Already wrapped content
         if (para.includes('</')) return para;
         return `<p>${para}</p>`;
       })
       .filter(para => para)
       .join('\n');
       
     // Wrap section in a container for better page break control
     return `<div class="content-section">${formattedSection}</div>`;
   }).join('\n');
 };

 const exportToGoogleDocsNew = async (content: LongformContent) => {
   try {
     // Show immediate feedback about automation
     toast({
       title: getTranslation('contentManager.gdocs.autoOpening', '🤖 Ouverture Auto de Google Docs...'),
       description: getTranslation('contentManager.gdocs.preparing', 'Préparation de votre contenu avec tentatives de collage automatisé'),
     });

     await exportToGoogleDocs(content);

     // Enhanced success feedback
     setTimeout(() => {
       toast({
         title: getTranslation('contentManager.gdocs.magicProgress', '🚀 Magie en Cours !'),
         description: getTranslation('contentManager.gdocs.opened', 'Google Docs ouvert avec automatisation intelligente. Le contenu devrait se coller automatiquement ou appuyez simplement sur Ctrl+V !'),
         duration: 10000,
         action: (
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => window.open('https://docs.google.com/document/u/0/', '_blank')}
             className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
           >
             <ExternalLink className="h-3 w-3" />
             {getTranslation('contentManager.gdocs.focusGdocs', 'Focuser Google Docs')}
           </Button>
         ),
       });
     }, 1000);

   } catch (error) {
     console.error('Google Docs export error:', error);
     toast({
       title: getTranslation('contentManager.errors.exportError', 'Erreur d\'Export'),
       description: getTranslation('contentManager.errors.automationFailed', 'L\'automatisation a échoué. Retour à l\'option de téléchargement manuel.'),
       variant: "destructive",
       action: (
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => downloadContent(content, 'html')}
           className="flex items-center gap-1"
         >
           <Download className="h-3 w-3" />
           {getTranslation('contentManager.gdocs.downloadHtml', 'Télécharger HTML')}
         </Button>
       ),
     });
   }
 };

 const exportToOneDriveWordNew = async (content: LongformContent) => {
   try {
     await exportToOneDriveWord(content);

     toast({
       title: "📄 Export OneDrive Word Démarré !",
       description: "Document Word téléchargé et OneDrive ouvert. Suivez les instructions de téléchargement.",
       action: (
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => window.open('https://office.live.com/start/Word.aspx', '_blank')}
           className="flex items-center gap-1"
         >
           <ExternalLink className="h-3 w-3" />
           Ouvrir OneDrive
         </Button>
       ),
     });

   } catch (error) {
     console.error('OneDrive Word export error:', error);
     toast({
       title: getTranslation('contentManager.errors.exportError', 'Erreur d\'Export'),
       description: getTranslation('contentManager.errors.wordError', 'Échec de la préparation de l\'export OneDrive Word. Veuillez réessayer.'),
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
     author: t('contentManager.metadata.aiContentCreator'),
     readingTime: `${content.metadata.estimatedReadingTime} ${t('contentManager.metadata.minRead')}`,
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
         title: getTranslation('contentManager.copy.success', 'Contenu propre copié !'),
         description: getTranslation('contentManager.copy.description', 'Contenu formaté propre avec texte noir copié. Parfait pour coller dans n\'importe quel document.'),
       });
     }).catch(() => {
       // Fallback to plain text
       navigator.clipboard.writeText(content.content);
       toast({
         title: getTranslation('contentManager.actions.copy', 'Copier'),
         description: getTranslation('contentManager.copy.fallback', 'Contenu copié dans le presse-papiers (texte brut de secours).'),
       });
     });
   } else {
     // Fallback for older browsers
     navigator.clipboard.writeText(content.content);
     toast({
       title: getTranslation('contentManager.actions.copy', 'Copier'),
       description: getTranslation('contentManager.copy.error', 'Contenu copié dans le presse-papiers.'),
     });
   }
 };

 // Clean copy content generator - neutral colors, no backgrounds
 const generateCleanCopyContent = (content: string, metadata: Record<string, unknown>, language: string) => {
   // Use translation system instead of manual language detection
   const authorLabel = getTranslation('contentManager.metadata.author', 'Auteur');
   const readingTimeLabel = getTranslation('contentManager.metadata.readingTime', 'Temps de lecture');
   const publishedLabel = getTranslation('contentManager.metadata.published', 'Publié le');
   
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
         ${Array.isArray(metadata.tags) && metadata.tags.length > 0 ? `
           <div style="margin-top: 15px;">
             ${(metadata.tags as string[]).map((tag: string) => `
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
     author: t('contentManager.metadata.aiContentCreator'),
     readingTime: `${selectedContent.metadata.estimatedReadingTime} ${t('contentManager.metadata.minRead')}`,
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
                 {item.metadata.estimatedReadingTime} {getTranslation('contentManager.metadata.minRead', 'min de lecture')}
               </Badge>
               <Badge variant="outline" className="flex items-center gap-1">
                 <FileText className="h-3 w-3" />
                 {item.metadata.actualWordCount.toLocaleString()} {getTranslation('contentManager.metadata.words', 'mots')}
               </Badge>
               {item.metadata.contentQuality.seoOptimized && (
                 <Badge variant="outline" className="flex items-center gap-1">
                   <TrendingUp className="h-3 w-3" />
                   {t('outputFormat.html.seoOptimized')}
                 </Badge>
               )}
             </div>

             <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1">
                 <Calendar className="h-3 w-3" />
                 {formatDate(item.metadata.generatedAt)}
               </span>
               <span>{getTranslation('contentManager.metadata.tone', 'Ton')}: {item.inputs.contentTone}</span>
               <span>{getTranslation('contentManager.metadata.version', 'Version')} {item.metadata.version}</span>
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
               {getTranslation('contentManager.actions.preview', 'Aperçu')}
             </Button>
           
                        <Button
               variant="outline"
               size="sm"
               onClick={() => copyToClipboard(item)}
               className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300"
               title="Copy clean, formatted content with black text (perfect for documents)"
             >
               <Copy className="h-4 w-4" />
               {getTranslation('contentManager.actions.copyClean', 'Copier Propre')}
             </Button>

           {/* Collaborative Export Buttons */}
                        <Button
               variant="outline"
               size="sm"
               onClick={() => downloadContent(item, 'gdoc')}
               className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 text-blue-700 border-blue-200 dark:from-green-950 dark:to-blue-950 dark:hover:from-green-900 dark:hover:to-blue-900 dark:border-blue-800 dark:text-blue-300 shadow-sm"
               title="Open Google Docs with automated paste (Almost zero-click collaboration!)"
             >
               <FileEdit className="h-4 w-4" />
               🤖 {getTranslation('contentManager.export.gdocs', 'Google Docs')} {getTranslation('contentManager.export.auto', 'Auto')}
             </Button>
           
                        <Button
               variant="outline"
               size="sm"
               onClick={() => downloadContent(item, 'word')}
               className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
             >
               <FileEdit className="h-4 w-4" />
               {getTranslation('contentManager.export.word', 'OneDrive Word')}
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
                 {getTranslation('contentManager.actions.download', 'Télécharger')}
                 <ChevronDown className="h-3 w-3" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => downloadContent(item, 'markdown')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.markdown', 'Markdown (.md)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'html')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.html', 'HTML (.html)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'txt')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.txt', 'Texte (.txt)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'pdf')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.enhanced', '(Amélioré)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadAsPDFAlternative(item)}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.pageSafe', '(Sûr pour Page)')}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => downloadContent(item, 'gdoc')}>
                     <Share2 className="h-4 w-4 mr-2" />
                     🤖 {getTranslation('contentManager.export.gdocs', 'Google Docs')} {getTranslation('contentManager.export.autoPaste', '(Collage Auto)')}
                   </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadContent(item, 'word')}>
                     <Share2 className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.word', 'OneDrive Word')} {getTranslation('contentManager.export.collaborative', '(Collaboratif)')}
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
                   {getTranslation('contentManager.actions.copyClean', 'Copier Propre')}
                 </Button>
               
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button
                     variant="outline"
                     size={isMobileView ? "sm" : "sm"}
                     className={`flex items-center ${isMobileView ? 'justify-center gap-2 w-full' : 'gap-2'} bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300 shadow-sm transition-all duration-200`}
                   >
                     <Download className="h-4 w-4" />
                     {getTranslation('contentManager.actions.export', 'Exporter')}
                     <ChevronDown className="h-3 w-3" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'gdoc')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     🤖 {getTranslation('contentManager.export.gdocs', 'Google Docs')} {getTranslation('contentManager.export.autoPaste', '(Collage Auto)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'word')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.word', 'OneDrive Word')} {getTranslation('contentManager.export.collaborative', '(Collaboratif)')}
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'markdown')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.markdown', 'Markdown (.md)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'html')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.html', 'HTML (.html)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'txt')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.txt', 'Texte (.txt)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'pdf')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.enhanced', '(Amélioré)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadAsPDFAlternative(selectedContent)}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.pageSafe', '(Sûr pour Page)')}
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
                   📊 {selectedContent.metadata.actualWordCount.toLocaleString()} {getTranslation('contentManager.metadata.words', 'mots')}
                 </Badge>
                 <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-slate-300 dark:border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                   ⏱️ {selectedContent.metadata.estimatedReadingTime} {getTranslation('contentManager.metadata.minRead', 'min de lecture')}
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

