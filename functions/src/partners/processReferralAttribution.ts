/**
 * Process Referral Attribution - Firebase Cexport const processReferralAttributionCallable = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
}, async (request) => { Function
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
    
    // Step 2: Validate and extract request data
    const data = request.data as {
      referralCode: string;
      customerUid?: string; // Optional: if different from caller UID
      customerData?: {
        email?: string;
        displayName?: string;
        photoURL?: string;
      };
      metadata?: {
        ipAddress?: string;
        userAgent?: string;
        utmParams?: any;
        referrerUrl?: string;
        landingPage?: string;
        country?: string;
        deviceType?: string;
        locale?: {
          language?: string;
          country?: string;
          timezone?: string;
        };
      };
    };
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { referralCode, customerUid, customerData, metadata } = data;

    if (!referralCode || typeof referralCode !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "Referral code is required and must be a string."
      );
    }

    // Use provided customerUid or fall back to caller UID
    const targetCustomerUid = customerUid || callerUid;

    logger.info(`[ProcessReferralAttribution] Processing enhanced referral attribution:`, {
      callerUid,
      targetCustomerUid,
      referralCode,
      hasCustomerData: !!customerData,
      customerEmail: customerData?.email,
      hasMetadata: !!metadata,
      locale: metadata?.locale
    });

    // Step 3: Process enhanced referral attribution
    const result = await processReferralAttribution(
      referralCode,
      targetCustomerUid,
      customerData,
      metadata
    );

    const processingTime = Date.now() - startTime;
    
    if (result.success) {
      logger.info(`[ProcessReferralAttribution] Enhanced referral attribution processed successfully in ${processingTime}ms:`, {
        callerUid,
        targetCustomerUid,
        referralId: result.referralId,
        partnerCode: result.partnerCode,
        customerId: result.customerId,
        commission: result.commission,
        customerRecordCreated: result.customerRecordCreated,
        messageKey: result.messageKey
      });
      
      return {
        success: true,
        referralId: result.referralId,
        partnerCode: result.partnerCode,
        customerId: result.customerId,
        commission: result.commission,
        metadata: result.metadata,
        customerRecordCreated: result.customerRecordCreated || false,
        messageKey: result.messageKey || "referral.attribution.success",
        message: result.message || "Referral attribution processed successfully"
      } as any;
    } else {
      logger.warn(`[ProcessReferralAttribution] Enhanced referral attribution failed in ${processingTime}ms:`, {
        callerUid,
        targetCustomerUid,
        referralCode,
        message: result.message,
        messageKey: result.messageKey
      });
      
      return {
        success: false,
        message: result.message || "Referral attribution failed",
        messageKey: result.messageKey || "referral.attribution.failed"
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

