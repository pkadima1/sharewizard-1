import { toast } from "sonner";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from '@/lib/firebase';  // Import the central functions instance

export interface GeneratedCaption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface CaptionResponse {
  captions: GeneratedCaption[];
  requests_remaining: number;
}

// Create the callable function using the shared instance
const generateCaptionsFunction = httpsCallable<
  {
    platform: string;
    tone: string;
    niche: string;
    goal: string;
    postIdea?: string;
    requestId?: string;
    lang?: string;
  }, 
  CaptionResponse
>(functions, 'generateCaptionsV3');

/**
 * Generates captions based on user inputs
 * Works in both development (with emulators) and production environments
 */
export const generateCaptions = async (
  platform: string,
  tone: string,
  niche: string,
  goal: string,
  postIdea?: string,
  lang?: string
): Promise<CaptionResponse> => {
  try {
    // Generate a unique request ID
    const requestId = `${platform}_${niche}_${Date.now()}`;
    
    // Call the Firebase function
    const result = await generateCaptionsFunction({
      platform,
      tone,
      niche,
      goal,
      postIdea,
      requestId,
      lang
    });
    
    // Make sure we have valid data
    if (!result.data || !Array.isArray(result.data.captions)) {
      throw new Error("Invalid response format");
    }

    return result.data;
  } catch (error: any) {
    console.error('Error generating captions:', error);
    
    // Improve error messages based on environment
    const isEmulator = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isEmulator && error.message?.includes('CORS')) {
      console.warn('CORS error detected in development. Make sure Firebase emulators are running.');
      throw new Error(`Development environment error: ${error.message}. Make sure Firebase emulators are running.`);
    }
    
    throw error;
  }
};
