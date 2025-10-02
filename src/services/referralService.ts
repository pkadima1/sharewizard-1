/**
 * Referral Service
 * 
 * Handles referral code capture, validation, and attribution on the frontend.
 * Integrates with the partner system to track referrals and prepare for commission processing.
 * 
 * Features:
 * - Referral code capture from URL parameters
 * - Referral code validation
 * - User attribution tracking
 * - Partner information retrieval
 * - Referral link generation
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getReferralCode, validateReferralCode, saveReferralCodeToStorage } from '@/lib/referrals';

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
  messageKey?: string; // For localization support
  metadata?: {
    customerRecordId?: string;
    customerRecordCreated?: boolean;
    processingTimeMs?: number;
    [key: string]: any;
  };
}

/**
 * Interface for partner information
 */
export interface PartnerInfo {
  partnerId: string;
  displayName: string;
  email: string;
  active: boolean;
  commissionRate: number;
}

/**
 * Process referral attribution for current user
 * 
 * @param metadata - Additional metadata for tracking
 * @returns Referral attribution result
 */
export async function processReferralAttribution(metadata?: {
  ipAddress?: string;
  userAgent?: string;
  utmParams?: any;
  referrerUrl?: string;
  landingPage?: string;
  country?: string;
  deviceType?: string;
}): Promise<ReferralAttributionResult> {
  try {
    // Get referral code from current URL or storage
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    const referralCode = getReferralCode(urlParams);
    
    if (!referralCode) {
      return {
        success: false,
        message: 'No referral code found'
      };
    }
    
    console.log('🎯 Processing referral attribution for code:', referralCode);
    
    // Validate referral code locally first
    const partnerInfo = await validateReferralCode(referralCode);
    
    if (!partnerInfo) {
      return {
        success: false,
        message: 'Invalid or expired referral code'
      };
    }
    
    // Save referral code to storage for checkout
    saveReferralCodeToStorage(referralCode, partnerInfo);
    
    // Call Firebase function to process attribution
    const processReferralAttribution = httpsCallable(functions, 'processReferralAttribution');
    
    const result = await processReferralAttribution({
      referralCode,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        referrerUrl: document.referrer,
        landingPage: window.location.href,
        ...(metadata?.utmParams && { utmParams: metadata.utmParams })
      }
    });
    
    const resultData = result.data as ReferralAttributionResult;
    
    if (resultData.success) {
      console.log('✅ Referral attribution processed successfully:', {
        partnerId: resultData.partnerId,
        partnerName: resultData.partnerName,
        commissionRate: resultData.commissionRate
      });
    }
    
    return resultData;
    
  } catch (error) {
    console.error('❌ Error processing referral attribution:', error);
    return {
      success: false,
      message: 'Failed to process referral attribution'
    };
  }
}

/**
 * Process referral attribution during user signup
 * 
 * Enhanced version that includes customer profile data for proper dashboard integration.
 * This function is specifically designed for the signup flow and handles the attribution
 * of referral codes to new users during registration.
 * 
 * @param customerUid - The UID of the newly created user
 * @param customerData - Customer profile data for dashboard integration
 * @param metadata - Additional metadata for tracking and localization
 * @returns Referral attribution result
 * 
 * @example
 * ```typescript
 * // In AuthContext.tsx after user creation
 * const attributionResult = await processSignupReferralAttribution(
 *   user.uid,
 *   {
 *     email: user.email,
 *     displayName: user.displayName,
 *     photoURL: user.photoURL
 *   },
 *   {
 *     source: 'signup',
 *     landingPage: window.location.href,
 *     userAgent: navigator.userAgent,
 *     locale: {
 *       language: navigator.language,
 *       timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
 *     }
 *   }
 * );
 * 
 * if (attributionResult.success) {
 *   console.log('User attributed to partner:', attributionResult.partnerName);
 * }
 * ```
 */
