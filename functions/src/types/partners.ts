/**
 * Partner Types and Interfaces
 * 
 * Defines the structure for partner accounts, codes, and related data
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Partner status options
 */
export type PartnerStatus = 'pending' | 'approved' | 'inactive' | 'suspended' | 'rejected' | 'terminated';

/**
 * Commission rate options (as decimals)
 */
export const COMMISSION_RATE_OPTIONS = [0.4, 0.5, 0.6, 0.7] as const;
export const DEFAULT_COMMISSION_RATE = 0.6;

/**
 * Partner account interface
 */
export interface Partner {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  commissionRate: number;
  status: PartnerStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  approvedAt?: Timestamp | Date;
  rejectedAt?: Timestamp | Date;
  rejectionReason?: string;
  description?: string;
  marketingPreferences?: {
    emailMarketing?: boolean;
    smsMarketing?: boolean;
    partnerNewsletter?: boolean;
  };
  stats: {
    totalReferrals: number;
    totalConversions: number;
    totalCommissionEarned: number;
    totalCommissionPaid: number;
    lastCalculated: Timestamp | Date;
  };
  registrationData?: {
    submittedAt: Timestamp | Date;
    ipAddress?: string;
    userAgent?: string;
    source: 'admin_created' | 'public_registration';
  };
}

/**
 * Partner code interface
 */
export interface PartnerCode {
  code: string;
  partnerId: string;
  active: boolean;
  uses: number;
  maxUses?: number;
  description?: string;
  customCommissionRate?: number;
  expiresAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  lastUsedAt?: Timestamp | Date;
}

/**
 * Referral Collection Interface
 * Collection: referrals/{referralId}
 * 
 * Tracks individual referral events and their conversion status
 */
export interface Referral {
  /** ID of the partner who made the referral */
  partnerId: string;
  
  /** The referral code that was used */
  code: string;
  
  /** Firebase Auth UID of the referred customer (if they signed up) */
  customerUid?: string;
  
  /** Stripe customer ID (if they became a paying customer) */
  stripeCustomerId?: string;
  
  /** Stripe subscription ID (if they subscribed) */
  stripeSubscriptionId?: string;
  
  /** The plan they subscribed to (if applicable) */
  planId?: string;
  
  /** Currency of the transaction */
  currency: string;
  
  /** When the referral was created (first click/visit) */
  createdAt: Timestamp;
  
  /** How this referral was generated */
  source: 'link' | 'manual' | 'promotion_code' | 'widget';
  
  /** Optional: When the referral converted to a customer */
  convertedAt?: Timestamp;
  
  /** Optional: When the customer first subscribed */
  subscribedAt?: Timestamp;
  
  /** Optional: IP address for fraud prevention */
  ipAddress?: string;
  
  /** Optional: User agent for analytics */
  userAgent?: string;
  
  /** Optional: UTM parameters for tracking */
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  
  /** Optional: Additional metadata for tracking */
  metadata?: {
    /** Page where the referral originated */
    referrerUrl?: string;
    
    /** Landing page the user visited */
    landingPage?: string;
    
    /** Country code from IP geolocation */
    country?: string;
    
    /** Device type (mobile, desktop, tablet) */
    deviceType?: string;
  };
}

/**
 * Commission Ledger Collection Interface
 * Collection: commission_ledger/{entryId}
 * 
 * Tracks commission calculations and payment status
 */
export interface CommissionLedgerEntry {
  /** ID of the partner earning the commission */
  partnerId: string;
  
  /** ID of the referral that generated this commission */
  referralId: string;
  
  /** Stripe invoice ID that triggered the commission */
  stripeInvoiceId: string;
  
  /** Stripe subscription ID for recurring commissions */
  stripeSubscriptionId: string;
  
  /** Gross amount of the invoice (in cents) */
  amountGross: number;
  
  /** Commission rate applied (0.0 to 1.0) */
  commissionRate: number;
  
  /** Calculated commission amount (in cents) */
  commissionAmount: number;
  
  /** Currency of the transaction */
  currency: string;
  
  /** Start of the billing period */
  periodStart: Timestamp;
  
  /** End of the billing period */
  periodEnd: Timestamp;
  
  /** Current status of the commission */
  status: 'accrued' | 'reversed' | 'paid';
  
  /** When the commission entry was created */
  createdAt: Timestamp;
  
  /** Optional: When the commission was paid out */
  paidAt?: Timestamp;
  
  /** Optional: Payment transaction ID */
  paymentTransactionId?: string;
  
  /** Optional: Reason for reversal */
  reversalReason?: string;
  
  /** Optional: When the commission was reversed */
  reversedAt?: Timestamp;
  
  /** Optional: Additional Stripe metadata */
  stripeMetadata?: {
    /** Invoice status at time of commission calculation */
    invoiceStatus: string;
    
    /** Subscription status at time of commission calculation */
    subscriptionStatus: string;
    
    /** Customer ID for reference */
    customerId: string;
    
    /** Plan/price ID */
    priceId?: string;
  };
  
