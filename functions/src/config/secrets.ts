/**
 * API Keys Configuration
 * This file handles secure API key retrieval for development and production
 */

export function getOpenAIKey(): string {
  // First try environment variable (for local development)  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    console.log("Using OpenAI API key from environment");
    return apiKey;
  }
  
  // In production, this would come from Firebase config
  throw new Error("OPENAI_API_KEY not found in environment variables");
}

export function getGeminiKey(): string {
  // First try environment variable (for local development)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    console.log("Using Gemini API key from environment");
    return apiKey;
  }
  
  // In production, this would come from Firebase config
  throw new Error("GEMINI_API_KEY not found in environment variables");
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

// Configuration object for Stripe integration
export const config = {
  // Get Stripe secret key from environment variables
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  
  // Get Stripe webhook secret from environment variables
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};