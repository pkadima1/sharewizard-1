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
 * REQUEST TRACKING:
 * - Blog generation costs 4 requests (complex two-stage AI process)
 * - Caption generation costs 1 request (single AI call)
 * - Usage validation ensures minimum 4 requests available before generation
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

// Request cost constants
const BLOG_REQUEST_COST = 4; // Blog generation costs 4 requests due to complex two-stage AI process

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
  });    // Validate arrays
  if (data.keywords && (!Array.isArray(data.keywords) || data.keywords.length > 20)) {
    errors.push("keywords must be an array with no more than 20 items");
  }
  
  if (data.mediaUrls && (!Array.isArray(data.mediaUrls) || data.mediaUrls.length > 10)) {
    errors.push("mediaUrls must be an array with no more than 10 items");
  }
  
  if (data.mediaCaptions && (!Array.isArray(data.mediaCaptions) || data.mediaCaptions.length > 10)) {
    errors.push("mediaCaptions must be an array with no more than 10 items");
  }
  
  if (data.mediaAnalysis && (!Array.isArray(data.mediaAnalysis) || data.mediaAnalysis.length > 10)) {
    errors.push("mediaAnalysis must be an array with no more than 10 items");
  }
  
  // Validate media placement strategy
  if (data.mediaPlacementStrategy && !["auto", "manual", "semantic"].includes(data.mediaPlacementStrategy)) {
    errors.push("mediaPlacementStrategy must be 'auto', 'manual', or 'semantic'");
  }
  // Validate boolean fields
  if (data.includeStats !== undefined && typeof data.includeStats !== "boolean") {
    errors.push("includeStats must be a boolean value");
  }
  
  if (data.includeReferences !== undefined && typeof data.includeReferences !== "boolean") {
    errors.push("includeReferences must be a boolean value");
  }
  
  if (data.tocRequired !== undefined && typeof data.tocRequired !== "boolean") {
    errors.push("tocRequired must be a boolean value");
  }
    if (data.summaryRequired !== undefined && typeof data.summaryRequired !== "boolean") {
    errors.push("summaryRequired must be a boolean value");
  }
    if (data.structuredData !== undefined && typeof data.structuredData !== "boolean") {
    errors.push("structuredData must be a boolean value");
  }
  
  if (data.enableMetadataBlock !== undefined && typeof data.enableMetadataBlock !== "boolean") {
    errors.push("enableMetadataBlock must be a boolean value");
  }
    // Validate optional string fields
  if (data.writingPersonality !== undefined && typeof data.writingPersonality !== "string") {
    errors.push("writingPersonality must be a string value");
  }
  
  if (data.writingPersonality && data.writingPersonality.length > 100) {
    errors.push("writingPersonality must be no more than 100 characters");
  }
  
  if (data.readingLevel !== undefined && typeof data.readingLevel !== "string") {
    errors.push("readingLevel must be a string value");
  }
  
  if (data.readingLevel && data.readingLevel.length > 20) {
    errors.push("readingLevel must be no more than 20 characters");
  }
  
  if (errors.length > 0) {
    throw new HttpsError("invalid-argument", `Validation errors: ${errors.join(", ")}`);
  }
};

