/**
 * Reject Partner - Firebase Callable Function
 * 
 * Admin-only function to reject partner applications
 * Updates status, removes custom claims, and sends notifications
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  Partner, 
  PartnerStatus 
} from "../types/partners.js";
import { sendPartnerRejectedEmail } from "./notifications.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();
const auth = getAuth();

/**
 * Validation functions
 */
const validateReviewNote = (note: string): boolean => {
  return note.trim().length >= 10 && note.trim().length <= 1000;
};

/**
 * Check if user is admin
 */
const isAdmin = (uid: string, email?: string): boolean => {
  return email?.toLowerCase() === 'engageperfect@gmail.com' || uid === 'admin-uid-here';
};

/**
 * Reject Partner Callable Function
 */
export const rejectPartner = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  partnerId: string;
  message: string;
  messageKey: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[RejectPartner] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to reject partners."
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail = request.auth.token.email;
    
    // Step 2: Admin authorization check
    if (!isAdmin(callerUid, callerEmail)) {
      logger.warn(`[RejectPartner] Unauthorized access attempt by ${callerEmail}`);
      throw new HttpsError(
        "permission-denied",
        "Only administrators can reject partner applications."
      );
    }

    // Step 3: Validate request data
    const data = request.data as {
      applicationId: string;
      reviewNote?: string;
    };
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { applicationId, reviewNote } = data;

    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "Application ID is required and must be a string."
      );
    }

    // Validate review note if provided
    if (reviewNote && !validateReviewNote(reviewNote)) {
      throw new HttpsError(
        "invalid-argument",
        "Review note must be between 10 and 1000 characters long."
      );
    }

    logger.info(`[RejectPartner] Rejecting partner application: ${applicationId}`);

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
    
    // Check if already rejected
    if (partnerData.status === 'rejected') {
      throw new HttpsError(
        "already-exists",
        "Partner application has already been rejected."
      );
    }

    // Check if already approved
    if (partnerData.status === 'active') {
      throw new HttpsError(
        "failed-precondition",
        "Cannot reject an approved partner application."
      );
    }

    const now = Timestamp.now();

    // Step 5: Update partner status to rejected
    await partnerRef.update({
      status: 'rejected' as PartnerStatus,
      updatedAt: now,
      rejectedAt: now,
      ...(reviewNote && { rejectionReason: reviewNote.trim() })
    });

    // Step 6: Remove Firebase Auth custom claims
    try {
      const authUser = await auth.getUser(partnerData.uid);
      await auth.setCustomUserClaims(partnerData.uid, {
        ...authUser.customClaims,
        partner: false,
        partnerId: null,
        partnerStatus: null
      });
      logger.info(`[RejectPartner] Removed custom claims for user: ${partnerData.uid}`);
    } catch (error) {
      logger.warn(`[RejectPartner] Failed to remove custom claims for ${partnerData.uid}:`, error);
      // Don't fail the operation for this
    }

    // Step 7: Create admin notification (optional)
    try {
      await db.collection('adminNotifications').add({
        type: 'partner_rejected',
        partnerId: applicationId,
        partnerEmail: partnerData.email,
        partnerName: partnerData.displayName,
        rejectedBy: callerEmail,
        rejectionReason: reviewNote?.trim(),
        createdAt: now,
        read: false
      });
      logger.info(`[RejectPartner] Created admin notification for rejected partner: ${applicationId}`);
    } catch (error) {
      logger.warn(`[RejectPartner] Failed to create admin notification:`, error);
      // Don't fail the operation for this
    }

    // Step 8: Send rejection email notification
    try {
      const mailId = await sendPartnerRejectedEmail({
        email: partnerData.email,
        displayName: partnerData.displayName,
        reviewNote: reviewNote?.trim() || 'No specific reason provided'
      });
      logger.info(`[RejectPartner] Rejection email sent: ${mailId} to ${partnerData.email}`);
    } catch (error) {
      logger.warn(`[RejectPartner] Failed to send rejection email to ${partnerData.email}:`, error);
      // Don't fail the operation for this
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[RejectPartner] Partner ${applicationId} rejected successfully in ${processingTime}ms`);

    return {
      success: true,
      partnerId: applicationId,
      message: `Partner application for ${partnerData.displayName} has been rejected.`,
      messageKey: 'admin.rejection.success'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[RejectPartner] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[RejectPartner] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while rejecting the partner application."
    );
  }
});
