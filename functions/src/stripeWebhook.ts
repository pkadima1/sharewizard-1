import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { handleSubscriptionCheckoutCompleted } from "./stripeHelpers.js";
import { processReferralCommission } from "./referralCommissions.js";
import { config } from "./config/secrets.js";

// Initialize Firebase Admin if not already initialized
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (error) {
  const err = error as { code?: string };
  // App already exists or another error
  if (err.code !== "app/duplicate-app") {
    console.error("Firebase admin initialization error", error);
  }
}

// Get Stripe secret key from env or extension config
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || config.stripeSecretKey;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set. Please set it in your environment or extension config.");
}

// Initialize Stripe with secret key
const stripe = new Stripe(stripeSecretKey, {
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
        
        // Extract referral metadata for commission processing
        const metadata = session.metadata || {};
        const referralCode = metadata.referralCode;
        const partnerId = metadata.partnerId;
        
        // Log referral information if present
        if (referralCode && partnerId) {
          console.log("📈 Checkout completed with referral attribution:", {
            customerId: session.customer,
            referralCode,
            partnerId,
            partnerName: metadata.partnerName,
            checkoutType: metadata.checkout_type,
            amount: session.amount_total
          });
          
          // Process referral commission
          try {
            const commissionId = await processReferralCommission(session);
            if (commissionId) {
              console.log("✅ Referral commission processed successfully:", commissionId);
            } else {
              console.log("⚠️ Referral commission processing skipped or failed");
            }
          } catch (error) {
            console.error("❌ Error processing referral commission:", error);
          }
        }
        
        // Handle subscription checkout
        if (session.mode === "subscription" && session.subscription) {
          await handleSubscriptionCheckoutCompleted(
            session.customer as string,
            session.subscription as string,
            stripe
          );
          
          console.log("Successfully processed subscription checkout", {
            customerId: session.customer,
            subscriptionId: session.subscription,
            hasReferral: !!referralCode
          });
        }
        
        // Handle one-time payment checkout (Flex packs)
        else if (session.mode === "payment") {
          console.log("Successfully processed one-time payment checkout", {
            customerId: session.customer,
            paymentIntentId: session.payment_intent,
            hasReferral: !!referralCode,
            productType: metadata.product_type,
            quantity: metadata.quantity
          });
          
          // Note: Flex pack balance updates are handled by existing Stripe Extension
          // Commission processing is handled above in the referral section
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
