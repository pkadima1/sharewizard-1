/**
 * Referral Commission Processing System
 * 
 * Handles commission calculation, storage, and partner notifications
 * when users complete purchases through referral links.
 */

import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";

// Initialize Firestore
const db = getFirestore();

/**
 * Commission rates for different partner tiers (percentage as decimal)
 * Updated to match the new partner system structure
 */
const COMMISSION_RATES = {
  basic: 0.70,     // 70% commission for basic partners
  standard: 0.70,  // 70% commission for standard partners  
  certified: 0.70, // 70% commission for certified partners
  // Legacy rates for backward compatibility
  premium: 0.15,   // 15% commission
  enterprise: 0.20 // 20% commission
} as const;

/**
 * Interface for commission calculation result
 */
export interface CommissionCalculation {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  partnerId: string;
  referralCode: string;
}

/**
 * Interface for commission record in Firestore
 */
export interface CommissionRecord {
  id: string;
  partnerId: string;
  referralCode: string;
  customerId: string;
  subscriptionId?: string;
  paymentIntentId?: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  purchaseType: 'subscription' | 'one_time';
  productType?: string;
  quantity?: number;
  createdAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, string>;
}

/**
 * Calculate commission amount based on partner tier and purchase amount
 * 
 * @param partnerId - Partner ID to lookup commission rate
 * @param grossAmount - Gross purchase amount in cents
 * @param currency - Currency code (e.g., 'usd', 'gbp')
 * @param referralCode - Referral code used
 * @returns Commission calculation details
 */
export async function calculateCommission(
  partnerId: string,
  grossAmount: number,
  currency: string,
  referralCode: string
): Promise<CommissionCalculation | null> {
  try {
    // Get partner data to determine commission rate
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    
    if (!partnerDoc.exists) {
      logger.warn(`Partner not found for commission calculation: ${partnerId}`);
      return null;
    }
    
    const partnerData = partnerDoc.data()!;
    
    // Use partner's commission rate from the new system
    let commissionRate = partnerData.commissionRate;
    
    // Fallback to tier-based rate if commissionRate is not set
    if (!commissionRate) {
      const tier = partnerData.tier || 'standard';
      commissionRate = COMMISSION_RATES[tier as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.standard;
    }
    
    // Calculate commission amount (rounded to nearest cent)
    const commissionAmount = Math.round(grossAmount * commissionRate);
    
    return {
      grossAmount,
      commissionRate,
      commissionAmount,
      currency,
      partnerId,
      referralCode
    };
    
  } catch (error) {
    logger.error('Error calculating commission:', error);
    return null;
  }
}

/**
 * Record commission in Firestore for tracking and payment processing
 * 
 * @param calculation - Commission calculation result
 * @param checkoutSession - Stripe checkout session data
 * @returns Commission record ID if successful, null if failed
 */
export async function recordCommission(
  calculation: CommissionCalculation,
  checkoutSession: Stripe.Checkout.Session
): Promise<string | null> {
  try {
    const metadata = checkoutSession.metadata || {};
    
    // Create commission record
    const commissionRecord: Omit<CommissionRecord, 'id'> = {
      partnerId: calculation.partnerId,
      referralCode: calculation.referralCode,
      customerId: checkoutSession.customer as string,
      subscriptionId: checkoutSession.subscription as string || undefined,
      paymentIntentId: checkoutSession.payment_intent as string || undefined,
      grossAmount: calculation.grossAmount,
      commissionRate: calculation.commissionRate,
      commissionAmount: calculation.commissionAmount,
      currency: calculation.currency,
      status: 'pending',
      purchaseType: checkoutSession.mode === 'subscription' ? 'subscription' : 'one_time',
      productType: metadata.product_type,
      quantity: metadata.quantity ? parseInt(metadata.quantity, 10) : undefined,
      createdAt: new Date(),
      metadata: {
        stripeCustomerId: checkoutSession.customer as string,
        stripeSessionId: checkoutSession.id,
        checkoutType: metadata.checkout_type || 'unknown',
        partnerName: metadata.partnerName || 'Unknown Partner',
        partnerEmail: metadata.partnerEmail || '',
        userAgent: metadata.user_agent || '',
        sourceUrl: metadata.source_url || ''
      }
    };
    
    // Store in Firestore
    const docRef = await db.collection('commissions').add(commissionRecord);
    
    logger.info('Commission recorded successfully:', {
      commissionId: docRef.id,
      partnerId: calculation.partnerId,
      referralCode: calculation.referralCode,
      commissionAmount: calculation.commissionAmount,
      currency: calculation.currency
    });
    
    // Update partner statistics
    await updatePartnerStatistics(calculation.partnerId, calculation.commissionAmount, calculation.currency);
    
    return docRef.id;
    
  } catch (error) {
    logger.error('Error recording commission:', error);
    return null;
  }
}

/**
 * Update partner statistics with new commission
 * 
 * @param partnerId - Partner ID
 * @param commissionAmount - Commission amount in cents
 * @param currency - Currency code
 */
async function updatePartnerStatistics(
  partnerId: string,
  commissionAmount: number,
  currency: string
): Promise<void> {
  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    
    // Use a transaction to safely update statistics
    await db.runTransaction(async (transaction) => {
      const partnerDoc = await transaction.get(partnerRef);
      
      if (!partnerDoc.exists) {
        logger.warn(`Partner not found for statistics update: ${partnerId}`);
        return;
      }
      
      const partnerData = partnerDoc.data()!;
      const stats = partnerData.stats || {};
      
      // Update total earnings and referral count using the new stats structure
      const currentEarnings = stats.totalCommissionEarned || 0;
      const currentReferrals = stats.totalReferrals || 0;
      const currentConversions = stats.totalConversions || 0;
      
      transaction.update(partnerRef, {
        'stats.totalCommissionEarned': currentEarnings + commissionAmount,
        'stats.totalReferrals': currentReferrals + 1,
        'stats.totalConversions': currentConversions + 1, // Increment conversions on commission
        'stats.lastCalculated': admin.firestore.Timestamp.now(),
        'updatedAt': admin.firestore.Timestamp.now()
      });
    });
    
    logger.info('Partner statistics updated:', {
      partnerId,
      commissionAmount,
      currency
    });
    
  } catch (error) {
    logger.error('Error updating partner statistics:', error);
  }
}

