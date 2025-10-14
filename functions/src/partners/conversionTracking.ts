/**
 * Conversion Tracking System
 * 
 * Handles comprehensive conversion tracking from signup to payment
 * for partner referral attribution and analytics.
 * 
 * Features:
 * - Track user journey from referral to conversion
 * - Calculate conversion rates and analytics
 * - Generate partner performance reports
 * - Monitor conversion funnel performance
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  ConversionTracking, 
  ConversionAnalytics, 
  ConversionFunnelStep,
  PartnerConversionSummary 
} from "../types/conversionTracking.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

/**
 * Create conversion tracking entry for new signup
 * 
 * @param partnerId - Partner ID
 * @param referralCode - Referral code used
 * @param customerUid - Customer UID
 * @param metadata - Additional tracking metadata
 * @returns Conversion tracking ID
 */
export async function createConversionTracking(
  partnerId: string,
  referralCode: string,
  customerUid: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    utmParams?: any;
    referrerUrl?: string;
    landingPage?: string;
    country?: string;
    deviceType?: string;
  }
): Promise<string | null> {
  try {
    const conversionId = `conv_${customerUid}_${Date.now()}`;
    const conversionRef = db.collection('conversionTracking').doc(conversionId);
    
    const conversionData: ConversionTracking = {
      partnerId,
      referralCode,
      customerUid,
      currency: 'USD', // Default currency
      referralCapturedAt: Timestamp.now(),
      signupAt: Timestamp.now(),
      status: 'signup',
      source: 'link',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      utmParams: metadata?.utmParams,
      metadata: {
        referrerUrl: metadata?.referrerUrl,
        landingPage: metadata?.landingPage,
        country: metadata?.country,
        deviceType: metadata?.deviceType
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await conversionRef.set(conversionData);
    
    logger.info(`[ConversionTracking] Conversion tracking created:`, {
      conversionId,
      partnerId,
      referralCode,
      customerUid
    });
    
    return conversionId;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error creating conversion tracking:`, error);
    return null;
  }
}

/**
 * Update conversion tracking when user makes first payment
 * 
 * @param customerUid - Customer UID
 * @param stripeCustomerId - Stripe customer ID
 * @param conversionValue - Conversion value in cents
 * @param currency - Currency code
 * @returns Success status
 */
export async function markConversion(
  customerUid: string,
  stripeCustomerId: string,
  conversionValue: number,
  currency: string
): Promise<boolean> {
  try {
    // Find conversion tracking by customer UID
    const conversionQuery = db.collection('conversionTracking')
      .where('customerUid', '==', customerUid)
      .where('status', '==', 'signup')
      .limit(1);
    
    const conversionSnapshot = await conversionQuery.get();
    
    if (conversionSnapshot.empty) {
      logger.warn(`[ConversionTracking] No conversion tracking found for customer: ${customerUid}`);
      return false;
    }
    
    const conversionDoc = conversionSnapshot.docs[0];
    const conversionData = conversionDoc.data() as ConversionTracking;
    
    // Calculate commission
    const commissionRate = conversionData.commissionRate || 0.7; // Default 70%
    const commissionEarned = Math.round(conversionValue * commissionRate);
    
    // Update conversion tracking
    await conversionDoc.ref.update({
      stripeCustomerId,
      convertedAt: Timestamp.now(),
      status: 'converted',
      conversionValue,
      commissionEarned,
      commissionRate,
      currency,
      updatedAt: Timestamp.now()
    });
    
    logger.info(`[ConversionTracking] Conversion marked:`, {
      customerUid,
      stripeCustomerId,
      conversionValue,
      commissionEarned,
      currency
    });
    
    return true;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error marking conversion:`, error);
    return false;
  }
}

/**
 * Update conversion tracking when user subscribes
 * 
 * @param customerUid - Customer UID
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param planId - Plan ID
 * @returns Success status
 */
export async function markSubscription(
  customerUid: string,
  stripeSubscriptionId: string,
  planId: string
): Promise<boolean> {
  try {
    // Find conversion tracking by customer UID
    const conversionQuery = db.collection('conversionTracking')
      .where('customerUid', '==', customerUid)
      .where('status', 'in', ['converted', 'subscribed'])
      .limit(1);
    
    const conversionSnapshot = await conversionQuery.get();
    
    if (conversionSnapshot.empty) {
      logger.warn(`[ConversionTracking] No conversion tracking found for customer: ${customerUid}`);
      return false;
    }
    
    const conversionDoc = conversionSnapshot.docs[0];
    
    // Update conversion tracking
    await conversionDoc.ref.update({
      stripeSubscriptionId,
      planId,
      subscribedAt: Timestamp.now(),
      status: 'subscribed',
      updatedAt: Timestamp.now()
    });
    
    logger.info(`[ConversionTracking] Subscription marked:`, {
      customerUid,
      stripeSubscriptionId,
      planId
    });
    
    return true;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error marking subscription:`, error);
    return false;
  }
}

/**
 * Get conversion analytics for a partner
 * 
 * @param partnerId - Partner ID
 * @param startDate - Start date for analytics
 * @param endDate - End date for analytics
 * @returns Conversion analytics
 */
export async function getConversionAnalytics(
  partnerId: string,
  startDate: Date,
  endDate: Date
): Promise<ConversionAnalytics | null> {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    // Get all conversions for the partner in the period
    const conversionsQuery = db.collection('conversionTracking')
      .where('partnerId', '==', partnerId)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp);
    
    const conversionsSnapshot = await conversionsQuery.get();
    const conversions = conversionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (ConversionTracking & { id: string })[];
    
    // Calculate analytics
    const totalReferrals = conversions.length;
    const totalSignups = conversions.filter(c => c.status === 'signup' || c.status === 'converted' || c.status === 'subscribed').length;
    const totalConversions = conversions.filter(c => ['converted', 'subscribed'].includes(c.status)).length;
    const totalSubscriptions = conversions.filter(c => c.status === 'subscribed').length;
    
    const conversionRate = totalSignups > 0 ? totalConversions / totalSignups : 0;
    const subscriptionRate = totalConversions > 0 ? totalSubscriptions / totalConversions : 0;
    
    const totalConversionValue = conversions
      .filter(c => c.conversionValue)
      .reduce((sum, c) => sum + (c.conversionValue || 0), 0);
    
    const totalCommissionEarned = conversions
      .filter(c => c.commissionEarned)
      .reduce((sum, c) => sum + (c.commissionEarned || 0), 0);
    
    const averageConversionValue = totalConversions > 0 ? totalConversionValue / totalConversions : 0;
    const averageCommissionPerConversion = totalConversions > 0 ? totalCommissionEarned / totalConversions : 0;
    
    // Calculate time to conversion
    const conversionsWithTime = conversions.filter(c => c.convertedAt && c.signupAt);
    const averageTimeToConversion = conversionsWithTime.length > 0 
      ? conversionsWithTime.reduce((sum, c) => {
          const timeDiff = c.convertedAt!.toMillis() - c.signupAt.toMillis();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / conversionsWithTime.length
      : undefined;
    
    // Calculate time to subscription
    const subscriptionsWithTime = conversions.filter(c => c.subscribedAt && c.convertedAt);
    const averageTimeToSubscription = subscriptionsWithTime.length > 0 
      ? subscriptionsWithTime.reduce((sum, c) => {
          const timeDiff = c.subscribedAt!.toMillis() - c.convertedAt!.toMillis();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / subscriptionsWithTime.length
      : undefined;
    
    const analytics: ConversionAnalytics = {
      partnerId,
      period: {
        start: startTimestamp,
        end: endTimestamp
      },
      totalReferrals,
      totalSignups,
      totalConversions,
      totalSubscriptions,
      conversionRate,
      subscriptionRate,
      totalConversionValue,
      totalCommissionEarned,
      averageConversionValue,
      averageCommissionPerConversion,
      funnel: {
        referrals: totalReferrals,
        signups: totalSignups,
        conversions: totalConversions,
        subscriptions: totalSubscriptions
      },
      averageTimeToConversion,
      averageTimeToSubscription
    };
    
    return analytics;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error getting conversion analytics:`, error);
    return null;
  }
}