  /** Optional: Tax information for reporting */
  taxInfo?: {
    /** Whether tax was included in the gross amount */
    taxInclusive: boolean;
    
    /** Tax amount (in cents) if applicable */
    taxAmount?: number;
    
    /** Tax rate applied */
    taxRate?: number;
  };
}

/**
 * Partner Dashboard Statistics Interface
 * Used for real-time dashboard updates
 */
export interface PartnerDashboardStats {
  /** Current period statistics */
  currentPeriod: {
    /** Start date of current period */
    startDate: Timestamp;
    
    /** End date of current period */
    endDate: Timestamp;
    
    /** Number of referrals in current period */
    referrals: number;
    
    /** Number of conversions in current period */
    conversions: number;
    
    /** Conversion rate percentage */
    conversionRate: number;
    
    /** Total commission earned in current period (in cents) */
    commissionEarned: number;
    
    /** Top performing referral codes */
    topCodes: Array<{
      code: string;
      referrals: number;
      conversions: number;
    }>;
  };
  
  /** Lifetime statistics */
  lifetime: {
    /** Total referrals ever generated */
    totalReferrals: number;
    
    /** Total successful conversions */
    totalConversions: number;
    
    /** Overall conversion rate */
    conversionRate: number;
    
    /** Total commission earned (in cents) */
    totalEarned: number;
    
    /** Total commission paid out (in cents) */
    totalPaid: number;
    
    /** Pending commission amount (in cents) */
    pendingAmount: number;
  };
  
  /** Recent activity for dashboard feed */
  recentActivity: Array<{
    /** Type of activity */
    type: 'referral' | 'conversion' | 'commission' | 'payment';
    
    /** Activity timestamp */
    timestamp: Timestamp;
    
    /** Activity description */
    description: string;
    
    /** Amount involved (if applicable, in cents) */
    amount?: number;
    
    /** Currency */
    currency?: string;
  }>;
}

/**
 * Partner Payout Request Interface
 * For managing commission payouts
 */
export interface PayoutRequest {
  /** Partner requesting the payout */
  partnerId: string;
  
  /** Requested payout amount (in cents) */
  amount: number;
  
  /** Currency of the payout */
  currency: string;
  
  /** Commission ledger entries included in this payout */
  includedEntries: string[];
  
  /** Status of the payout request */
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  /** When the payout was requested */
  requestedAt: Timestamp;
  
  /** Optional: When the payout was processed */
  processedAt?: Timestamp;
  
  /** Optional: Payment provider transaction ID */
  transactionId?: string;
  
  /** Optional: Failure reason */
  failureReason?: string;
  
  /** Optional: Admin notes */
  adminNotes?: string;
}

/**
 * Utility type for partner creation
 */
export interface CreatePartnerRequest {
  uid?: string; // Optional - if not provided, will create new user
  email: string;
  displayName: string;
  commissionRate?: number;
  companyName?: string;
  website?: string;
  marketingPreferences?: Partner['marketingPreferences'];
  password?: string; // Optional - required when creating new user
}

/**
 * Utility type for partner registration
 */
export interface RegisterPartnerRequest {
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  commissionRate?: number;
  description?: string;
  marketingPreferences?: Partner['marketingPreferences'];
}

/**
 * Utility type for referral creation
 */
export interface CreateReferralRequest {
  partnerId: string;
  code: string;
  source: 'link' | 'manual' | 'promotion_code' | 'widget';
  ipAddress?: string;
  userAgent?: string;
  utmParams?: Referral['utmParams'];
  metadata?: Referral['metadata'];
}

/**
 * Utility type for commission calculation
 */
export interface CalculateCommissionRequest {
  partnerId: string;
  referralId: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string;
  amountGross: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Localization keys for partner system
 * These should be added to the i18n translation files
 */
export const PARTNER_I18N_KEYS = {
  // Partner status labels
  status: {
    pending: 'partner.status.pending',
    active: 'partner.status.active',
    suspended: 'partner.status.suspended',
    inactive: 'partner.status.inactive',
    terminated: 'partner.status.terminated',
  },
  
  // Commission status labels
  commission: {
    accrued: 'partner.commission.accrued',
    reversed: 'partner.commission.reversed',
    paid: 'partner.commission.paid',
  },
  
  // Referral source labels
  source: {
    link: 'partner.source.link',
    manual: 'partner.source.manual',
    promotion_code: 'partner.source.promotion_code',
    widget: 'partner.source.widget',
  },
  
  // Dashboard labels
  dashboard: {
    title: 'partner.dashboard.title',
    stats: 'partner.dashboard.stats',
    earnings: 'partner.dashboard.earnings',
    referrals: 'partner.dashboard.referrals',
    conversions: 'partner.dashboard.conversions',
    conversionRate: 'partner.dashboard.conversionRate',
    pendingCommission: 'partner.dashboard.pendingCommission',
    totalEarned: 'partner.dashboard.totalEarned',
  }
} as const;

// Constants and enums are already exported above, no need for additional exports
