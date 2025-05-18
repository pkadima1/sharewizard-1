import html2canvas from 'html2canvas';
import React from 'react';
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MediaType, Caption, CaptionStyle, DownloadOptions } from '@/types/mediaTypes';
import { stripMarkdownFormatting } from './textFormatters';

/**
 * Prepares media for sharing, but doesn't actually call navigator.share()
 * This solves the Web Share API user gesture requirement by separating preparation
 * from the actual sharing action
 */
export const prepareMediaForSharing = async (
  previewRef: React.RefObject<HTMLDivElement>,
  caption: Caption,
  mediaType: MediaType
): Promise<{
  formattedCaption: string;
  title: string;
  mediaFile?: File;
}> => {
  if (!previewRef.current) {
    toast.error('Preview element not found');
    throw new Error('Preview element not found');
  }

  // Target the sharable-content element
  const sharableContent = previewRef.current.querySelector('#sharable-content');
  if (!sharableContent) {
    toast.error('Sharable content not found');
    throw new Error('Sharable content not found');
  }
  
  // Format the caption text properly for sharing and strip markdown
  const formattedCaption = joinCaptionFields(
    stripMarkdownFormatting(caption.title),
    stripMarkdownFormatting(caption.caption),
    stripMarkdownFormatting(caption.cta),
    caption.hashtags.map(tag => `#${stripMarkdownFormatting(tag)}`).join(' ')
  );
  
  let mediaFile: File | undefined;
  
  if (mediaType === 'video') {
    // For video content, process it with captions
    const video = sharableContent.querySelector('video');
    if (!video) {
      toast.error('Video element not found');
      throw new Error('Video element not found');
    }
    
    // Make sure video is loaded properly
    if (video.readyState < 2) { // HAVE_CURRENT_DATA or higher
      // Wait for video to be loaded enough to get dimensions
      await new Promise<void>((resolve) => {
        const checkReadyState = () => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReadyState, 100);
          }
        };
        checkReadyState();
      });
    }
    
    console.log('Processing video with dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    try {
      // Create captioned video with overlay - always use modern style for videos
      const captionedVideoBlob = await createCaptionedVideo(video, caption, 'modern');
      console.log('Captioned video blob created for sharing:', captionedVideoBlob.size, 'bytes');
      
      // Convert to appropriate format for sharing
      const timestamp = Date.now();
      mediaFile = new File([captionedVideoBlob], `video-${timestamp}.mp4`, { 
        type: 'video/mp4' 
      });
    } catch (videoError) {
      console.error('Error processing video:', videoError);
      
      // Fallback to screenshot of video if processing fails
      try {
        const canvas = await html2canvas(sharableContent as HTMLElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          logging: false,
          backgroundColor: '#1e1e1e'
        });
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 
            'image/png', 
            0.95
          );
        });
        
        mediaFile = new File([blob], `video-screenshot-${Date.now()}.png`, { 
          type: 'image/png' 
        });
      } catch (fallbackError) {
        console.error('Fallback screenshot failed:', fallbackError);
        // Continue without media file
      }
    }
  } else if (mediaType === 'image') {
    // For images, capture the entire preview with HTML2Canvas with enhanced quality
    const canvas = await html2canvas(sharableContent as HTMLElement, {
      useCORS: true,
      allowTaint: true,
      scale: 4,  // Higher scale for better quality
      logging: false,
      backgroundColor: '#1e1e1e',
      ignoreElements: (element) => {
        // Ignore elements that shouldn't be captured
        return element.classList.contains('social-share-buttons') ||
              element.classList.contains('preview-controls');
      },
      onclone: (clonedDoc) => {
        // Apply additional styling to the clone for better rendering
        const clonedContent = clonedDoc.querySelector('#sharable-content');
        if (clonedContent) {
          // Apply styles to improve text rendering in the captured image
          const textElements = clonedContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
          textElements.forEach(el => {
            (el as HTMLElement).style.textRendering = 'optimizeLegibility';
            (el as HTMLElement).style.setProperty('-webkit-font-smoothing', 'antialiased');
            (el as HTMLElement).style.setProperty('-moz-osx-font-smoothing', 'grayscale');
            (el as HTMLElement).style.letterSpacing = '0.01em';
          });
        }
      }
    });
        
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 
        'image/png', 
        0.95
      );
    });
        
    mediaFile = new File([blob], `image-${Date.now()}.png`, { 
      type: 'image/png' 
    });
  }
  
  return {
    formattedCaption,
    title: stripMarkdownFormatting(caption.title),
    mediaFile
  };
};

/**
 * Helper function to join caption fields
 */
export function joinCaptionFields(...fields: (string | string[])[]) {
  return fields
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n'); // Prevent triple newlines
}

// Import functions from sharingUtils.ts
import { createCaptionedVideo, downloadPreview } from './sharingUtils';

// Re-export for convenience
export { createCaptionedVideo, downloadPreview };