// Enhanced usage checking with better error messages for blog generation (4 requests required)
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
  
  // Check if user has enough requests for blog generation
  if (requestsUsed + BLOG_REQUEST_COST > totalAvailable) {
    const upgradeMessage = planType === "free" 
      ? "Upgrade to a paid plan to continue generating content."
      : "Purchase additional Flex requests to continue.";
      
    return {
      hasUsage: false,
      error: "limit_reached",
      message: `Blog generation requires ${BLOG_REQUEST_COST} requests. You need ${requestsUsed + BLOG_REQUEST_COST - totalAvailable} more requests. ${upgradeMessage}`,
      requestsRemaining: totalAvailable - requestsUsed,
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
  const toneInstructions = getToneInstructions(data.contentTone);
  
  // Structure-specific instructions for new content formats
  const getStructureInstructions = (structureFormat: string): string => {
    switch (structureFormat) {
      case 'how-to-steps':
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (How-To / Step-by-Step):
• Create a clear introduction explaining what readers will accomplish
• Include a prerequisites section listing what's needed before starting
• Break down the process into 3-7 numbered steps
• Each step should be actionable and specific
• Include tips, warnings, or best practices for each step
• End with a summary of what was accomplished and next steps
• Ensure each step flows logically to the next
• Use action verbs to start each step title`;

      case 'faq-qa':
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (FAQ / Q&A):
• Start with an introduction explaining the topic scope
• Organize questions from most common/basic to more advanced
• Create 5-8 question-answer pairs
• Use natural question language that real users would ask
• Provide comprehensive but concise answers
• Include follow-up information or related questions where relevant
• End with a conclusion addressing how to get additional help
• Questions should cover the full spectrum of user concerns`;

      case 'comparison-vs':
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (Comparison / vs.):
• Begin with context explaining what's being compared and why
• Provide an overview of Option A with its key features
• Provide an overview of Option B with its key features
• Create a side-by-side comparison section with specific criteria
• Include pros and cons for each option
• Provide clear recommendations for different use cases
• End with guidance on how to choose between options
• Maintain objectivity while providing clear guidance`;

      case 'review-analysis':
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (Review / Analysis):
• Start with an introduction explaining what's being reviewed
• Create a comprehensive features overview section
• Organize pros and cons into clear sections
• Include real-world performance analysis
• Provide rating or scoring where appropriate
• Include comparisons to alternatives where relevant
• End with a clear verdict and recommendation
• Support claims with specific examples and evidence`;

      case 'case-study-detailed':
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (Case Study):
• Begin with an executive summary of outcomes
• Provide detailed background and context
• Clearly define the challenge or problem faced
• Explain the solution approach and implementation
• Present quantifiable results and metrics
• Include lessons learned and key takeaways
• End with actionable insights for readers
• Use storytelling elements throughout to maintain engagement`;

      default:
        return `
STRUCTURE-SPECIFIC REQUIREMENTS (${structureFormat}):
• Follow the specified structure format guidance
• Ensure content flows logically between sections
• Maintain consistent tone throughout
• Include clear transitions between sections`;
    }
  };

  return `You are an expert content strategist and editorial consultant with 15 years of experience in ${data.industry} content creation.

${toneInstructions}

CONTEXT & REQUIREMENTS:
• Topic: "${data.topic}"
• Target Audience: ${data.audience}
• Industry: ${data.industry}
• Content Type: ${data.contentType}
• Structure Format: ${data.structureFormat}
• Target Word Count: ${data.wordCount} words
• Tone: ${data.contentTone}
• Keywords to include: ${data.keywords.join(", ")}
${data.structureNotes ? `• Additional Structure Notes: ${data.structureNotes}` : ""}
${data.includeStats ? "• MUST include relevant statistics and data points" : ""}
${data.includeReferences ? "• MUST include credible external sources and references" : ""}
${data.mediaUrls.length > 0 ? `
• Media Assets: ${data.mediaUrls.length} images provided
• Placement Strategy: ${data.mediaPlacementStrategy}
• Media Analysis: ${data.mediaAnalysis.length > 0 ? "AI descriptions available for optimal placement" : "Basic media integration"}
• Alt Text Requirements: Generate SEO-friendly alt text for each image
` : ""}

${getStructureInstructions(data.structureFormat)}

YOUR TASK:
Create a comprehensive content outline that serves as a blueprint for writing ${data.wordCount}-word ${data.contentType} content. This outline will be used by a skilled writer to create engaging, human-centered content that follows the ${data.structureFormat} structure format.

OUTLINE REQUIREMENTS:
1. **Hook & Opening Strategy**: Provide 2-3 opening hook options (story, question, statistic, or bold statement)
2. **Detailed Section Breakdown**: Create sections appropriate for ${data.structureFormat} format with:
   - Section titles (H2 level)
   - 2-3 subsection points (H3 level) per section where appropriate
   - Key messages and talking points
   - Suggested word count per section
   - Emotional tone guidance for each section

3. **Human Elements Integration**: For each section, specify:
   - Personal anecdotes or story opportunities
   - Emotional connection points
   - Relatable examples from ${data.audience}'s experience
   - Industry-specific references that resonate

📌 **Reader Journey Mapping**: For each section, define the reader's emotional state and what transformation or insight they should gain.

4. **Content Enrichment Ideas**:
   ${data.includeStats ? "- Specific types of statistics/data to research and include" : ""}
   ${data.includeReferences ? "- Types of authoritative sources to reference (.gov, .edu, industry leaders)" : ""}
   - Expert quotes or industry insights to reference
   - Common pain points of ${data.audience} to address
   - Actionable tips that provide immediate value
   ${data.mediaUrls.length > 0 ? `- Strategic media placement recommendations for ${data.mediaUrls.length} visual assets
   - SEO-optimized alt text suggestions for each image
   - Visual content integration that enhances narrative flow` : ""}

5. **SEO & Structure Optimization**:
   - Natural keyword integration strategy
   - Internal linking opportunities
   - Meta description suggestion (150-160 chars)
   - Featured snippet optimization approach
   ${data.outputFormat === "html" ? "- Schema.org BlogPosting structured data requirements" : ""}

6. **Conclusion Strategy**: 
   - Summary approach that reinforces key value
   ${data.ctaType !== "none" ? `- ${data.ctaType} call-to-action integration` : "- Natural conclusion without sales pitch"}
   - Final emotional resonance goal

7. **Voice & Personality Guidelines**:
   - Specific ${data.contentTone} tone characteristics
   - ${data.audience}-appropriate language level
   - Personality traits to inject (humor, authority, empathy, etc.)
   ${data.writingPersonality ? `- Embody the personality of a ${data.writingPersonality} expert in writing style and approach` : ""}

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
      "keyPoints": ["Point 1", "Point 2", "Point 3"],      "humanElements": {
        "storyOpportunity": "specific story type to include",
        "emotionalConnection": "how to connect emotionally",
        "practicalValue": "concrete takeaway for reader"
      },${data.includeReferences ? `      "referenceOpportunities": {
        "authoritySourceTypes": "types of .gov, .edu, or industry authority sources to include",
        "integrationStrategy": "how to naturally weave sources into content flow"
      },` : ""}${data.mediaUrls.length > 0 ? `
      "mediaPlacement": {
        "recommendedImages": ["suggest which of the ${data.mediaUrls.length} images work best for this section"],
        "placementRationale": "why these specific images enhance this section's message",
        "altTextSuggestions": ["SEO-friendly alt text for each recommended image"],
        "captionIdeas": ["engaging caption suggestions that tie images to content"]
      },` : ""}
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
  },  "conclusion": {
    "approach": "how to conclude powerfully",
    "emotionalGoal": "final feeling to leave reader with",
    "ctaIntegration": "${data.ctaType !== "none" ? data.ctaType : "none"}"  }${data.includeReferences ? `,
  "referencesSection": {
    "sourceCount": "3-7 sources recommended",
    "sourceTypes": "mix of .gov, .edu, and authoritative industry sources",
    "formattingStyle": "clean list with clickable links and brief descriptions"
  }` : ""}${data.mediaUrls.length > 0 ? `,
  "mediaStrategy": {
    "overallPlacementApproach": "${data.mediaPlacementStrategy} placement strategy for optimal content flow",
    "imageCount": ${data.mediaUrls.length},
    "strategicPlacements": [
      {
        "imageIndex": 0,
        "recommendedSection": "section name where this image works best",
        "placementReason": "why this image enhances this specific section",
        "altTextSuggestion": "SEO-optimized alt text",
        "captionSuggestion": "engaging caption that ties to content"
      }
    ],
    "visualNarrativeFlow": "how images collectively support the content's story arc"
  }` : ""}
}`;
};

/**
 * Enhanced GPT prompt for creating human-like, emotionally resonant content
 * Focuses on authenticity, practical value, and genuine expertise demonstration
 */
const buildGPTPrompt = (outline: any, data: any): string => {
  const toneInstructions = getToneInstructions(data.contentTone);
  
  // Structure-specific writing guidance
  const getStructureWritingGuidance = (structureFormat: string): string => {
    switch (structureFormat) {
      case 'how-to-steps':
        return `
🔧 **HOW-TO STRUCTURE GUIDANCE:**
- Start each step with a clear action verb (e.g., "Create", "Navigate", "Configure")
- Use numbered lists for the main steps and bullet points for sub-tasks
- Include time estimates for each step where appropriate
- Add "Pro Tips" or "Warning" callouts for important considerations
- Use screenshots or visual references when describing UI elements
- End each step by confirming what the reader should have accomplished
- Include troubleshooting tips for common issues`;

      case 'faq-qa':
        return `
❓ **FAQ STRUCTURE GUIDANCE:**
- Format questions as H3 headings in natural language
- Start answers immediately after each question without additional formatting
- Keep answers concise but comprehensive (50-200 words each)
- Use bullet points within answers for multiple related points
- Cross-reference related questions when appropriate
- Include follow-up questions or "Related: See question X" references
- End with a clear next step or resource for additional help`;

      case 'comparison-vs':
        return `
⚖️ **COMPARISON STRUCTURE GUIDANCE:**
- Use comparison tables or side-by-side formatting where possible
- Maintain objectivity while providing clear guidance
- Include specific criteria for comparison (price, features, usability, etc.)
- Use consistent evaluation criteria across both options
- Provide real-world use case examples for each option
- Include "Winner" or "Best for" callouts for specific scenarios
- Support claims with specific examples and data points`;

      case 'review-analysis':
        return `
📊 **REVIEW STRUCTURE GUIDANCE:**
- Include ratings or scores where appropriate (e.g., "8/10" or "4.5/5 stars")
- Use clear section headers for different aspects being reviewed
- Balance positive and negative points fairly
- Include specific examples and evidence for all claims
- Compare to alternatives or competitors where relevant
- Use callout boxes for key pros and cons
- End with a clear recommendation and target user profile`;

      case 'case-study-detailed':
        return `
📈 **CASE STUDY STRUCTURE GUIDANCE:**
- Use storytelling elements to maintain engagement throughout
- Include specific metrics and quantifiable results
- Present information chronologically where appropriate
- Use quotes or testimonials if available
- Include before/after comparisons with specific data
- Highlight key decision points and rationale
- Focus on actionable insights readers can apply
- Use data visualization concepts in descriptions`;

      default:
        return `
📝 **STANDARD STRUCTURE GUIDANCE:**
- Follow the outline structure precisely
- Maintain consistent formatting throughout
- Use appropriate heading hierarchy (H1, H2, H3)
- Include clear transitions between sections`;
    }
  };

  return `You are an exceptionally skilled ${data.industry} content writer and ${data.audience} specialist with a gift for creating deeply human, emotionally resonant content that feels like it was written by someone who truly understands both the subject matter and the reader's world.

${toneInstructions}

WRITING MISSION:
Transform this content outline into ${data.wordCount} words of compelling, human-centered ${data.contentType} content that follows the ${data.structureFormat} structure format. Ensure ${data.audience} will find it genuinely valuable, relatable, and engaging.

${getStructureWritingGuidance(data.structureFormat)}

CONTENT OUTLINE TO EXPAND:
${JSON.stringify(outline, null, 2)}

USER'S COMPLETE CONTEXT:
• Core Topic: "${data.topic}"
• Writing for: ${data.audience} in ${data.industry}
• Desired Tone: ${data.contentTone}
${data.writingPersonality ? `• Writing Personality: ${data.writingPersonality}` : ""}
${data.readingLevel ? `• Target Reading Level: ${data.readingLevel} for clarity and accessibility` : ""}
• Word Target: ${data.wordCount} words
• Keywords to weave naturally: ${data.keywords.join(", ")}
${data.includeStats ? "• MUST include relevant statistics with sources" : ""}
${data.includeReferences ? "• MUST include 3-7 reputable external sources with clickable links" : ""}
${data.mediaUrls.length > 0 ? `• Media Integration: ${data.mediaUrls.length} visual elements provided
• Placement Strategy: Follow ${data.mediaPlacementStrategy} placement recommendations from outline
• Alt Text Requirements: Generate SEO-friendly alt text for each image
• Visual Storytelling: Use images to enhance narrative flow and break up text` : ""}

CRITICAL WRITING GUIDELINES:

🎯 **HUMAN-FIRST APPROACH:**
- Write as if you're having a conversation with a smart friend in ${data.industry}
- Include personal observations, relatable scenarios, and "you've been there" moments
- Use contractions, occasional informal language, and natural speech patterns
- Reference common experiences that ${data.audience} faces daily
- Inject personality, opinions, and authentic voice throughout
${data.writingPersonality ? `- Inject the personality of a ${data.writingPersonality} expert into the writing style` : ""}

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
- Include keyword variations and semantically related terms to improve topic authority and SEO
- Create scannable content with compelling subheadings
- Include questions that match search intent

${data.includeReferences ? `📚 **REFERENCES & CREDIBILITY:**
- Include 3-7 reputable external sources in clickable markdown or HTML format throughout the content
- Prioritize .gov, .edu, and industry authorities (e.g., Harvard.edu, WHO.int, Forbes.com)
- Integrate source links naturally within the content flow, not just as citations
- Add a "References" section at the end with all sources used
- Use authoritative sources that enhance credibility and support key claims
- Format links appropriately for ${data.outputFormat} output format` : ""}

${data.mediaUrls.length > 0 ? `🖼️ **ENHANCED MEDIA INTEGRATION:**
- Follow the mediaStrategy from the outline for optimal image placement
- CRITICAL: Use the exact image placeholder format: ![Alt Text](image-${data.mediaUrls.map((_: any, i: number) => i + 1).join('|image-')})
- Available images: ${data.mediaUrls.length} uploaded media files
${data.mediaCaptions.length > 0 ? `- Image captions provided: ${data.mediaCaptions.map((caption: string, i: number) => `Image ${i + 1}: "${caption}"`).join(', ')}` : ''}
${data.mediaAnalysis.length > 0 ? `- AI Analysis available: ${data.mediaAnalysis.map((analysis: string, i: number) => `Image ${i + 1}: "${analysis}"`).join(', ')}` : ''}
- Place images strategically throughout content to break up text and enhance storytelling
- Use SEO-optimized alt text for each image (descriptive and keyword-rich)
- Include engaging captions that tie images directly to surrounding content
- Reference images naturally in the text flow (e.g., "As shown in the image above..." or "The visual below illustrates...")
- Ensure images support key points and provide visual breaks every 300-500 words
- For ${data.mediaPlacementStrategy} placement: ${
  data.mediaPlacementStrategy === 'auto' ? 'Let AI determine optimal placement for maximum engagement and content flow' :
  data.mediaPlacementStrategy === 'manual' ? 'Follow exact placement specifications from media analysis and user preferences' :
  'Use semantic analysis to place images where they best support content meaning and context'
}
- MANDATORY: Include at least one image reference per major section if images are available
- Format: ![Descriptive alt text about the image content](image-1), ![Alt text for second image](image-2), etc.
- Caption format: Place caption text immediately after image in italics: *Caption explaining relevance*` : ""}

${data.outputFormat === "html" ? `📘 **STRUCTURED DATA (Schema.org):**
- Add JSON-LD for BlogPosting schema at the beginning of the HTML content
- Include proper schema markup with author, datePublished, headline, description
- Use schema.org/BlogPosting structure for better SEO and rich snippets
- Include wordCount, keywords, and industry-relevant organization data` : ""}

${data.outputFormat === "html" && data.structuredData ? `🔗 **BLOG SCHEMA MARKUP:**
- Include a valid JSON-LD schema block for type "BlogPosting" using schema.org structure
- Add structured data in a <script type="application/ld+json"> block at the beginning
- Use the content's title as headline, meta description, and proper author information
- Include datePublished, wordCount, keywords, and publisher details` : ""}

FORMATTING REQUIREMENTS:
- Use markdown formatting for structure
- Create compelling, specific subheadings (not generic ones)
- Include bullet points and numbered lists for scanability
- Bold key concepts and important takeaways
- Use short paragraphs (2-4 sentences max) for readability
${data.tocRequired ? "- Begin the content with a clean, clickable Table of Contents" : ""}
${data.summaryRequired ? "- End with a TL;DR section summarizing the 3-5 key takeaways" : ""}

${data.ctaType !== "none" ? `CTA INTEGRATION: Conclude with a natural, ${data.ctaType}-focused call-to-action that feels helpful, not salesy.` : "CONCLUSION: End with inspiring final thoughts that leave readers feeling empowered and informed."}

${data.enableMetadataBlock ? `🔍 **METADATA BLOCK:**
After the main content, include a JSON metadata block with:
- metaTitle: SEO-optimized title (50-60 chars)
- metaDescription: compelling meta description (150-160 chars)
- estimatedReadingTime: reading time in minutes
- primaryEmotion: main emotion the content evokes
- readingLevel: assessed reading level (e.g., "B2-C1", "High School", "College")
- primaryKeyword: main target keyword
- topics: array of 3-5 main topics/themes covered` : ""}

${data.outputFormat === "html" ? `FORMAT: Return content in clean HTML format with proper heading tags and structure. START with JSON-LD schema markup in a <script type="application/ld+json"> tag containing BlogPosting schema with:
- @context: "https://schema.org"
- @type: "BlogPosting"
- headline: "${data.topic}"
- description: meta description from outline
- datePublished: current date
- wordCount: estimated word count
- keywords: ${data.keywords.join(", ")}
- author: { @type: "Person", name: "Expert ${data.industry} Writer" }
- publisher: { @type: "Organization", name: "EngagePerfect" }
Then follow with the actual HTML content.` : "FORMAT: Return content in clean Markdown format."}

${data.includeReferences ? `📋 **SOURCES SECTION:**
Add a section titled "Sources" at the end of the content that includes a bullet list of all external links used throughout the article. Format as clickable links in either Markdown format [Link Text](URL) or clean HTML format <a href="URL">Link Text</a> depending on the output format. Include brief descriptions of what each source provides.` : ""}

Remember: This content should feel like it was written by a human expert who genuinely cares about helping ${data.audience} succeed in ${data.industry}. Every sentence should either inform, inspire, or provide practical value. Avoid AI-sounding phrases, generic advice, and robotic language patterns.

Write the complete ${data.wordCount}-word ${data.contentType} now:`;
};

const getToneInstructions = (tone: string): string => {
  switch (tone.toLowerCase()) {
    case 'friendly':
      return `
TONE GUIDELINES - FRIENDLY:
• Use warm, approachable language that feels like a conversation with a trusted friend
• Include personal touches and relatable examples from everyday life
• Ask rhetorical questions to engage readers and create dialogue
• Use "you" frequently to create direct connection
• Share experiences and insights in a personal way
• Maintain optimism and positivity throughout
• Use contractions and casual language where appropriate
• Include encouraging phrases and supportive language
• Make complex topics feel accessible and non-intimidating`;

    case 'professional':
      return `
TONE GUIDELINES - PROFESSIONAL:
• Maintain formal, authoritative language appropriate for business contexts
• Use industry-standard terminology and proper business etiquette
• Structure content with clear, logical progression
• Support statements with credible sources and data
• Avoid overly casual expressions or slang
• Use third-person perspective when appropriate
• Include executive summaries and key takeaways
• Maintain objectivity while providing expert insights
• Present information in a polished, corporate-appropriate manner`;

    case 'thoughtprovoking':
    case 'thought-provoking':
      return `
TONE GUIDELINES - THOUGHT-PROVOKING:
• Challenge conventional thinking and present new perspectives
• Ask deep, meaningful questions that encourage reflection
• Present contrasting viewpoints and explore nuances
• Use thought experiments and hypothetical scenarios
• Connect ideas across different domains and disciplines
• Encourage critical thinking and self-examination
• Present complex concepts that require mental engagement
• Use philosophical approaches and broader implications
• Inspire readers to reconsider their assumptions and beliefs`;

    case 'expert':
      return `
TONE GUIDELINES - EXPERT:
• Demonstrate deep, specialized knowledge and years of experience
• Use technical terminology appropriately with clear explanations
• Share insider knowledge and industry secrets
• Reference specific methodologies, frameworks, and best practices
• Include detailed analysis and sophisticated insights
• Cite authoritative sources and recent research
• Provide advanced strategies beyond basic advice
• Show mastery through nuanced understanding of complex topics
• Offer strategic perspectives that only experienced professionals would know`;

    case 'persuasive':
      return `
TONE GUIDELINES - PERSUASIVE:
• Build compelling arguments using logical reasoning and emotional appeal
• Use social proof, testimonials, and success stories
• Address objections and counterarguments proactively
• Create urgency and emphasize benefits clearly
• Use powerful action words and decisive language
• Structure arguments with strong opening and closing statements
• Include specific examples and case studies as evidence
• Appeal to readers' desires, fears, and aspirations
• Guide readers toward a specific conclusion or action`;

    case 'informative':
    case 'informative/neutral':
    case 'neutral':
      return `
TONE GUIDELINES - INFORMATIVE/NEUTRAL:
• Present information objectively without bias or personal opinion
• Use clear, straightforward language that's easy to understand
• Focus on facts, data, and verifiable information
• Organize content logically with clear headings and structure
• Provide balanced coverage of different aspects or viewpoints
• Use examples and analogies to clarify complex concepts
• Maintain educational focus without trying to persuade
• Include relevant statistics and research findings
• Write in an accessible style suitable for general audiences`;

    case 'casual':
    case 'casual/conversational':
    case 'conversational':
      return `
TONE GUIDELINES - CASUAL/CONVERSATIONAL:
• Write as if speaking directly to a friend over coffee
• Use everyday language, contractions, and natural speech patterns
• Include personal anecdotes and relatable stories
• Use humor, pop culture references, and current trends
• Break complex ideas into bite-sized, digestible pieces
• Include rhetorical questions and direct reader engagement
• Use shorter sentences and paragraphs for easy reading
• Add personality and authentic voice throughout
• Make content feel effortless and enjoyable to read`;

    case 'authoritative':
    case 'authoritative/confident':
    case 'confident':
      return `
TONE GUIDELINES - AUTHORITATIVE/CONFIDENT:
• Make definitive statements backed by expertise and evidence
• Use commanding language that demonstrates leadership
• Present information with unwavering confidence and clarity
• Establish credibility through demonstrated knowledge and experience
• Use assertive statements rather than tentative suggestions
• Include specific metrics, results, and proven outcomes
• Take clear positions on controversial or debated topics
• Show mastery through comprehensive understanding
• Guide readers with confidence and decisive recommendations`;

    case 'inspirational':
    case 'inspirational/motivational':
    case 'motivational':
      return `
TONE GUIDELINES - INSPIRATIONAL/MOTIVATIONAL:
• Use uplifting language that energizes and motivates action
• Share success stories and transformation examples
• Focus on possibilities, potential, and positive outcomes
• Include calls to action that inspire immediate steps
• Use empowering language that builds confidence
• Address challenges as opportunities for growth
• Create vision of better future and achievable goals
• Include motivational quotes and inspiring examples
• End sections with encouraging and actionable insights`;

    case 'humorous':
    case 'humorous/witty':
    case 'witty':
      return `
TONE GUIDELINES - HUMOROUS/WITTY:
• Include appropriate humor, wordplay, and clever observations
• Use funny analogies and entertaining examples
• Make light of common frustrations and shared experiences
• Include witty one-liners and amusing anecdotes
• Use self-deprecating humor when appropriate
• Keep humor relevant to the topic and audience
• Balance entertainment with valuable information
• Use unexpected comparisons and creative metaphors
• Maintain professionalism while being entertaining`;

    case 'empathetic':
      return `
TONE GUIDELINES - EMPATHETIC:
• Acknowledge readers' feelings, struggles, and challenges
• Use understanding and compassionate language
• Validate emotions and experiences without judgment
• Share relatable stories of overcoming difficulties
• Offer support and encouragement throughout content
• Use inclusive language that makes everyone feel welcome
• Address common pain points with sensitivity
• Provide comfort and reassurance alongside practical advice
• Show genuine care for readers' wellbeing and success`;

    default:
      return `
TONE GUIDELINES - ${tone.toUpperCase()}:
• Write in a ${tone} tone that resonates with your target audience
• Maintain consistency throughout the content
• Use language appropriate for the selected tone
• Ensure the tone enhances rather than distracts from the message`;
  }
};