/**
 * Process referral commission for a completed checkout session
 * This is the main entry point called from webhook handlers
 * 
 * @param checkoutSession - Stripe checkout session
 * @returns Commission record ID if processed, null otherwise
 */
export async function processReferralCommission(
  checkoutSession: Stripe.Checkout.Session
): Promise<string | null> {
  try {
    const metadata = checkoutSession.metadata || {};
    const referralCode = metadata.referralCode;
    const partnerId = metadata.partnerId;
    
    // Only process if we have referral information
    if (!referralCode || !partnerId) {
      logger.info('No referral information in checkout session, skipping commission processing');
      return null;
    }
    
    // Get gross amount (Stripe amounts are in cents)
    const grossAmount = checkoutSession.amount_total || 0;
    const currency = checkoutSession.currency || 'usd';
    
    if (grossAmount <= 0) {
      logger.warn('Invalid gross amount for commission calculation:', grossAmount);
      return null;
    }
    
    // Calculate commission
    const calculation = await calculateCommission(partnerId, grossAmount, currency, referralCode);
    
    if (!calculation) {
      logger.warn('Failed to calculate commission for partner:', partnerId);
      return null;
    }
    
    // Record commission
    const commissionId = await recordCommission(calculation, checkoutSession);
    
    if (commissionId) {
      logger.info('Referral commission processed successfully:', {
        commissionId,
        partnerId,
        referralCode,
        grossAmount,
        commissionAmount: calculation.commissionAmount,
        currency
      });
    }
    
    return commissionId;
    
  } catch (error) {
    logger.error('Error processing referral commission:', error);
    return null;
  }
}

/**
 * Mark commission as paid (for future admin interface)
 * 
 * @param commissionId - Commission record ID
 * @returns Success status
 */
export async function markCommissionAsPaid(commissionId: string): Promise<boolean> {
  try {
    await db.collection('commissions').doc(commissionId).update({
      status: 'paid',
      paidAt: new Date()
    });
    
    logger.info('Commission marked as paid:', commissionId);
    return true;
    
  } catch (error) {
    logger.error('Error marking commission as paid:', error);
    return false;
  }
}

/**
 * Cancel commission (for refunds/cancellations)
 * 
 * @param commissionId - Commission record ID
 * @returns Success status
 */
export async function cancelCommission(commissionId: string): Promise<boolean> {
  try {
    await db.collection('commissions').doc(commissionId).update({
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    logger.info('Commission cancelled:', commissionId);
    return true;
    
  } catch (error) {
    logger.error('Error cancelling commission:', error);
    return false;
  }
}
