/**
 * Visual AI Services - Client-side API for Foundry Lab
 * 
 * This service provides a clean interface to Google's visual AI models:
 * - Gemini 2.5 Flash Image (Nano Banana) for image editing
 * - Imagen 4 for image generation
 * - Veo 3 for video generation
 * 
 * All model names are abstracted away - they're implementation details
 * handled by the backend Firebase Functions.
 */

import { toast } from '@/hooks/use-toast';

// Get the base URL for Firebase Functions
const getFunctionsBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL;
  
  if (!baseUrl) {
    console.warn('VITE_FUNCTIONS_BASE_URL not configured, using local development');
    // For development, use relative path or localhost
    return import.meta.env.DEV 
      ? 'http://localhost:5001/engperfecthlc/us-central1'
      : 'https://us-central1-engperfecthlc.cloudfunctions.net';
  }
  
  return baseUrl;
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
 * Edit an image with multiple prompts using Gemini 2.5 Flash Image
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

    // Call backend API
    const response = await fetch(`${getFunctionsBaseUrl()}/editImageWithGemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        prompts,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform response to expected format
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from API');
    }

    return data.results.map((result: any) => ({
      prompt: result.prompt,
      dataUrl: result.dataUrl,
    }));

  } catch (error) {
    console.error('editImage error:', error);
    
    // Show user-friendly error
    toast({
      title: 'Edit Failed',
      description: error instanceof Error ? error.message : 'Failed to edit image',
      variant: 'destructive',
    });
    
    // Return empty array on error
    return [];
  }
};

/**
 * Generate images from a text prompt using Imagen 4
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

    // Call backend API
    const response = await fetch(`${getFunctionsBaseUrl()}/generateImagesWithImagen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        numberOfImages,
        aspectRatio,
        personGeneration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response
    if (!data.images || !Array.isArray(data.images)) {
      throw new Error('Invalid response format from API');
    }

    return data.images;

  } catch (error) {
    console.error('generateImages error:', error);
    
    // Show user-friendly error
    toast({
      title: 'Generation Failed',
      description: error instanceof Error ? error.message : 'Failed to generate images',
      variant: 'destructive',
    });
    
    // Return empty array on error
    return [];
  }
};

/**
 * Generate a video from a text prompt using Veo 3
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

    // Call backend API
    const response = await fetch(`${getFunctionsBaseUrl()}/generateVideoWithVeo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        resolution,
        durationSeconds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 501 Not Implemented specifically
      if (response.status === 501) {
        throw new Error(`Video generation not yet implemented: ${errorData.message || 'Feature coming soon'}`);
      }
      
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response
    if (!data.mimeType || !data.dataUrl) {
      throw new Error('Invalid response format from API');
    }

    return {
      mimeType: data.mimeType,
      dataUrl: data.dataUrl,
    };

  } catch (error) {
    console.error('generateVideo error:', error);
    
    // Show user-friendly error
    toast({
      title: 'Generation Failed',
      description: error instanceof Error ? error.message : 'Failed to generate video',
      variant: 'destructive',
    });
    
    // Return null on error
    return null;
  }
};
