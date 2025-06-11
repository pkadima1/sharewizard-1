/**
 * Firebase Function to sync Stripe subscription data to user profile
 * 
 * This function listens for changes to Stripe subscription documents created by the
 * Stripe Firebase Extension and updates the user profile with relevant subscription data.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeFirebaseAdmin, getFirestore } from "./config/firebase-admin.js";

// Define interfaces for Stripe subscription data
interface PriceMetadata {
  firebaseRole?: string;
  request_limit?: string;
  month_request_limit?: string;
  year_request_limit?: string;
  [key: string]: string | undefined;
}

interface StripeSubscriptionItem {
  price?: {
    metadata?: PriceMetadata;
  };
}

interface StripeSubscription {
  status?: string;
  items?: StripeSubscriptionItem[];
  current_period_end?: number;
  trial_end?: number;
}

// Initialize Firebase Admin with hybrid configuration
initializeFirebaseAdmin();

// Initialize Firestore
const db = getFirestore();

export const syncSubscriptionToUserProfile = onDocumentWritten({
  region: "us-central1", // Add region to match generateCaptionsV3
  document: "customers/{userId}/subscriptions/{subscriptionId}"
}, async (event) => {
    const { userId } = event.params;

    if (!event.data?.after?.exists) {
      logger.info(`Subscription was deleted for user ${userId}`);
      return;
    }    const subscription = event.data.after.data() as StripeSubscription;
    const item = subscription.items?.[0];
    const metadata = item?.price?.metadata;

    if (!metadata) {
      logger.warn(`No metadata found in price for user ${userId}`);
      return;
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.warn(`User document not found for userId ${userId}`);
      return;
    }

    const currentUser = userDoc.data() || {};
    const existingLimit = currentUser.requests_limit || 0;
    const existingUsed = currentUser.requests_used || 0;

    const subscriptionStatus = subscription.status || "active";
    const resetDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    const updateData: Record<string, any> = {
      subscription_status: subscriptionStatus,
    };

    // Handle trialing plan
    if (subscriptionStatus === "trialing") {
      updateData.plan_type = "trial";
      updateData.requests_limit = 5;
      updateData.requests_used = 0;
      updateData.has_used_trial = true;
      if (subscription.trial_end) {
        updateData.trial_end_date = new Date(subscription.trial_end * 1000);
      }
      if (resetDate) {
        updateData.reset_date = resetDate;
      }
    }

    // Handle Flexy (add-on requests)
    else if (metadata.firebaseRole === "flexy") {
      const flexAdd = parseInt(metadata.request_limit || "0", 10);
      updateData.requests_limit = existingLimit + flexAdd;
      updateData.plan_type = currentUser.plan_type || "flexy";
      updateData.requests_used = existingUsed;
      if (resetDate) updateData.reset_date = resetDate;
    }

    // Handle normal plans: basicMonth, basicYear
    else if (metadata.firebaseRole && ["basicMonth", "basicYear"].includes(metadata.firebaseRole)) {
      const newLimit = parseInt(
        metadata.request_limit || metadata.month_request_limit || metadata.year_request_limit || "0",
        10
      );

      updateData.plan_type = metadata.firebaseRole;
      updateData.requests_limit = newLimit;
      updateData.requests_used = 0;
      if (resetDate) updateData.reset_date = resetDate;
    }

    // Update Firestore user doc
    await userRef.set(updateData, { merge: true });

    logger.info(`User ${userId} synced:`, updateData);
  }
);
