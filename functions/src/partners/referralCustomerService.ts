/**
 * Referral Customer Service
 * 
 * Handles the creation and management of referral customer records for partner dashboards.
 * This service bridges the gap between referral attribution (stored in 'referrals' collection)
 * and partner dashboard analytics (which reads from 'referralCustomers' collection).
 * 
 * Features:
 * - Create referral customer records during signup attribution
 * - Update customer status and activity
 * - Handle data synchronization between collections
 * - Support for localization and internationalization
 * - Comprehensive error handling and logging
 * 
 * @version 1.0.0
 * @author ShareWizard Team
 * @since 2025-10-01
 */

import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { Partner } from "../types/partners.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

/**
 * Interface for referral customer data
 * Matches the structure expected by partner dashboards
 */
export interface ReferralCustomerData {
  /** Unique identifier for the customer record */
  id: string;
  
  /** Partner ID who referred this customer */
  partnerId: string;
  
  /** Firebase Auth UID of the customer */
  customerUid: string;
  
  /** Customer's display name */
  displayName: string;
  
  /** Customer's email address */
  email: string;
  
  /** Date when customer joined via referral */
  joinedAt: Timestamp;
  
  /** Current customer status */
  status: 'active' | 'inactive' | 'churned';
  
  /** Total amount spent by customer (in dollars) */
  totalSpent: number;
  
  /** Last activity timestamp */
  lastActivity: Timestamp;
  
  /** Referral code that was used */
  referralCode?: string;
  
  /** Stripe customer ID (if available) */
  stripeCustomerId?: string;
  
  /** Original referral tracking ID for correlation */
  referralTrackingId?: string;
  
  /** Creation timestamp */
  createdAt: Timestamp;
  
  /** Last update timestamp */
  updatedAt: Timestamp;
  
  /** Additional metadata for analytics */
  metadata?: {
    /** Source of the referral */
    source?: string;
    
    /** Landing page visited */
    landingPage?: string;
    
    /** UTM parameters */
    utmParams?: Record<string, string>;
    
    /** Device information */
    deviceInfo?: {
      userAgent?: string;
      deviceType?: string;
      country?: string;
    };
    
    /** Localization data */
    locale?: {
      /** User's preferred language */
      language?: string;
      
      /** User's country code */
      country?: string;
      
      /** User's timezone */
      timezone?: string;
    };
  };
}

/**
 * Result interface for referral customer operations
 */
export interface ReferralCustomerResult {
  /** Operation success status */
  success: boolean;
  
  /** Customer record ID if successful */
  customerId?: string;
  
  /** Error or success message */
  message: string;
  
  /** Localization key for the message */
  messageKey: string;
  
  /** Additional data for the operation */
  data?: Partial<ReferralCustomerData>;
}

/**
 * Create a referral customer record during signup attribution
 * 
 * This function creates a customer record in the 'referralCustomers' collection
 * that partner dashboards use for analytics and reporting. It's called during
 * the referral attribution process to ensure proper tracking.
 * 
 * @param partnerId - Partner ID who gets credit for the referral
 * @param customerUid - Firebase Auth UID of the new customer
 * @param customerData - Customer profile data from Firebase Auth
 * @param referralMetadata - Additional metadata from the referral process
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * const result = await createReferralCustomer(
 *   'partner-123',
 *   'user-456',
 *   {
 *     email: 'user@example.com',
 *     displayName: 'John Doe'
 *   },
 *   {
 *     referralCode: 'PROMO2024',
 *     referralTrackingId: 'ref-789',
 *     source: 'link',
 *     landingPage: 'https://app.com/?ref=PROMO2024'
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log('Customer created:', result.customerId);
 * }
 * ```
 */
