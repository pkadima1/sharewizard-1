/**
 * Referral Attribution System
 * 
 * Handles referral code capture and attribution during user signup and checkout.
 * Integrates with the partner system to track referrals and prepare for commission processing.
 * 
 * Features:
 * - Referral code validation
 * - User attribution tracking
 * - Partner statistics updates
 * - Referral link generation
 */

import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { Partner, PartnerCode } from "../types/partners.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

/**
 * Interface for referral attribution result
 */
export interface ReferralAttributionResult {
  success: boolean;
  partnerId?: string;
  partnerCode?: string;
  partnerName?: string;
  commissionRate?: number;
  referralId?: string;
  message: string;
}

/**
 * Interface for referral tracking document
 */
export interface ReferralTracking {
  id: string;
  partnerId: string;
  partnerCode: string;
  customerUid?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planId?: string;
  currency: string;
  source: 'link' | 'manual' | 'promotion_code' | 'widget';
  createdAt: Timestamp;
  convertedAt?: Timestamp;
  subscribedAt?: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  metadata?: {
    referrerUrl?: string;
    landingPage?: string;
    country?: string;
    deviceType?: string;
  };
}

/**
 * Validate and get partner information from referral code
 * 
 * @param referralCode - The referral code to validate
 * @returns Partner information if valid, null if invalid
 */
export async function validateReferralCode(referralCode: string): Promise<{
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  commissionRate: number;
  active: boolean;
} | null> {
  try {
    if (!referralCode || typeof referralCode !== 'string') {
      return null;
    }
    
    const normalizedCode = referralCode.toUpperCase().trim();
    
    // Get partner code document by querying the 'code' field
    const codesQuery = db.collection('partnerCodes').where('code', '==', normalizedCode);
    const codeSnapshot = await codesQuery.get();
    
    if (codeSnapshot.empty) {
      logger.warn(`[ReferralAttribution] Referral code not found: ${normalizedCode}`);
      return null;
    }
    
    const codeDoc = codeSnapshot.docs[0];
    const codeData = codeDoc.data() as PartnerCode;
    
    // Check if code is active
    if (!codeData.active) {
      logger.warn(`[ReferralAttribution] Referral code is inactive: ${normalizedCode}`);
      return null;
    }
    
    // Check if code has expired
    if (codeData.expiresAt) {
      const expiresAt = codeData.expiresAt instanceof Date ? codeData.expiresAt : codeData.expiresAt.toDate();
      if (expiresAt < new Date()) {
        logger.warn(`[ReferralAttribution] Referral code has expired: ${normalizedCode}`);
        return null;
      }
    }
    
    // Check if code has reached usage limit
    if (codeData.maxUses && codeData.uses >= codeData.maxUses) {
      logger.warn(`[ReferralAttribution] Referral code has reached usage limit: ${normalizedCode}`);
      return null;
    }
    
    // Get partner information
    const partnerDoc = await db.collection('partners').doc(codeData.partnerId).get();
    
    if (!partnerDoc.exists) {
      logger.warn(`[ReferralAttribution] Partner not found: ${codeData.partnerId}`);
      return null;
    }
    
    const partnerData = partnerDoc.data() as Partner;
    
    // Check if partner is active
    if (partnerData.status !== 'active') {
      logger.warn(`[ReferralAttribution] Partner is not active: ${codeData.partnerId}`);
      return null;
    }
    
    logger.info(`[ReferralAttribution] Valid referral code found:`, {
      code: normalizedCode,
      partnerId: codeData.partnerId,
      partnerName: partnerData.displayName,
      commissionRate: partnerData.commissionRate
    });
    
    return {
      partnerId: codeData.partnerId,
      partnerCode: normalizedCode,
      partnerName: partnerData.displayName,
      commissionRate: partnerData.commissionRate,
      active: true
    };
    
  } catch (error) {
    logger.error(`[ReferralAttribution] Error validating referral code:`, error);
    return null;
  }
}

/**
 * Create referral tracking document
 * 
 * @param partnerId - Partner ID
 * @param partnerCode - Partner code
 * @param customerUid - Customer UID (if available)
 * @param source - Referral source
 * @param metadata - Additional metadata
 * @returns Referral tracking document ID
 */
export async function createReferralTracking(
  partnerId: string,
  partnerCode: string,
  customerUid?: string,
  source: 'link' | 'manual' | 'promotion_code' | 'widget' = 'link',
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    utmParams?: any;
    referrerUrl?: string;
    landingPage?: string;
    country?: string;
    deviceType?: string;
  }
): Promise<string | null> {
  try {
    const referralId = db.collection('referrals').doc().id;
    const referralRef = db.collection('referrals').doc(referralId);
    
    const referralData: ReferralTracking = {
      id: referralId,
      partnerId,
      partnerCode,
      customerUid,
      currency: 'usd', // Default currency
      source,
      createdAt: Timestamp.now(),
      ...(metadata?.ipAddress && { ipAddress: metadata.ipAddress }),
      ...(metadata?.userAgent && { userAgent: metadata.userAgent }),
      ...(metadata?.utmParams && { utmParams: metadata.utmParams }),
      ...(metadata && {
        metadata: {
          referrerUrl: metadata.referrerUrl,
          landingPage: metadata.landingPage,
          country: metadata.country,
          deviceType: metadata.deviceType
        }
      })
    };
    
    await referralRef.set(referralData);
    
    // Update partner code usage count
    await db.collection('partnerCodes').doc(partnerCode).update({
      uses: FieldValue.increment(1),
      lastUsedAt: Timestamp.now()
    });
    
    logger.info(`[ReferralAttribution] Referral tracking created:`, {
      referralId,
      partnerId,
      partnerCode,
      customerUid,
      source
    });
    
    return referralId;
    
  } catch (error) {
    logger.error(`[ReferralAttribution] Error creating referral tracking:`, error);
    return null;
  }
}

