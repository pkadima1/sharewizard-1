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
${data.includeReferences ? "• MUST include credible external sources and references" : ""}
${data.mediaUrls.length > 0 ? `
• Media Assets: ${data.mediaUrls.length} images provided
• Placement Strategy: ${data.mediaPlacementStrategy}
• Media Analysis: ${data.mediaAnalysis.length > 0 ? "AI descriptions available for optimal placement" : "Basic media integration"}
• Alt Text Requirements: Generate SEO-friendly alt text for each image
` : ""}

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
  return `You are an exceptionally skilled ${data.industry} content writer and ${data.audience} specialist with a gift for creating deeply human, emotionally resonant content that feels like it was written by someone who truly understands both the subject matter and the reader's world.

WRITING MISSION:
Transform this content outline into ${data.wordCount} words of compelling, human-centered ${data.contentType} content that ${data.audience} will find genuinely valuable, relatable, and engaging.

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

const buildSystemPrompt = (data: any): string => {
  const personalityText = data.writingPersonality ? ` with a ${data.writingPersonality} personality` : "";
  return `You are an expert ${data.industry} content writer${personalityText} specializing in ${data.audience}-focused content. Write in a ${data.contentTone} tone with deep expertise and authentic human voice. Ensure the content is comprehensive, engaging, and provides genuine value to the reader.`;
};

/**
 * Creates a sophisticated fallback outline when Gemini fails
 * Ensures content generation can continue with high-quality structure
 */
const createFallbackOutline = (data: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { topic, audience, industry, wordCount, contentTone, keywords, includeReferences, mediaUrls, mediaPlacementStrategy, ctaType } = data;
  
  const sections = Math.max(4, Math.min(7, Math.ceil(wordCount / 300))); // 4-7 sections
  const wordsPerSection = Math.floor(wordCount / sections);
  
  return {
    meta: {
      estimatedReadingTime: `${Math.ceil(wordCount / 200)} minutes`,
      primaryEmotion: "informed and empowered",
      keyValueProposition: `Comprehensive guide to ${topic} for ${audience}`
    },
    hookOptions: [
      `Did you know that ${audience} face this exact challenge with ${topic} every single day?`,
      `Picture this: You're a ${audience.toLowerCase()} trying to navigate ${topic}, and everything feels overwhelming.`,
      `Here's the truth about ${topic} that most ${audience} never discover...`
    ],
    sections: Array.from({ length: sections }, (_, i) => ({
      title: i === 0 ? `Understanding ${topic}: A Complete Guide for ${audience}` :
             i === sections - 1 ? `Your Next Steps: Implementing ${topic} Successfully` :
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
      },
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
      subsections: [
        {
          subtitle: "Key Concepts",
          focusArea: "Foundational understanding",
          wordCount: Math.floor(wordsPerSection / 2)
        },
        {
          subtitle: "Practical Application", 
          focusArea: "Implementation guidance",
          wordCount: Math.floor(wordsPerSection / 2)
        }
      ]
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
          recommendedSection: `Section ${Math.min(index + 1, sections)}`,
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

