/**
 * Check User By Email - Firebase Callable Function
 * 
 * Admin-only function to check if a Firebase Auth user exists by email
 * Used for UX improvement in partner creation form
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const auth = getAuth();

/**
 * Check if user is admin
 */
const isAdmin = (uid: string, email?: string): boolean => {
  return email?.toLowerCase() === 'engageperfect@gmail.com' || uid === 'admin-uid-here';
};

/**
 * Check User By Email Callable Function
 */
export const checkUserByEmail = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "128MiB",
  maxInstances: 10
}, async (request): Promise<{
  exists: boolean;
  uid?: string;
  email?: string;
  displayName?: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Authentication check
    if (!request.auth) {
      logger.warn('[CheckUserByEmail] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to check user by email."
      );
    }

    const callerUid = request.auth.uid;
    const callerEmail = request.auth.token.email;
    
    // Step 2: Admin authorization check
    if (!isAdmin(callerUid, callerEmail)) {
      logger.warn(`[CheckUserByEmail] Unauthorized access attempt by ${callerEmail}`);
      throw new HttpsError(
        "permission-denied",
        "Only administrators can check user by email."
      );
    }

    // Step 3: Validate request data
    const data = request.data as { email: string };
    
    if (!data || !data.email) {
      throw new HttpsError(
        "invalid-argument",
        "Email address is required."
      );
    }

    const email = data.email.toLowerCase().trim();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid email address format."
      );
    }

    // Step 4: Check if user exists in Firebase Auth
    try {
      const userRecord = await auth.getUserByEmail(email);
      
      const processingTime = Date.now() - startTime;
      logger.info(`[CheckUserByEmail] User found for ${email} in ${processingTime}ms`);
      
      return {
        exists: true,
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || undefined
      };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const processingTime = Date.now() - startTime;
        logger.info(`[CheckUserByEmail] No user found for ${email} in ${processingTime}ms`);
        
        return {
          exists: false
        };
      } else {
        // Re-throw other errors
        logger.error(`[CheckUserByEmail] Error checking user by email:`, error);
        throw new HttpsError(
          "internal",
          "An error occurred while checking the user."
        );
      }
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[CheckUserByEmail] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[CheckUserByEmail] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while checking the user."
    );
  }
});
