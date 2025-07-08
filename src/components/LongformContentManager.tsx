import React, { useState } from 'react';
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
       // Convert markdown to basic HTML
       const htmlContent = content.content
         .replace(/^# (.*$)/gim, '<h1>$1</h1>')
         .replace(/^## (.*$)/gim, '<h2>$1</h2>')
         .replace(/^### (.*$)/gim, '<h3>$1</h3>')
         .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
         .replace(/\*(.*)\*/gim, '<em>$1</em>')
         .replace(/\n\n/gim, '</p><p>')
         .replace(/\n/gim, '<br>');
       
       fileContent = `<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>${content.inputs.topic}</title>
   <style>
       body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
       h1, h2, h3 { color: #333; }
       p { margin-bottom: 1em; }
   </style>
</head>
<body>
   <p>${htmlContent}</p>
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
   
   // Convert markdown to HTML for PDF generation
   const htmlContent = content.content
     .replace(/^# (.*$)/gim, '<h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">$1</h1>')
     .replace(/^## (.*$)/gim, '<h2 style="color: #555; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
     .replace(/^### (.*$)/gim, '<h3 style="color: #666; font-size: 16px; margin-top: 20px; margin-bottom: 8px;">$1</h3>')
     .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
     .replace(/\*(.*?)\*/gim, '<em>$1</em>')
     .replace(/\n\n/gim, '</p><p style="margin-bottom: 16px; line-height: 1.6;">')
     .replace(/\n/gim, '<br>');

   const element = document.createElement('div');
   element.innerHTML = `
     <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6;">
       <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
         <h1 style="color: #333; font-size: 28px; margin-bottom: 8px;">${content.inputs.topic}</h1>
         <p style="color: #666; font-size: 14px; margin: 0;">
           Generated for ${content.inputs.audience} • ${content.inputs.industry} • 
           ${content.metadata.actualWordCount} words • ${content.metadata.estimatedReadingTime} min read
         </p>
         <p style="color: #888; font-size: 12px; margin-top: 8px;">
           Generated on ${formatDate(content.metadata.generatedAt)} • Tone: ${content.inputs.contentTone}
         </p>
       </div>
       <div style="color: #333;">
         <p style="margin-bottom: 16px; line-height: 1.6;">${htmlContent}</p>
       </div>
       <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
         <p style="color: #888; font-size: 12px; margin: 0;">
           Generated with EngagePerfect AI • Content v${content.metadata.version}
         </p>
       </div>
     </div>
   `;

   const opt = {
     margin: [0.5, 0.5, 0.5, 0.5],
     filename: `${sanitizedTitle}.pdf`,
     image: { type: 'jpeg', quality: 0.98 },
     html2canvas: { scale: 2, useCORS: true },
     jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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

 const copyToClipboard = (content: string) => {
   navigator.clipboard.writeText(content);
   toast({
     title: "Content copied",
     description: "Content has been copied to your clipboard.",
   });
 };

 const getContentPreview = (content: string, maxLength: number = 150) => {
   if (content.length <= maxLength) return content;
   return content.substring(0, maxLength) + '...';
 };

 const openPreview = (content: LongformContent) => {
   setSelectedContent(content);
   setPreviewOpen(true);
 };

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
         <h3 className="text-lg font-medium mb-2">{t('errorLoading', 'Error Loading Content')}</h3>
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
         <h3 className="text-lg font-medium mb-2">{t('empty', 'No Content Generated Yet')}</h3>
         <p className="text-sm mb-4">{t('createFirst', 'Create your first long-form content to see it here.')}</p>
         <Button onClick={() => window.location.href = '/longform'}>
           {t('startCreating', 'Start Creating Content')}
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
             {t('actions.preview', 'Preview')}
           </Button>
           
           <Button
             variant="outline"
             size="sm"
             onClick={() => copyToClipboard(item.content)}
             className="flex items-center gap-1"
           >
             <Copy className="h-4 w-4" />
             {t('actions.copy', 'Copy')}
           </Button>

           {/* Collaborative Export Buttons */}
           <Button
             variant="outline"
             size="sm"
             onClick={() => downloadContent(item, 'gdoc')}
             className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
           >
             <FileEdit className="h-4 w-4" />
             {t('gdocs', 'Google Docs')}
           </Button>
           
           <Button
             variant="outline"
             size="sm"
             onClick={() => downloadContent(item, 'word')}
             className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
           >
             <FileEdit className="h-4 w-4" />
             {t('word', 'OneDrive Word')}
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
                 {t('actions.download', 'Download')}
                 <ChevronDown className="h-3 w-3" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => downloadContent(item, 'markdown')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('export.markdown', 'Markdown (.md)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'html')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('export.html', 'HTML (.html)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'txt')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('export.txt', 'Text (.txt)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'pdf')}>
                 <Download className="h-4 w-4 mr-2" />
                 {t('export.pdf', 'PDF (.pdf)')}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => downloadContent(item, 'gdoc')}>
                 <Share2 className="h-4 w-4 mr-2" />
                 {t('gdocs', 'Google Docs (Collaborative)')}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => downloadContent(item, 'word')}>
                 <Share2 className="h-4 w-4 mr-2" />
                 {t('word', 'OneDrive Word (Collaborative)')}
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </Card>
     ))}

     {/* Preview Dialog */}
     <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
       <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
         <DialogHeader>
           <DialogTitle className="flex items-center justify-between">
             <span>{selectedContent?.inputs.topic}</span>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => selectedContent && copyToClipboard(selectedContent.content)}
                 className="flex items-center gap-1"
               >
                 <Copy className="h-4 w-4" />
                 {t('actions.copy', 'Copy')}
               </Button>
               
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button
                     variant="outline"
                     size="sm"
                     className="flex items-center gap-1"
                   >
                     <Download className="h-4 w-4" />
                     {t('actions.export', 'Export')}
                     <ChevronDown className="h-3 w-3" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'gdoc')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     {t('gdocs', 'Google Docs (Collaborative)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'word')}>
                     <FileEdit className="h-4 w-4 mr-2" />
                     {t('word', 'OneDrive Word (Collaborative)')}
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'markdown')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('export.markdown', 'Markdown (.md)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'html')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('export.html', 'HTML (.html)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'txt')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('export.txt', 'Text (.txt)')}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => selectedContent && downloadContent(selectedContent, 'pdf')}>
                     <Download className="h-4 w-4 mr-2" />
                     {t('export.pdf', 'PDF (.pdf)')}
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>
           </DialogTitle>
           <DialogDescription>
             {selectedContent && (
               <div className="flex flex-wrap gap-2 mt-2">
                 <Badge className={getContentTypeColor(selectedContent.inputs.contentType)}>
                   {selectedContent.inputs.contentType.replace('-', ' ')}
                 </Badge>
                 <Badge variant="outline">
                   {selectedContent.metadata.actualWordCount.toLocaleString()} {t('words', 'words')}
                 </Badge>
                 <Badge variant="outline">
                   {selectedContent.metadata.estimatedReadingTime} {t('minRead', 'min read')}
                 </Badge>
               </div>
             )}
           </DialogDescription>
         </DialogHeader>
         
         <div className="overflow-y-auto max-h-[60vh] prose prose-sm dark:prose-invert max-w-none">
           {selectedContent && (
             <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
               {selectedContent.content}
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   </div>
 );
};

export default LongformContentManager;

