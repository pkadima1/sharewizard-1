/**
 * Firebase Cloud Function: generateLongformContent
 * Version: 2.2.0
 * 
 * Purpose: Generate human-like, EEAT-optimized long-form content using a two-stage AI process
 * 
 * ARCHITECTURE:
 * This function implements a sophisticated two-stage AI generation process:
 * 1. Gemini 2.0 Flash Exp: Creates intelligent, human-centered content outlines with emotional resonance
 * 2. GPT-4o-mini: Transforms outlines into authentic, engaging, expert-level content
 * 
 * FLOW: Authentication → Validation → Usage Check → Gemini Outline → GPT Content → Storage → Response
 * 
 * KEY FEATURES:
 * - Enhanced prompting for human-like content generation
 * - EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) optimization
 * - Emotional resonance and storytelling integration
 * - Industry-specific expertise demonstration
 * - Comprehensive error handling with retry logic
 * - Usage limit management and transaction-safe data storage
 * 
 * PERFORMANCE:
 * - Timeout: 300 seconds for complex content generation
 * - Memory: 512MiB for handling large prompts and responses
 * - Retry logic: Exponential backoff for transient failures
 * - Fallback mechanisms: Structured outline generation when Gemini fails
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getOpenAIKey, getGeminiKey } from "../config/secrets.js";
import { initializeFirebaseAdmin, getFirestore } from "../config/firebase-admin.js";

// Initialize Firebase Admin with hybrid configuration
initializeFirebaseAdmin();

const db = getFirestore();

// Enhanced configuration with environment-specific settings
const CONFIG = {
  development: {
    timeoutSeconds: 180,
    memory: "256MiB" as const,
    maxInstances: 5,
    retryAttempts: 2
  },
  production: {
    timeoutSeconds: 300,
    memory: "512MiB" as const,
    maxInstances: 20,
    retryAttempts: 3
  }
};

const isProduction = process.env.NODE_ENV === "production";
const config = CONFIG[isProduction ? "production" : "development"];

// Enhanced AI service initialization with error handling
const initializeAIServices = () => {
  try {
    const geminiKey = getGeminiKey();
    const openaiKey = getOpenAIKey();
    
    return {
      genAI: new GoogleGenerativeAI(geminiKey),
      openai: new OpenAI({ apiKey: openaiKey })
    };
  } catch (error) {
    console.error("AI services initialization error:", error);
    throw new HttpsError("failed-precondition", "AI service API keys not configured properly");
  }
};

// Enhanced retry mechanism with exponential backoff and better error handling
const retryWithBackoff = async <T>(
  operation: () => Promise<T>, 
  maxRetries = config.retryAttempts, 
  baseDelay = 500 // Reduced initial delay
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
        // Don't retry on certain error types
      if (error instanceof HttpsError && 
          (error.code === "unauthenticated" || error.code === "permission-denied")) {
        throw error;
      }
      
      // For the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with jitter for better distribution
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        10000 // Cap at 10 seconds
      );
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Enhanced input validation with detailed error messages
const validateInputs = (data: any) => {
  const requiredFields = [
    { key: "topic", minLength: 10, maxLength: 200 },
    { key: "audience", minLength: 3, maxLength: 100 },
    { key: "industry", minLength: 3, maxLength: 50 },
    { key: "contentTone", minLength: 3, maxLength: 30 },
    { key: "wordCount", min: 300, max: 5000 }
  ];
  
  const errors: string[] = [];
  
  requiredFields.forEach(({ key, minLength, maxLength, min, max }) => {
    const value = data[key];
    
    if (value === undefined || value === null || value === "") {
      errors.push(`${key} is required`);
      return;
    }
    
    if (typeof value === "string") {
      if (minLength && value.length < minLength) {
        errors.push(`${key} must be at least ${minLength} characters`);
      }
      if (maxLength && value.length > maxLength) {
        errors.push(`${key} must be no more than ${maxLength} characters`);
      }
    }
    
    if (typeof value === "number") {
      if (min && value < min) {
        errors.push(`${key} must be at least ${min}`);
      }
      if (max && value > max) {
        errors.push(`${key} must be no more than ${max}`);
      }
    }
  });
  
  // Validate arrays
  if (data.keywords && (!Array.isArray(data.keywords) || data.keywords.length > 20)) {
    errors.push("keywords must be an array with no more than 20 items");
  }
  
  if (data.mediaUrls && (!Array.isArray(data.mediaUrls) || data.mediaUrls.length > 10)) {
    errors.push("mediaUrls must be an array with no more than 10 items");
  }
  
  if (errors.length > 0) {
    throw new HttpsError("invalid-argument", `Validation errors: ${errors.join(", ")}`);
  }
};

// Enhanced usage checking with better error messages
const checkUsageLimits = async (uid: string) => {
  const userDoc = await db.collection("users").doc(uid).get();
  
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "User profile not found. Please complete your profile setup.");
  }
  
  const userData = userDoc.data()!;
  const requestsUsed = userData.requests_used || 0;
  const requestsLimit = userData.requests_limit || 0;
  const flexyRequests = userData.flexy_requests || 0;
  const planType = userData.plan_type || "free";
  
  const totalAvailable = requestsLimit + flexyRequests;
  
  if (requestsUsed >= totalAvailable) {
    const upgradeMessage = planType === "free" 
      ? "Upgrade to a paid plan to continue generating content."
      : "Purchase additional Flex requests to continue.";
      
    return {
      hasUsage: false,
      error: "limit_reached",
      message: `You've used all ${totalAvailable} available requests. ${upgradeMessage}`,
      requestsRemaining: 0,
      planType
    };
  }
  
  return {
    hasUsage: true,
    requestsRemaining: totalAvailable - requestsUsed,
    planType,
    userData
  };
};

// Enhanced outline generation with better error handling and improved fallback
const generateOutline = async (genAI: GoogleGenerativeAI, promptData: any) => {
  const geminiPrompt = buildGeminiPrompt(promptData);
    // Try Gemini with enhanced error handling
  try {
    return await retryWithBackoff(async () => {    
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.6, // Slightly lower for more consistent output
          topK: 40,
          topP: 0.9, // Increase for better completion
          maxOutputTokens: 3000, // Increase token limit
          responseMimeType: "application/json"
        }
      });
      
      const result = await model.generateContent(geminiPrompt);
      const response = result.response.text();
      
      if (!response || response.length < 50) { // Lower threshold
        throw new Error("Gemini response too short or empty");
      }
      
      // Enhanced JSON parsing with cleanup
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      
      try {
        return JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response:", response);
        
        // Try to extract JSON from response with more aggressive cleanup
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Fix common JSON issues
            let fixedJson = jsonMatch[0]
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to keys
              .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double
              .replace(/,\s*}/g, '}') // Remove trailing commas
              .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
            
            return JSON.parse(fixedJson);
          } catch (secondParseError) {
            console.error("Second parse attempt failed:", secondParseError);
          }
        }
        
        // If all JSON parsing fails, fall back to structured outline
        console.warn("Gemini JSON parsing failed, using fallback outline");
        throw new Error("JSON parsing failed, using fallback");
      }
    });
  } catch (error) {
    console.warn("Gemini failed completely, using enhanced fallback outline:", error instanceof Error ? error.message : String(error));
    return createFallbackOutline(promptData);
  }
};

// Enhanced content generation with better prompt engineering
const generateContent = async (openai: OpenAI, outline: any, promptData: any) => {
  const gptPrompt = buildGPTPrompt(outline, promptData);
  
  return retryWithBackoff(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(promptData)
        },
        {
          role: "user",
          content: gptPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: Math.min(4000, Math.floor(promptData.wordCount * 1.5)),
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      stream: false
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content || content.length < 500) {
      throw new Error("Generated content too short or empty");
    }
    
    return content;
  });
};

/**
 * Enhanced Gemini prompt for creating human-centered, EEAT-optimized content outlines
 * Focuses on emotional resonance, practical value, and authentic expertise demonstration
 */
