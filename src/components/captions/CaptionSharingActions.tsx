
import React, { useEffect, useState } from 'react';
import { GeneratedCaption } from '@/services/openaiService';
import { MediaType } from '@/types/mediaTypes';
import SocialSharing from './SocialSharing';
import ShareDialog from './ShareDialog';
import ShareInfo from './ShareInfo';
import { downloadPreview } from '@/utils/sharingUtils';
import { prepareMediaForSharing } from '@/utils/mediaPreparation';
import { toast } from "sonner";

interface CaptionSharingActionsProps {
  previewRef: React.RefObject<HTMLDivElement>;
  captions: GeneratedCaption[];
  selectedCaption: number;
  isEditing: boolean;
  isSharing: boolean;
  setIsSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isDownloading: boolean;
  setIsDownloading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPlatform: string;
  previewUrl: string | null;
  mediaType: MediaType;
  captionOverlayMode: 'overlay' | 'below';
}

const CaptionSharingActions: React.FC<CaptionSharingActionsProps> = ({
  previewRef,
  captions,
  selectedCaption,
  isEditing,
  isSharing,
  setIsSharing,
  isDownloading,
  setIsDownloading,
  selectedPlatform,
  previewUrl,
  mediaType,
  captionOverlayMode
}) => {
  // State for the share dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [preparedShareData, setPreparedShareData] = useState<{
    title: string;
    text: string;
    file?: File;
  } | null>(null);
  
  // Log previewRef on mount and update to help with debugging
  useEffect(() => {
    console.log('CaptionSharingActions previewRef:', previewRef);
    console.log('previewRef current:', previewRef.current);
  }, [previewRef, previewRef.current]);
  
  const handleShareToSocial = async () => {
    if (!previewRef.current) {
      toast.error("Conteneur d'aperçu introuvable. Veuillez réessayer.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    const sharableContent = previewRef.current.querySelector('#sharable-content');
    if (!sharableContent) {
      toast.error("Contenu partageable introuvable. Veuillez réessayer.");
      console.error("Sharable content not found in:", previewRef.current);
      return;
    }
    
    if (!captions[selectedCaption]) {
      toast.error("Aucune légende sélectionnée à partager");
      return;
    }
    
    try {
      // Start the sharing process and show the dialog immediately
      setIsSharing(true);
      setShowShareDialog(true);
      setPreparedShareData(null); // Reset any previous data
      
      console.log("Starting sharing process for media type:", mediaType);
      
      // Prepare the media in the background
      const prepared = await prepareMediaForSharing(
        previewRef,
        captions[selectedCaption],
        mediaType
      );
      
      // Update the dialog with prepared content
      setPreparedShareData({
        title: prepared.title,
        text: prepared.formattedCaption,
        file: prepared.mediaFile
      });
      
      // Dialog stays open for user to click actual share button
    } catch (error) {
      console.error("Error preparing media for sharing:", error);
      toast.error("Échec de la préparation du contenu pour le partage. Veuillez réessayer.");
      setShowShareDialog(false);
    } finally {
      setIsSharing(false);
    }
  };
  const handleDownload = () => {
    if (!previewRef.current) {
      toast.error("Preview container not found. Please try again.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    const sharableContent = previewRef.current.querySelector('#sharable-content');
    if (!sharableContent) {
      toast.error("Sharable content not found. Please try again.");
      console.error("Sharable content not found in:", previewRef.current);
      return;
    }
    
    if (!captions[selectedCaption]) {
      toast.error("No caption selected for download");
      return;
    }
    
    // Simply set isDownloading to true, and the useEffect will handle the actual download
    setIsDownloading(true);
  };
  // Use the proper downloadPreview directly from sharingUtils
  useEffect(() => {
    const handleDownloadProcess = async () => {
      if (isDownloading && previewRef.current) {
        try {          const caption = captions[selectedCaption];
          if (!caption) {
            toast.error("No caption selected for download");
            setIsDownloading(false);
            return;
          }
          const timestamp = new Date().getTime();
          // Add appropriate file extension based on media type
          const extension = mediaType === 'video' ? '.mp4' : '.png';
          const filename = `${caption.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}${extension}`;          
          // Always use modern (overlay) style for videos
          const captionStyle = mediaType === 'video' ? 'modern' : (captionOverlayMode === 'overlay' ? 'handwritten' : 'standard');
          
          // Import the real download function from sharingUtils instead of downloadHelper
          const { downloadPreview } = await import('@/utils/sharingUtils');
          await downloadPreview(
            previewRef,
            mediaType,
            caption,
            filename,
            captionStyle
          );
        } catch (error) {
          console.error("Error in download process:", error);
          toast.error("Échec du téléchargement. Veuillez réessayer.");
        } finally {
          setIsDownloading(false);
        }
      }
    };
    
    handleDownloadProcess();
  }, [isDownloading, previewRef, captions, selectedCaption, mediaType, captionOverlayMode, setIsDownloading]);
  return (
    <>
      <SocialSharing 
        isEditing={isEditing}
        isSharing={isSharing}
        onShareClick={handleShareToSocial}


        /* ====================commented out for now until full SM platforms integration============*/
       
       // selectedPlatform={selectedPlatform}
        caption={captions[selectedCaption]}
        mediaType={mediaType}
        previewUrl={previewUrl}
      />
      
      {/* Add explanation about two-step sharing for videos */}
      {mediaType === 'video' && <ShareInfo isVideo={true} className="mt-3" />}
      
      {/* Two-step sharing dialog */}
      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          title={preparedShareData?.title || (captions[selectedCaption]?.title || "Partager le Contenu")}
          text={preparedShareData?.text || ""}
          file={preparedShareData?.file}
          isProcessing={!preparedShareData} // Show processing state until data is ready
        />
      )}
    </>
  );
};

export default CaptionSharingActions;
