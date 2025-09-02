/**
 * Referral Capture System
 * 
 * Handles capturing, storing, and retrieving referral codes from URL parameters.
 * Implements localStorage + cookie storage with 90-day expiration.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { shouldUseMockData, getMockPartnerData } from './mockPartnerData';

export interface PartnerCode {
  code: string;
  partnerId: string;
  active: boolean;
  uses: number;
  maxUses?: number;
  description?: string;
  customCommissionRate?: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface PartnerInfo {
  partnerId: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  active: boolean;
  commissionRate: number;
}

/**
 * Storage keys for referral data
 */
const STORAGE_KEYS = {
  referralCode: 'sharewizard_referral_code',
  partnerInfo: 'sharewizard_partner_info',
  captureTimestamp: 'sharewizard_referral_timestamp'
} as const;

/**
 * Referral data expiration time (90 days in milliseconds)
 */
const REFERRAL_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Save referral code to both localStorage and cookies
 * @param code - The referral code to store
 * @param partnerInfo - Partner information to cache
 */
export function saveReferralCodeToStorage(code: string, partnerInfo: PartnerInfo): void {
  const timestamp = Date.now();
  const expiryDate = new Date(timestamp + REFERRAL_EXPIRY_MS);
  
  try {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.referralCode, code);
    localStorage.setItem(STORAGE_KEYS.partnerInfo, JSON.stringify(partnerInfo));
    localStorage.setItem(STORAGE_KEYS.captureTimestamp, timestamp.toString());
    
    // Save to cookies (90 days expiration)
    const cookieExpiry = expiryDate.toUTCString();
    document.cookie = `${STORAGE_KEYS.referralCode}=${code}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
    document.cookie = `${STORAGE_KEYS.partnerInfo}=${encodeURIComponent(JSON.stringify(partnerInfo))}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
    document.cookie = `${STORAGE_KEYS.captureTimestamp}=${timestamp}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
    
    console.log('✅ Referral code saved to storage:', code, 'Partner:', partnerInfo.displayName);
  } catch (error) {
    console.error('❌ Failed to save referral code to storage:', error);
  }
}

/**
 * Get referral code from URL query params, cookies, or localStorage
 * Precedence: query → cookie → localStorage
 * @param searchParams - URLSearchParams from current location
 * @returns The referral code if found and valid, null otherwise
 */
export function getReferralCode(searchParams?: URLSearchParams): string | null {
  try {
    // 1. Check URL query parameters first (highest priority)
    if (searchParams) {
      const queryCode = searchParams.get('ref');
      if (queryCode) {
        console.log('📝 Found referral code in URL:', queryCode);
        return queryCode.toUpperCase();
      }
    }
    
    // 2. Check cookies (medium priority)
    const cookieCode = getCookieValue(STORAGE_KEYS.referralCode);
    const cookieTimestamp = getCookieValue(STORAGE_KEYS.captureTimestamp);
    
    if (cookieCode && cookieTimestamp) {
      const timestamp = parseInt(cookieTimestamp, 10);
      if (isReferralValid(timestamp)) {
        console.log('🍪 Found valid referral code in cookies:', cookieCode);
        return cookieCode;
      } else {
        console.log('⏰ Referral code in cookies has expired');
        clearExpiredReferralData();
      }
    }
    
    // 3. Check localStorage (lowest priority)
    const localCode = localStorage.getItem(STORAGE_KEYS.referralCode);
    const localTimestamp = localStorage.getItem(STORAGE_KEYS.captureTimestamp);
    
    if (localCode && localTimestamp) {
      const timestamp = parseInt(localTimestamp, 10);
      if (isReferralValid(timestamp)) {
        console.log('💾 Found valid referral code in localStorage:', localCode);
        return localCode;
      } else {
        console.log('⏰ Referral code in localStorage has expired');
        clearExpiredReferralData();
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error retrieving referral code:', error);
    return null;
  }
}

/**
 * Get cached partner information from storage
 * @returns Cached partner info if available and valid, null otherwise
 */
export function getCachedPartnerInfo(): PartnerInfo | null {
  try {
    // Check localStorage first
    const localInfo = localStorage.getItem(STORAGE_KEYS.partnerInfo);
    const localTimestamp = localStorage.getItem(STORAGE_KEYS.captureTimestamp);
    
    if (localInfo && localTimestamp) {
      const timestamp = parseInt(localTimestamp, 10);
      if (isReferralValid(timestamp)) {
        return JSON.parse(localInfo);
      }
    }
    
    // Check cookies
    const cookieInfo = getCookieValue(STORAGE_KEYS.partnerInfo);
    const cookieTimestamp = getCookieValue(STORAGE_KEYS.captureTimestamp);
    
    if (cookieInfo && cookieTimestamp) {
      const timestamp = parseInt(cookieTimestamp, 10);
      if (isReferralValid(timestamp)) {
        return JSON.parse(decodeURIComponent(cookieInfo));
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error retrieving cached partner info:', error);
    return null;
  }
}

/**
 * Validate a referral code against Firestore
 * @param code - The referral code to validate
 * @returns Promise with partner information if valid, null if invalid
 */
export async function validateReferralCode(code: string): Promise<PartnerInfo | null> {
  try {
    if (!code || typeof code !== 'string') {
      return null;
    }
    
    const normalizedCode = code.toUpperCase().trim();
    
    // In development mode, use mock data for testing
    if (shouldUseMockData()) {
      const mockData = getMockPartnerData(normalizedCode);
      if (mockData) {
        console.log('✅ Using mock partner data for development:', normalizedCode, mockData.displayName);
        return mockData;
      }
      console.log('❌ No mock data found for code:', normalizedCode);
      return null;
    }
    
    // Check if code exists and is active in Firestore
    const codeDoc = await getDoc(doc(db, 'partnerCodes', normalizedCode));
    
    if (!codeDoc.exists()) {
      console.log('❌ Referral code not found:', normalizedCode);
      return null;
    }
    
    const codeData = codeDoc.data() as PartnerCode;
    
    // Check if code is active
    if (!codeData.active) {
      console.log('❌ Referral code is inactive:', normalizedCode);
      return null;
    }
    
    // Check if code has expired
    if (codeData.expiresAt && codeData.expiresAt.getTime() < Date.now()) {
      console.log('❌ Referral code has expired:', normalizedCode);
      return null;
    }
    
    // Check if code has reached usage limit
    if (codeData.maxUses && codeData.uses >= codeData.maxUses) {
      console.log('❌ Referral code has reached usage limit:', normalizedCode);
      return null;
    }
    
    // Get partner information
    const partnerDoc = await getDoc(doc(db, 'partners', codeData.partnerId));
    
    if (!partnerDoc.exists()) {
      console.log('❌ Partner not found for code:', normalizedCode);
      return null;
    }
    
    const partnerData = partnerDoc.data() as PartnerInfo;
    
    // Check if partner is active
    if (!partnerData.active) {
      console.log('❌ Partner is inactive:', partnerData.displayName);
      return null;
    }
    
    console.log('✅ Valid referral code found:', normalizedCode, 'Partner:', partnerData.displayName);
    return partnerData;
    
  } catch (error) {
    console.error('❌ Error validating referral code:', error);
    return null;
  }
}

/**
 * Clear expired referral data from storage
 */
export function clearExpiredReferralData(): void {
  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.referralCode);
    localStorage.removeItem(STORAGE_KEYS.partnerInfo);
    localStorage.removeItem(STORAGE_KEYS.captureTimestamp);
    
    // Clear cookies by setting them to expire in the past
    const pastDate = new Date(0).toUTCString();
    document.cookie = `${STORAGE_KEYS.referralCode}=; expires=${pastDate}; path=/`;
    document.cookie = `${STORAGE_KEYS.partnerInfo}=; expires=${pastDate}; path=/`;
    document.cookie = `${STORAGE_KEYS.captureTimestamp}=; expires=${pastDate}; path=/`;
    
    console.log('🧹 Cleared expired referral data');
  } catch (error) {
    console.error('❌ Error clearing referral data:', error);
  }
}

/**
 * Clear all referral data (for logout or manual clearing)
 */
export function clearReferralData(): void {
  clearExpiredReferralData();
}

/**
 * Check if a referral timestamp is still valid (within 90 days)
 * @param timestamp - The timestamp to check
 * @returns True if valid, false if expired
 */
function isReferralValid(timestamp: number): boolean {
  const now = Date.now();
  const age = now - timestamp;
  return age < REFERRAL_EXPIRY_MS;
}

/**
 * Get cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
function getCookieValue(name: string): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Error reading cookie:', name, error);
    return null;
  }
}

/**
 * Get referral status for display purposes
 * @returns Current referral information
 */
export function getReferralStatus(): {
  hasReferral: boolean;
  code: string | null;
  partnerInfo: PartnerInfo | null;
  timestamp: number | null;
} {
  const code = getReferralCode();
  const partnerInfo = getCachedPartnerInfo();
  const timestamp = localStorage.getItem(STORAGE_KEYS.captureTimestamp);
  
  return {
    hasReferral: !!code,
    code,
    partnerInfo,
    timestamp: timestamp ? parseInt(timestamp, 10) : null
  };
}