const buildGeminiPrompt = (data: any): string => {
  return `You are an expert content strategist and editorial consultant with 15 years of experience in ${data.industry} content creation.

CONTEXT & REQUIREMENTS:
• Topic: "${data.topic}"
• Target Audience: ${data.audience}
• Industry: ${data.industry}
• Content Type: ${data.contentType}
• Target Word Count: ${data.wordCount} words
• Tone: ${data.contentTone}
• Structure Preference: ${data.structureFormat}
• Keywords to include: ${data.keywords.join(", ")}
${data.structureNotes ? `• Additional Structure Notes: ${data.structureNotes}` : ""}
${data.includeStats ? "• MUST include relevant statistics and data points" : ""}

YOUR TASK:
Create a comprehensive content outline that serves as a blueprint for writing ${data.wordCount}-word ${data.contentType} content. This outline will be used by a skilled writer to create engaging, human-centered content.

OUTLINE REQUIREMENTS:
1. **Hook & Opening Strategy**: Provide 2-3 opening hook options (story, question, statistic, or bold statement)
2. **Detailed Section Breakdown**: Create 4-7 main sections with:
   - Section titles (H2 level)
   - 2-3 subsection points (H3 level) per section
   - Key messages and talking points
   - Suggested word count per section
   - Emotional tone guidance for each section

3. **Human Elements Integration**: For each section, specify:
   - Personal anecdotes or story opportunities
   - Emotional connection points
   - Relatable examples from ${data.audience}'s experience
   - Industry-specific references that resonate

4. **Content Enrichment Ideas**:
   ${data.includeStats ? "- Specific types of statistics/data to research and include" : ""}
   - Expert quotes or industry insights to reference
   - Common pain points of ${data.audience} to address
   - Actionable tips that provide immediate value

5. **SEO & Structure Optimization**:
   - Natural keyword integration strategy
   - Internal linking opportunities
   - Meta description suggestion (150-160 chars)
   - Featured snippet optimization approach

6. **Conclusion Strategy**: 
   - Summary approach that reinforces key value
   ${data.ctaType !== "none" ? `- ${data.ctaType} call-to-action integration` : "- Natural conclusion without sales pitch"}
   - Final emotional resonance goal

7. **Voice & Personality Guidelines**:
   - Specific ${data.contentTone} tone characteristics
   - ${data.audience}-appropriate language level
   - Personality traits to inject (humor, authority, empathy, etc.)

CRITICAL: This outline should enable a writer to create content that feels authentically human, not AI-generated. Focus on emotional resonance, practical value, and genuine connection with ${data.audience}.

Return ONLY a well-structured JSON object with this exact format:
{
  "meta": {
    "estimatedReadingTime": "X minutes",
    "primaryEmotion": "specific emotion to evoke",
    "keyValueProposition": "main benefit reader gets"
  },
  "hookOptions": [
    "Hook option 1...",
    "Hook option 2...",
    "Hook option 3..."
  ],
  "sections": [
    {
      "title": "Section Title",
      "wordCount": 200,
      "tone": "specific tone for this section",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "humanElements": {
        "storyOpportunity": "specific story type to include",
        "emotionalConnection": "how to connect emotionally",
        "practicalValue": "concrete takeaway for reader"
      },
      "subsections": [
        {
          "subtitle": "Subsection Title",
          "focusArea": "what this subsection accomplishes",
          "wordCount": 100
        }
      ]
    }
  ],
  "seoStrategy": {
    "metaDescription": "150-160 char meta description",
    "primaryKeyword": "main keyword from list",
    "keywordDensity": "natural integration approach",
    "featuredSnippetTarget": "what type of snippet to target"
  },
  "conclusion": {
    "approach": "how to conclude powerfully",
    "emotionalGoal": "final feeling to leave reader with",
    "ctaIntegration": "${data.ctaType !== "none" ? data.ctaType : "none"}"
  }
}`;
};

