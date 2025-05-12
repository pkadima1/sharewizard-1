
import React, { useEffect } from 'react';
import { GeneratedCaption } from '@/services/openaiService';
import { MediaType } from '@/types/mediaTypes';
import SocialSharing from './SocialSharing';
import { sharePreview, downloadPreview } from '@/utils/sharingUtils';
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
  // Log previewRef on mount and update to help with debugging
  useEffect(() => {
    console.log('CaptionSharingActions previewRef:', previewRef);
    console.log('previewRef current:', previewRef.current);
  }, [previewRef, previewRef.current]);

  const handleShareToSocial = async () => {
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
      toast.error("No caption selected to share");
      return;
    }
    
    try {
      setIsSharing(true);
      console.log("Starting sharing process for media type:", mediaType);
      
      const result = await sharePreview(
        previewRef,
        captions[selectedCaption],
        mediaType
      );
      
      if (result.message) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Please try again.");
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
        try {
          const caption = captions[selectedCaption];
          if (!caption) {
            toast.error("No caption selected for download");
            setIsDownloading(false);
            return;
          }
            const timestamp = new Date().getTime();
          const filename = `${caption.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;          
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
          toast.error("Download failed. Please try again.");
        } finally {
          setIsDownloading(false);
        }
      }
    };
    
    handleDownloadProcess();
  }, [isDownloading, previewRef, captions, selectedCaption, mediaType, captionOverlayMode, setIsDownloading]);
  
  return (
    <SocialSharing 
      isEditing={isEditing}
      isSharing={isSharing}
      onShareClick={handleShareToSocial}
      selectedPlatform={selectedPlatform}
      caption={captions[selectedCaption]}
      mediaType={mediaType}
      previewUrl={previewUrl}
    />
  );
};

export default CaptionSharingActions;
