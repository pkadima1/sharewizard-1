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
import { 
  exportToGoogleDocs, 
  createGoogleDocsService 
} from '@/services/googleDocsService';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { formatBlogContent, generateModernArticle } from '@/utils/blogFormatter';
import { generateProfessionalPDF, getAvailableTemplates, PDFGenerationOptions } from '@/utils/pdfGenerator';
import PDFTemplateSelector from '@/components/ui/pdf-template-selector';

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
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState<LongformContent | null>(null);
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

 const downloadContent = (content: LongformContent, format: 'html' | 'pdf' | 'gdoc') => {
   let fileContent = '';
   let fileName = '';
   let mimeType = '';

   const sanitizedTitle = content.inputs.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();

   switch (format) {
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
       ${content.metadata.actualWordCount} ${getTranslation('contentManager.metadata.words', 'mots')} • ${content.metadata.estimatedReadingTime} ${getTranslation('contentManager.metadata.minRead', 'min de lecture')}
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
     case 'pdf':
       // Open professional PDF generator dialog
       setPdfContent(content);
       setPdfDialogOpen(true);
       return;
     case 'gdoc':
       exportToGoogleDocsNew(content);
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

 const copyToClipboard = (content: LongformContent) => {
   // Detect language from content
   const isfrench = content.content.includes('Cependant') ||
                    content.content.includes('Par ailleurs') ||
                    content.content.includes('En effet') ||
                    content.content.includes('français') ||
                    content.inputs.topic.toLowerCase().includes('français');
   const language = isfrench ? 'fr' : 'en';
   
   // Format content with professional styling - matching HTML download quality
   const cleanContent = formatBlogContent(content.content, {
     darkMode: false,
     accentColor: '#2563eb', // Use blue accent like HTML download
     mobileFirst: false, // Use desktop formatting for documents
     enhancedReadability: true,
     titleToRemove: content.inputs.topic // Remove duplicate title
   });
   
   // Generate complete article with professional styling matching HTML download
   const metadata = {
     title: content.inputs.topic,
     author: t('contentManager.metadata.aiContentCreator'),
     readingTime: `${content.metadata.estimatedReadingTime} ${t('contentManager.metadata.minRead')}`,
     publishDate: formatDate(content.metadata.generatedAt),
     tags: content.inputs.keywords?.slice(0, 5) || [],
     wordCount: content.metadata.actualWordCount
   };
   
   // Create professional HTML for copying with same quality as download
   const professionalFormattedContent = generateCleanCopyContent(cleanContent, metadata, language);

   // Try to copy as rich HTML first, fallback to plain text
   if (navigator.clipboard && navigator.clipboard.write) {
     const blob = new Blob([professionalFormattedContent], { type: 'text/html' });
     const clipboardItem = new ClipboardItem({
       'text/html': blob,
       'text/plain': new Blob([content.content], { type: 'text/plain' })
     });
     
     navigator.clipboard.write([clipboardItem]).then(() => {
       toast({
         title: getTranslation('contentManager.copy.success', '✨ Contenu Professionnel Copié !'),
         description: getTranslation('contentManager.copy.description', 'Format professionnel avec titres colorés et mise en page parfaite. Prêt pour Google Docs, Word, etc.'),
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

 // Enhanced copy content generator - matches HTML download quality
 const generateCleanCopyContent = (content: string, metadata: Record<string, unknown>, language: string) => {
   // Use translation system instead of manual language detection
   const authorLabel = getTranslation('contentManager.metadata.author', 'Auteur');
   const readingTimeLabel = getTranslation('contentManager.metadata.readingTime', 'Temps de lecture');
   const publishedLabel = getTranslation('contentManager.metadata.published', 'Publié le');
   const wordsLabel = getTranslation('contentManager.metadata.words', 'mots');
   
   return `
     <div style="
       max-width: 800px;
       margin: 0 auto;
       padding: 20px;
       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
       background: transparent;
       color: #333333;
       line-height: 1.6;
     ">
       <div style="
         text-align: center;
         margin-bottom: 3em;
         padding-bottom: 2em;
         border-bottom: 2px solid #e5e7eb;
       ">
         <h1 style="
           color: #1e40af;
           font-size: 1.2em;
           font-weight: bold;
           margin: 0 0 0.5em 0;
           line-height: 1.2;
         ">${metadata.title}</h1>
         <div style="
           color: #6b7280;
           font-size: 0.875em;
           margin-top: 10px;
         ">
           <span>${metadata.readingTime}</span>
         </div>
         ${Array.isArray(metadata.tags) && metadata.tags.length > 0 ? `
           <div style="margin-top: 15px;">
             ${(metadata.tags as string[]).map((tag: string) => `
               <span style="
                 background: #f3f4f6;
                 color: #374151;
                 padding: 4px 12px;
                 border-radius: 20px;
                 font-size: 12px;
                 margin: 0 4px;
                 border: 1px solid #d1d5db;
               ">#${tag}</span>
             `).join('')}
           </div>
         ` : ''}
       </div>
       
       <div style="
         font-size: 16px;
         line-height: 1.7;
         color: #333333;
         text-align: left;
       ">
         ${content
           .replace(/color:\s*[^;]+;/g, 'color: #333333;')
           .replace(/background[^;]*;/g, '')
           .replace(/box-shadow[^;]*;/g, '')
           .replace(/<h1[^>]*>/g, '<h1 style="color: #2563eb; font-size: 1.4em; margin-top: 2em; margin-bottom: 0.5em; font-weight: bold; line-height: 1.2; text-align: left;">')
           .replace(/<h2[^>]*>/g, '<h2 style="color: #2563eb; font-size: 1.2em; margin-top: 2em; margin-bottom: 0.5em; font-weight: bold; line-height: 1.2; text-align: left;">')
           .replace(/<h3[^>]*>/g, '<h3 style="color: #2563eb; font-size: 1.1em; margin-top: 1.8em; margin-bottom: 0.5em; font-weight: bold; line-height: 1.2; text-align: left;">')
           .replace(/<h4[^>]*>/g, '<h4 style="color: #2563eb; font-size: 1.05em; margin-top: 1.6em; margin-bottom: 0.5em; font-weight: bold; line-height: 1.2; text-align: left;">')
           .replace(/<p[^>]*>/g, '<p style="margin-bottom: 1.25em; color: #333333; line-height: 1.7; text-align: left;">')
           .replace(/<ul[^>]*>/g, '<ul style="margin: 1.5em 0; padding-left: 2em; color: #333333; text-align: left;">')
           .replace(/<ol[^>]*>/g, '<ol style="margin: 1.5em 0; padding-left: 2em; color: #333333; text-align: left;">')
           .replace(/<li[^>]*>/g, '<li style="margin-bottom: 0.5em; color: #333333; line-height: 1.6; text-align: left;">')
           .replace(/<blockquote[^>]*>/g, '<blockquote style="border-left: 4px solid #3b82f6; padding-left: 1.5em; margin: 1.5em 0; font-style: italic; color: #4b5563; text-align: left;">')
           .replace(/<strong[^>]*>/g, '<strong style="font-weight: 600; color: #1f2937;">')
           .replace(/<em[^>]*>/g, '<em style="font-style: italic; color: #374151;">')
           .replace(/<a[^>]*>/g, '<a style="color: #2563eb; text-decoration: underline;">')
         }
       </div>
       
       <div style="
         margin-top: 3em;
         padding-top: 2em;
         border-top: 1px solid #e5e7eb;
         text-align: center;
         color: #6b7280;
         font-size: 0.875em;
       ">
         <div style="margin-bottom: 0.5em;">
           <span>${authorLabel}: ${metadata.author}</span>
         </div>
         <div>
           <span>${publishedLabel}: ${metadata.publishDate}</span>
         </div>
       </div>
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

 const handlePDFGeneration = async (options: PDFGenerationOptions) => {
   if (!pdfContent) return;
   
   try {
     toast({
       title: getTranslation('contentManager.pdf.generating', '🎨 Génération PDF Professionnel...'),
       description: getTranslation('contentManager.pdf.preparing', 'Création d\'un document de qualité publication avec le template sélectionné.'),
     });

     await generateProfessionalPDF(pdfContent, options);
     
     toast({
       title: getTranslation('contentManager.pdf.success', '✅ PDF Professionnel Créé !'),
       description: getTranslation('contentManager.pdf.downloaded', 'Document de qualité publication téléchargé avec succès.'),
     });
     
     setPdfDialogOpen(false);
     setPdfContent(null);
   } catch (error) {
     console.error('Professional PDF generation failed:', error);
     toast({
       title: getTranslation('contentManager.pdf.error', '❌ Erreur de Génération PDF'),
       description: getTranslation('contentManager.pdf.errorDesc', 'Il y a eu une erreur lors de la génération du PDF professionnel. Veuillez réessayer.'),
       variant: "destructive",
     });
   }
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
               <DropdownMenuItem onClick={() => downloadContent(item, 'html')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.html', 'HTML (.html)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'pdf')}>
                 <Download className="h-4 w-4 mr-2" />
                 {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.professional', '(Professionnel)')}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => downloadContent(item, 'gdoc')}>
                     <Share2 className="h-4 w-4 mr-2" />
                     🤖 {getTranslation('contentManager.export.gdocs', 'Google Docs')} {getTranslation('contentManager.export.autoPaste', '(Collage Auto)')}
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
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'html')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.html', 'HTML (.html)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'pdf')}>
                     <Download className="h-4 w-4 mr-2" />
                     {getTranslation('contentManager.export.pdf', 'PDF (.pdf)')} {getTranslation('contentManager.export.professional', '(Professionnel)')}
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
                 <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
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

     {/* Professional PDF Generator Dialog */}
     <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Download className="h-5 w-5" />
             {getTranslation('contentManager.pdf.title', 'Générateur PDF Professionnel')}
           </DialogTitle>
           <DialogDescription>
             {getTranslation('contentManager.pdf.description', 'Choisissez un template et personnalisez votre PDF pour un résultat de qualité publication.')}
           </DialogDescription>
         </DialogHeader>
         
         {pdfContent && (
           <div className="mt-6">
             <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
               <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                 {getTranslation('contentManager.pdf.contentInfo', 'Contenu Sélectionné:')}
               </h4>
               <p className="text-sm text-blue-700 dark:text-blue-300">
                 <strong>{pdfContent.inputs.topic}</strong>
               </p>
               <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                 {pdfContent.metadata.actualWordCount} {getTranslation('contentManager.metadata.words', 'mots')} • 
                 {pdfContent.metadata.estimatedReadingTime} {getTranslation('contentManager.metadata.minRead', 'min de lecture')} • 
                 {pdfContent.inputs.contentType.replace('-', ' ')}
               </p>
             </div>
             
             <PDFTemplateSelector
               onGenerate={handlePDFGeneration}
               availableTemplates={getAvailableTemplates()}
               defaultTemplate="business"
             />
           </div>
         )}
       </DialogContent>
     </Dialog>
   </div>
 );
};

export default LongformContentManager;

