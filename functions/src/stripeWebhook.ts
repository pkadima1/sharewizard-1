import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { handleSubscriptionCheckoutCompleted } from "./stripeHelpers.js";
import { config } from "./config/secrets.js";

// Initialize Firebase Admin if not already initialized
try {
  admin.initializeApp();
} catch (error: any) {
  // App already exists
  if (error.code !== "app/duplicate-app") {
    console.error("Firebase admin initialization error", error);
  }
}

// Initialize Stripe with secret key
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2025-04-30.basil" // Using latest Stripe API version as of May 2025
});

/**
 * Handles Stripe webhook events
 * This function will process checkout.session.completed events
 * to properly handle tax and free trial information
 */
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  
  if (!signature) {
    console.error("No Stripe signature found in the request");
    res.status(400).send("Webhook Error: No signature provided");
    return;
  }
  
  try {
    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      config.stripeWebhookSecret
    );
    
    // Handle specific event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle subscription checkout
        if (session.mode === "subscription" && session.subscription) {
          await handleSubscriptionCheckoutCompleted(
            session.customer as string,
            session.subscription as string,
            stripe
          );
          
          console.log("Successfully processed subscription checkout", {
            customerId: session.customer,
            subscriptionId: session.subscription
          });
        }
        break;
      }
      
      // Other event types can be handled here
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).send({ received: true });  } catch (error: any) {
    console.error("Error handling webhook:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }
});
