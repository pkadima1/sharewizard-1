/**
 * secrets.ts - v1.0.0
 * 
 * Purpose: Centralized secret management for Firebase Functions
 * Features: Environment-aware secret retrieval with fallbacks
 */

import { defineSecret } from "firebase-functions/params";

// Define secrets for different environments
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Get OpenAI API key with environment fallbacks
 */
export function getOpenAIKey(): string {
  // In production, use Firebase secret
  if (process.env.NODE_ENV === 'production') {
    return openaiApiKey.value();
  }
  
  // In development, try environment variable first, then Firebase secret
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    console.log("Using OpenAI API key from environment");
    return apiKey;
  }
  
  try {
    return openaiApiKey.value();
  } catch (error) {
    throw new Error("OPENAI_API_KEY not found in environment variables or Firebase secrets");
  }
}

/**
 * Get Gemini API key with environment fallbacks
 */
export function getGeminiKey(): string {
  // In production, use Firebase secret
  if (process.env.NODE_ENV === 'production') {
    return geminiApiKey.value();
  }
  
  // In development, try environment variable first, then Firebase secret
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    console.log("Using Gemini API key from environment");
    return apiKey;
  }
  
  try {
    return geminiApiKey.value();
  } catch (error) {
    throw new Error("GEMINI_API_KEY not found in environment variables or Firebase secrets");
  }
}

// Validate API keys format
export const validateApiKeys = (): void => {
  try {
    const geminiKey = getGeminiKey();
    const openaiKey = getOpenAIKey();
    
    // Basic validation
    if (!geminiKey.startsWith('AIzaSy')) {
      throw new Error("Invalid Gemini API key format");
    }
    
    if (!openaiKey.startsWith('sk-')) {
      throw new Error("Invalid OpenAI API key format");
    }
    
    console.log("✅ API keys validation passed");
  } catch (error) {
    console.error("❌ API keys validation failed:", error);
    throw error;
  }
};

// Export secrets for Firebase Functions to access
export const secrets = {
  openaiApiKey,
  geminiApiKey
};

// Configuration object for Stripe integration
export const config = {
  // Get Stripe secret key from environment variables
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  
  // Get Stripe webhook secret from environment variables
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};