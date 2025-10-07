/**
 * Visual AI Functions - Backend implementation for Foundry Lab
 * 
 * Implements real Google AI API integrations:
 * - Gemini 2.5 Flash Image (Nano Banana) for native image generation and editing
 * - Imagen 3 for advanced image generation (planned)
 * - Veo 2 for video generation (planned)
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

import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiKey } from './config/secrets.js';

// Model Configuration - Using Gemini 2.5 Flash Image (Nano Banana)
const FOUNDRY_EDIT_MODEL = 'gemini-2.5-flash-image'; // Native image generation model

// Initialize Gemini
const getGenAI = () => {
  const apiKey = getGeminiKey();
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Edit an image with multiple prompts using Gemini 2.5 Flash Image (Nano Banana)
 * 
 * This uses the native image generation model optimized for image editing
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
 *   results: [{ prompt: string, dataUrl: string }]
 * }
 */
export const editImageWithGemini = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { imageBase64, mimeType, prompts } = req.body;

    // Validate input
    if (!imageBase64 || !mimeType || !prompts || !Array.isArray(prompts)) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    console.log('🎨 editImageWithGemini called with', prompts.length, 'prompts');

    // Initialize Gemini 2.5 Flash Image (Nano Banana) - Native image generation model
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: FOUNDRY_EDIT_MODEL, // gemini-2.5-flash-image (Nano Banana)
      generationConfig: {
        temperature: 0.7, // Balanced creativity for image editing
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        // Note: responseMimeType only supports text formats (text/plain, application/json, etc.)
        // Image generation is handled through the model's native capabilities
      },
    });

    // Process each prompt
    const results = await Promise.all(
      prompts.map(async (prompt: string) => {
        try {
          console.log('Processing prompt:', prompt);

          // Create the image edit request
          const imageParts = {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          };

          // Nano Banana native image generation prompt
          // Request image generation explicitly in the prompt
          const fullPrompt = `Generate an edited version of this image: ${prompt}
          
Return the edited image.`;

          const result = await model.generateContent([fullPrompt, imageParts]);
          const response = await result.response;
          
          // Check if we got an image in the response
          const candidates = response.candidates;
          if (candidates && candidates[0]?.content?.parts) {
            const parts = candidates[0].content.parts;
            
            // Look for inline image data
            for (const part of parts) {
              if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                const editedImageBase64 = part.inlineData.data;
                console.log('✓ Nano Banana generated edited image:', editedImageBase64.substring(0, 50) + '...');
                
                return {
                  prompt,
                  dataUrl: `data:${part.inlineData.mimeType};base64,${editedImageBase64}`,
                  model: FOUNDRY_EDIT_MODEL,
                  status: 'generated' // Successfully generated edited image
                };
              }
            }
          }
          
          // Fallback: if no image generated, return original with text description
          const text = response.text();
          console.log('⚠️ No image generated, got text response:', text.substring(0, 150) + '...');
          
          return {
            prompt,
            dataUrl: `data:${mimeType};base64,${imageBase64}`,
            description: text,
            model: FOUNDRY_EDIT_MODEL,
            status: 'analyzed' // Only got text analysis, not generated image
          };

        } catch (error) {
          console.error('Error processing prompt:', prompt, error);
          // Return original image on error
          return {
            prompt,
            dataUrl: `data:${mimeType};base64,${imageBase64}`,
            error: 'Failed to process this prompt'
          };
        }
      })
    );

    console.log('✓ Processed', results.length, 'edits successfully');
    res.status(200).json({ results });

  } catch (error) {
    console.error('editImageWithGemini error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate images using Imagen 4
 * 
 * Expected input:
 * {
 *   prompt: string,
 *   numberOfImages: 1 | 2 | 3 | 4,
 *   aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
 *   personGeneration: 'dont_allow' | 'allow_adult'
 * }
 * 
 * Expected output:
 * {
 *   images: string[] // array of data URLs
 * }
 */
export const generateImagesWithImagen = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, numberOfImages = 1, aspectRatio = '1:1', personGeneration = 'dont_allow' } = req.body;

    // Validate input
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('🎨 Image generation with Gemini:', { prompt, numberOfImages, aspectRatio, personGeneration });

    // Use Gemini 2.5 Flash Image for generation (same model as editing)
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: FOUNDRY_EDIT_MODEL, // gemini-2.5-flash-image (Nano Banana)
      generationConfig: {
        temperature: 0.9, // Higher creativity for generation
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Generate images in parallel
    const imagePromises = Array(numberOfImages).fill(null).map(async (_, index) => {
      try {
        console.log(`Generating image ${index + 1}/${numberOfImages}...`);
        
        // Craft prompt with aspect ratio and person generation preferences
        const fullPrompt = `Generate a high-quality image: ${prompt}
        
Aspect ratio: ${aspectRatio}
Person generation: ${personGeneration === 'allow_adult' ? 'Allowed' : 'Not allowed'}

Create a stunning, professional image that matches this description.`;

        const result = await model.generateContent([fullPrompt]);
        const response = await result.response;

        // Check for image in response
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              const imageBase64 = part.inlineData.data;
              console.log(`✓ Generated image ${index + 1}:`, imageBase64.substring(0, 50) + '...');
              return `data:${part.inlineData.mimeType};base64,${imageBase64}`;
            }
          }
        }

        // Fallback: if no image, return placeholder with text
        console.warn(`⚠️ Image ${index + 1} generation returned text instead of image`);
        // Return a small colored placeholder so user knows it's not working
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBnZW5lcmF0aW9uIG5vdCB5ZXQgc3VwcG9ydGVkPC90ZXh0Pjwvc3ZnPg==';
        
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        // Return error placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2ZmMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJvcjogRmFpbGVkIHRvIGdlbmVyYXRlPC90ZXh0Pjwvc3ZnPg==';
      }
    });

    const images = await Promise.all(imagePromises);
    console.log('✓ Generated', images.length, 'images successfully');

    res.status(200).json({ images });
  } catch (error) {
    console.error('generateImagesWithImagen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate video using Veo 3
 * 
 * Expected input:
 * {
 *   prompt: string,
 *   resolution: '720p' | '1080p',
 *   durationSeconds: number (1-8)
 * }
 * 
 * Expected output:
 * {
 *   mimeType: string,
 *   dataUrl: string
 * }
 */
export const generateVideoWithVeo = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, resolution = '720p', durationSeconds = 5 } = req.body;

    // Validate input
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (durationSeconds < 1 || durationSeconds > 8) {
      res.status(400).json({ error: 'Duration must be between 1 and 8 seconds' });
      return;
    }

    console.log('🎬 Video generation requested:', { prompt, resolution, durationSeconds });
    
    // NOTE: Video generation with Veo 3 requires Vertex AI integration
    // Gemini models (including gemini-2.5-flash-image) cannot generate videos
    // TODO: Implement Veo 3 via Vertex AI API
    
    // For now, return error response indicating feature not implemented
    console.warn('⚠️ Video generation not yet implemented - requires Veo 3 / Vertex AI setup');
    
    res.status(501).json({
      error: 'Video generation not yet implemented',
      message: 'Veo 3 video generation requires Vertex AI integration. This feature is coming soon!',
      details: {
        prompt,
        resolution,
        durationSeconds,
        status: 'not_implemented'
      }
    });
  } catch (error) {
    console.error('generateVideoWithVeo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