export async function createReferralCustomer(
  partnerId: string,
  customerUid: string,
  customerData: {
    email: string;
    displayName?: string;
    photoURL?: string;
  },
  referralMetadata: {
    referralCode?: string;
    referralTrackingId?: string;
    source?: string;
    landingPage?: string;
    userAgent?: string;
    utmParams?: Record<string, string>;
    locale?: {
      language?: string;
      country?: string;
      timezone?: string;
    };
  } = {}
): Promise<ReferralCustomerResult> {
  const startTime = Date.now();
  const operationId = `create-customer-${customerUid}-${Date.now()}`;
  
  try {
    logger.info(`[ReferralCustomerService] Starting customer creation:`, {
      operationId,
      partnerId,
      customerUid,
      customerEmail: customerData.email,
      referralCode: referralMetadata.referralCode
    });

    // Validate required parameters
    if (!partnerId || typeof partnerId !== 'string') {
      const error = 'Partner ID is required and must be a valid string';
      logger.warn(`[ReferralCustomerService] Validation failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.invalidPartnerId'
      };
    }

    if (!customerUid || typeof customerUid !== 'string') {
      const error = 'Customer UID is required and must be a valid string';
      logger.warn(`[ReferralCustomerService] Validation failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.invalidCustomerUid'
      };
    }

    if (!customerData.email || typeof customerData.email !== 'string') {
      const error = 'Customer email is required and must be a valid string';
      logger.warn(`[ReferralCustomerService] Validation failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.invalidEmail'
      };
    }

    // Check if customer already exists to prevent duplicates
    const existingCustomerQuery = db.collection('referralCustomers')
      .where('customerUid', '==', customerUid)
      .where('partnerId', '==', partnerId)
      .limit(1);

    const existingSnapshot = await existingCustomerQuery.get();
    
    if (!existingSnapshot.empty) {
      const existingCustomer = existingSnapshot.docs[0];
      const existingData = existingCustomer.data();
      
      logger.info(`[ReferralCustomerService] Customer already exists:`, {
        operationId,
        customerId: existingCustomer.id,
        createdAt: existingData.createdAt
      });
      
      return {
        success: true,
        customerId: existingCustomer.id,
        message: 'Referral customer already exists',
        messageKey: 'referral.customer.success.alreadyExists',
        data: {
          id: existingCustomer.id,
          ...existingData
        } as Partial<ReferralCustomerData>
      };
    }

    // Verify partner exists and is active
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      const error = `Partner not found: ${partnerId}`;
      logger.warn(`[ReferralCustomerService] Partner validation failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.partnerNotFound'
      };
    }

    const partnerData = partnerDoc.data() as Partner;
    
    if (partnerData.status !== 'active') {
      const error = `Partner is not active: ${partnerId} (status: ${partnerData.status})`;
      logger.warn(`[ReferralCustomerService] Partner status check failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.partnerInactive'
      };
    }

    // Generate unique customer ID
    const customerRef = db.collection('referralCustomers').doc();
    const customerId = customerRef.id;

    // Prepare customer data
    const now = Timestamp.now();
    const customerRecord: ReferralCustomerData = {
      id: customerId,
      partnerId,
      customerUid,
      displayName: customerData.displayName || customerData.email.split('@')[0] || 'Anonymous User',
      email: customerData.email,
      joinedAt: now,
      status: 'active',
      totalSpent: 0, // Will be updated when customer makes purchases
      lastActivity: now,
      referralCode: referralMetadata.referralCode,
      referralTrackingId: referralMetadata.referralTrackingId,
      createdAt: now,
      updatedAt: now,
      metadata: {
        source: referralMetadata.source || 'link',
        ...(referralMetadata.landingPage && { landingPage: referralMetadata.landingPage }),
        ...(referralMetadata.utmParams && { utmParams: referralMetadata.utmParams }),
        deviceInfo: {
          ...(referralMetadata.userAgent && { userAgent: referralMetadata.userAgent })
          // Additional device info can be added here
        },
        ...(referralMetadata.locale && { locale: referralMetadata.locale })
      }
    };

    // Create the customer record using transaction for consistency
    await db.runTransaction(async (transaction) => {
      // Double-check that customer doesn't exist (race condition protection)
      const doubleCheckSnapshot = await transaction.get(existingCustomerQuery);
      
      if (!doubleCheckSnapshot.empty) {
        throw new Error('Customer already exists (race condition detected)');
      }

      // Create the customer record
      transaction.set(customerRef, customerRecord);

      // Update partner statistics
      const partnerRef = db.collection('partners').doc(partnerId);
      const partnerDoc = await transaction.get(partnerRef);
      
      if (partnerDoc.exists) {
        const currentStats = partnerDoc.data()?.stats || {};
        
        transaction.update(partnerRef, {
          'stats.totalReferrals': FieldValue.increment(1),
          'stats.lastCalculated': now,
          'updatedAt': now
        });

        logger.info(`[ReferralCustomerService] Updated partner statistics:`, {
          operationId,
          partnerId,
          previousReferrals: currentStats.totalReferrals || 0,
          newReferrals: (currentStats.totalReferrals || 0) + 1
        });
      }
    });

    const processingTime = Date.now() - startTime;
    
    logger.info(`[ReferralCustomerService] Customer created successfully in ${processingTime}ms:`, {
      operationId,
      customerId,
      partnerId,
      customerUid,
      customerEmail: customerData.email,
      referralCode: referralMetadata.referralCode
    });

    return {
      success: true,
      customerId,
      message: 'Referral customer created successfully',
      messageKey: 'referral.customer.success.created',
      data: customerRecord
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(`[ReferralCustomerService] Error creating customer in ${processingTime}ms:`, {
      operationId,
      partnerId,
      customerUid,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle specific error cases
    if (error instanceof Error && error.message.includes('already exists')) {
      return {
        success: false,
        message: 'Customer already exists for this partner',
        messageKey: 'referral.customer.error.duplicate'
      };
    }

    return {
      success: false,
      message: 'Failed to create referral customer',
      messageKey: 'referral.customer.error.creationFailed'
    };
  }
}

/**
 * Update referral customer activity and spending
 * 
 * This function updates customer records when they make purchases or
 * perform other activities that should be tracked for partner analytics.
 * 
 * @param customerUid - Customer's Firebase Auth UID
 * @param updates - Updates to apply to the customer record
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * const result = await updateReferralCustomer('user-456', {
 *   totalSpent: 99.99,
 *   status: 'active',
 *   stripeCustomerId: 'cus_stripe123'
 * });
 * ```
 */
export async function updateReferralCustomer(
  customerUid: string,
  updates: {
    totalSpent?: number;
    status?: 'active' | 'inactive' | 'churned';
    stripeCustomerId?: string;
    lastActivity?: Timestamp;
    metadata?: Partial<ReferralCustomerData['metadata']>;
  }
): Promise<ReferralCustomerResult> {
  const startTime = Date.now();
  const operationId = `update-customer-${customerUid}-${Date.now()}`;

  try {
    logger.info(`[ReferralCustomerService] Starting customer update:`, {
      operationId,
      customerUid,
      updates: Object.keys(updates)
    });

    // Find customer records for this UID
    const customerQuery = db.collection('referralCustomers')
      .where('customerUid', '==', customerUid);

    const snapshot = await customerQuery.get();

    if (snapshot.empty) {
      const error = `No referral customer found for UID: ${customerUid}`;
      logger.warn(`[ReferralCustomerService] Update failed:`, { operationId, error });
      return {
        success: false,
        message: error,
        messageKey: 'referral.customer.error.notFound'
      };
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      lastActivity: updates.lastActivity || Timestamp.now()
    };

    // Update all customer records for this UID (in case of multiple partners)
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, updateData);
      updatedCount++;
    });

    await batch.commit();

    const processingTime = Date.now() - startTime;

    logger.info(`[ReferralCustomerService] Customer updated successfully in ${processingTime}ms:`, {
      operationId,
      customerUid,
      updatedRecords: updatedCount,
      updates: Object.keys(updates)
    });

    return {
      success: true,
      message: `Updated ${updatedCount} customer record(s)`,
      messageKey: 'referral.customer.success.updated',
      data: updateData
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error(`[ReferralCustomerService] Error updating customer in ${processingTime}ms:`, {
      operationId,
      customerUid,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      message: 'Failed to update referral customer',
      messageKey: 'referral.customer.error.updateFailed'
    };
  }
}

/**
 * Get referral customer statistics for a partner
 * 
 * @param partnerId - Partner ID to get statistics for
 * @returns Promise with customer statistics
 */
export async function getPartnerCustomerStats(partnerId: string): Promise<{
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnedCustomers: number;
  totalSpent: number;
  averageSpent: number;
  recentCustomers: ReferralCustomerData[];
}> {
  try {
    const customersQuery = db.collection('referralCustomers')
      .where('partnerId', '==', partnerId);

    const snapshot = await customersQuery.get();
    const customers = snapshot.docs.map(doc => doc.data() as ReferralCustomerData);

    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
      churnedCustomers: customers.filter(c => c.status === 'churned').length,
      totalSpent: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      averageSpent: 0,
      recentCustomers: customers
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 10)
    };

    stats.averageSpent = stats.totalCustomers > 0 ? stats.totalSpent / stats.totalCustomers : 0;

    return stats;

  } catch (error) {
    logger.error(`[ReferralCustomerService] Error getting customer stats:`, {
      partnerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      churnedCustomers: 0,
      totalSpent: 0,
      averageSpent: 0,
      recentCustomers: []
    };
  }
}