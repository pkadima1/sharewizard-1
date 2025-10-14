/**
 * Enhanced Commission Tracking System
 * 
 * Handles comprehensive commission tracking, calculation, and partner statistics
 * integration with the new partner system structure.
 * 
 * Features:
 * - Real-time commission calculation
 * - Partner statistics updates
 * - Commission ledger management
 * - Referral attribution tracking
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  Partner, 
  CommissionLedgerEntry,
  DEFAULT_COMMISSION_RATE 
} from "../types/partners.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

/**
 * Interface for commission calculation result
 */
export interface CommissionCalculationResult {
  partnerId: string;
  referralId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: 'calculated' | 'accrued' | 'paid' | 'reversed';
  calculatedAt: Timestamp;
}

/**
 * Interface for partner statistics update
 */
export interface PartnerStatsUpdate {
  totalReferrals: number;
  totalConversions: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  lastCalculated: Timestamp;
}

/**
 * Calculate commission for a referral
 * 
 * @param partnerId - Partner ID
 * @param grossAmount - Gross amount in cents
 * @param currency - Currency code
 * @param referralId - Referral ID for tracking
 * @returns Commission calculation result
 */
export async function calculateCommission(
  partnerId: string,
  grossAmount: number,
  currency: string,
  referralId: string
): Promise<CommissionCalculationResult | null> {
  try {
    // Get partner data
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      logger.warn(`[CommissionTracking] Partner not found: ${partnerId}`);
      return null;
    }
    
    const partnerData = partnerDoc.data() as Partner;
    
    // Use partner's commission rate or default
    const commissionRate = partnerData.commissionRate || DEFAULT_COMMISSION_RATE;
    
    // Calculate commission amount (rounded to nearest cent)
    const commissionAmount = Math.round(grossAmount * commissionRate);
    
    const result: CommissionCalculationResult = {
      partnerId,
      referralId,
      grossAmount,
      commissionRate,
      commissionAmount,
      currency,
      status: 'calculated',
      calculatedAt: Timestamp.now()
    };
    
    logger.info(`[CommissionTracking] Commission calculated:`, {
      partnerId,
      referralId,
      grossAmount,
      commissionRate,
      commissionAmount,
      currency
    });
    
    return result;
    
  } catch (error) {
    logger.error(`[CommissionTracking] Error calculating commission:`, error);
    return null;
  }
}

/**
 * Create commission ledger entry
 * 
 * @param calculation - Commission calculation result
 * @param stripeInvoiceId - Stripe invoice ID
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param periodStart - Billing period start
 * @param periodEnd - Billing period end
 * @returns Commission ledger entry ID
 */
export async function createCommissionLedgerEntry(
  calculation: CommissionCalculationResult,
  stripeInvoiceId: string,
  stripeSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<string | null> {
  try {
    const ledgerEntryId = `${stripeInvoiceId}_${calculation.partnerId}`;
    const ledgerRef = db.collection('commission_ledger').doc(ledgerEntryId);
    
    // Check if entry already exists (idempotency)
    const existingEntry = await ledgerRef.get();
    if (existingEntry.exists) {
      logger.info(`[CommissionTracking] Commission ledger entry already exists: ${ledgerEntryId}`);
      return ledgerEntryId;
    }
    
    const ledgerEntry: CommissionLedgerEntry = {
      partnerId: calculation.partnerId,
      referralId: calculation.referralId,
      stripeInvoiceId,
      stripeSubscriptionId,
      amountGross: calculation.grossAmount,
      commissionRate: calculation.commissionRate,
      commissionAmount: calculation.commissionAmount,
      currency: calculation.currency,
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      status: 'accrued',
      createdAt: Timestamp.now(),
      
      // Additional metadata
      stripeMetadata: {
        invoiceStatus: 'paid',
        subscriptionStatus: 'active',
        customerId: '', // Will be filled by webhook
        priceId: '' // Will be filled by webhook
      }
    };
    
    await ledgerRef.set(ledgerEntry);
    
    logger.info(`[CommissionTracking] Commission ledger entry created:`, {
      ledgerEntryId,
      partnerId: calculation.partnerId,
      commissionAmount: calculation.commissionAmount,
      currency: calculation.currency
    });
    
    return ledgerEntryId;
    
  } catch (error) {
    logger.error(`[CommissionTracking] Error creating commission ledger entry:`, error);
    return null;
  }
}

/**
 * Update partner statistics with new commission
 * 
 * @param partnerId - Partner ID
 * @param commissionAmount - Commission amount in cents
 * @param isConversion - Whether this is a new conversion
 * @returns Success status
 */
export async function updatePartnerStatistics(
  partnerId: string,
  commissionAmount: number,
  isConversion: boolean = true
): Promise<boolean> {
  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    
    await db.runTransaction(async (transaction) => {
      const partnerDoc = await transaction.get(partnerRef);
      
      if (!partnerDoc.exists) {
        logger.warn(`[CommissionTracking] Partner not found for statistics update: ${partnerId}`);
        return;
      }
      
      const partnerData = partnerDoc.data() as Partner;
      const stats = partnerData.stats || {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: Timestamp.now()
      };
      
      // Update statistics
      const updatedStats: PartnerStatsUpdate = {
        totalReferrals: stats.totalReferrals,
        totalConversions: isConversion ? stats.totalConversions + 1 : stats.totalConversions,
        totalCommissionEarned: stats.totalCommissionEarned + commissionAmount,
        totalCommissionPaid: stats.totalCommissionPaid, // Will be updated when paid
        lastCalculated: Timestamp.now()
      };
      
      transaction.update(partnerRef, {
        'stats': updatedStats,
        'updatedAt': Timestamp.now()
      });
    });
    
    logger.info(`[CommissionTracking] Partner statistics updated:`, {
      partnerId,
      commissionAmount,
      isConversion
    });
    
    return true;
    
  } catch (error) {
    logger.error(`[CommissionTracking] Error updating partner statistics:`, error);
    return false;
  }
}

