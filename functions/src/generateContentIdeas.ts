/**
 * Generate Content Ideas Firebase Function
 * v1.0.0 - Production Ready
 * 
 * OpenAI-powered content idea generation with:
 * - Multi-language support
 * - Usage tracking and limits
 * - Cost optimization with gpt-4o-mini
 * - Structured JSON output
 * - Fallback template generation
 * - Analytics and billing integration
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { getOpenAIKey } from "./config/secrets.js";
import { initializeFirebaseAdmin, getFirestore } from "./config/firebase-admin.js";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

// Usage limits and cost tracking
const FREE_TIER_DAILY_LIMIT = 3;
const CONTENT_IDEAS_REQUEST_COST = 1;

// TypeScript interfaces
interface GenerateContentIdeasRequest {
  niche: string;
  keywords: string[];
  trendingData?: string[];
  model?: 'gpt-4o-mini' | 'gpt-4o';
  userId: string;
  language?: string;
  industry?: string;
  audience?: string;
}

interface ContentIdea {
  title: string;
  description: string;
  targetKeywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'social_post' | 'blog_article';
  estimatedReadTime?: string;
  engagementScore?: number;
  seoPotential?: number;
}

interface GenerateContentIdeasResponse {
  socialPosts: ContentIdea[];
  blogArticles: ContentIdea[];
  requestsRemaining: number;
  usageStats: {
    totalRequests: number;
    dailyRequests: number;
    resetDate: string;
  };
  costInfo: {
    modelUsed: string;
    estimatedCost: number;
    tokensUsed?: number;
  };
}

interface UsageRecord {
  timestamp: FieldValue;
  model: string;
  tokensUsed?: number;
  cost: number;
  success: boolean;
  error?: string;
}

interface UserUsage {
  count: number;
  lastReset: string;
  requests: UsageRecord[];
  dailyCount: number;
}

// Language-specific prompts
const LANGUAGE_PROMPTS = {
  en: {
    system: "You are a professional content strategist specializing in creating engaging content ideas for social media and blogs.",
    user: "Generate 6 engaging content ideas for {niche} industry based on keywords: {keywords} and trending topics: {trends}. Return JSON format with social posts and blog articles.",
    fallback: "Create content ideas for {niche} with keywords: {keywords}"
  },
  fr: {
    system: "Vous êtes un stratège de contenu professionnel spécialisé dans la création d'idées de contenu engageantes pour les réseaux sociaux et les blogs.",
    user: "Générez 6 idées de contenu engageantes pour l'industrie {niche} basées sur les mots-clés: {keywords} et les sujets tendance: {trends}. Retournez au format JSON avec des posts sociaux et des articles de blog.",
    fallback: "Créez des idées de contenu pour {niche} avec les mots-clés: {keywords}"
  },
  es: {
    system: "Eres un estratega de contenido profesional especializado en crear ideas de contenido atractivo para redes sociales y blogs.",
    user: "Genera 6 ideas de contenido atractivo para la industria {niche} basadas en palabras clave: {keywords} y temas de tendencia: {trends}. Devuelve en formato JSON con posts sociales y artículos de blog.",
    fallback: "Crea ideas de contenido para {niche} con palabras clave: {keywords}"
  }
};

// Template-based fallback content ideas
const FALLBACK_TEMPLATES = {
  social: [
    {
      title: "5 Quick Tips for {niche} Success",
      description: "Share actionable tips that your audience can implement immediately",
      targetKeywords: ["tips", "success", "{niche}"],
      difficulty: "beginner" as const,
      contentType: "social_post" as const,
      estimatedReadTime: "2 min",
      engagementScore: 85,
      seoPotential: 70
    },
    {
      title: "Behind the Scenes: {niche} Insights",
      description: "Give your audience a peek into your {niche} process and expertise",
      targetKeywords: ["behind the scenes", "insights", "{niche}"],
      difficulty: "intermediate" as const,
      contentType: "social_post" as const,
      estimatedReadTime: "3 min",
      engagementScore: 90,
      seoPotential: 65
    },
    {
      title: "Common {niche} Mistakes to Avoid",
      description: "Help your audience learn from common pitfalls in the {niche} industry",
      targetKeywords: ["mistakes", "avoid", "{niche}"],
      difficulty: "intermediate" as const,
      contentType: "social_post" as const,
      estimatedReadTime: "4 min",
      engagementScore: 88,
      seoPotential: 75
    }
  ],
  blog: [
    {
      title: "The Complete Guide to {niche} Best Practices",
      description: "A comprehensive guide covering essential strategies and techniques for {niche} success",
      targetKeywords: ["guide", "best practices", "{niche}"],
      difficulty: "advanced" as const,
      contentType: "blog_article" as const,
      estimatedReadTime: "8 min",
      engagementScore: 92,
      seoPotential: 90
    },
    {
      title: "How to Measure Success in {niche}: Key Metrics Explained",
      description: "Learn the most important metrics to track and optimize your {niche} performance",
      targetKeywords: ["metrics", "measure", "success", "{niche}"],
      difficulty: "intermediate" as const,
      contentType: "blog_article" as const,
      estimatedReadTime: "6 min",
      engagementScore: 87,
      seoPotential: 85
    },
    {
      title: "The Future of {niche}: Trends and Predictions",
      description: "Explore emerging trends and future developments in the {niche} industry",
      targetKeywords: ["future", "trends", "predictions", "{niche}"],
      difficulty: "advanced" as const,
      contentType: "blog_article" as const,
      estimatedReadTime: "10 min",
      engagementScore: 95,
      seoPotential: 88
    }
  ]
};

/**
 * Check user usage limits and reset daily counter if needed
 */