/**
 * Enhanced GPT prompt for creating human-like, emotionally resonant content
 * Focuses on authenticity, practical value, and genuine expertise demonstration
 */
const buildGPTPrompt = (outline: any, data: any): string => {
  return `You are an exceptionally skilled ${data.industry} content writer and ${data.audience} specialist with a gift for creating deeply human, emotionally resonant content that feels like it was written by someone who truly understands both the subject matter and the reader's world.

WRITING MISSION:
Transform this content outline into ${data.wordCount} words of compelling, human-centered ${data.contentType} content that ${data.audience} will find genuinely valuable, relatable, and engaging.

CONTENT OUTLINE TO EXPAND:
${JSON.stringify(outline, null, 2)}

USER'S COMPLETE CONTEXT:
• Core Topic: "${data.topic}"
• Writing for: ${data.audience} in ${data.industry}
• Desired Tone: ${data.contentTone}
• Word Target: ${data.wordCount} words
• Keywords to weave naturally: ${data.keywords.join(", ")}
${data.includeStats ? "• MUST include relevant statistics with sources" : ""}
${data.mediaUrls.length > 0 ? `• Include references to ${data.mediaUrls.length} visual elements provided` : ""}

CRITICAL WRITING GUIDELINES:

🎯 **HUMAN-FIRST APPROACH:**
- Write as if you're having a conversation with a smart friend in ${data.industry}
- Include personal observations, relatable scenarios, and "you've been there" moments
- Use contractions, occasional informal language, and natural speech patterns
- Reference common experiences that ${data.audience} faces daily
- Inject personality, opinions, and authentic voice throughout

📖 **STORYTELLING INTEGRATION:**
- Start sections with micro-stories, scenarios, or "picture this" moments
- Use real-world examples that ${data.audience} can immediately relate to
- Include failure stories, lessons learned, and honest admissions
- Reference industry trends, challenges, and opportunities naturally

🧠 **EXPERTISE DEMONSTRATION (E-A-T):**
- Showcase deep understanding of ${data.industry} through specific details
- Reference industry tools, terminology, and insider knowledge naturally
- Include forward-thinking insights and trend predictions
- Demonstrate experience through specific examples and case references

💝 **EMOTIONAL CONNECTION:**
- Acknowledge the frustrations ${data.audience} feels
- Celebrate their successes and validate their challenges  
- Use empathetic language that shows you "get it"
- Include moments of inspiration, hope, and encouragement
- End sections with emotional resonance, not just information

⚡ **PRACTICAL VALUE:**
- Every major point should include actionable advice
- Provide specific steps, frameworks, or tools they can use immediately
- Include "pro tips," "insider secrets," or "game-changing insights"
- Give concrete examples with measurable outcomes

🔍 **SEO INTEGRATION (Natural):**
- Weave keywords organically into compelling sentences
- Use variations and related terms naturally throughout
- Create scannable content with compelling subheadings
- Include questions that match search intent

FORMATTING REQUIREMENTS:
- Use markdown formatting for structure
- Create compelling, specific subheadings (not generic ones)
- Include bullet points and numbered lists for scanability
- Bold key concepts and important takeaways
- Use short paragraphs (2-4 sentences max) for readability

${data.ctaType !== "none" ? `CTA INTEGRATION: Conclude with a natural, ${data.ctaType}-focused call-to-action that feels helpful, not salesy.` : "CONCLUSION: End with inspiring final thoughts that leave readers feeling empowered and informed."}

${data.outputFormat === "html" ? "FORMAT: Return content in clean HTML format with proper heading tags and structure." : "FORMAT: Return content in clean Markdown format."}

Remember: This content should feel like it was written by a human expert who genuinely cares about helping ${data.audience} succeed in ${data.industry}. Every sentence should either inform, inspire, or provide practical value. Avoid AI-sounding phrases, generic advice, and robotic language patterns.

Write the complete ${data.wordCount}-word ${data.contentType} now:`;
};

