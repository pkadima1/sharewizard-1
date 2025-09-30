/**
 * Conversion Tracking System Types
 * 
 * Handles comprehensive conversion tracking from signup to payment
 * for partner referral attribution and analytics.
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Conversion Tracking Collection Interface
 * Collection: conversionTracking/{conversionId}
 * 
 * Tracks the complete user journey from referral link to payment
 */
export interface ConversionTracking {
  /** ID of the partner who made the referral */
  partnerId: string;
  
  /** The referral code that was used */
  referralCode: string;
  
  /** Firebase Auth UID of the referred customer */
  customerUid: string;
  
  /** Stripe customer ID (if they became a paying customer) */
  stripeCustomerId?: string;
  
  /** Stripe subscription ID (if they subscribed) */
  stripeSubscriptionId?: string;
  
  /** The plan they subscribed to (if applicable) */
  planId?: string;
  
  /** Currency of the transaction */
  currency: string;
  
  /** When the referral was first captured (link visit) */
  referralCapturedAt: Timestamp;
  
  /** When the user signed up */
  signupAt: Timestamp;
  
  /** When the user first made a payment (conversion) */
  convertedAt?: Timestamp;
  
  /** When the user first subscribed (if applicable) */
  subscribedAt?: Timestamp;
  
  /** Conversion status */
  status: 'signup' | 'converted' | 'subscribed' | 'churned';
  
  /** Conversion value in cents */
  conversionValue?: number;
  
  /** Commission earned from this conversion */
  commissionEarned?: number;
  
  /** Commission rate applied */
  commissionRate?: number;
  
  /** How this referral was generated */
  source: 'link' | 'manual' | 'promotion_code' | 'widget';
  
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
  
  /** Timestamps for tracking */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Conversion Analytics Interface
 * 
 * Aggregated conversion data for partner dashboards
 */
export interface ConversionAnalytics {
  /** Partner ID */
  partnerId: string;
  
  /** Time period for analytics */
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  
  /** Total referrals in period */
  totalReferrals: number;
  
  /** Total signups in period */
  totalSignups: number;
  
  /** Total conversions in period */
  totalConversions: number;
  
  /** Total subscriptions in period */
  totalSubscriptions: number;
  
  /** Conversion rate (conversions / signups) */
  conversionRate: number;
  
  /** Subscription rate (subscriptions / conversions) */
  subscriptionRate: number;
  
  /** Total conversion value in cents */
  totalConversionValue: number;
  
  /** Total commission earned in cents */
  totalCommissionEarned: number;
  
  /** Average conversion value in cents */
  averageConversionValue: number;
  
  /** Average commission per conversion in cents */
  averageCommissionPerConversion: number;
  
  /** Conversion funnel data */
  funnel: {
    referrals: number;
    signups: number;
    conversions: number;
    subscriptions: number;
  };
  
  /** Time to conversion (average days from signup to first payment) */
  averageTimeToConversion?: number;
  
  /** Time to subscription (average days from conversion to subscription) */
  averageTimeToSubscription?: number;
}

/**
 * Conversion Funnel Step Interface
 * 
 * Represents a step in the conversion funnel
 */
export interface ConversionFunnelStep {
  step: 'referral' | 'signup' | 'conversion' | 'subscription';
  count: number;
  percentage: number;
  averageTimeToNext?: number; // in days
}

/**
 * Partner Conversion Summary Interface
 * 
 * High-level conversion summary for partner dashboard
 */
export interface PartnerConversionSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  
  /** Current period stats */
  currentPeriod: {
    referrals: number;
    signups: number;
    conversions: number;
    subscriptions: number;
    conversionRate: number;
    subscriptionRate: number;
    totalValue: number;
    totalCommission: number;
  };
  
  /** Historical stats */
  historical: {
    totalReferrals: number;
    totalSignups: number;
    totalConversions: number;
    totalSubscriptions: number;
    lifetimeConversionRate: number;
    lifetimeSubscriptionRate: number;
    totalLifetimeValue: number;
    totalLifetimeCommission: number;
  };
  
  /** Recent activity */
  recentActivity: ConversionTracking[];
  
  /** Performance trends */
  trends: {
    conversionRateTrend: 'up' | 'down' | 'stable';
    subscriptionRateTrend: 'up' | 'down' | 'stable';
    valueTrend: 'up' | 'down' | 'stable';
  };
}