async function checkUserUsage(userId: string): Promise<UserUsage> {
  const userRef = db.collection('users').doc(userId);
  const usageRef = userRef.collection('usage').doc('contentIdeas');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  try {
    const usageDoc = await usageRef.get();
    
    if (!usageDoc.exists) {
      // First time user
      const newUsage: UserUsage = {
        count: 0,
        lastReset: today,
        requests: [],
        dailyCount: 0
      };
      await usageRef.set(newUsage);
      return newUsage;
    }
    
    const usage = usageDoc.data() as UserUsage;
    
    // Check if we need to reset daily counter
    if (usage.lastReset !== today) {
      usage.dailyCount = 0;
      usage.lastReset = today;
      await usageRef.update({
        dailyCount: 0,
        lastReset: today
      });
    }
    
    return usage;
  } catch (error) {
    console.error('Error checking user usage:', error);
    throw new HttpsError('internal', 'Failed to check usage limits');
  }
}

/**
 * Update user usage after successful request
 */
async function updateUserUsage(
  userId: string, 
  model: string, 
  tokensUsed?: number, 
  cost: number = 0.01
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const usageRef = userRef.collection('usage').doc('contentIdeas');
  
  const usageRecord: UsageRecord = {
    timestamp: FieldValue.serverTimestamp(),
    model,
    tokensUsed,
    cost,
    success: true
  };
  
  try {
    await usageRef.update({
      count: FieldValue.increment(1),
      dailyCount: FieldValue.increment(1),
      requests: FieldValue.arrayUnion(usageRecord)
    });
    
    // Update analytics
    const analyticsRef = db.collection('analytics').doc('contentGeneration');
    await analyticsRef.set({
      totalRequests: FieldValue.increment(1),
      totalCost: FieldValue.increment(cost),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating user usage:', error);
    // Don't throw error here as the main function succeeded
  }
}

/**
 * Record failed request
 */
async function recordFailedRequest(
  userId: string, 
  model: string, 
  error: string
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const usageRef = userRef.collection('usage').doc('contentIdeas');
  
  const usageRecord: UsageRecord = {
    timestamp: FieldValue.serverTimestamp(),
    model,
    cost: 0,
    success: false,
    error
  };
  
  try {
    await usageRef.update({
      requests: FieldValue.arrayUnion(usageRecord)
    });
  } catch (error) {
    console.error('Error recording failed request:', error);
  }
}

/**
 * Generate content ideas using OpenAI API
 */
async function generateWithOpenAI(
  prompt: string,
  model: string = 'gpt-4o-mini',
  language: string = 'en'
): Promise<ContentIdea[]> {
  const openai = new OpenAI({
    apiKey: getOpenAIKey(),
  });
  
  const systemPrompt = LANGUAGE_PROMPTS[language as keyof typeof LANGUAGE_PROMPTS]?.system || 
                      LANGUAGE_PROMPTS.en.system;
  
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }
    
    // Parse JSON response
    const parsed = JSON.parse(responseText);
    
    // Extract content ideas from response
    const allIdeas: ContentIdea[] = [];
    
    if (parsed.socialPosts) {
      allIdeas.push(...parsed.socialPosts.map((post: any) => ({
        ...post,
        contentType: 'social_post' as const
      })));
    }
    
    if (parsed.blogArticles) {
      allIdeas.push(...parsed.blogArticles.map((article: any) => ({
        ...article,
        contentType: 'blog_article' as const
      })));
    }
    
    // If no structured response, try to parse as array
    if (allIdeas.length === 0 && Array.isArray(parsed)) {
      allIdeas.push(...parsed);
    }
    
    return allIdeas;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Generate fallback content ideas using templates
 */
function generateFallbackIdeas(niche: string, keywords: string[]): ContentIdea[] {
  const allIdeas: ContentIdea[] = [];
  
  // Add social posts
  FALLBACK_TEMPLATES.social.forEach(template => {
    allIdeas.push({
      ...template,
      title: template.title.replace(/{niche}/g, niche),
      targetKeywords: template.targetKeywords.map(kw => kw.replace(/{niche}/g, niche)),
      description: template.description.replace(/{niche}/g, niche)
    });
  });
  
  // Add blog articles
  FALLBACK_TEMPLATES.blog.forEach(template => {
    allIdeas.push({
      ...template,
      title: template.title.replace(/{niche}/g, niche),
      targetKeywords: template.targetKeywords.map(kw => kw.replace(/{niche}/g, niche)),
      description: template.description.replace(/{niche}/g, niche)
    });
  });
  
  return allIdeas;
}

/**
 * Main Firebase Cloud Function
 */
export const generateContentIdeas = onCall({
  cors: [
    "localhost:3000",
    "localhost:5173",
    "localhost:5174",
    "localhost:8080",
    /engperfecthlc\.web\.app$/,
    /engperfecthlc\.firebaseapp\.com$/,
    /engageperfect\.com$/,
    /www\.engageperfect\.com$/,
    /preview--.*\.lovable\.app$/,
    /.*\.lovable\.app$/,
    /.*\.lovableproject\.com$/,
    ...(process.env.NODE_ENV !== 'production' ? ["*"] : [])
  ],
  maxInstances: process.env.NODE_ENV === 'production' ? 50 : 10,
  timeoutSeconds: 120,
  minInstances: process.env.NODE_ENV === 'production' ? 1 : 0,
  memory: process.env.NODE_ENV === 'production' ? "512MiB" : "256MiB",
  region: "us-central1",
  concurrency: process.env.NODE_ENV === 'production' ? 80 : 10,
  labels: {
    version: "v1.0.0",
    service: "content-ideas-generation",
    environment: process.env.NODE_ENV === 'production' ? "production" : "development"
  }
}, async (request) => {
  try {
    // Step 1: Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    
    const uid = request.auth.uid;
    const data = request.data as GenerateContentIdeasRequest;
    
    // Step 2: Validate request data
    if (!data.niche || !data.keywords || data.keywords.length === 0) {
      throw new HttpsError("invalid-argument", "Niche and keywords are required.");
    }
    
    // Step 3: Check usage limits
    const userUsage = await checkUserUsage(uid);
    
    if (userUsage.dailyCount >= FREE_TIER_DAILY_LIMIT) {
      throw new HttpsError(
        "resource-exhausted", 
        `Daily limit of ${FREE_TIER_DAILY_LIMIT} requests reached. Please try again tomorrow or upgrade your plan.`
      );
    }
    
    // Step 4: Prepare prompt with localization
    const language = data.language || 'en';
    const promptTemplate = LANGUAGE_PROMPTS[language as keyof typeof LANGUAGE_PROMPTS]?.user || 
                          LANGUAGE_PROMPTS.en.user;
    
    const keywordsText = data.keywords.join(', ');
    const trendsText = data.trendingData?.join(', ') || 'current industry trends';
    
    const prompt = promptTemplate
      .replace('{niche}', data.niche)
      .replace('{keywords}', keywordsText)
      .replace('{trends}', trendsText);
    
    // Step 5: Generate content ideas
    const model = data.model || 'gpt-4o-mini';
    let contentIdeas: ContentIdea[] = [];
    let tokensUsed: number | undefined;
    let cost = 0.01; // Default cost for gpt-4o-mini
    
    try {
      contentIdeas = await generateWithOpenAI(prompt, model, language);
      
      // Estimate tokens used (rough calculation)
      const promptTokens = Math.ceil(prompt.length / 4);
      const responseTokens = Math.ceil(JSON.stringify(contentIdeas).length / 4);
      tokensUsed = promptTokens + responseTokens;
      
      // Calculate cost (approximate)
      if (model === 'gpt-4o-mini') {
        cost = (tokensUsed * 0.00015) / 1000; // $0.15 per 1M tokens
      } else if (model === 'gpt-4o') {
        cost = (tokensUsed * 0.005) / 1000; // $5.00 per 1M tokens
      }
      
    } catch (openaiError) {
      console.error('OpenAI generation failed, using fallback:', openaiError);
      
      // Use fallback template-based generation
      contentIdeas = generateFallbackIdeas(data.niche, data.keywords);
      
      // Record the failure
      await recordFailedRequest(uid, model, openaiError instanceof Error ? openaiError.message : 'Unknown error');
    }
    
    // Step 6: Separate social posts and blog articles
    const socialPosts = contentIdeas.filter(idea => idea.contentType === 'social_post').slice(0, 3);
    const blogArticles = contentIdeas.filter(idea => idea.contentType === 'blog_article').slice(0, 3);
    
    // Step 7: Update usage tracking
    await updateUserUsage(uid, model, tokensUsed, cost);
    
    // Step 8: Prepare response
    const response: GenerateContentIdeasResponse = {
      socialPosts,
      blogArticles,
      requestsRemaining: FREE_TIER_DAILY_LIMIT - (userUsage.dailyCount + 1),
      usageStats: {
        totalRequests: userUsage.count + 1,
        dailyRequests: userUsage.dailyCount + 1,
        resetDate: userUsage.lastReset
      },
      costInfo: {
        modelUsed: model,
        estimatedCost: cost,
        tokensUsed
      }
    };
    
    return response;
    
  } catch (error) {
    console.error('generateContentIdeas error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to generate content ideas. Please try again.');
  }
}); 