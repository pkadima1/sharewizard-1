import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Initialize Firestore
const db = getFirestore();

/**
 * Handle subscription checkout completed events
 * This processes a checkout session after completion to update user subscription data
 */
export async function handleSubscriptionCheckoutCompleted(
  customerId: string,
  subscriptionId: string,
  stripe: Stripe
): Promise<void> {
  try {
    // Get the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Get important data
    const status = subscription.status;
    const currentPeriodEnd = (subscription as any).current_period_end;
    const trialEnd = (subscription as any).trial_end;
    
    // Get the subscription items to extract metadata
    const items = (subscription as any).items?.data || [];
    const firstItem = items[0];
    const metadata = firstItem?.price?.metadata || {};
    
    // Extract the plan type from metadata
    const planType = metadata.firebaseRole || 'basicMonth';
    const requestLimit = parseInt(
      metadata.request_limit || 
      metadata.month_request_limit || 
      metadata.year_request_limit || 
      "70", 
      10
    );
    
    console.log("Processing subscription:", {
      customerId,
      subscriptionId,
      status,
      currentPeriodEnd,
      trialEnd,
      planType,
      requestLimit
    });
    
    // Store subscription details in Firestore
    await db.collection('subscriptions').doc(customerId).set({
      subscriptionId,
      status,
      planType,
      requestLimit,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      trialEnd: trialEnd ? new Date(trialEnd * 1000) : null,
      updatedAt: new Date()
    });
    
    // Update the user document with new subscription data
    const userRef = db.collection('users').doc(customerId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.warn(`User document not found for userId ${customerId}`);
      return;
    }
    
    // Update user's subscription status
    await userRef.update({
      plan_type: status === 'trialing' ? 'trial' : planType,
      requests_limit: status === 'trialing' ? 5 : requestLimit,
      requests_used: 0,  // Reset usage count when subscription changes
      has_used_trial: status === 'trialing' ? true : userDoc.data()?.has_used_trial || false,
      reset_date: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      trial_end_date: trialEnd ? new Date(trialEnd * 1000) : null,
      subscription_status: status
    });
    
    logger.info(`Successfully updated subscription for user ${customerId}`);
  } catch (error) {
    logger.error(`Error handling subscription checkout for user ${customerId}:`, error);
    throw error;
  }
}
