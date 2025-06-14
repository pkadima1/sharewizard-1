/**
 * supportChat.ts - v1.0.0
 * 
 * Purpose: Firebase Cloud Function for EngagePerfect AI-powered support chat
 * Features: OpenAI GPT-4o-mini integration, rate limiting, message storage, error handling
 * Interactions: Receives chat messages, returns AI responses, stores chat history
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";
import { getOpenAIKey } from "./config/secrets.js";

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
  console.log("Firebase Admin initialized successfully for support chat");
} catch (error: unknown) {
  if ((error as { code?: string }).code !== "app/duplicate-app") {
    console.error("Firebase admin initialization error", error);
  }
}

const db = getFirestore();

// TypeScript interfaces
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Timestamp;
  userId?: string;
}

interface SupportChatRequest {
  messages: Array<{ role: 'user' | 'assistant', content: string }>;
}

interface SupportChatResponse {
  reply: string;
  messagesRemaining?: number;
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxMessagesPerHour: 10,
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Enhanced system prompt with EngagePerfect knowledge
const SYSTEM_PROMPT = `You are the official AI support assistant for EngagePerfect, a cutting-edge AI-powered content creation platform. You're knowledgeable, helpful, and friendly.

## ABOUT ENGAGEPERFECT:

### Core Features:
1. **AI Caption Generator**: 6-step wizard (Upload Media → Select Niche → Choose Platform → Define Goal → Pick Tone → Generate Results)
2. **Long-Form Blog Creator**: AI-powered blog post generation with SEO optimization
3. **Content Personalization**: Tailored content based on industry, platform, and user goals

### Subscription Plans:
- **Free Plan**: 3 requests total, basic features, manual sharing
- **Basic Monthly**: £5.99/month, 70 requests/month, all features
- **Basic Yearly**: £59.99/year, 900 requests/year, all features (save 17%)
- **Flex Packs**: £1.99 per pack, 20 additional requests, no expiry

### Supported Platforms:
- Instagram, Twitter/X, LinkedIn, Facebook, TikTok, YouTube
- Platform-specific optimization for character limits and formats

### Key Benefits:
- Human-like, EEAT-optimized content
- Mobile-first responsive design
- Real-time preview and editing
- Multiple export formats (text, image with overlay, video with text)
- Smart hashtag suggestions
- Industry-specific content optimization

### Common User Questions:
- How to upgrade/downgrade plans
- Request limit explanations
- Platform-specific sharing guidance
- Content quality optimization tips
- Billing and subscription management

## YOUR ROLE:
- Provide accurate, helpful support
- Guide users through features step-by-step
- Explain subscription benefits clearly
- Troubleshoot technical issues
- Suggest best practices for content creation
- Be concise but thorough
- Always maintain a friendly, professional tone

If you don't know something specific, be honest and suggest contacting human support for complex technical issues.`;

/**
 * Check rate limit for user
 */
async function checkRateLimit(uid: string): Promise<boolean> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - RATE_LIMIT.windowMs);
    
    const rateLimitRef = db.collection('supportChats').doc(uid).collection('rateLimit');
    const recentMessages = await rateLimitRef
      .where('timestamp', '>', Timestamp.fromDate(oneHourAgo))
      .get();
    
    console.log(`[SupportChat] User ${uid} has sent ${recentMessages.size} messages in the last hour`);
    
    if (recentMessages.size >= RATE_LIMIT.maxMessagesPerHour) {
      return false; // Rate limit exceeded
    }
    
    // Log this request for rate limiting
    await rateLimitRef.add({
      timestamp: FieldValue.serverTimestamp(),
      userAgent: 'support-chat'
    });
    
    return true; // Within rate limit
  } catch (error) {
    console.error('[SupportChat] Rate limit check error:', error);
    return true; // Default to allowing if there's an error
  }
}

/**
 * Store chat message in Firestore
 */
async function storeChatMessage(uid: string, message: ChatMessage): Promise<void> {
  try {
    const chatRef = db.collection('supportChats').doc(uid).collection('messages');
    await chatRef.add({
      ...message,
      timestamp: FieldValue.serverTimestamp(),
      userId: uid
    });
  } catch (error) {    console.error('[SupportChat] Error storing message:', error);
    // Don't throw here - storage failure shouldn't break the chat
  }
}

/**
 * Get recent chat history for context
 * Exported for potential use in admin functions
 */
export async function getChatHistory(uid: string, limit: number = 10): Promise<ChatMessage[]> {
  try {
    const chatRef = db.collection('supportChats').doc(uid).collection('messages');
    const snapshot = await chatRef
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const messages: ChatMessage[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.unshift({ // Reverse order to get chronological
        role: data.role,
        content: data.content,
        timestamp: data.timestamp
      });
    });
    
    return messages;
  } catch (error) {
    console.error('[SupportChat] Error fetching chat history:', error);
    return [];
  }
}

/**
 * Generate AI response using OpenAI
 */