export async function processSignupReferralAttribution(
  customerUid: string,
  customerData?: {
    email?: string;
    displayName?: string;
    photoURL?: string;
  },
  metadata?: {
    source?: string;
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
  }
): Promise<ReferralAttributionResult> {
  try {
    // Get referral code from storage (captured during initial visit)
    const referralCode = getCurrentReferralCode();
    
    if (!referralCode) {
      console.log('ℹ️ No referral code found during signup - user will not be attributed');
      return {
        success: false,
        message: 'No referral code found during signup',
        messageKey: 'referral.signup.noCodeFound'
      };
    }
    
    console.log('🎯 Processing enhanced signup referral attribution:', {
      customerUid,
      referralCode,
      source: metadata?.source || 'signup',
      hasCustomerData: !!customerData,
      customerEmail: customerData?.email
    });
    
    // Validate referral code locally first
    const partnerInfo = await validateReferralCode(referralCode);
    
    if (!partnerInfo) {
      console.warn('⚠️ Invalid referral code during signup:', referralCode);
      return {
        success: false,
        message: 'Invalid or expired referral code during signup',
        messageKey: 'referral.signup.invalidCode'
      };
    }
    
    // Prepare enhanced metadata with localization support
    const enhancedMetadata = {
      ...metadata,
      source: metadata?.source || 'signup',
      userAgent: metadata?.userAgent || navigator.userAgent,
      referrerUrl: metadata?.referrerUrl || document.referrer,
      landingPage: metadata?.landingPage || window.location.href,
      locale: {
        language: metadata?.locale?.language || navigator.language || 'en',
        country: metadata?.locale?.country,
        timezone: metadata?.locale?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...metadata?.locale
      },
      ...(metadata?.utmParams && { utmParams: metadata.utmParams })
    };
    
    // Call enhanced Firebase function with customer data
    const processReferralAttribution = httpsCallable(functions, 'processReferralAttribution');
    
    const result = await processReferralAttribution({
      referralCode,
      customerUid,
      customerData: customerData || {}, // Include customer profile data
      metadata: enhancedMetadata
    });
    
    const resultData = result.data as ReferralAttributionResult;
    
    if (resultData.success) {
      console.log('✅ Enhanced signup referral attribution processed successfully:', {
        customerUid,
        customerEmail: customerData?.email,
        partnerId: resultData.partnerId,
        partnerName: resultData.partnerName,
        commissionRate: resultData.commissionRate,
        referralId: resultData.referralId,
        customerRecordCreated: resultData.metadata?.customerRecordCreated,
        processingTime: resultData.metadata?.processingTimeMs
      });
      
      // Log successful attribution with proper context
      console.group('🎉 Referral Attribution Success');
      console.log('📊 Attribution Details:');
      console.log(`   Partner: ${resultData.partnerName} (${resultData.partnerId})`);
      console.log(`   Code: ${resultData.partnerCode}`);
      console.log(`   Commission Rate: ${(resultData.commissionRate || 0) * 100}%`);
      console.log(`   Customer Record: ${resultData.metadata?.customerRecordCreated ? '✅ Created' : '❌ Failed'}`);
      console.log(`   Processing Time: ${resultData.metadata?.processingTimeMs || 0}ms`);
      console.groupEnd();
      
    } else {
      console.warn('⚠️ Enhanced signup referral attribution failed:', {
        customerUid,
        message: resultData.message,
        messageKey: resultData.messageKey
      });
    }
    
    return resultData;
    
  } catch (error) {
    console.error('❌ Error processing enhanced signup referral attribution:', error);
    return {
      success: false,
      message: 'Failed to process signup referral attribution',
      messageKey: 'referral.signup.processingError'
    };
  }
}

/**
 * Get partner information from referral code
 * 
 * @param referralCode - Referral code to validate
 * @returns Partner information if valid
 */
export async function getPartnerFromReferralCode(referralCode: string): Promise<PartnerInfo | null> {
  try {
    const partnerInfo = await validateReferralCode(referralCode);
    
    if (!partnerInfo) {
      return null;
    }
    
    return {
      partnerId: partnerInfo.partnerId,
      displayName: partnerInfo.displayName,
      email: partnerInfo.email,
      active: partnerInfo.active,
      commissionRate: partnerInfo.commissionRate
    };
    
  } catch (error) {
    console.error('❌ Error getting partner from referral code:', error);
    return null;
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
  baseUrl: string = window.location.origin,
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
 * Check if current user has a referral code
 * 
 * @returns Referral code if found, null otherwise
 */
export function getCurrentReferralCode(): string | null {
  try {
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    return getReferralCode(urlParams);
  } catch (error) {
    console.error('❌ Error getting current referral code:', error);
    return null;
  }
}

/**
 * Clear referral data from storage
 */
export function clearReferralData(): void {
  try {
    // Clear localStorage
    localStorage.removeItem('sharewizard_referral_code');
    localStorage.removeItem('sharewizard_partner_info');
    localStorage.removeItem('sharewizard_referral_timestamp');
    
    // Clear cookies
    document.cookie = 'sharewizard_referral_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sharewizard_partner_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sharewizard_referral_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('✅ Referral data cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing referral data:', error);
  }
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
  recentReferrals: any[];
} | null> {
  try {
    const getPartnerReferralStats = httpsCallable(functions, 'getPartnerReferralStats');
    
    const result = await getPartnerReferralStats({
      partnerId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
    
    return result.data as any;
    
  } catch (error) {
    console.error('❌ Error getting partner referral stats:', error);
    return null;
  }
}

/**
 * Get commission summary for a partner
 * 
 * @param partnerId - Partner ID
 * @param startDate - Start date for summary
 * @param endDate - End date for summary
 * @returns Commission summary
 */
export async function getPartnerCommissionSummary(
  partnerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCommissions: number;
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  recentEntries: any[];
} | null> {
  try {
    const getPartnerCommissionSummary = httpsCallable(functions, 'getPartnerCommissionSummary');
    
    const result = await getPartnerCommissionSummary({
      partnerId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
    
    return result.data as any;
    
  } catch (error) {
    console.error('❌ Error getting partner commission summary:', error);
    return null;
  }
}