/**
 * Update referral tracking with customer information
 * 
 * @param referralId - Referral tracking document ID
 * @param customerUid - Customer UID
 * @param stripeCustomerId - Stripe customer ID
 * @param stripeSubscriptionId - Stripe subscription ID (if applicable)
 * @param planId - Plan ID (if applicable)
 * @returns Success status
 */
export async function updateReferralWithCustomer(
  referralId: string,
  customerUid: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  planId?: string
): Promise<boolean> {
  try {
    const referralRef = db.collection('referrals').doc(referralId);
    
    const updateData: Partial<ReferralTracking> = {
      customerUid,
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(stripeSubscriptionId && { stripeSubscriptionId }),
      ...(planId && { planId }),
      convertedAt: Timestamp.now()
    };
    
    await referralRef.update(updateData);
    
    logger.info(`[ReferralAttribution] Referral tracking updated with customer info:`, {
      referralId,
      customerUid,
      stripeCustomerId,
      stripeSubscriptionId,
      planId
    });
    
    return true;
    
  } catch (error) {
    logger.error(`[ReferralAttribution] Error updating referral with customer info:`, error);
    return false;
  }
}

/**
 * Process referral attribution for user signup
 * 
 * @param referralCode - Referral code from URL/storage
 * @param customerUid - Customer UID
 * @param metadata - Additional metadata
 * @returns Referral attribution result
 */
export async function processReferralAttribution(
  referralCode: string,
  customerUid: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    utmParams?: any;
    referrerUrl?: string;
    landingPage?: string;
    country?: string;
    deviceType?: string;
  }
): Promise<ReferralAttributionResult> {
  try {
    // Validate referral code
    const partnerInfo = await validateReferralCode(referralCode);
    
    if (!partnerInfo) {
      return {
        success: false,
        message: 'Invalid or expired referral code'
      };
    }
    
    // Create referral tracking
    const referralId = await createReferralTracking(
      partnerInfo.partnerId,
      partnerInfo.partnerCode,
      customerUid,
      'link',
      metadata
    );
    
    if (!referralId) {
      return {
        success: false,
        message: 'Failed to create referral tracking'
      };
    }
    
    logger.info(`[ReferralAttribution] Referral attribution processed successfully:`, {
      referralId,
      partnerId: partnerInfo.partnerId,
      partnerCode: partnerInfo.partnerCode,
      customerUid
    });
    
    return {
      success: true,
      partnerId: partnerInfo.partnerId,
      partnerCode: partnerInfo.partnerCode,
      partnerName: partnerInfo.partnerName,
      commissionRate: partnerInfo.commissionRate,
      referralId,
      message: 'Referral attribution successful'
    };
    
  } catch (error) {
    logger.error(`[ReferralAttribution] Error processing referral attribution:`, error);
    return {
      success: false,
      message: 'Failed to process referral attribution'
    };
  }
}

/**
 * Generate referral link for partner
 * 
 * @param partnerCode - Partner code
 * @param baseUrl - Base URL for the application
 * @param utmParams - UTM parameters (optional)
 * @returns Referral link
 */
export function generateReferralLink(
  partnerCode: string,
  baseUrl: string = 'https://engageperfect.com',
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('ref', partnerCode);
  
  if (utmParams) {
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value);
      }
    });
  }
  
  return url.toString();
}

/**
 * Get referral statistics for a partner
 * 
 * @param partnerId - Partner ID
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Referral statistics
 */
export async function getPartnerReferralStats(
  partnerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalReferrals: number;
  totalConversions: number;
  conversionRate: number;
  recentReferrals: ReferralTracking[];
} | null> {
  try {
    let query = db.collection('referrals')
      .where('partnerId', '==', partnerId);
    
    if (startDate && endDate) {
      query = query
        .where('createdAt', '>=', Timestamp.fromDate(startDate))
        .where('createdAt', '<=', Timestamp.fromDate(endDate));
    }
    
    const snapshot = await query.get();
    const referrals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ReferralTracking[];
    
    const totalReferrals = referrals.length;
    const totalConversions = referrals.filter(ref => ref.convertedAt).length;
    const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;
    
    // Get recent referrals (last 10)
    const recentReferrals = referrals
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 10);
    
    return {
      totalReferrals,
      totalConversions,
      conversionRate,
      recentReferrals
    };
    
  } catch (error) {
    logger.error(`[ReferralAttribution] Error getting partner referral stats:`, error);
    return null;
  }
}
