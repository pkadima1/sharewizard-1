/**
 * Create Partner Code - Firebase Callable Function
 * 
 * Admin-only function to create unique referral codes for partners
 * Handles code validation, uniqueness checking, and generation
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { PartnerCode } from "../types/partners.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

/**
 * Reserved codes that cannot be used
 */
const RESERVED_CODES = [
  'ADMIN', 'TEST', 'DEMO', 'API', 'WWW', 'MAIL', 'SUPPORT',
  'HELP', 'INFO', 'SALES', 'BILLING', 'LEGAL', 'TERMS',
  'PRIVACY', 'COOKIE', 'GDPR', 'CCPA', 'ENGAGE', 'PERFECT',
  'PROMO', 'COUPON', 'DISCOUNT', 'OFFER', 'DEAL', 'SAVE',
  'FREE', 'TRIAL', 'PREMIUM', 'BASIC', 'VIP', 'SPECIAL'
];

/**
 * Code validation regex: 3-20 alphanumeric uppercase characters
 */
const CODE_REGEX = /^[A-Z0-9]{3,20}$/;

/**
 * Request interface
 */
interface CreatePartnerCodeRequest {
  partnerId: string;
  desiredCode?: string;
  description?: string;
  expiresAt?: string; // ISO date string
  maxUses?: number;
  customCommissionRate?: number;
}

/**
 * Validation helpers
 */
const validateCodeFormat = (code: string): { valid: boolean; error?: string } => {
  if (!code) {
    return { valid: false, error: 'Code is required' };
  }

  if (!CODE_REGEX.test(code)) {
    return { 
      valid: false, 
      error: 'Code must be 3-20 characters, uppercase letters and numbers only' 
    };
  }

  if (RESERVED_CODES.includes(code)) {
    return { 
      valid: false, 
      error: 'This code is reserved and cannot be used' 
    };
  }

  return { valid: true };
};

/**
 * Generate a random partner code
 */
const generateRandomCode = (partnerName: string = ''): string => {
  // Clean partner name for code generation
  const cleanName = partnerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Use first 4-6 characters of name if available
  let baseCode = cleanName.substring(0, 6);
  
  // If name is too short, use random prefix
  if (baseCode.length < 3) {
    baseCode = 'REF';
  }
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Combine and ensure it's within length limits
  let finalCode = (baseCode + randomSuffix).substring(0, 12);
  
  // Ensure minimum length
  while (finalCode.length < 6) {
    finalCode += Math.random().toString(36).substring(2, 3).toUpperCase();
  }
  
  return finalCode;
};

/**
 * Check if code is unique
 */
const isCodeUnique = async (code: string): Promise<boolean> => {
  try {
    const doc = await db.collection('partnerCodes').doc(code).get();
    return !doc.exists;
  } catch (error) {
    logger.error('[IsCodeUnique] Error checking code:', error);
    throw new HttpsError("internal", "Failed to validate code uniqueness");
  }
};

/**
 * Check if partner exists
 */
