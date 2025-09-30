/**
 * Create Partner - Firebase Callable Function
 * 
 * Admin-only function to create or update partner accounts
 * Handles partner registration, validation, and initial setup
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  Partner, 
  CreatePartnerRequest, 
  DEFAULT_COMMISSION_RATE,
  COMMISSION_RATE_OPTIONS,
  PartnerStatus 
} from "../types/partners.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();
const auth = getAuth();

/**
 * Validation helpers
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCommissionRate = (rate: number): boolean => {
  return COMMISSION_RATE_OPTIONS.includes(rate as any);
};

const validateDisplayName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100;
};

const validateWebsite = (website?: string): boolean => {
  if (!website) return true; // Optional field
  try {
    const url = new URL(website);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (uid: string, email?: string): boolean => {
  return email?.toLowerCase() === 'engageperfect@gmail.com';
};

/**
 * Create Partner Callable Function
 */
export const createPartner = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  partnerId: string;
  partner: Partner;
  message: string;
  messageKey: string; // For localization
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[CreatePartner] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to create partners."
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail = request.auth.token.email;
    
    // Step 2: Admin authorization check
    if (!isAdmin(callerUid, callerEmail)) {
      logger.warn(`[CreatePartner] Unauthorized access attempt by ${callerEmail}`);
      throw new HttpsError(
        "permission-denied",
        "Only administrators can create partner accounts."
      );
    }

    // Step 3: Validate request data
    const data = request.data as CreatePartnerRequest;
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { uid, email, displayName, commissionRate, companyName, website, marketingPreferences, password } = data;

    // Validate required fields
    if (!email || !validateEmail(email)) {
      throw new HttpsError(
        "invalid-argument",
        "Valid email address is required."
      );
    }

    if (!displayName || !validateDisplayName(displayName)) {
      throw new HttpsError(
        "invalid-argument",
        "Display name must be 2-100 characters long."
      );
    }

    // Validate optional fields
    const finalCommissionRate = commissionRate ?? DEFAULT_COMMISSION_RATE;
    if (!validateCommissionRate(finalCommissionRate)) {
      throw new HttpsError(
        "invalid-argument",
        `Commission rate must be one of: ${COMMISSION_RATE_OPTIONS.join(', ')}`
      );
    }

    if (website && !validateWebsite(website)) {
      throw new HttpsError(
        "invalid-argument",
        "Website must be a valid HTTP/HTTPS URL."
      );
    }

    // Step 4: Handle user creation or validation
    let finalUid: string;
    let isNewUser = false;

    if (uid) {
      // Using existing user - validate UID exists
      logger.info(`[CreatePartner] Using existing user UID: ${uid}`);
      
      try {
        const authUser = await auth.getUser(uid);
        
        // Verify email matches
        if (authUser.email?.toLowerCase() !== email.toLowerCase()) {
          throw new HttpsError(
            "invalid-argument",
            "Email must match Firebase Auth user email."
          );
        }
        
        finalUid = uid;
        logger.info(`[CreatePartner] Validated existing user: ${finalUid}`);
      } catch (error) {
        logger.error(`[CreatePartner] Firebase Auth user not found: ${uid}`, error);
        throw new HttpsError(
          "not-found",
          "Firebase Auth user not found. User must be registered first."
        );
      }
    } else {
      // Creating new user
      logger.info(`[CreatePartner] Creating new Firebase Auth user for email: ${email}`);
      
      if (!password || password.length < 6) {
        throw new HttpsError(
          "invalid-argument",
          "Password is required and must be at least 6 characters long."
        );
      }

      try {
        // Check if user already exists
        await auth.getUserByEmail(email);
        throw new HttpsError(
          "already-exists",
          "A user with this email already exists. Please use the existing UID or choose a different email."
        );
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // User doesn't exist, create new one
          try {
            const userRecord = await auth.createUser({
              email: email,
              password: password,
              displayName: displayName,
              emailVerified: false
            });
            
            finalUid = userRecord.uid;
            isNewUser = true;
            logger.info(`[CreatePartner] Created new Firebase Auth user: ${finalUid}`);
          } catch (createError: any) {
            logger.error(`[CreatePartner] Failed to create Firebase Auth user:`, createError);
            throw new HttpsError(
              "internal",
              `Failed to create Firebase Auth user: ${createError.message}`
            );
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    }

    // Step 5: Check if partner already exists
    const existingPartnerQuery = await db.collection('partners')
      .where('uid', '==', finalUid)
      .limit(1)
      .get();

    let partnerId: string;
    let isUpdate = false;

    if (!existingPartnerQuery.empty) {
      // Partner exists, update it
      partnerId = existingPartnerQuery.docs[0].id;
      isUpdate = true;
      logger.info(`[CreatePartner] Updating existing partner: ${partnerId}`);
    } else {
      // Check if email is already used by another partner
      const emailQuery = await db.collection('partners')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!emailQuery.empty) {
        throw new HttpsError(
          "already-exists",
          "A partner with this email already exists."
        );
      }

      // Generate new partner ID
      partnerId = db.collection('partners').doc().id;
      logger.info(`[CreatePartner] Creating new partner: ${partnerId}`);
    }

    // Step 6: Prepare partner data
    const now = Timestamp.now();
    const partnerData: Partner = {
      uid: finalUid,
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      commissionRate: finalCommissionRate,
      status: 'active' as PartnerStatus, // New partners are immediately active (admin created)
      createdAt: isUpdate ? (existingPartnerQuery.docs[0].data().createdAt || now) : now,
      updatedAt: now,
      ...(companyName && { companyName: companyName.trim() }),
      ...(website && { website }),
      ...(marketingPreferences && { marketingPreferences }),
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: now
      }
    };

    // Step 7: Save partner to Firestore
    const partnerRef = db.collection('partners').doc(partnerId);
    await partnerRef.set(partnerData, { merge: isUpdate });

    // Step 8: Update Firebase Auth custom claims (for UI authorization)
    try {
      const authUser = await auth.getUser(finalUid);
      await auth.setCustomUserClaims(finalUid, {
        ...authUser.customClaims,
        partner: true,
        partnerId: partnerId,
        partnerStatus: 'active'
      });
      logger.info(`[CreatePartner] Updated custom claims for user: ${finalUid}`);
    } catch (error) {
      logger.warn(`[CreatePartner] Failed to set custom claims for ${finalUid}:`, error);
      // Don't fail the operation for this
    }

    const processingTime = Date.now() - startTime;
    const action = isUpdate ? 'Updated' : (isNewUser ? 'Created user and partner' : 'Created partner');
    logger.info(`[CreatePartner] ${action} ${partnerId} in ${processingTime}ms`);

    return {
      success: true,
      partnerId,
      partner: partnerData,
      message: isUpdate 
        ? `Partner account updated successfully for ${displayName}` 
        : isNewUser
        ? `Firebase Auth user and partner account created successfully for ${displayName}`
        : `Partner account created successfully for ${displayName}`,
      messageKey: isUpdate 
        ? 'partner.messages.accountUpdated'
        : 'partner.messages.accountCreated'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[CreatePartner] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[CreatePartner] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while creating the partner account."
    );
  }
});

/**
 * Helper function to get partner by UID (for internal use)
 */
export const getPartnerByUid = async (uid: string): Promise<{ id: string; data: Partner } | null> => {
  try {
    const query = await db.collection('partners')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (query.empty) {
      return null;
    }

    const doc = query.docs[0];
    return {
      id: doc.id,
      data: doc.data() as Partner
    };
  } catch (error) {
    logger.error('[GetPartnerByUid] Error:', error);
    return null;
  }
};

/**
 * Helper function to get partner by email (for internal use)
 */
export const getPartnerByEmail = async (email: string): Promise<{ id: string; data: Partner } | null> => {
  try {
    const query = await db.collection('partners')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (query.empty) {
      return null;
    }

    const doc = query.docs[0];
    return {
      id: doc.id,
      data: doc.data() as Partner
    };
  } catch (error) {
    logger.error('[GetPartnerByEmail] Error:', error);
    return null;
  }
};
