/**
 * Process Referral Attribution - Firebase Callable Function
 * 
 * Handles referral attribution during user signup and checkout.
 * Integrates with the partner system to track referrals and prepare for commission processing.
 * 
 * Features:
 * - Referral code validation
 * - User attribution tracking
 * - Partner statistics updates
 * - Commission preparation
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { processReferralAttribution } from "./referralAttribution.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();

/**
 * Process Referral Attribution Callable Function
 */
export const processReferralAttributionCallable = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  partnerId?: string;
  partnerCode?: string;
  partnerName?: string;
  commissionRate?: number;
  referralId?: string;
  message: string;
  messageKey: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[ProcessReferralAttribution] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to process referral attribution."
      );
    }

    const callerUid = request.auth.uid;
    
    // Step 2: Validate request data
    const data = request.data as {
      referralCode: string;
      metadata?: {
        ipAddress?: string;
        userAgent?: string;
        utmParams?: any;
        referrerUrl?: string;
        landingPage?: string;
        country?: string;
        deviceType?: string;
      };
    };
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { referralCode, metadata } = data;

    if (!referralCode || typeof referralCode !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "Referral code is required and must be a string."
      );
    }

    logger.info(`[ProcessReferralAttribution] Processing referral attribution:`, {
      callerUid,
      referralCode,
      hasMetadata: !!metadata
    });

    // Step 3: Process referral attribution
    const result = await processReferralAttribution(
      referralCode,
      callerUid,
      metadata
    );

    const processingTime = Date.now() - startTime;
    
    if (result.success) {
      logger.info(`[ProcessReferralAttribution] Referral attribution processed successfully in ${processingTime}ms:`, {
        callerUid,
        partnerId: result.partnerId,
        partnerCode: result.partnerCode,
        referralId: result.referralId
      });
      
      return {
        success: true,
        partnerId: result.partnerId,
        partnerCode: result.partnerCode,
        partnerName: result.partnerName,
        commissionRate: result.commissionRate,
        referralId: result.referralId,
        message: result.message,
        messageKey: 'referral.attribution.success'
      };
    } else {
      logger.warn(`[ProcessReferralAttribution] Referral attribution failed in ${processingTime}ms:`, {
        callerUid,
        referralCode,
        message: result.message
      });
      
      return {
        success: false,
        message: result.message,
        messageKey: 'referral.attribution.failed'
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[ProcessReferralAttribution] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[ProcessReferralAttribution] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while processing referral attribution."
    );
  }
});

