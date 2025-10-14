import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { getOpenAIKey } from "../config/secrets.js";
import { initializeFirebaseAdmin, getFirestore } from "../config/firebase-admin.js";

// Request cost constants
const CAPTION_REQUEST_COST = 1; // Caption generation costs 1 request (single AI call)

// Initialize Firebase Admin with hybrid configuration
initializeFirebaseAdmin();

// Initialize Firestore
const db = getFirestore();

// Used to track in-progress request IDs to prevent duplicates
const inProgressRequests = new Set<string>();

// Type for OpenAI error response
interface OpenAIErrorResponse {
  status?: number;
  response?: {
    status: number;
    data: Record<string, unknown>;
  };
  message?: string;
}

export interface GeneratedCaption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

// Response type for the callable function
export interface GenerateCaptionsResponse {
  captions: GeneratedCaption[];
  requests_remaining: number;
}

interface GenerateCaptionsRequest {
  tone: string;
  platform: string;
  postIdea?: string; // Now optional
  niche: string;
  goal: string;
  requestId?: string;
}

/**
 * Validates the OpenAI API key format
 */
function validateOpenAIAPIKey(apiKey: string): boolean {
  if (!apiKey) {
    console.error("[validateOpenAIAPIKey] API key is missing or empty");
    return false;
  }
  
  if (!apiKey.startsWith("sk-")) {
    console.error("[validateOpenAIAPIKey] API key doesn't start with 'sk-'");
    return false;
  }
  
  if (apiKey.length < 30) {
    console.error("[validateOpenAIAPIKey] API key appears to be too short");
    return false;
  }
  
  return true;
}

/**
 * Helper function to extract a field from caption text using robust regex
 */