/**
 * Get partner conversion summary for dashboard
 * 
 * @param partnerId - Partner ID
 * @returns Partner conversion summary
 */
export async function getPartnerConversionSummary(
  partnerId: string
): Promise<PartnerConversionSummary | null> {
  try {
    // Get partner information
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      logger.warn(`[ConversionTracking] Partner not found: ${partnerId}`);
      return null;
    }
    
    const partnerData = partnerDoc.data()!;
    
    // Get current period (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const currentPeriodAnalytics = await getConversionAnalytics(partnerId, startDate, endDate);
    
    // Get historical data (all time)
    const historicalStartDate = new Date('2024-01-01'); // Start of tracking
    const historicalAnalytics = await getConversionAnalytics(partnerId, historicalStartDate, endDate);
    
    // Get recent activity (last 10 conversions)
    const recentActivityQuery = db.collection('conversionTracking')
      .where('partnerId', '==', partnerId)
      .orderBy('createdAt', 'desc')
      .limit(10);
    
    const recentActivitySnapshot = await recentActivityQuery.get();
    const recentActivity = recentActivitySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (ConversionTracking & { id: string })[];
    
    // Calculate trends (simplified - compare current period to previous period)
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - 60);
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - 30);
    
    const previousPeriodAnalytics = await getConversionAnalytics(partnerId, previousStartDate, previousEndDate);
    
    const trends = {
      conversionRateTrend: 'stable' as 'up' | 'down' | 'stable',
      subscriptionRateTrend: 'stable' as 'up' | 'down' | 'stable',
      valueTrend: 'stable' as 'up' | 'down' | 'stable'
    };
    
    if (currentPeriodAnalytics && previousPeriodAnalytics) {
      trends.conversionRateTrend = currentPeriodAnalytics.conversionRate > previousPeriodAnalytics.conversionRate ? 'up' : 
                                  currentPeriodAnalytics.conversionRate < previousPeriodAnalytics.conversionRate ? 'down' : 'stable';
      
      trends.subscriptionRateTrend = currentPeriodAnalytics.subscriptionRate > previousPeriodAnalytics.subscriptionRate ? 'up' : 
                                   currentPeriodAnalytics.subscriptionRate < previousPeriodAnalytics.subscriptionRate ? 'down' : 'stable';
      
      trends.valueTrend = currentPeriodAnalytics.averageConversionValue > previousPeriodAnalytics.averageConversionValue ? 'up' : 
                         currentPeriodAnalytics.averageConversionValue < previousPeriodAnalytics.averageConversionValue ? 'down' : 'stable';
    }
    
    const summary: PartnerConversionSummary = {
      partnerId,
      partnerName: partnerData.displayName,
      partnerEmail: partnerData.email,
      currentPeriod: currentPeriodAnalytics ? {
        referrals: currentPeriodAnalytics.totalReferrals,
        signups: currentPeriodAnalytics.totalSignups,
        conversions: currentPeriodAnalytics.totalConversions,
        subscriptions: currentPeriodAnalytics.totalSubscriptions,
        conversionRate: currentPeriodAnalytics.conversionRate,
        subscriptionRate: currentPeriodAnalytics.subscriptionRate,
        totalValue: currentPeriodAnalytics.totalConversionValue,
        totalCommission: currentPeriodAnalytics.totalCommissionEarned
      } : {
        referrals: 0,
        signups: 0,
        conversions: 0,
        subscriptions: 0,
        conversionRate: 0,
        subscriptionRate: 0,
        totalValue: 0,
        totalCommission: 0
      },
      historical: historicalAnalytics ? {
        totalReferrals: historicalAnalytics.totalReferrals,
        totalSignups: historicalAnalytics.totalSignups,
        totalConversions: historicalAnalytics.totalConversions,
        totalSubscriptions: historicalAnalytics.totalSubscriptions,
        lifetimeConversionRate: historicalAnalytics.conversionRate,
        lifetimeSubscriptionRate: historicalAnalytics.subscriptionRate,
        totalLifetimeValue: historicalAnalytics.totalConversionValue,
        totalLifetimeCommission: historicalAnalytics.totalCommissionEarned
      } : {
        totalReferrals: 0,
        totalSignups: 0,
        totalConversions: 0,
        totalSubscriptions: 0,
        lifetimeConversionRate: 0,
        lifetimeSubscriptionRate: 0,
        totalLifetimeValue: 0,
        totalLifetimeCommission: 0
      },
      recentActivity,
      trends
    };
    
    return summary;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error getting partner conversion summary:`, error);
    return null;
  }
}

/**
 * Get conversion funnel for a partner
 * 
 * @param partnerId - Partner ID
 * @param startDate - Start date for funnel
 * @param endDate - End date for funnel
 * @returns Conversion funnel steps
 */
export async function getConversionFunnel(
  partnerId: string,
  startDate: Date,
  endDate: Date
): Promise<ConversionFunnelStep[]> {
  try {
    const analytics = await getConversionAnalytics(partnerId, startDate, endDate);
    
    if (!analytics) {
      return [];
    }
    
    const steps: ConversionFunnelStep[] = [
      {
        step: 'referral',
        count: analytics.totalReferrals,
        percentage: 100
      },
      {
        step: 'signup',
        count: analytics.totalSignups,
        percentage: analytics.totalReferrals > 0 ? (analytics.totalSignups / analytics.totalReferrals) * 100 : 0
      },
      {
        step: 'conversion',
        count: analytics.totalConversions,
        percentage: analytics.totalSignups > 0 ? (analytics.totalConversions / analytics.totalSignups) * 100 : 0
      },
      {
        step: 'subscription',
        count: analytics.totalSubscriptions,
        percentage: analytics.totalConversions > 0 ? (analytics.totalSubscriptions / analytics.totalConversions) * 100 : 0
      }
    ];
    
    return steps;
    
  } catch (error) {
    logger.error(`[ConversionTracking] Error getting conversion funnel:`, error);
    return [];
  }
}
