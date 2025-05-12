import { MediaType, Caption, CaptionStyle } from '@/types/mediaTypes';
import { toast } from "sonner";
import React from 'react';

/**
 * Simplified version of the download preview function to test exports
 */
export const downloadPreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  mediaType: MediaType,
  caption: Caption,
  filename?: string,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  toast.success('Download started');
  console.log('Download preview called with:', {
    mediaType,
    caption,
    filename,
    captionStyle
  });
};