/**
 * Process commission for a completed purchase
 * 
 * @param partnerId - Partner ID
 * @param referralId - Referral ID
 * @param grossAmount - Gross amount in cents
 * @param currency - Currency code
 * @param stripeInvoiceId - Stripe invoice ID
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param periodStart - Billing period start
 * @param periodEnd - Billing period end
 * @returns Commission ledger entry ID
 */
export async function processCommission(
  partnerId: string,
  referralId: string,
  grossAmount: number,
  currency: string,
  stripeInvoiceId: string,
  stripeSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<string | null> {
  try {
    // Step 1: Calculate commission
    const calculation = await calculateCommission(
      partnerId,
      grossAmount,
      currency,
      referralId
    );
    
    if (!calculation) {
      logger.warn(`[CommissionTracking] Failed to calculate commission for partner: ${partnerId}`);
      return null;
    }
    
    // Step 2: Create commission ledger entry
    const ledgerEntryId = await createCommissionLedgerEntry(
      calculation,
      stripeInvoiceId,
      stripeSubscriptionId,
      periodStart,
      periodEnd
    );
    
    if (!ledgerEntryId) {
      logger.warn(`[CommissionTracking] Failed to create commission ledger entry for partner: ${partnerId}`);
      return null;
    }
    
    // Step 3: Update partner statistics
    const statsUpdated = await updatePartnerStatistics(
      partnerId,
      calculation.commissionAmount,
      true // This is a conversion
    );
    
    if (!statsUpdated) {
      logger.warn(`[CommissionTracking] Failed to update partner statistics for partner: ${partnerId}`);
      // Don't fail the entire process for this
    }
    
    logger.info(`[CommissionTracking] Commission processed successfully:`, {
      partnerId,
      referralId,
      ledgerEntryId,
      commissionAmount: calculation.commissionAmount,
      currency
    });
    
    return ledgerEntryId;
    
  } catch (error) {
    logger.error(`[CommissionTracking] Error processing commission:`, error);
    return null;
  }
}

/**
 * Get partner commission summary
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
  recentEntries: CommissionLedgerEntry[];
} | null> {
  try {
    let query = db.collection('commission_ledger')
      .where('partnerId', '==', partnerId);
    
    if (startDate && endDate) {
      query = query
        .where('createdAt', '>=', Timestamp.fromDate(startDate))
        .where('createdAt', '<=', Timestamp.fromDate(endDate));
    }
    
    const snapshot = await query.get();
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (CommissionLedgerEntry & { id: string })[];
    
    const totalCommissions = entries.length;
    const totalEarned = entries
      .filter(entry => entry.status === 'accrued' || entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.commissionAmount, 0);
    const totalPaid = entries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.commissionAmount, 0);
    const pendingAmount = totalEarned - totalPaid;
    
    // Get recent entries (last 10)
    const recentEntries = entries
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 10);
    
    return {
      totalCommissions,
      totalEarned,
      totalPaid,
      pendingAmount,
      recentEntries
    };
    
  } catch (error) {
    logger.error(`[CommissionTracking] Error getting partner commission summary:`, error);
    return null;
  }
}