const buildSystemPrompt = (data: any): string => {
  return `You are an expert ${data.industry} content writer specializing in ${data.audience}-focused content. Write in a ${data.contentTone} tone with deep expertise and authentic human voice. Ensure the content is comprehensive, engaging, and provides genuine value to the reader.`;
};

/**
 * Creates a sophisticated fallback outline when Gemini fails
 * Ensures content generation can continue with high-quality structure
 */
const createFallbackOutline = (data: any) => {
  const sections = Math.max(4, Math.min(7, Math.ceil(data.wordCount / 300))); // 4-7 sections
  const wordsPerSection = Math.floor(data.wordCount / sections);
  
  return {
    meta: {
      estimatedReadingTime: `${Math.ceil(data.wordCount / 200)} minutes`,
      primaryEmotion: "informed and empowered",
      keyValueProposition: `practical, actionable insights about ${data.topic} for ${data.audience}`
    },
    hookOptions: [
      `Have you ever wondered why ${data.topic} seems so challenging for most ${data.audience}?`,
      `Picture this: You're facing a ${data.topic}-related challenge that could make or break your success in ${data.industry}.`,
      `Here's a surprising truth about ${data.topic} that most ${data.audience} never discover...`
    ],
    sections: Array.from({ length: sections }, (_, i) => {
      const sectionTypes = [
        "Understanding the Fundamentals",
        "Common Challenges and Solutions", 
        "Best Practices and Strategies",
        "Advanced Techniques",
        "Real-World Applications",
        "Future Trends and Opportunities",
        "Implementation Guide"
      ];
      
      return {
        title: sectionTypes[i] || `Key Aspect ${i + 1} of ${data.topic}`,
        wordCount: wordsPerSection,
        tone: i === 0 ? "engaging and accessible" : i === sections - 1 ? "inspiring and actionable" : "informative and practical",
        keyPoints: [
          `Essential ${data.topic} concepts for ${data.audience}`,
          `Practical applications in ${data.industry}`,
          `Actionable steps and best practices`
        ],
        humanElements: {
          storyOpportunity: `Real ${data.industry} scenario involving ${data.topic}`,
          emotionalConnection: "shared challenges and breakthrough moments",
          practicalValue: `Immediately implementable ${data.topic} strategies`
        },
        subsections: [
          {
            subtitle: `Core Principles`,
            focusArea: `foundational understanding of ${data.topic}`,
            wordCount: Math.floor(wordsPerSection * 0.4)
          },
          {
            subtitle: `Practical Application`,
            focusArea: `how ${data.audience} can apply this knowledge`,
            wordCount: Math.floor(wordsPerSection * 0.6)
          }
        ]
      };
    }),
    seoStrategy: {
      metaDescription: `Discover essential ${data.topic} strategies for ${data.audience} in ${data.industry}. Expert insights, practical tips, and actionable advice.`,
      primaryKeyword: data.keywords[0] || data.topic,
      keywordDensity: "natural integration throughout content with semantic variations",
      featuredSnippetTarget: "how-to guide with step-by-step instructions"
    },
    conclusion: {
      approach: "synthesize key insights and provide clear next steps",
      emotionalGoal: "confident and motivated to implement learnings",
      ctaIntegration: data.ctaType !== "none" ? data.ctaType : "encouraging action without sales pressure"
    }
  };
};

