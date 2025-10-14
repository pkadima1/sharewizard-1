/**
 * Download Utilities for Foundry Lab
 * 
 * Provides functions to download, copy, and share generated assets
 */

import { toast } from '@/hooks/use-toast';

/**
 * Download a data URL as a file
 */
export const downloadDataUrl = (filename: string, dataUrl: string): void => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: `Downloading ${filename}`,
    });
  } catch (error) {
    console.error('Download error:', error);
    toast({
      title: 'Download Failed',
      description: 'Failed to download file',
      variant: 'destructive',
    });
  }
};

/**
 * Copy a data URL to clipboard
 */
export const copyDataUrl = async (dataUrl: string): Promise<void> => {
  try {
    // For images, try to copy as blob for better compatibility
    if (dataUrl.startsWith('data:image/')) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } else {
      // For other types, copy the data URL as text
      await navigator.clipboard.writeText(dataUrl);
    }
    
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  } catch (error) {
    console.error('Copy error:', error);
    
    // Fallback: copy as text
    try {
      await navigator.clipboard.writeText(dataUrl);
      toast({
        title: 'Copied',
        description: 'Copied to clipboard',
      });
    } catch (fallbackError) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  }
};

/**
 * Share an asset using Web Share API with fallback to download
 */
export interface ShareAssetOptions {
  title: string;
  text: string;
  dataUrl: string;
  filename: string;
}

export const shareAsset = async (options: ShareAssetOptions): Promise<void> => {
  const { title, text, dataUrl, filename } = options;
  
  try {
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create a File from blob
      const file = new File([blob], filename, { type: blob.type });
      
      // Check if we can share this file
      const shareData = {
        title,
        text,
        files: [file],
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        
        toast({
          title: 'Shared',
          description: 'Content shared successfully',
        });
        return;
      }
    }
    
    // Fallback: download the file
    toast({
      title: 'Share Not Supported',
      description: 'Downloading file instead...',
    });
    downloadDataUrl(filename, dataUrl);
    
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled - don't show error
      return;
    }
    
    console.error('Share error:', error);
    
    // Fallback to download
    toast({
      title: 'Share Failed',
      description: 'Downloading file instead...',
    });
    downloadDataUrl(filename, dataUrl);
  }
};

/**
 * Generate a unique filename with timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Get file extension from mime type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  
  return mimeMap[mimeType] || 'bin';
};

/**
 * Get mime type from data URL
 */
export const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'application/octet-stream';
};
