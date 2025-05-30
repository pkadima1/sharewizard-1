export function getOpenAIKey(): string {
  // Option 1: Return environment variable
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return apiKey;
  
  // Option 2: If you want to hardcode for development (not recommended for production)
  // return "your-openai-api-key";
}

// Configuration object for Stripe integration
export const config = {
  // Get Stripe secret key from environment variables
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  
  // Get Stripe webhook secret from environment variables
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};