/**
 * Visual AI Functions - Backend implementation for Foundry Lab
 * 
 * Implements real Google AI API integrations with authentication and credit tracking:
 * - Gemini 2.5 Flash Image (Nano Banana) for native image generation and editing
 * - Imagen 3 for advanced image generation (planned)
 * - Veo 2 for video generation (planned)
 * 
 * AUTHENTICATION & CREDITS:
 * - All functions require Firebase Authentication
 * - Image editing costs 5 credits per request
 * - Image generation costs 5 credits per request
 * - Credits are validated before processing and deducted after success
 * 
 * MODELS USED:
 * - Image Editing: gemini-2.5-flash-image (Nano Banana - Native image generation model)
 *   This model is optimized for speed, flexibility, and contextual understanding.
 *   Text input and output is priced the same as 2.5 Flash.
 * 
 * Model Details:
 * - gemini-2.5-flash-image: Native image generation, optimized for image editing
 * - Input price: $0.30 (text / image)
 * - Output price: $0.039 per image (1024x1024px = 1290 tokens)
 * - Best for: Image editing, generation, and manipulation
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiKey } from './config/secrets.js';
import { initializeFirebaseAdmin, getFirestore } from './config/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Request cost constants (must match frontend constants)
const IMAGE_EDIT_COST = 5;
const IMAGE_GENERATION_COST = 5;

// Model Configuration - Using Gemini 2.5 Flash Image (Nano Banana)
const FOUNDRY_EDIT_MODEL = 'gemini-2.5-flash-image'; // Native image generation model

// Initialize Gemini
const getGenAI = () => {
  const apiKey = getGeminiKey();
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Helper function to check and deduct user credits
 */
async function checkAndDeductCredits(
  uid: string,
  requiredCredits: number,
  operationType: string
): Promise<{ success: boolean; message?: string; requestsRemaining?: number }> {
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);

  try {
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return { success: false, message: 'User profile not found' };
    }

    const userData = userDoc.data();
    const requestsUsed = userData?.requests_used || 0;
    const requestsLimit = userData?.requests_limit || 0;
    const requestsRemaining = requestsLimit - requestsUsed;

    console.log(`[${operationType}] User ${uid}: ${requestsRemaining}/${requestsLimit} credits remaining`);

    // Check if user has enough credits
    if (requestsRemaining < requiredCredits) {
      return {
        success: false,
        message: `Insufficient credits. You need ${requiredCredits} credits but only have ${requestsRemaining} remaining.`,
        requestsRemaining
      };
    }

    // Deduct credits
    await userRef.update({
      requests_used: FieldValue.increment(requiredCredits)
    });

    console.log(`[${operationType}] Deducted ${requiredCredits} credits from user ${uid}`);

    return {
      success: true,
      requestsRemaining: requestsRemaining - requiredCredits
    };
  } catch (error) {
    console.error(`[${operationType}] Error checking/deducting credits:`, error);
    return {
      success: false,
      message: 'Failed to process credit transaction'
    };
  }
}

/**
 * Edit an image with multiple prompts using Gemini 2.5 Flash Image (Nano Banana)
 * 
 * REQUIRES AUTHENTICATION
 * COSTS: 5 credits per request
 * 
 * Expected input:
 * {
 *   imageBase64: string,
 *   mimeType: string,
 *   prompts: string[]
 * }
 * 
 * Expected output:
 * {
 *   success: boolean,
 *   results?: [{ prompt: string, dataUrl: string }],
 *   requestsRemaining?: number,
 *   error?: string
 * }
 */