const buildSystemPrompt = (data: any): string => {
  const personalityText = data.writingPersonality ? ` with a ${data.writingPersonality} personality` : "";
  const toneInstructions = getToneInstructions(data.contentTone);
  
  return `You are an expert ${data.industry} content writer${personalityText} specializing in ${data.audience}-focused content. Write with deep expertise and authentic human voice that provides genuine value to the reader.

${toneInstructions}

CORE WRITING PRINCIPLES:
• Ensure every paragraph provides genuine value and insights
• Use specific examples and concrete details rather than generic statements
• Maintain the specified tone consistently throughout the entire piece
• Write with authority while being accessible to your target audience
• Create content that is comprehensive, engaging, and actionable`;
};

/**
 * Creates a sophisticated fallback outline when Gemini fails
 * Ensures content generation can continue with high-quality structure
 */
const createFallbackOutline = (data: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { topic, audience, industry, wordCount, contentTone, keywords, includeReferences, mediaUrls, mediaPlacementStrategy, ctaType, structureFormat } = data;
  
  // Structure-specific section generation
  const generateStructureSpecificSections = () => {
    const wordsPerSection = Math.floor(wordCount / 5); // Default to 5 sections

    switch (structureFormat) {
      case 'how-to-steps':
        return [
          {
            title: `How to ${topic}: Complete Step-by-Step Guide`,
            wordCount: Math.floor(wordCount * 0.15),
            tone: contentTone,
            keyPoints: ["Overview of the process", "What readers will learn", "Prerequisites and requirements"],
            humanElements: {
              storyOpportunity: "User success story or common frustration",
              emotionalConnection: "Building confidence about the process",
              practicalValue: "Clear expectations and outcomes"
            }
          },
          {
            title: "Step 1: Getting Started",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Initial setup", "First actions to take", "Common beginner mistakes to avoid"],
            humanElements: {
              storyOpportunity: "First-time experience scenario",
              emotionalConnection: "Reducing anxiety about starting",
              practicalValue: "Concrete first steps"
            }
          },
          {
            title: "Step 2: Building Momentum",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Next level actions", "Building on previous step", "Tips for efficiency"],
            humanElements: {
              storyOpportunity: "Progress milestone story",
              emotionalConnection: "Celebrating early wins",
              practicalValue: "Advanced techniques"
            }
          },
          {
            title: "Step 3: Mastering the Process",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Advanced techniques", "Optimization strategies", "Troubleshooting common issues"],
            humanElements: {
              storyOpportunity: "Expert-level application",
              emotionalConnection: "Building expertise and confidence",
              practicalValue: "Pro tips and best practices"
            }
          },
          {
            title: "Conclusion & Next Steps",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Summary of accomplishments", "What to do next", "Resources for continued learning"],
            humanElements: {
              storyOpportunity: "Long-term success vision",
              emotionalConnection: "Empowerment and motivation",
              practicalValue: "Clear path forward"
            }
          }
        ];

      case 'faq-qa':
        return [
          {
            title: `${topic}: Frequently Asked Questions`,
            wordCount: Math.floor(wordCount * 0.12),
            tone: contentTone,
            keyPoints: ["Introduction to the topic", "Scope of questions covered", "How to use this guide"],
            humanElements: {
              storyOpportunity: "Common user scenarios",
              emotionalConnection: "Understanding user concerns",
              practicalValue: "Navigation guide"
            }
          },
          {
            title: "Basic Questions",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["What is questions", "Why questions", "When questions"],
            humanElements: {
              storyOpportunity: "Beginner experiences",
              emotionalConnection: "Reducing confusion and anxiety",
              practicalValue: "Foundational understanding"
            }
          },
          {
            title: "Getting Started Questions",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["How to start", "What you need", "First steps"],
            humanElements: {
              storyOpportunity: "First-time user journey",
              emotionalConnection: "Building confidence to begin",
              practicalValue: "Actionable starting points"
            }
          },
          {
            title: "Advanced Questions",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Complex scenarios", "Troubleshooting", "Optimization"],
            humanElements: {
              storyOpportunity: "Power user experiences",
              emotionalConnection: "Advanced mastery",
              practicalValue: "Expert-level insights"
            }
          },
          {
            title: "Additional Resources",
            wordCount: Math.floor(wordCount * 0.13),
            tone: contentTone,
            keyPoints: ["Where to get help", "Further reading", "Community resources"],
            humanElements: {
              storyOpportunity: "Continuing education journey",
              emotionalConnection: "Ongoing support and growth",
              practicalValue: "Resource directory"
            }
          }
        ];

      case 'comparison-vs':
        return [
          {
            title: `${topic}: Complete Comparison Guide`,
            wordCount: Math.floor(wordCount * 0.15),
            tone: contentTone,
            keyPoints: ["What's being compared", "Why comparison matters", "How to use this guide"],
            humanElements: {
              storyOpportunity: "Decision-making scenario",
              emotionalConnection: "Understanding the dilemma",
              practicalValue: "Framework for comparison"
            }
          },
          {
            title: "Option A: In-Depth Analysis",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Key features", "Strengths and benefits", "Ideal use cases"],
            humanElements: {
              storyOpportunity: "Success story with Option A",
              emotionalConnection: "Excitement about possibilities",
              practicalValue: "When to choose this option"
            }
          },
          {
            title: "Option B: Comprehensive Review",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Key features", "Strengths and benefits", "Ideal use cases"],
            humanElements: {
              storyOpportunity: "Success story with Option B",
              emotionalConnection: "Alternative path excitement",
              practicalValue: "When to choose this option"
            }
          },
          {
            title: "Side-by-Side Comparison",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Feature comparison", "Pros and cons", "Cost analysis"],
            humanElements: {
              storyOpportunity: "Real user choosing between options",
              emotionalConnection: "Confidence in decision-making",
              practicalValue: "Clear comparison framework"
            }
          },
          {
            title: "Final Recommendation",
            wordCount: Math.floor(wordCount * 0.15),
            tone: contentTone,
            keyPoints: ["Best choice for different scenarios", "Final thoughts", "How to proceed"],
            humanElements: {
              storyOpportunity: "Successful implementation story",
              emotionalConnection: "Clarity and confidence",
              practicalValue: "Decision-making guidance"
            }
          }
        ];

      case 'review-analysis':
        return [
          {
            title: `${topic}: Complete Review and Analysis`,
            wordCount: Math.floor(wordCount * 0.12),
            tone: contentTone,
            keyPoints: ["What's being reviewed", "Review methodology", "Key evaluation criteria"],
            humanElements: {
              storyOpportunity: "Why this review matters",
              emotionalConnection: "Understanding user needs",
              practicalValue: "Review framework"
            }
          },
          {
            title: "Key Features and Capabilities",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Core features", "Unique capabilities", "User interface"],
            humanElements: {
              storyOpportunity: "First impressions experience",
              emotionalConnection: "Excitement about features",
              practicalValue: "Feature breakdown"
            }
          },
          {
            title: "What We Loved (Pros)",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Standout strengths", "User experience highlights", "Value propositions"],
            humanElements: {
              storyOpportunity: "Positive user experiences",
              emotionalConnection: "Satisfaction and delight",
              practicalValue: "Key benefits"
            }
          },
          {
            title: "Areas for Improvement (Cons)",
            wordCount: Math.floor(wordCount * 0.18),
            tone: contentTone,
            keyPoints: ["Limitations", "User frustrations", "Missing features"],
            humanElements: {
              storyOpportunity: "Challenging user scenarios",
              emotionalConnection: "Honest assessment",
              practicalValue: "Realistic expectations"
            }
          },
          {
            title: "Final Verdict and Recommendation",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Overall rating", "Who should use this", "Final thoughts"],
            humanElements: {
              storyOpportunity: "Ideal user success story",
              emotionalConnection: "Confident recommendation",
              practicalValue: "Clear guidance"
            }
          }
        ];

      case 'case-study-detailed':
        return [
          {
            title: `${topic}: Case Study Overview`,
            wordCount: Math.floor(wordCount * 0.1),
            tone: contentTone,
            keyPoints: ["Executive summary", "Key outcomes", "Why this matters"],
            humanElements: {
              storyOpportunity: "Setting the scene",
              emotionalConnection: "Inspiring possibility",
              practicalValue: "Key takeaways preview"
            }
          },
          {
            title: "Background and Context",
            wordCount: Math.floor(wordCount * 0.15),
            tone: contentTone,
            keyPoints: ["Initial situation", "Market conditions", "Stakeholders involved"],
            humanElements: {
              storyOpportunity: "Behind-the-scenes setup",
              emotionalConnection: "Understanding the stakes",
              practicalValue: "Context for decisions"
            }
          },
          {
            title: "The Challenge",
            wordCount: Math.floor(wordCount * 0.2),
            tone: contentTone,
            keyPoints: ["Problem definition", "Constraints faced", "Why traditional solutions failed"],
            humanElements: {
              storyOpportunity: "Moment of crisis or realization",
              emotionalConnection: "Tension and urgency",
              practicalValue: "Problem identification"
            }
          },
          {
            title: "The Solution and Implementation",
            wordCount: Math.floor(wordCount * 0.3),
            tone: contentTone,
            keyPoints: ["Strategic approach", "Implementation steps", "Key decisions made"],
            humanElements: {
              storyOpportunity: "Breakthrough moments",
              emotionalConnection: "Innovation and determination",
              practicalValue: "Actionable strategies"
            }
          },
          {
            title: "Results and Key Takeaways",
            wordCount: Math.floor(wordCount * 0.25),
            tone: contentTone,
            keyPoints: ["Quantifiable results", "Lessons learned", "Actionable insights"],
            humanElements: {
              storyOpportunity: "Success celebration",
              emotionalConnection: "Achievement and satisfaction",
              practicalValue: "Replicable insights"
            }
          }
        ];

      default:
        return Array.from({ length: 5 }, (_, i) => ({
          title: i === 0 ? `Understanding ${topic}: A Complete Guide for ${audience}` :
                 i === 4 ? `Your Next Steps: Implementing ${topic} Successfully` :
                 `Strategy ${i}: Key Approaches to ${topic}`,
          wordCount: wordsPerSection,
          tone: contentTone,
          keyPoints: [
            `Essential information for ${audience}`,
            `Practical implementation strategies`,
            `Real-world examples and case studies`
          ],
          humanElements: {
            storyOpportunity: `Real-world scenario relevant to ${industry}`,
            emotionalConnection: "Building confidence and understanding",
            practicalValue: "Actionable insights and next steps"
          }
        }));
    }
  };

  const sections = generateStructureSpecificSections();
  
  return {
    meta: {
      estimatedReadingTime: `${Math.ceil(wordCount / 200)} minutes`,
      primaryEmotion: "informed and empowered",
      keyValueProposition: `Comprehensive ${structureFormat} guide to ${topic} for ${audience}`
    },
    hookOptions: [
      `Did you know that ${audience} face this exact challenge with ${topic} every single day?`,
      `Picture this: You're a ${audience.toLowerCase()} trying to navigate ${topic}, and everything feels overwhelming.`,
      `Here's the truth about ${topic} that most ${audience} never discover...`
    ],
    sections: sections.map((section, i) => ({
      ...section,
      ...(includeReferences && {
        referenceOpportunities: {
          authoritySourceTypes: "Industry authorities, government sources, and research studies",
          integrationStrategy: "Natural integration throughout content flow"
        }
      }),
      ...(mediaUrls.length > 0 && i < mediaUrls.length && {
        mediaPlacement: {
          recommendedImages: [`Image ${i + 1} for section illustration`],
          placementRationale: "Visual support for key concepts",
          altTextSuggestions: [`${topic} illustration ${i + 1} for ${audience}`],
          captionIdeas: [`Visual guide to ${topic} concept ${i + 1}`]
        }
      }),
      subsections: section.keyPoints.map((point, idx) => ({
        subtitle: point,
        focusArea: `Implementation of ${point.toLowerCase()}`,
        wordCount: Math.floor(section.wordCount / section.keyPoints.length)
      }))
    })),
    seoStrategy: {
      metaDescription: `Discover essential ${topic} strategies for ${audience} in ${industry}. Expert insights, practical tips, and actionable advice.`,
      primaryKeyword: keywords[0] || topic,
      keywordDensity: "natural integration throughout content with semantic variations",
      featuredSnippetTarget: "how-to guide with step-by-step instructions"
    },
    conclusion: {
      approach: "synthesize key insights and provide clear next steps",
      emotionalGoal: "confident and motivated to implement learnings",
      ctaIntegration: ctaType !== "none" ? ctaType : "encouraging action without sales pressure"
    },
    ...(includeReferences && {
      referencesSection: {
        sourceCount: "3-7 sources recommended",
        sourceTypes: "mix of .gov, .edu, and authoritative industry sources",
        formattingStyle: "clean list with clickable links and brief descriptions"
      }
    }),
    ...(mediaUrls.length > 0 && {
      mediaStrategy: {
        overallPlacementApproach: `${mediaPlacementStrategy} placement strategy for optimal content flow`,
        imageCount: mediaUrls.length,
        strategicPlacements: mediaUrls.map((_: any, index: number) => ({
          imageIndex: index,
          recommendedSection: `Section ${Math.min(index + 1, sections.length)}`,
          placementReason: "Visual support for key concepts",
          altTextSuggestion: `Illustration showing ${topic} concept ${index + 1}`,
          captionSuggestion: `Visual guide to understanding this aspect of ${topic}`
        })),
        visualNarrativeFlow: "Images strategically placed to support learning progression"
      }
    })  };
};

