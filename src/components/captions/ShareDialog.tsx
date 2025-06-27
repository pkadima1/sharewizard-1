import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share, Download, X } from 'lucide-react';
import { toast } from "sonner";

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
      toast.success("Partagé avec succès !");
      onClose();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error sharing:", error);
        toast.error("Échec du partage. Veuillez réessayer.");
      }
    }
  };
  
  // Function to copy text to clipboard as fallback
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Légende copiée dans le presse-papiers !");
    } catch (error) {
      console.error("Clipboard error:", error);
      toast.error("Impossible de copier dans le presse-papiers");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager le Contenu</DialogTitle>
        </DialogHeader>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Préparation de votre contenu pour le partage...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre un moment, surtout pour les vidéos</p>
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
                  Partager Maintenant
                </Button>
              )}
              
              <Button onClick={copyToClipboard} variant="outline" className="w-full">
                Copier le Texte de la Légende
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
                  Télécharger le Fichier
                </Button>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