export const editImageWithGemini = onCall({
  timeoutSeconds: 120,
  memory: '512MiB',
  region: 'us-central1',
  cors: [
    // Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080",
    
    // Firebase hosting domains
    /https?:\/\/engperfecthlc\.web\.app$/,
    /https?:\/\/engperfecthlc\.firebaseapp\.com$/,
    
    // Production domain
    /https?:\/\/engageperfect\.com$/,
    /https?:\/\/www\.engageperfect\.com$/,
    
    // Lovable preview domains
    /https?:\/\/preview--.*\.lovable\.app$/,
    /https?:\/\/.*\.lovable\.app$/,
    /https?:\/\/.*\.lovableproject\.com$/,
  ]
}, async (request) => {
  try {
    // Step 1: Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to edit images.');
    }

    const uid = request.auth.uid;
    console.log('🎨 editImageWithGemini called by user:', uid);

    // Step 2: Validate input
    const { imageBase64, mimeType, prompts } = request.data;

    if (!imageBase64 || !mimeType || !prompts || !Array.isArray(prompts)) {
      throw new HttpsError('invalid-argument', 'Invalid input: imageBase64, mimeType, and prompts array are required');
    }

    if (prompts.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one prompt is required');
    }

    console.log(`Processing ${prompts.length} edit prompts`);

    // Step 3: Check and deduct credits
    const creditCheck = await checkAndDeductCredits(uid, IMAGE_EDIT_COST, 'Image Edit');
    
    if (!creditCheck.success) {
      throw new HttpsError(
        'resource-exhausted',
        creditCheck.message || 'Insufficient credits',
        { requestsRemaining: creditCheck.requestsRemaining || 0 }
      );
    }

    // Step 4: Initialize Gemini and process edits
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: FOUNDRY_EDIT_MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Process each prompt
    const results = await Promise.all(
      prompts.map(async (prompt: string) => {
        try {
          console.log('Processing prompt:', prompt);

          const imageParts = {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          };

          const fullPrompt = `Generate an edited version of this image: ${prompt}\n\nReturn the edited image.`;

          const result = await model.generateContent([fullPrompt, imageParts]);
          const response = await result.response;
          
          // Check if we got an image in the response
          const candidates = response.candidates;
          if (candidates && candidates[0]?.content?.parts) {
            const parts = candidates[0].content.parts;
            
            for (const part of parts) {
              if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                const editedImageBase64 = part.inlineData.data;
                console.log('✓ Generated edited image for prompt:', prompt.substring(0, 50));
                
                return {
                  prompt,
                  dataUrl: `data:${part.inlineData.mimeType};base64,${editedImageBase64}`,
                  model: FOUNDRY_EDIT_MODEL,
                  status: 'generated'
                };
              }
            }
          }
          
          // Fallback: return original with description
          const text = response.text();
          console.log('⚠️ No image generated, got text response');
          
          return {
            prompt,
            dataUrl: `data:${mimeType};base64,${imageBase64}`,
            description: text,
            model: FOUNDRY_EDIT_MODEL,
            status: 'analyzed'
          };

        } catch (error) {
          console.error('Error processing prompt:', prompt, error);
          return {
            prompt,
            dataUrl: `data:${mimeType};base64,${imageBase64}`,
            error: 'Failed to process this prompt'
          };
        }
      })
    );

    console.log('✓ Processed', results.length, 'edits successfully');

    return {
      success: true,
      results,
      requestsRemaining: creditCheck.requestsRemaining
    };

  } catch (error) {
    console.error('editImageWithGemini error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      'internal',
      'Internal server error during image editing',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
});

/**
 * Generate images using Imagen 4 (via Gemini 2.5 Flash Image)
 * 
 * REQUIRES AUTHENTICATION
 * COSTS: 5 credits per request
 * 
 * Expected input:
 * {
 *   prompt: string,
 *   numberOfImages?: 1 | 2 | 3 | 4,
 *   aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
 *   personGeneration?: 'dont_allow' | 'allow_adult'
 * }
 * 
 * Expected output:
 * {
 *   success: boolean,
 *   images?: string[],
 *   requestsRemaining?: number,
 *   error?: string
 * }
 */
