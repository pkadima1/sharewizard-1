/**
 * Approve Partner - Firebase Callable Function
 * 
 * Admin-only function to approve partner applications
 * Creates partner account, generates referral code, and sends notifications
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  Partner, 
  PartnerCode,
  DEFAULT_COMMISSION_RATE,
  PartnerStatus 
} from "../types/partners.js";
import { sendPartnerApprovedEmail } from "./notifications.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();
const auth = getAuth();

/**
 * Validation functions
 */
const validateCommissionRate = (rate: number): boolean => {
  return rate >= 0.1 && rate <= 0.9 && rate % 0.05 === 0;
};

const validateCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{3,20}$/;
  return codeRegex.test(code);
};

const generateUniqueCode = async (partnerName: string): Promise<string> => {
  const baseCode = partnerName
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .substring(0, 8);
  
  let code = baseCode;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Check if code exists
    const existingCode = await db.collection('partnerCodes')
      .where('code', '==', code)
      .limit(1)
      .get();
    
    if (existingCode.empty) {
      return code;
    }
    
    // Add random suffix
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${baseCode}${suffix}`;
    attempts++;
  }
  
  // Fallback to timestamp-based code
  return `P${Date.now().toString(36).toUpperCase()}`;
};

/**
 * Check if user is admin
 */
const isAdmin = (uid: string, email?: string): boolean => {
  return email?.toLowerCase() === 'engageperfect@gmail.com' || uid === 'admin-uid-here';
};

/**
 * Approve Partner Callable Function
 */
export const approvePartner = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  partnerId: string;
  partner: Partner;
  code: string;
  partnerCode: PartnerCode;
  message: string;
  messageKey: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[ApprovePartner] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to approve partners."
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail = request.auth.token.email;
    
    // Step 2: Admin authorization check
    if (!isAdmin(callerUid, callerEmail)) {
      logger.warn(`[ApprovePartner] Unauthorized access attempt by ${callerEmail}`);
      throw new HttpsError(
        "permission-denied",
        "Only administrators can approve partner applications."
      );
    }

    // Step 3: Validate request data
    const data = request.data as {
      applicationId: string;
      commissionRate?: number;
      desiredCode?: string;
    };
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { applicationId, commissionRate, desiredCode } = data;

    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "Application ID is required and must be a string."
      );
    }

    // Validate commission rate
    const finalCommissionRate = commissionRate ?? DEFAULT_COMMISSION_RATE;
    if (!validateCommissionRate(finalCommissionRate)) {
      throw new HttpsError(
        "invalid-argument",
        "Commission rate must be between 10% and 90% in 5% increments."
      );
    }

    // Validate desired code if provided
    if (desiredCode && !validateCode(desiredCode)) {
      throw new HttpsError(
        "invalid-argument",
        "Desired code must be 3-20 characters long and contain only uppercase letters and numbers."
      );
    }

    logger.info(`[ApprovePartner] Approving partner application: ${applicationId}`);

    // Step 4: Get partner application
    const partnerRef = db.collection('partners').doc(applicationId);
    const partnerDoc = await partnerRef.get();
    
    if (!partnerDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Partner application not found."
      );
    }

    const partnerData = partnerDoc.data() as Partner;
    
    // Check if already approved
    if (partnerData.status === 'approved') {
      throw new HttpsError(
        "already-exists",
        "Partner application has already been approved."
      );
    }

    // Check if rejected
    if (partnerData.status === 'rejected') {
      throw new HttpsError(
        "failed-precondition",
        "Cannot approve a rejected partner application."
      );
    }

    const now = Timestamp.now();

    // Step 5: Update partner status to approved
    await partnerRef.update({
      status: 'approved' as PartnerStatus,
      commissionRate: finalCommissionRate,
      updatedAt: now,
      approvedAt: now,
      approvedByUid: callerUid,
      approvedByEmail: callerEmail
    });

    // Step 6: Update Firebase Auth custom claims
    try {
      const authUser = await auth.getUser(partnerData.uid);
      await auth.setCustomUserClaims(partnerData.uid, {
        ...authUser.customClaims,
        partner: true,
        partnerId: applicationId,
        partnerStatus: 'approved'
      });
      logger.info(`[ApprovePartner] Updated custom claims for user: ${partnerData.uid}`);
    } catch (error) {
      logger.warn(`[ApprovePartner] Failed to set custom claims for ${partnerData.uid}:`, error);
      // Don't fail the operation for this
    }

    // Step 7: Generate or validate referral code
    let finalCode: string;
    if (desiredCode) {
      // Check if desired code is available
      const existingCode = await db.collection('partnerCodes')
        .where('code', '==', desiredCode)
        .limit(1)
        .get();
      
      if (!existingCode.empty) {
        throw new HttpsError(
          "already-exists",
          "The desired code is already in use. Please choose a different code."
        );
      }
      finalCode = desiredCode;
    } else {
      finalCode = await generateUniqueCode(partnerData.displayName);
    }

    // Step 8: Create partner code
    const codeId = db.collection('partnerCodes').doc().id;
    const partnerCodeData: PartnerCode = {
      code: finalCode,
      partnerId: applicationId,
      active: true,
      uses: 0,
      description: `Default code for ${partnerData.displayName}`,
      customCommissionRate: finalCommissionRate,
      createdAt: now
    };

    await db.collection('partnerCodes').doc(codeId).set(partnerCodeData);

    // Step 9: Create admin notification (optional)
    try {
      await db.collection('adminNotifications').add({
        type: 'partner_approved',
        partnerId: applicationId,
        partnerEmail: partnerData.email,
        partnerName: partnerData.displayName,
        approvedBy: callerEmail,
        commissionRate: finalCommissionRate,
        code: finalCode,
        createdAt: now,
        read: false
      });
      logger.info(`[ApprovePartner] Created admin notification for approved partner: ${applicationId}`);
    } catch (error) {
      logger.warn(`[ApprovePartner] Failed to create admin notification:`, error);
      // Don't fail the operation for this
    }

    // Step 10: Send approval email notification
    try {
      const origin = process.env.APP_ORIGIN || 'https://engageperfect.com';
      const mailId = await sendPartnerApprovedEmail({
        email: partnerData.email,
        displayName: partnerData.displayName,
        code: finalCode,
        origin
      });
      logger.info(`[ApprovePartner] Approval email sent: ${mailId} to ${partnerData.email}`);
    } catch (error) {
      logger.warn(`[ApprovePartner] Failed to send approval email to ${partnerData.email}:`, error);
      // Don't fail the operation for this
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[ApprovePartner] Partner ${applicationId} approved successfully in ${processingTime}ms`);

    return {
      success: true,
      partnerId: applicationId,
      partner: partnerData,
      code: finalCode,
      partnerCode: partnerCodeData,
      message: `Partner ${partnerData.displayName} approved successfully with ${(finalCommissionRate * 100).toFixed(0)}% commission rate. Referral code: ${finalCode}`,
      messageKey: 'admin.approval.success'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[ApprovePartner] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[ApprovePartner] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while approving the partner application."
    );
  }
});
