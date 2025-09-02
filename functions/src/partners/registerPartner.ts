/**
 * Register Partner - Public Firebase Callable Function
 * 
 * Public function to allow users to register themselves as partners
 * Creates a pending partner account that requires admin approval
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  Partner, 
  PartnerStatus,
  DEFAULT_COMMISSION_RATE,
  COMMISSION_RATE_OPTIONS
} from "../types/partners.js";
import { sendMail } from "../lib/sendMail.js";
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
 * Register Partner Callable Function
 */
export const registerPartner = onCall({
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
      logger.warn('[RegisterPartner] Unauthenticated request');
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to register as a partner."
      );
    }

    const userUid = request.auth.uid;
    const userEmail = request.auth.token.email;
    
    logger.info(`[RegisterPartner] User ${userEmail} (${userUid}) attempting to register as partner`);

    // Step 2: Validate request data
    const data = request.data as {
      email: string;
      displayName: string;
      companyName?: string;
      website?: string;
      commissionRate?: number;
      description?: string;
      marketingPreferences?: {
        emailMarketing?: boolean;
        smsMarketing?: boolean;
        partnerNewsletter?: boolean;
      };
    };
    
    if (!data || typeof data !== 'object') {
      throw new HttpsError(
        "invalid-argument",
        "Request data is required and must be an object."
      );
    }

    const { 
      email, 
      displayName, 
      companyName, 
      website, 
      commissionRate, 
      description, 
      marketingPreferences 
    } = data;

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

    // Verify email matches authenticated user
    if (email.toLowerCase() !== userEmail?.toLowerCase()) {
      throw new HttpsError(
        "invalid-argument",
        "Email must match your authenticated account email."
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

    // Step 3: Check if user is already a partner
    const existingPartnerQuery = await db.collection('partners')
      .where('uid', '==', userUid)
      .limit(1)
      .get();

    if (!existingPartnerQuery.empty) {
      logger.warn(`[RegisterPartner] User ${userEmail} already has partner account: ${existingPartnerQuery.docs[0].id}`);
      
      throw new HttpsError(
        "already-exists",
        "You already have a partner account. Please contact support if you need assistance."
      );
    }

    // Step 4: Check if email is already used by another partner
    const emailQuery = await db.collection('partners')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!emailQuery.empty) {
      logger.warn(`[RegisterPartner] Email ${email} already used by another partner`);
      throw new HttpsError(
        "already-exists",
        "A partner account with this email already exists. Please contact support if this is an error."
      );
    }

    // Step 5: Create pending partner account
    const now = Timestamp.now();
    const partnerId = db.collection('partners').doc().id;
    
    const partnerData: Partner = {
      uid: userUid,
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      commissionRate: finalCommissionRate,
      status: 'pending' as PartnerStatus, // Requires admin approval
      createdAt: now,
      updatedAt: now,
      ...(companyName && { companyName: companyName.trim() }),
      ...(website && { website }),
      ...(description && { description: description.trim() }),
      ...(marketingPreferences && { marketingPreferences }),
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: now
      },
      // Add registration metadata
      registrationData: {
        submittedAt: now,
        ipAddress: request.rawRequest.ip || 'unknown',
        userAgent: request.rawRequest.headers['user-agent'] || 'unknown',
        source: 'public_registration'
      }
    };

    // Step 6: Save partner to Firestore
    const partnerRef = db.collection('partners').doc(partnerId);
    await partnerRef.set(partnerData);

    // Step 7: Update Firebase Auth custom claims (for UI authorization)
    try {
      const authUser = await auth.getUser(userUid);
      await auth.setCustomUserClaims(userUid, {
        ...authUser.customClaims,
        partner: true,
        partnerId: partnerId,
        partnerStatus: 'pending'
      });
      logger.info(`[RegisterPartner] Updated custom claims for user: ${userUid}`);
    } catch (error) {
      logger.warn(`[RegisterPartner] Failed to set custom claims for ${userUid}:`, error);
      // Don't fail the operation for this
    }

    // Step 8: Create admin notification in Firestore
    try {
      await db.collection('adminNotifications').add({
        type: 'partner_registration',
        partnerId: partnerId,
        partnerEmail: email,
        partnerName: displayName,
        status: 'pending',
        createdAt: now,
        read: false
      });
      logger.info(`[RegisterPartner] Created admin notification for partner: ${partnerId}`);
    } catch (error) {
      logger.warn(`[RegisterPartner] Failed to create admin notification:`, error);
      // Don't fail the operation for this
    }

    // Step 9: Send email notification to admin
    try {
      const adminEmail = 'engageperfect@gmail.com';
      const commissionRatePercent = Math.round(finalCommissionRate * 100);
      
      await sendMail({
        to: adminEmail,
        subject: `Nouvelle demande de partenariat - ${displayName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouvelle demande de partenariat</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Détails du candidat</h3>
              <p><strong>Nom:</strong> ${displayName}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${companyName ? `<p><strong>Entreprise:</strong> ${companyName}</p>` : ''}
              ${website ? `<p><strong>Site web:</strong> <a href="${website}">${website}</a></p>` : ''}
              <p><strong>Taux de commission:</strong> ${commissionRatePercent}%</p>
              ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>Action requise:</strong> Veuillez examiner cette demande et approuver ou rejeter le candidat partenaire.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                ID du partenaire: ${partnerId}<br>
                Date de soumission: ${now.toDate().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        `,
        text: `
Nouvelle demande de partenariat

Détails du candidat:
- Nom: ${displayName}
- Email: ${email}
${companyName ? `- Entreprise: ${companyName}` : ''}
${website ? `- Site web: ${website}` : ''}
- Taux de commission: ${commissionRatePercent}%
${description ? `- Description: ${description}` : ''}

Action requise: Veuillez examiner cette demande et approuver ou rejeter le candidat partenaire.

ID du partenaire: ${partnerId}
Date de soumission: ${now.toDate().toLocaleString('fr-FR')}
        `,
        locale: 'fr'
      });
      
      logger.info(`[RegisterPartner] Sent admin email notification for partner: ${partnerId}`);
    } catch (error) {
      logger.warn(`[RegisterPartner] Failed to send admin email notification:`, error);
      // Don't fail the operation for this
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[RegisterPartner] Partner registration completed for ${partnerId} in ${processingTime}ms`);

    return {
      success: true,
      partnerId,
      message: `Partner registration submitted successfully for ${displayName}. Your application is pending admin approval.`,
      messageKey: 'partner.registration.submitted'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof HttpsError) {
      logger.warn(`[RegisterPartner] Request failed in ${processingTime}ms:`, error.message);
      throw error;
    }
    
    logger.error(`[RegisterPartner] Unexpected error in ${processingTime}ms:`, error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while registering as a partner."
    );
  }
});

/**
 * Helper function to get pending partner registrations (for admin use)
 */
export const getPendingPartnerRegistrations = async (): Promise<Array<{ id: string; data: Partner }>> => {
  try {
    const query = await db.collection('partners')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    return query.docs.map(doc => ({
      id: doc.id,
      data: doc.data() as Partner
    }));
  } catch (error) {
    logger.error('[GetPendingPartnerRegistrations] Error:', error);
    return [];
  }
};

/**
 * Helper function to approve partner registration (for admin use)
 */
export const approvePartnerRegistration = async (partnerId: string): Promise<boolean> => {
  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();
    
    if (!partnerDoc.exists) {
      logger.warn(`[ApprovePartnerRegistration] Partner not found: ${partnerId}`);
      return false;
    }
    
    const partnerData = partnerDoc.data() as Partner;
    
    // Update partner status to active
    await partnerRef.update({
      status: 'active',
      updatedAt: Timestamp.now(),
      approvedAt: Timestamp.now()
    });
    
    // Update Firebase Auth custom claims
    try {
      await auth.setCustomUserClaims(partnerData.uid, {
        partner: true,
        partnerId: partnerId,
        partnerStatus: 'active'
      });
      logger.info(`[ApprovePartnerRegistration] Updated custom claims for user: ${partnerData.uid}`);
    } catch (error) {
      logger.warn(`[ApprovePartnerRegistration] Failed to set custom claims:`, error);
    }
    
    logger.info(`[ApprovePartnerRegistration] Partner ${partnerId} approved successfully`);
    return true;
    
  } catch (error) {
    logger.error('[ApprovePartnerRegistration] Error:', error);
    return false;
  }
};

/**
 * Helper function to reject partner registration (for admin use)
 */
export const rejectPartnerRegistration = async (partnerId: string, reason?: string): Promise<boolean> => {
  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();
    
    if (!partnerDoc.exists) {
      logger.warn(`[RejectPartnerRegistration] Partner not found: ${partnerId}`);
      return false;
    }
    
    const partnerData = partnerDoc.data() as Partner;
    
    // Update partner status to rejected
    await partnerRef.update({
      status: 'rejected',
      updatedAt: Timestamp.now(),
      rejectedAt: Timestamp.now(),
      ...(reason && { rejectionReason: reason })
    });
    
    // Remove Firebase Auth custom claims
    try {
      await auth.setCustomUserClaims(partnerData.uid, {
        partner: false,
        partnerId: null,
        partnerStatus: null
      });
      logger.info(`[RejectPartnerRegistration] Removed custom claims for user: ${partnerData.uid}`);
    } catch (error) {
      logger.warn(`[RejectPartnerRegistration] Failed to remove custom claims:`, error);
    }
    
    logger.info(`[RejectPartnerRegistration] Partner ${partnerId} rejected successfully`);
    return true;
    
  } catch (error) {
    logger.error('[RejectPartnerRegistration] Error:', error);
    return false;
  }
};
