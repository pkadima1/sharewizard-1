import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share, Download, X } from 'lucide-react';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  file?: File;
  isProcessing: boolean;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  text, 
  file,
  isProcessing
}) => {
  const { t } = useTranslation(['common', 'wizard']);
  const [canShare, setCanShare] = useState(false);
  
  // Check if sharing is supported
  useEffect(() => {
    const checkShareSupport = async () => {
      if (navigator.share) {
        if (file) {
          setCanShare(!!navigator.canShare && navigator.canShare({ files: [file] }));
        } else {
          setCanShare(true);
        }
      } else {
        setCanShare(false);
      }
    };
    
    checkShareSupport();
  }, [file]);

  // Function to handle direct sharing
  const handleShare = async (e: React.MouseEvent) => {
    // This is called directly from a user interaction
    try {
      const shareData: ShareData = { title, text };
      
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }
      
      await navigator.share(shareData);
      toast.success(t('wizard:captions.sharedSuccessfully', "Shared successfully!"));
      onClose();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error sharing:", error);
        toast.error(t('wizard:captions.sharingFailed', "Sharing failed. Please try again."));
      }
    }
  };
  
  // Function to copy text to clipboard as fallback
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('wizard:captions.copiedToClipboard', "Caption copied to clipboard!"));
    } catch (error) {
      console.error("Clipboard error:", error);
      toast.error(t('wizard:captions.clipboardError', "Couldn't copy to clipboard"));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('wizard:captions.shareContent', "Share Content")}</DialogTitle>
        </DialogHeader>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>{t('wizard:captions.preparingContent', "Preparing your content for sharing...")}</p>
            <p className="text-sm text-gray-500 mt-2">{t('wizard:captions.preparingHint', "This may take a moment, especially for videos")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded">
              {text}
            </div>
            
            <div className="flex flex-col space-y-3">
              {canShare && (
                <Button onClick={handleShare} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Share className="mr-2 h-4 w-4" />
                  {t('wizard:captions.shareNow', "Share Now")}
                </Button>
              )}
              
              <Button onClick={copyToClipboard} variant="outline" className="w-full">
                {t('wizard:captions.copyCaptionText', "Copy Caption Text")}
              </Button>
              
              {file && (
                <Button 
                  onClick={() => {
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('wizard:captions.downloadFile', "Download File")}
                </Button>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('common.close', "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
