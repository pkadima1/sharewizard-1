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
    "localhost:3000",
    "localhost:5173",
    "localhost:5174",
    "localhost:8080",
    
    // Firebase hosting domains
    /engperfecthlc\.web\.app$/,
    /engperfecthlc\.firebaseapp\.com$/,
    
    // Production domain
    /engageperfect\.com$/,
    /www\.engageperfect\.com$/,
    
    // Lovable preview domains
    /preview--.*\.lovable\.app$/,
    /.*\.lovable\.app$/,
    /.*\.lovableproject\.com$/,
    
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
    version: "v3",
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
      
      // Create the prompt for OpenAI - improved structure for better parsing
      const systemPrompt = `You are the world's best content creator and digital, Social Media marketing and sales expert. You create highly engaging content tailored to specific platforms and audiences.`;
      
      const languageInstruction = `Write all captions in ${lang}.`;
      const userPrompt = `
        ${languageInstruction}
        Create exactly 3 highly engaging ${tone} captions for ${platform} about '${postIdea || niche}' in the ${niche} industry.
        
        The captions MUST follow this exact format with these exact headings:
        
        Caption 1:
        [Title] A catchy title that highlights the post's theme.
        [Caption] Write a 1-3 sentence caption in a ${tone} tone without hashtags.
        [Call to Action] Provide a specific call-to-action to encourage engagement.
        [#Tags] Include 3-5 relevant hashtags for the ${niche} industry.
        
        Caption 2:
        [Title] Another engaging title for a unique post idea.
        [Caption] Write an attention-grabbing caption.
        [Call to Action] Include a CTA to drive user interaction.
        [#Tags] Include creative relevant hashtags.
        
        Caption 3:
        [Title] Third compelling title idea
        [Caption] Provide a brief but engaging caption.
        [Call to Action] Suggest a CTA to encourage likes, shares, or comments
        [#Tags] Include a third set of appropriate hashtags.
        
        Important requirements:
        1. Be concise and tailored to ${platform}'s audience and character limits (e.g., Instagram: 2200 characters, Twitter: 200 characters).
        2. Reflect current trends or platform-specific language where applicable. Consider post format and size.
        3. If the goal is to share knowledge, start with words like 'did you know?', "Insight", "Fact", or anything intriguing.
        4. Focus on the goal: "${goal}"
        5. Make sure the Caption ideas are practical, innovative, and tailored specifically to the ${niche} industry while reflecting trends on ${platform}.
        6. ALWAYS use the EXACT format with [Title], [Caption], [Call to Action], and [#Tags] sections for each caption.
        7. Do not include any explanations, just the 3 formatted captions.
      `;
      
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // You could consider using gpt-4o-mini for cost efficiency
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8, // Slightly increased for more creative variety
        max_tokens: 800
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