/**
 * Validates that media URLs are accessible Firebase Storage URLs
 * This ensures images can be properly referenced in generated content
 */
const validateMediaUrls = async (mediaUrls: string[], userId: string): Promise<string[]> => {
  const validUrls: string[] = [];
  
  for (const url of mediaUrls) {
    try {
      // Check if URL is a valid Firebase Storage URL
      if (!url.includes('firebasestorage.googleapis.com') && !url.includes('storage.googleapis.com')) {
        console.warn(`[LongForm] Skipping non-Firebase URL: ${url.substring(0, 50)}...`);
        continue;
      }
      
      // Validate URL accessibility by making a HEAD request
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        validUrls.push(url);
        console.log(`[LongForm] Validated media URL: ${url.substring(0, 50)}...`);
      } else {
        console.warn(`[LongForm] Media URL not accessible (${response.status}): ${url.substring(0, 50)}...`);
      }
    } catch (error) {
      console.warn(`[LongForm] Error validating media URL: ${url.substring(0, 50)}...`, error);
    }
  }
  
  return validUrls;
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
  timeoutSeconds: 540, // Increased to 9 minutes for complex generation
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
    }    // Step 5: Extract and structure inputs with media validation
    const promptData = {
      topic: data.topic,
      audience: data.audience,
      industry: data.industry,
      keywords: data.keywords || [],
      contentTone: data.contentTone,
      writingPersonality: data.writingPersonality || "",
      readingLevel: data.readingLevel || "",
      contentType: data.contentType || "blog-article",
      structureFormat: data.structureFormat || "intro-points-cta",
      wordCount: data.wordCount || 1200,
      includeStats: data.includeStats || false,
      includeReferences: data.includeReferences || false,
      tocRequired: data.tocRequired || false,
      summaryRequired: data.summaryRequired || false,
      structuredData: data.structuredData || false,
      enableMetadataBlock: data.enableMetadataBlock || false,
      ctaType: data.ctaType || "none",
      mediaUrls: data.mediaUrls || [],
      mediaCaptions: data.mediaCaptions || [],
      mediaAnalysis: data.mediaAnalysis || [], // AI-analyzed descriptions of uploaded images
      mediaPlacementStrategy: data.mediaPlacementStrategy || "auto", // auto, manual, or semantic
      structureNotes: data.structureNotes || "",
      outputFormat: data.outputFormat || "markdown"
    };

    // Step 5.1: Validate and process media URLs
    if (promptData.mediaUrls.length > 0) {
      console.log(`[LongForm] Processing ${promptData.mediaUrls.length} media URLs`);
      
      // Validate media URLs are accessible Firebase Storage URLs
      const validatedUrls = await validateMediaUrls(promptData.mediaUrls, uid);
      promptData.mediaUrls = validatedUrls;
      
      console.log(`[LongForm] ${validatedUrls.length} media URLs validated successfully`);
    }
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
      content: generatedContent,      metadata: {
        actualWordCount: generatedContent.split(/\s+/).filter(word => word.length > 0).length, // More accurate word count
        estimatedReadingTime: Math.ceil(generatedContent.split(/\s+/).filter(word => word.length > 0).length / 200),
        generatedAt: FieldValue.serverTimestamp(),        generationTime: Date.now() - startTime,
        outlineGenerationTime: outlineTime,
        contentGenerationTime: contentTime,
        version: "2.2.0", // Updated version with enhanced prompts
        // New enhanced metadata fields
        readingLevel: promptData.readingLevel || "General",
        hasReferences: promptData.includeReferences || false,
        contentPersonality: promptData.writingPersonality || "Professional",
        contentEmotion: outline.meta?.primaryEmotion || "Informative",
        topics: outline.meta?.topics || promptData.keywords?.slice(0, 5) || [promptData.topic],
        metaTitle: outline.seoStrategy?.metaDescription?.substring(0, 60) || `${promptData.topic} - Expert Guide`,
        metaDescription: outline.seoStrategy?.metaDescription || `Comprehensive guide to ${promptData.topic} for ${promptData.audience}`,
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
      transaction.set(contentRef, contentData);      // Update usage based on plan type - Blog generation costs 4 requests
      if (usageCheck.planType === "flexy" && usageCheck.userData?.flexy_requests && usageCheck.userData.flexy_requests > 0) {
        transaction.update(userRef, {
          flexy_requests: FieldValue.increment(-BLOG_REQUEST_COST)
        });
      } else {
        transaction.update(userRef, {
          requests_used: FieldValue.increment(BLOG_REQUEST_COST)
        });
      }
    });    // Step 10: Calculate remaining requests - Blog generation costs 4 requests
    const remainingRequests = Math.max(0, usageCheck.requestsRemaining - BLOG_REQUEST_COST);
    
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