const partnerExists = async (partnerId: string): Promise<boolean> => {
  try {
    const doc = await db.collection('partners').doc(partnerId).get();
    return doc.exists;
  } catch (error) {
    logger.error('[PartnerExists] Error checking partner:', error);
    throw new HttpsError("internal", "Failed to validate partner");
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (uid: string, email?: string): boolean => {
  return email?.toLowerCase() === 'engageperfect@gmail.com';
};

/**
 * Create Partner Code Callable Function
 */
export const createPartnerCode = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  code: string;
  partnerCode: PartnerCode;
  message: string;
  messageKey: string; // For localization
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[CreatePartnerCode] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to create partner codes."
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail = request.auth.token.email;
    
    // Step 2: Admin authorization check
    if (!isAdmin(callerUid, callerEmail)) {
      logger.warn(`[CreatePartnerCode] Unauthorized access attempt by ${callerEmail}`);
      throw new HttpsError(
        "permission-denied",
        "Only administrators can create partner codes."
      );
    }

    // Step 3: Validate request data
    const data = request.data as CreatePartnerCodeRequest;
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { 
      partnerId, 
      desiredCode, 
      description, 
      expiresAt, 
      maxUses, 
      customCommissionRate 
    } = data;

    // Validate required fields
    if (!partnerId || typeof partnerId !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "Partner ID is required and must be a string."
      );
    }

    logger.info(`[CreatePartnerCode] Creating code for partner: ${partnerId}`);

    // Step 4: Verify partner exists
    const partnerExistsResult = await partnerExists(partnerId);
    if (!partnerExistsResult) {
      throw new HttpsError(
        "not-found",
        "Partner not found. Please ensure the partner exists first."
      );
    }

    // Step 5: Get partner info for code generation
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    const partnerData = partnerDoc.data();
    const partnerName = partnerData?.displayName || '';

    // Step 6: Determine final code
    let finalCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    if (desiredCode) {
      // Use desired code if provided
      const validation = validateCodeFormat(desiredCode.toUpperCase());
      if (!validation.valid) {
        throw new HttpsError(
          "invalid-argument",
          validation.error || "Invalid code format"
        );
      }

      finalCode = desiredCode.toUpperCase();
      
      // Check uniqueness
      const isUnique = await isCodeUnique(finalCode);
      if (!isUnique) {
        throw new HttpsError(
          "already-exists",
          "This code is already taken. Please choose a different one."
        );
      }
    } else {
      // Generate unique code
      do {
        finalCode = generateRandomCode(partnerName);
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new HttpsError(
            "internal",
            "Failed to generate unique code after multiple attempts. Please try again."
          );
        }
      } while (!(await isCodeUnique(finalCode)));
    }

    // Step 7: Validate optional fields
    let expirationDate: Timestamp | undefined;
    if (expiresAt) {
      try {
        const expDate = new Date(expiresAt);
        if (expDate <= new Date()) {
          throw new HttpsError(
            "invalid-argument",
            "Expiration date must be in the future."
          );
        }
        expirationDate = Timestamp.fromDate(expDate);
      } catch (error) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid expiration date format. Use ISO date string."
        );
      }
    }

    if (maxUses !== undefined && (maxUses < 1 || maxUses > 100000)) {
      throw new HttpsError(
        "invalid-argument",
        "Max uses must be between 1 and 100,000."
      );
    }

    if (customCommissionRate !== undefined && 
        (customCommissionRate < 0.1 || customCommissionRate > 0.9)) {
      throw new HttpsError(
        "invalid-argument",
        "Custom commission rate must be between 0.1 (10%) and 0.9 (90%)."
      );
    }

    // Step 8: Create partner code data
    const now = Timestamp.now();
    const partnerCodeData: PartnerCode = {
      code: finalCode,
      partnerId,
      active: true,
      createdAt: now,
      uses: 0,
      ...(description && { description: description.trim() }),
      ...(expirationDate && { expiresAt: expirationDate }),
      ...(maxUses && { maxUses }),
      ...(customCommissionRate && { customCommissionRate })
    };

    // Step 9: Save to Firestore
    const codeRef = db.collection('partnerCodes').doc(finalCode);
    await codeRef.set(partnerCodeData);

    const processingTime = Date.now() - startTime;
    logger.info(`[CreatePartnerCode] Created code ${finalCode} for partner ${partnerId} in ${processingTime}ms`);

    return {
      success: true,
      code: finalCode,
      partnerCode: partnerCodeData,
      message: `Partner code '${finalCode}' created successfully`,
      messageKey: 'partner.messages.codeCreated'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[CreatePartnerCode] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[CreatePartnerCode] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while creating the partner code."
    );
  }
});

/**
 * Helper function to get partner codes for a partner (for internal use)
 */
export const getPartnerCodes = async (partnerId: string): Promise<PartnerCode[]> => {
  try {
    const query = await db.collection('partnerCodes')
      .where('partnerId', '==', partnerId)
      .orderBy('createdAt', 'desc')
      .get();

    return query.docs.map(doc => doc.data() as PartnerCode);
  } catch (error) {
    logger.error('[GetPartnerCodes] Error:', error);
    return [];
  }
};

/**
 * Helper function to validate if a code exists and is active (for internal use)
 */
export const validatePartnerCode = async (code: string): Promise<{
  valid: boolean;
  partnerCode?: PartnerCode;
  error?: string;
}> => {
  try {
    const doc = await db.collection('partnerCodes').doc(code.toUpperCase()).get();
    
    if (!doc.exists) {
      return { valid: false, error: 'Code not found' };
    }

    const partnerCode = doc.data() as PartnerCode;
    
    if (!partnerCode.active) {
      return { valid: false, error: 'Code is inactive' };
    }

    if (partnerCode.expiresAt && (partnerCode.expiresAt instanceof Timestamp ? partnerCode.expiresAt.toDate() : partnerCode.expiresAt) <= new Date()) {
      return { valid: false, error: 'Code has expired' };
    }

    if (partnerCode.maxUses && partnerCode.uses >= partnerCode.maxUses) {
      return { valid: false, error: 'Code has reached maximum uses' };
    }

    return { valid: true, partnerCode };
  } catch (error) {
    logger.error('[ValidatePartnerCode] Error:', error);
    return { valid: false, error: 'Validation failed' };
  }
};

/**
 * Helper function to increment code usage (for internal use)
 */
export const incrementCodeUsage = async (code: string): Promise<boolean> => {
  try {
    const codeRef = db.collection('partnerCodes').doc(code.toUpperCase());
    await codeRef.update({
      uses: FieldValue.increment(1),
      lastUsedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    logger.error('[IncrementCodeUsage] Error:', error);
    return false;
  }
};