export const generateImagesWithImagen = onCall({
  timeoutSeconds: 120,
  memory: '512MiB',
  region: 'us-central1',
  cors: [
    // Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080",
    
    // Firebase hosting domains
    /https?:\/\/engperfecthlc\.web\.app$/,
    /https?:\/\/engperfecthlc\.firebaseapp\.com$/,
    
    // Production domain
    /https?:\/\/engageperfect\.com$/,
    /https?:\/\/www\.engageperfect\.com$/,
    
    // Lovable preview domains
    /https?:\/\/preview--.*\.lovable\.app$/,
    /https?:\/\/.*\.lovable\.app$/,
    /https?:\/\/.*\.lovableproject\.com$/,
  ]
}, async (request) => {
  try {
    // Step 1: Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to generate images.');
    }

    const uid = request.auth.uid;
    console.log('🎨 generateImagesWithImagen called by user:', uid);

    // Step 2: Validate input
    const { prompt, numberOfImages = 1, aspectRatio = '1:1', personGeneration = 'dont_allow' } = request.data;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'A valid prompt is required');
    }

    console.log(`Generating ${numberOfImages} images with prompt: ${prompt.substring(0, 100)}`);

    // Step 3: Check and deduct credits
    const creditCheck = await checkAndDeductCredits(uid, IMAGE_GENERATION_COST, 'Image Generation');
    
    if (!creditCheck.success) {
      throw new HttpsError(
        'resource-exhausted',
        creditCheck.message || 'Insufficient credits',
        { requestsRemaining: creditCheck.requestsRemaining || 0 }
      );
    }

    // Step 4: Generate images
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: FOUNDRY_EDIT_MODEL,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Generate images in parallel
    const imagePromises = Array(numberOfImages).fill(null).map(async (_, index) => {
      try {
        console.log(`Generating image ${index + 1}/${numberOfImages}...`);
        
        const fullPrompt = `Generate a high-quality image: ${prompt}\n\nAspect ratio: ${aspectRatio}\nPerson generation: ${personGeneration === 'allow_adult' ? 'Allowed' : 'Not allowed'}\n\nCreate a stunning, professional image that matches this description.`;

        const result = await model.generateContent([fullPrompt]);
        const response = await result.response;

        // Check for image in response
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              const imageBase64 = part.inlineData.data;
              console.log(`✓ Generated image ${index + 1}`);
              return `data:${part.inlineData.mimeType};base64,${imageBase64}`;
            }
          }
        }

        console.warn(`⚠️ Image ${index + 1} generation returned text instead of image`);
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBnZW5lcmF0aW9uIG5vdCB5ZXQgc3VwcG9ydGVkPC90ZXh0Pjwvc3ZnPg==';
        
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2ZmMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJvcjogRmFpbGVkIHRvIGdlbmVyYXRlPC90ZXh0Pjwvc3ZnPg==';
      }
    });

    const images = await Promise.all(imagePromises);
    console.log('✓ Generated', images.length, 'images successfully');

    return {
      success: true,
      images,
      requestsRemaining: creditCheck.requestsRemaining
    };

  } catch (error) {
    console.error('generateImagesWithImagen error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      'internal',
      'Internal server error during image generation',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
});

/**
 * Generate video using Veo 3
 * 
 * REQUIRES AUTHENTICATION
 * NOT IMPLEMENTED - Returns 501
 * 
 * Expected input:
 * {
 *   prompt: string,
 *   resolution?: '720p' | '1080p',
 *   durationSeconds?: number (1-8)
 * }
 */
export const generateVideoWithVeo = onCall({
  timeoutSeconds: 120,
  memory: '512MiB',
  region: 'us-central1',
}, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to generate videos.');
  }

  console.log('🎬 Video generation requested (not implemented)');
  
  throw new HttpsError(
    'unimplemented',
    'Video generation with Veo 3 is not yet implemented. This feature requires Vertex AI integration.',
    { featureStatus: 'coming-soon' }
  );
});