function extractField(block: string, label: string): string | null {
  const regex = new RegExp(`\\[${label}\\](?:\\s*)(([\\s\\S]*?)(?=\\s*\\[|$))`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parses the OpenAI response text to extract structured captions
 */
function parseCaptions(text: string): GeneratedCaption[] {
  console.log("[parseCaptions] Raw text from OpenAI:", text);
  
  const captions: GeneratedCaption[] = [];
  
  // Split the text by "Caption X:" pattern
  const captionBlocks = text.split(/Caption \d+:/);
  console.log("[parseCaptions] Caption blocks after splitting:", captionBlocks);
  
  // Skip the first block if it's empty or contains only intro text
  const blocksToProcess = captionBlocks.slice(1);
  
  for (const block of blocksToProcess) {
    if (block.trim()) {
      // Extract the different parts using robust extraction
      const title = extractField(block, "Title");
      const caption = extractField(block, "Caption");
      const cta = extractField(block, "Call to Action");
      const tags = extractField(block, "#Tags");
      
      console.log("[parseCaptions] Extracted parts:", {
        title,
        caption,
        cta,
        tags,
        blockText: block
      });
      
      if (title && caption && cta && tags) {
        captions.push({
          title,
          caption,
          cta,
          hashtags: tags.split(/\s+/).map(tag => tag.replace(/^#/, ""))
        });
      }
    }
  }
  
  // If no captions were parsed correctly, try a fallback approach
  if (captions.length === 0) {
    console.warn("[parseCaptions] Regular parsing failed, attempting fallback parsing");
    
    // Try to extract content with a more lenient approach
    const titleSection = text.match(/\[Title\]([\s\S]*?)(?=\[Caption\]|$)/i);
    const captionSection = text.match(/\[Caption\]([\s\S]*?)(?=\[Call to Action\]|$)/i);
    const ctaSection = text.match(/\[Call to Action\]([\s\S]*?)(?=\[#Tags\]|$)/i);
    const tagsSection = text.match(/\[#Tags\]([\s\S]*?)(?=$)/i);
    
    const fallbackCaption: GeneratedCaption = {
      title: titleSection && titleSection[1].trim() || "Generated Title",
      caption: captionSection && captionSection[1].trim() || "Check out this amazing content!",
      cta: ctaSection && ctaSection[1].trim() || "Like and share!",
      hashtags: tagsSection ? tagsSection[1].trim().split(/\s+/).map(tag => tag.replace(/^#/, "")) : ["content", "social"]
    };
    
    captions.push(fallbackCaption);
  }
  
  console.log("[parseCaptions] Final parsed captions:", captions);
  
  // Ensure we return exactly 3 captions (or fewer if parsing failed)
  return captions.slice(0, 3);
}

// Get environment
const isProduction = process.env.NODE_ENV === 'production';

export const generateCaptionsV3 = onCall({
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
    
    // Allow all origins in development only
    ...(isProduction ? [] : ["*"])
  ],
  maxInstances: isProduction ? 50 : 10,
  timeoutSeconds: 120,
  minInstances: isProduction ? 1 : 0, // Warm instance only in production
  memory: isProduction ? "512MiB" : "256MiB",
  region: "us-central1",
  concurrency: isProduction ? 80 : 10,
  labels: {
    version: "v3-0-0",
    service: "caption-generation",
    environment: isProduction ? "production" : "development"
  }
}, async (request) => {
  try {
    // Step 1: Verify Firebase Auth
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    
    const uid = request.auth.uid;
    const data = request.data as GenerateCaptionsRequest & { lang?: string };
    const lang = typeof data.lang === 'string' ? data.lang : 'en';
    
    // Generate a consistent request ID if not provided
    const requestId = data.requestId || `${uid}_${data.platform}_${data.niche}_${Date.now()}`;
    
    // Check if this request is already being processed
    if (inProgressRequests.has(requestId)) {
      console.log(`[generateCaptions] Duplicate request detected: ${requestId}`);
      throw new HttpsError(
        "already-exists",
        "This request is already being processed. Please wait for it to complete."
      );
    }
    
    // Mark this request as in-progress
    inProgressRequests.add(requestId);
    
    try {
      const { tone, platform, postIdea, niche, goal } = data;
      
      // UPDATED: Relaxed input validation - only require tone, platform, niche, and goal
      const required = ['tone', 'platform', 'niche', 'goal'] as const;
      for (const field of required) {
        if (!data[field as keyof GenerateCaptionsRequest]) {
          throw new HttpsError(
            "invalid-argument",
            `Missing required field: ${field}`
          );
        }
      }
      
      // Step 2: Fetch user profile
      const userDoc = await db.collection("users").doc(uid).get();
      
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User profile not found.");
      }
      
      const userData = userDoc.data() as {
        requests_used: number;
        requests_limit: number;
        plan_type: string;
        flexy_requests?: number;
      };
      
      // Step 3: Check usage limits
      if (
        userData.requests_used >= userData.requests_limit &&
        (!userData.flexy_requests || userData.flexy_requests <= 0)
      ) {
        throw new HttpsError(
          "resource-exhausted",
          "You've reached your plan limit. Please upgrade or buy a Flex pack."
        );
      }
      
      // Step 4: Get OpenAI API key and validate
      const apiKey = await getOpenAIKey();
      if (!validateOpenAIAPIKey(apiKey)) {
        throw new HttpsError(
          "failed-precondition",
          "OpenAI API key is not configured correctly. Please contact support."
        );
      }
      
      const openai = new OpenAI({ apiKey });
      
      // ENHANCED: Anti-pattern system prompt with temporal awareness and variety enforcement
      const systemPrompt = `You are the world's best content creator and digital marketing expert specializing in ${platform} content strategy.

CRITICAL WRITING CONSTRAINTS (2025):
❌ NEVER start with "In my X years of experience..."
❌ NEVER use "As a seasoned expert..." or "As a professional..."
❌ NEVER open with "Did you know that..." unless it's genuinely surprising
❌ NEVER reference outdated years (2023 or earlier) - WE ARE IN LATE 2025
❌ AVOID formulaic, repetitive opening patterns
❌ NEVER use generic phrases like "game-changer" or "unlock your potential"

✅ DO use fresh, varied, and direct opening hooks
✅ DO reference current ${platform} trends (2024-2025)
✅ DO demonstrate expertise through insights, not credentials
✅ DO use dynamic, platform-specific language
✅ DO make EVERY caption feel unique and authentic

TEMPORAL AWARENESS:
- Current year: 2025 (October)
- Reference trends from late 2024-2025
- Acknowledge recent ${platform} algorithm changes and features
- Use contemporary language and cultural references

VARIETY MANDATE:
Each caption MUST have a distinctly different opening style:
- Caption 1: Start with a bold statement, surprising stat, or contrarian take
- Caption 2: Open with an engaging question or direct challenge
- Caption 3: Begin with a relatable scenario, micro-story, or vivid imagery

Create highly engaging content tailored to ${platform}'s 2025 algorithm and audience expectations.`;
      
      const languageInstruction = lang === 'en' 
        ? `Write all content in English.`
        : `IMPORTANT: Write ALL content in ${lang === 'fr' ? 'French (français)' : lang}. Every word, phrase, and hashtag must be in ${lang}.`;
      
      const userPrompt = `
        ${languageInstruction}
        
        Create exactly 3 highly engaging ${tone} captions for ${platform} about '${postIdea || niche}' in the ${niche} industry.
        
        CRITICAL: Each caption MUST have a DIFFERENT opening style and voice. Show versatility, not templates.
        
        TEMPORAL CONTEXT (2025):
        - We are in late 2025 (October 2025)
        - Reference current ${platform} trends from 2024-2025
        - Use contemporary ${niche} industry insights
        - Acknowledge recent ${platform} features (e.g., Instagram Reels evolution, TikTok Shop, LinkedIn newsletters)
        
        OPENING STYLE REQUIREMENTS (MUST VARY):
        Caption 1: Start with a surprising statistic, bold claim, or contrarian take
        Caption 2: Open with an engaging question or challenge to the audience
        Caption 3: Begin with a micro-story, relatable scenario, or vivid moment
        
        TONE VARIATIONS:
        - Mix conversational and ${tone} tones
        - Vary sentence lengths dramatically
        - Use different punctuation styles (!, ?, ..., —)
        - Incorporate emojis strategically but not in every caption
        
        The captions MUST follow this exact format with these exact headings:
        
        Caption 1:
        [Title] A catchy, unique title (not generic - be specific to ${niche})
        [Caption] Write a 1-3 sentence caption in a ${tone} tone without hashtags. START WITH A BOLD STATEMENT OR STAT.
        [Call to Action] Provide a specific, creative CTA (not just "like and share" - be innovative)
        [#Tags] Include 3-5 trending, relevant hashtags for ${niche} on ${platform} in 2025
        
        Caption 2:
        [Title] Another engaging title with different energy (shift the vibe)
        [Caption] Write an attention-grabbing caption. START WITH A PROVOCATIVE QUESTION.
        [Call to Action] Include a unique CTA that drives real interaction and conversation
        [#Tags] Include creative relevant hashtags (different from Caption 1, reflect 2025 trends)
        
        Caption 3:
        [Title] Third compelling title idea (different vibe again - be bold)
        [Caption] Provide a brief but engaging caption. START WITH A RELATABLE SCENARIO OR STORY.
        [Call to Action] Suggest a CTA that encourages authentic engagement and community building
        [#Tags] Include a third set of appropriate hashtags (no repeats from 1 & 2, include emerging trends)
        
        QUALITY STANDARDS:
        1. Be concise and tailored to ${platform}'s 2025 best practices and character limits
        2. Reflect CURRENT trends (late 2025) and platform-specific language
        3. Focus on the goal: "${goal}"
        4. Make sure ideas are innovative, fresh, and specific to ${niche}
        5. Use contemporary ${platform} terminology and features (Stories, Reels, Carousels, etc.)
        6. ALWAYS use the EXACT format with [Title], [Caption], [Call to Action], and [#Tags]
        7. No explanations, just the 3 DISTINCTLY DIFFERENT formatted captions
        8. MANDATORY: Each caption must feel like it was written by a different person with a different style
      `;
      
      // Make the API call with enhanced parameters for variety
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // UPDATED: Using gpt-4o-mini for better instruction following
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9, // INCREASED for more creative variety
        max_tokens: 1000, // INCREASED for richer content
        presence_penalty: 0.7, // INCREASED to discourage repetition
        frequency_penalty: 0.6, // INCREASED for more diverse vocabulary
        top_p: 0.95 // ADDED: Nucleus sampling for better diversity
      });

      console.log("OpenAI API response received");
      
      // Parse the response
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new HttpsError("internal", "Empty response from OpenAI");
      }
      
      // Parse captions from the response
      const captions = parseCaptions(content);
      
      if (captions.length === 0) {
        throw new HttpsError("internal", "Failed to generate captions from AI response.");
      }
      
      // Step 5: Store generation log
      const generationData = {
        input: {
          tone,
          platform,
          niche,
          goal,
          postIdea,
          requestId,
          lang
        },
        output: captions,
        createdAt: FieldValue.serverTimestamp()
      };
      
      await db.collection("users").doc(uid).collection("generations").add(generationData);
      
      // Step 6: Update user request count based on plan type
      let requests_remaining: number;
        if (userData.plan_type === "flexy" && userData.flexy_requests && userData.flexy_requests > 0) {
        // Update flexy requests - Caption generation costs 1 request
        await db.collection("users").doc(uid).update({
          flexy_requests: FieldValue.increment(-CAPTION_REQUEST_COST)
        });
        
        // Get updated flexy requests count for response
        const updatedUserDoc = await db.collection("users").doc(uid).get();
        const updatedUserData = updatedUserDoc.data() as { flexy_requests: number; requests_limit: number; requests_used: number };
        requests_remaining = (updatedUserData.flexy_requests || 0) + (updatedUserData.requests_limit - updatedUserData.requests_used);
      } else {
        // Update standard requests - Caption generation costs 1 request
        await db.collection("users").doc(uid).update({
          requests_used: FieldValue.increment(CAPTION_REQUEST_COST)
        });
        
        // Get updated requests count for response
        const updatedUserDoc = await db.collection("users").doc(uid).get();
        const updatedUserData = updatedUserDoc.data() as { requests_limit: number; requests_used: number; flexy_requests?: number };
        requests_remaining = (updatedUserData.requests_limit - updatedUserData.requests_used) + (updatedUserData.flexy_requests || 0);
      }
      
      // Step 7: Return response with captions and remaining requests
      return {
        captions,
        requests_remaining
      } as GenerateCaptionsResponse;
      
    } finally {
      // Always remove the request from the in-progress set
      inProgressRequests.delete(requestId);
      console.log(`[generateCaptions] Removed request from processing: ${requestId}`);
    }
    
  } catch (error: unknown) {
    console.error("[generateCaptions] Function error:", error);
    
    // If it's already a HttpsError, just rethrow it
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Type guard for OpenAI error response
    const openAIError = error as OpenAIErrorResponse;
    
    if (openAIError.response) {
      console.error("OpenAI API Error Response:", {
        status: openAIError.response.status,
        data: openAIError.response.data
      });
    }
    
    // Map OpenAI errors to appropriate Firebase errors
    if (openAIError.status === 401 || (openAIError.response?.status === 401)) {
      throw new HttpsError(
        "permission-denied",
        "Invalid OpenAI API key."
      );
    } else if (openAIError.status === 429 || (openAIError.response?.status === 429)) {
      throw new HttpsError(
        "resource-exhausted",
        "OpenAI rate limit exceeded. Please try again later."
      );
    }
    
    // Default error handling with proper type checking
    if (openAIError.message) {
      throw new HttpsError("internal", openAIError.message);
    } else {
      throw new HttpsError("internal", "An unknown error occurred");
    }
  }
});
