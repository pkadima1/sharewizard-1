/**
 * Visual AI Services - Client-side API for Foundry Lab
 * 
 * This service provides a clean interface to Google's visual AI models:
 * - Gemini 2.5 Flash Image (Nano Banana) for image editing
 * - Imagen 4 for image generation
 * - Veo 3 for video generation
 * 
 * All functions require authentication and consume credits:
 * - Image editing: 5 credits per request
 * - Image generation: 5 credits per request
 * 
 * All model names are abstracted away - they're implementation details
 * handled by the backend Firebase Functions.
 */

import { toast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Callback type for showing insufficient credits dialog
type InsufficientCreditsCallback = (creditsNeeded: number, creditsAvailable: number, featureName: string) => void;

// Global callback for insufficient credits dialog
let insufficientCreditsCallback: InsufficientCreditsCallback | null = null;

/**
 * Set the callback for showing insufficient credits dialog
 * This should be called from the component that renders the dialog
 */
export const setInsufficientCreditsCallback = (callback: InsufficientCreditsCallback | null) => {
  insufficientCreditsCallback = callback;
};

// Types
export interface EditImageResult {
  prompt: string;
  dataUrl: string;
}

export interface GenerateImagesOptions {
  numberOfImages?: 1 | 2 | 3 | 4;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  personGeneration?: 'dont_allow' | 'allow_adult';
}

export interface GenerateVideoOptions {
  resolution?: '720p' | '1080p';
  durationSeconds?: number; // max 8
}

export interface GenerateVideoResult {
  mimeType: string;
  dataUrl: string;
}

/**
 * Edit an image with multiple prompts using Gemini 2.5 Flash Image
 * 
 * REQUIRES: User must be logged in
 * COSTS: 5 credits per request
 * 
 * Returns an array of edited images, one per prompt
 */
export const editImage = async (
  baseFile: File,
  prompts: string[]
): Promise<EditImageResult[]> => {
  try {
    // Validate inputs
    if (!baseFile) {
      throw new Error('No image file provided');
    }
    
    if (!prompts || prompts.length === 0) {
      throw new Error('No edit prompts provided');
    }

    // Validate file size (8MB max)
    const maxSize = 8 * 1024 * 1024; // 8MB in bytes
    if (baseFile.size > maxSize) {
      throw new Error('File size exceeds 8MB limit');
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(baseFile.type)) {
      throw new Error('Invalid file type. Please use PNG, JPG, or WEBP');
    }

    // Convert to base64
    const imageBase64 = await fileToBase64(baseFile);
    const mimeType = baseFile.type;

    // Call Firebase callable function
    const editImageFn = httpsCallable(functions, 'editImageWithGemini');
    const result = await editImageFn({
      imageBase64,
      mimeType,
      prompts,
    });

    const data = result.data as {
      success: boolean;
      results?: EditImageResult[];
      requestsRemaining?: number;
      error?: string;
    };

    if (!data.success || !data.results) {
      throw new Error(data.error || 'Failed to edit image');
    }

    // Show success toast with remaining credits
    if (data.requestsRemaining !== undefined) {
      toast({
        title: 'Image Edited Successfully',
        description: `${data.results.length} edits completed. ${data.requestsRemaining} credits remaining.`,
      });
    }

    return data.results;

  } catch (error: any) {
    console.error('editImage error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to edit images.',
        variant: 'destructive',
      });
    } else if (error.code === 'functions/resource-exhausted') {
      // Extract credits info from error
      const creditsNeeded = 5;
      const creditsAvailable = error.details?.requestsRemaining || 0;
      
      // Show promotional dialog if callback is set
      if (insufficientCreditsCallback) {
        insufficientCreditsCallback(creditsNeeded, creditsAvailable, 'Image Editing');
      } else {
        // Fallback to toast
        toast({
          title: 'Insufficient Credits',
          description: error.message || 'You need 5 credits to edit images. Please upgrade your plan.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Edit Failed',
        description: error.message || 'Failed to edit image',
        variant: 'destructive',
      });
    }
    
    // Return empty array on error
    return [];
  }
};

/**
 * Convert File to base64 string (without data: prefix for backend)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generate images from a text prompt using Imagen 4
 * 
 * REQUIRES: User must be logged in
 * COSTS: 5 credits per request
 * 
 * Returns an array of data URLs for the generated images
 */
export const generateImages = async (
  prompt: string,
  options: GenerateImagesOptions = {}
): Promise<string[]> => {
  try {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('No prompt provided');
    }

    // Set defaults
    const numberOfImages = options.numberOfImages || 1;
    const aspectRatio = options.aspectRatio || '1:1';
    const personGeneration = options.personGeneration || 'dont_allow';

    // Call Firebase callable function
    const generateImagesFn = httpsCallable(functions, 'generateImagesWithImagen');
    const result = await generateImagesFn({
      prompt,
      numberOfImages,
      aspectRatio,
      personGeneration,
    });

    const data = result.data as {
      success: boolean;
      images?: string[];
      requestsRemaining?: number;
      error?: string;
    };

    if (!data.success || !data.images || !Array.isArray(data.images)) {
      throw new Error(data.error || 'Failed to generate images');
    }

    // Show success toast with remaining credits
    if (data.requestsRemaining !== undefined) {
      toast({
        title: 'Images Generated Successfully',
        description: `${data.images.length} images created. ${data.requestsRemaining} credits remaining.`,
      });
    }

    return data.images;

  } catch (error: any) {
    console.error('generateImages error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to generate images.',
        variant: 'destructive',
      });
    } else if (error.code === 'functions/resource-exhausted') {
      // Extract credits info from error
      const creditsNeeded = 5;
      const creditsAvailable = error.details?.requestsRemaining || 0;
      
      // Show promotional dialog if callback is set
      if (insufficientCreditsCallback) {
        insufficientCreditsCallback(creditsNeeded, creditsAvailable, 'Image Generation');
      } else {
        // Fallback to toast
        toast({
          title: 'Insufficient Credits',
          description: error.message || 'You need 5 credits to generate images. Please upgrade your plan.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate images',
        variant: 'destructive',
      });
    }
    
    // Return empty array on error
    return [];
  }
};

/**
 * Generate a video from a text prompt using Veo 3
 * 
 * REQUIRES: User must be logged in
 * STATUS: Not yet implemented - returns error
 * 
 * Returns a video data URL
 */
export const generateVideo = async (
  prompt: string,
  options: GenerateVideoOptions = {}
): Promise<GenerateVideoResult | null> => {
  try {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('No prompt provided');
    }

    // Set defaults and validate duration
    const resolution = options.resolution || '720p';
    const durationSeconds = options.durationSeconds || 5;

    if (durationSeconds < 1 || durationSeconds > 8) {
      throw new Error('Duration must be between 1 and 8 seconds');
    }

    // Call Firebase callable function
    const generateVideoFn = httpsCallable(functions, 'generateVideoWithVeo');
    const result = await generateVideoFn({
      prompt,
      resolution,
      durationSeconds,
    });

    const data = result.data as {
      mimeType?: string;
      dataUrl?: string;
      error?: string;
    };

    if (!data.mimeType || !data.dataUrl) {
      throw new Error(data.error || 'Failed to generate video');
    }

    return {
      mimeType: data.mimeType,
      dataUrl: data.dataUrl,
    };

  } catch (error: any) {
    console.error('generateVideo error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unimplemented') {
      toast({
        title: 'Coming Soon',
        description: 'Video generation with Veo 3 is not yet implemented.',
      });
    } else if (error.code === 'functions/unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to generate videos.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate video',
        variant: 'destructive',
      });
    }
    
    return null;
  }
};