// Main longform content generation function
export const generateLongformContent = onCall({
  cors: [
    "localhost:5173",
    "localhost:5174",
    /engperfecthlc\.web\.app$/,
    /engperfecthlc\.firebaseapp\.com$/,
    /engageperfect\.com$/
  ],
  maxInstances: config.maxInstances,
  timeoutSeconds: config.timeoutSeconds,
  memory: config.memory,
  minInstances: isProduction ? 1 : 0,
  region: "us-central1"
}, async (request) => {
  const startTime = Date.now();
  let contentId: string | null = null;
  
  try {
    // Step 1: Authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required to generate content.");
    }
    
    const uid = request.auth.uid;
    const data = request.data;
    
    console.log(`[LongForm] Starting generation for user: ${uid}`);
    
    // Step 2: Input validation
    validateInputs(data);
    
    // Step 3: Initialize AI services
    const { genAI, openai } = initializeAIServices();
    
    // Step 4: Check usage limits
    const usageCheck = await checkUsageLimits(uid);
    if (!usageCheck.hasUsage) {
      return usageCheck;
    }
    
    // Step 5: Extract and structure inputs
    const promptData = {
      topic: data.topic,
      audience: data.audience,
      industry: data.industry,
      keywords: data.keywords || [],
      contentTone: data.contentTone,
      contentType: data.contentType || "blog-article",
      structureFormat: data.structureFormat || "intro-points-cta",
      wordCount: data.wordCount || 1200,
      includeStats: data.includeStats || false,
      ctaType: data.ctaType || "none",
      mediaUrls: data.mediaUrls || [],
      mediaCaptions: data.mediaCaptions || [],
      structureNotes: data.structureNotes || "",
      outputFormat: data.outputFormat || "markdown"
    };
      console.log(`[LongForm] Generating ${promptData.wordCount}-word content for: ${promptData.topic}`);
    
    // Step 6: Generate outline with Gemini
    console.log("[LongForm] Stage 1: Generating outline...");
    const outlineStartTime = Date.now();
    const outline = await generateOutline(genAI, promptData);
    const outlineTime = Date.now() - outlineStartTime;
    console.log(`[LongForm] Outline generated in ${outlineTime}ms`);
    
    // Step 7: Generate content with GPT
    console.log("[LongForm] Stage 2: Generating content...");
    const contentStartTime = Date.now();
    const generatedContent = await generateContent(openai, outline, promptData);
    const contentTime = Date.now() - contentStartTime;
    console.log(`[LongForm] Content generated in ${contentTime}ms`);
    
    // Step 8: Create content record
    contentId = db.collection("users").doc(uid).collection("longform-content").doc().id;
      const contentData = {
      id: contentId,
      uid: uid,
      moduleType: "longform",
      inputs: promptData,
      outline: outline,
      content: generatedContent,
      metadata: {
        actualWordCount: generatedContent.split(/\s+/).filter(word => word.length > 0).length, // More accurate word count
        estimatedReadingTime: Math.ceil(generatedContent.split(/\s+/).filter(word => word.length > 0).length / 200),
        generatedAt: FieldValue.serverTimestamp(),        generationTime: Date.now() - startTime,
        outlineGenerationTime: outlineTime,
        contentGenerationTime: contentTime,
        version: "2.2.0", // Updated version with enhanced prompts
        contentQuality: {
          hasEmotionalElements: outline.sections?.some((s: any) => s.humanElements?.emotionalConnection),
          hasActionableContent: outline.sections?.some((s: any) => s.humanElements?.practicalValue),
          seoOptimized: !!outline.seoStrategy?.primaryKeyword,
          structureComplexity: outline.sections?.length || 0
        }
      },
      status: "completed"
    };
    
    // Step 9: Store content and update usage in transaction
    await db.runTransaction(async (transaction) => {
      const contentRef = db.collection("users").doc(uid).collection("longform-content").doc(contentId!);
      const userRef = db.collection("users").doc(uid);
      
      // Store content
      transaction.set(contentRef, contentData);
        // Update usage based on plan type
      if (usageCheck.planType === "flexy" && usageCheck.userData?.flexy_requests && usageCheck.userData.flexy_requests > 0) {
        transaction.update(userRef, {
          flexy_requests: FieldValue.increment(-1)
        });
      } else {
        transaction.update(userRef, {
          requests_used: FieldValue.increment(1)
        });
      }
    });
    
    // Step 10: Calculate remaining requests
    const remainingRequests = Math.max(0, usageCheck.requestsRemaining - 1);
    
    console.log(`[LongForm] Content generation completed in ${Date.now() - startTime}ms`);
    
    // Step 11: Return success response
    return {
      success: true,
      contentId: contentId,
      content: generatedContent,
      outline: outline,
      metadata: contentData.metadata,
      requestsRemaining: remainingRequests,
      message: "Long-form content generated successfully!"
    };
    
  } catch (error) {
    console.error("[LongForm] Function error:", error);
    
    // Enhanced error logging
    if (contentId && request.auth?.uid) {
      try {
        await db.collection("users").doc(request.auth.uid).collection("longform-content").doc(contentId).set({
          status: "failed",
          error: (error as Error).message,
          timestamp: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (logError) {
        console.error("[LongForm] Failed to log error:", logError);
      }
    }
    
    // Re-throw HttpsError or wrap in internal error
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal", 
      `Content generation failed: ${(error as Error).message}. Please try again or contact support if the issue persists.`
    );
  }
});
