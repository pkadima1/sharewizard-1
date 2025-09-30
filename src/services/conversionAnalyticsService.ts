/**
 * Conversion Analytics Service
 * 
 * Frontend service for accessing conversion tracking data
 * and analytics for partner dashboards.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

/**
 * Interface for conversion analytics
 */
export interface ConversionAnalytics {
  partnerId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalReferrals: number;
  totalSignups: number;
  totalConversions: number;
  totalSubscriptions: number;
  conversionRate: number;
  subscriptionRate: number;
  totalConversionValue: number;
  totalCommissionEarned: number;
  averageConversionValue: number;
  averageCommissionPerConversion: number;
  funnel: {
    referrals: number;
    signups: number;
    conversions: number;
    subscriptions: number;
  };
  averageTimeToConversion?: number;
  averageTimeToSubscription?: number;
}

/**
 * Interface for partner conversion summary
 */
export interface PartnerConversionSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
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
  recentActivity: any[];
  trends: {
    conversionRateTrend: 'up' | 'down' | 'stable';
    subscriptionRateTrend: 'up' | 'down' | 'stable';
    valueTrend: 'up' | 'down' | 'stable';
  };
}

/**
 * Interface for conversion funnel step
 */
export interface ConversionFunnelStep {
  step: 'referral' | 'signup' | 'conversion' | 'subscription';
  count: number;
  percentage: number;
  averageTimeToNext?: number;
}

/**
 * Get conversion analytics for a partner
 * 
 * @param partnerId - Partner ID
 * @param startDate - Start date for analytics
 * @param endDate - End date for analytics
 * @returns Conversion analytics
 */
export async function getPartnerConversionAnalytics(
  partnerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversionAnalytics | null> {
  try {
    const getPartnerConversionAnalytics = httpsCallable(functions, 'getPartnerConversionAnalytics');
    
    const result = await getPartnerConversionAnalytics({
      partnerId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
    
    const resultData = result.data as { success: boolean; data?: ConversionAnalytics; message: string };
    
    if (resultData.success && resultData.data) {
      // Convert timestamp objects to Date objects
      const analytics = resultData.data;
      analytics.period.start = new Date(analytics.period.start);
      analytics.period.end = new Date(analytics.period.end);
      
      return analytics;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting partner conversion analytics:', error);
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
    const getPartnerConversionSummary = httpsCallable(functions, 'getPartnerConversionSummary');
    
    const result = await getPartnerConversionSummary({
      partnerId
    });
    
    const resultData = result.data as { success: boolean; data?: PartnerConversionSummary; message: string };
    
    if (resultData.success && resultData.data) {
      return resultData.data;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting partner conversion summary:', error);
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
export async function getPartnerConversionFunnel(
  partnerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversionFunnelStep[]> {
  try {
    const getPartnerConversionFunnel = httpsCallable(functions, 'getPartnerConversionFunnel');
    
    const result = await getPartnerConversionFunnel({
      partnerId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
    
    const resultData = result.data as { success: boolean; data?: ConversionFunnelStep[]; message: string };
    
    if (resultData.success && resultData.data) {
      return resultData.data;
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error getting partner conversion funnel:', error);
    return [];
  }
}

/**
 * Format conversion rate as percentage
 * 
 * @param rate - Conversion rate (0-1)
 * @returns Formatted percentage string
 */
export function formatConversionRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format currency amount
 * 
 * @param amount - Amount in cents
 * @param currency - Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

/**
 * Get trend indicator
 * 
 * @param trend - Trend direction
 * @returns Trend indicator
 */
export function getTrendIndicator(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'stable':
      return '➡️';
    default:
      return '➡️';
  }
}

/**
 * Get period options for analytics
 * 
 * @returns Array of period options
 */
export function getPeriodOptions(): Array<{
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}> {
  const now = new Date();
  
  return [
    {
      label: 'Dernières 24h',
      value: '24h',
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Dernières 7 jours',
      value: '7d',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Dernières 30 jours',
      value: '30d',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Derniers 90 jours',
      value: '90d',
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Dernière année',
      value: '1y',
      startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      endDate: now
    }
  ];
}