async function generateAIResponse(messages: Array<{ role: 'user' | 'assistant', content: string }>): Promise<string> {
  try {
    const openaiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey: openaiKey });
    
    // Prepare messages for OpenAI (include system prompt)
    const openAIMessages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-6) // Keep last 6 messages for context (to stay within token limits)
    ];
    
    console.log('[SupportChat] Sending request to OpenAI with', openAIMessages.length, 'messages');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-efficient model
      messages: openAIMessages,
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 500, // Reasonable limit for support responses
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });
    
    const reply = completion.choices[0]?.message?.content;
    
    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('[SupportChat] OpenAI response generated successfully');
    return reply;
    
  } catch (error: any) {
    console.error('[SupportChat] OpenAI error:', error);
    
    // Return helpful fallback based on error type
    if (error.code === 'insufficient_quota') {
      return "I'm currently experiencing high demand. Please try again in a few minutes or contact our human support team for immediate assistance.";
    } else if (error.code === 'rate_limit_exceeded') {
      return "I'm processing many requests right now. Please wait a moment and try again.";
    } else {
      return "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or contact our support team directly for assistance.";
    }
  }
}

/**
 * Main support chat function
 */
export const supportChat = onCall({
  cors: [
    // Local development
    "localhost:3000",
    "localhost:5173",
    "localhost:5174",
    
    // Firebase hosting domains
    /engperfecthlc\.web\.app$/,
    /engperfecthlc\.firebaseapp\.com$/,
    
    // Production domain
    /engageperfect\.com$/,
    /www\.engageperfect\.com$/,
    
    // Development wildcard
    "*"
  ],
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
  region: "us-central1"
}, async (request): Promise<SupportChatResponse> => {
  
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      console.log('[SupportChat] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to use support chat."
      );
    }
    
    const uid = request.auth.uid;
    const data = request.data as SupportChatRequest;
    
    console.log(`[SupportChat] Request from user: ${uid}`);
    
    // Step 2: Input validation
    if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Messages array is required and cannot be empty."
      );
    }
    
    // Validate message structure
    for (const msg of data.messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid message format. Each message must have 'role' (user|assistant) and 'content'."
        );
      }
    }
    
    // Step 3: Rate limiting
    const withinRateLimit = await checkRateLimit(uid);
    if (!withinRateLimit) {
      console.log(`[SupportChat] Rate limit exceeded for user: ${uid}`);
      throw new HttpsError(
        "resource-exhausted",
        `You've reached the maximum of ${RATE_LIMIT.maxMessagesPerHour} support messages per hour. Please try again later or contact human support for urgent issues.`
      );
    }
    
    // Step 4: Get the last user message to store
    const lastUserMessage = data.messages[data.messages.length - 1];
    if (lastUserMessage.role !== 'user') {
      throw new HttpsError(
        "invalid-argument",
        "The last message must be from the user."
      );
    }
    
    // Step 5: Store user message
    await storeChatMessage(uid, {
      role: lastUserMessage.role,
      content: lastUserMessage.content
    });
    
    // Step 6: Generate AI response
    const aiReply = await generateAIResponse(data.messages);
    
    // Step 7: Store AI response
    await storeChatMessage(uid, {
      role: 'assistant',
      content: aiReply
    });
    
    // Step 8: Calculate remaining messages for rate limiting info
    const messagesUsedThisHour = await db
      .collection('supportChats')
      .doc(uid)
      .collection('rateLimit')
      .where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - RATE_LIMIT.windowMs)))
      .get();
    
    const messagesRemaining = Math.max(0, RATE_LIMIT.maxMessagesPerHour - messagesUsedThisHour.size);
    
    const processingTime = Date.now() - startTime;
    console.log(`[SupportChat] Request completed in ${processingTime}ms for user: ${uid}`);
    
    // Step 9: Return response
    return {
      reply: aiReply,
      messagesRemaining
    };
    
  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    console.error(`[SupportChat] Error after ${processingTime}ms:`, error);
    
    // If it's already an HttpsError, re-throw it
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // For unexpected errors, return a generic error
    throw new HttpsError(
      "internal",
      "An unexpected error occurred. Please try again or contact support."
    );
  }
});

/**
 * Optional: Future streaming version (commented out for now)
 * 
 * export const supportChatStream = onRequest({
 *   cors: [...],
 *   // ... same config
 * }, async (req, res) => {
 *   // Implementation for streaming responses
 *   // res.writeHead(200, {
 *   //   'Content-Type': 'text/plain; charset=utf-8',
 *   //   'Transfer-Encoding': 'chunked'
 *   // });
 *   // 
 *   // const stream = await openai.chat.completions.create({
 *   //   ...config,
 *   //   stream: true
 *   // });
 *   //
 *   // for await (const chunk of stream) {
 *   //   const content = chunk.choices[0]?.delta?.content || '';
 *   //   res.write(content);
 *   // }
 *   // res.end();
 * });
 */
