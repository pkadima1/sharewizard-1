/**
 * useReferralAttribution Hook
 * 
 * React hook for handling referral attribution during user signup and checkout.
 * Integrates with the partner system to track referrals and prepare for commission processing.
 * 
 * Features:
 * - Automatic referral code capture
 * - Referral attribution processing
 * - Partner information retrieval
 * - Referral statistics tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  processReferralAttribution, 
  getCurrentReferralCode,
  clearReferralData,
  type ReferralAttributionResult,
  type PartnerInfo 
} from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface for referral attribution state
 */
export interface ReferralAttributionState {
  isLoading: boolean;
  isProcessing: boolean;
  hasReferralCode: boolean;
  referralCode: string | null;
  partnerInfo: PartnerInfo | null;
  attributionResult: ReferralAttributionResult | null;
  error: string | null;
}

/**
 * Interface for referral attribution actions
 */
export interface ReferralAttributionActions {
  processAttribution: (metadata?: any) => Promise<ReferralAttributionResult>;
  clearAttribution: () => void;
  refreshAttribution: () => Promise<void>;
}

/**
 * Hook for referral attribution
 * 
 * @param autoProcess - Whether to automatically process attribution on mount
 * @returns Referral attribution state and actions
 */
export function useReferralAttribution(autoProcess: boolean = true): ReferralAttributionState & ReferralAttributionActions {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<ReferralAttributionState>({
    isLoading: false,
    isProcessing: false,
    hasReferralCode: false,
    referralCode: null,
    partnerInfo: null,
    attributionResult: null,
    error: null
  });

  /**
   * Process referral attribution
   */
  const processAttribution = useCallback(async (metadata?: any): Promise<ReferralAttributionResult> => {
    if (!currentUser) {
      const error = 'User must be authenticated to process referral attribution';
      setState(prev => ({ ...prev, error }));
      return { success: false, message: error };
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await processReferralAttribution(metadata);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        attributionResult: result,
        error: result.success ? null : result.message
      }));

      if (result.success) {
        toast({
          title: 'Referral Attribution Successful',
          description: `You were referred by ${result.partnerName}. You'll earn them a commission when you subscribe!`,
        });
      } else {
        toast({
          title: 'Referral Attribution Failed',
          description: result.message,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process referral attribution';
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
      
      toast({
        title: 'Referral Attribution Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, message: errorMessage };
    }
  }, [currentUser, toast]);

  /**
   * Clear referral attribution
   */
  const clearAttribution = useCallback(() => {
    clearReferralData();
    setState(prev => ({
      ...prev,
      hasReferralCode: false,
      referralCode: null,
      partnerInfo: null,
      attributionResult: null,
      error: null
    }));
  }, []);

  /**
   * Refresh referral attribution
   */
  const refreshAttribution = useCallback(async () => {
    if (!currentUser) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const referralCode = getCurrentReferralCode();
      
      if (referralCode) {
        setState(prev => ({
          ...prev,
          hasReferralCode: true,
          referralCode,
          isLoading: false
        }));

        if (autoProcess) {
          await processAttribution();
        }
      } else {
        setState(prev => ({
          ...prev,
          hasReferralCode: false,
          referralCode: null,
          isLoading: false
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh referral attribution';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [currentUser, autoProcess, processAttribution]);

  /**
   * Auto-process attribution on mount if user is authenticated
   */
  useEffect(() => {
    if (currentUser && autoProcess) {
      refreshAttribution();
    }
  }, [currentUser, autoProcess, refreshAttribution]);

  /**
   * Listen for URL changes to detect new referral codes
   */
  useEffect(() => {
    const handleUrlChange = () => {
      if (currentUser) {
        refreshAttribution();
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentUser, refreshAttribution]);

  return {
    ...state,
    processAttribution,
    clearAttribution,
    refreshAttribution
  };
}

/**
 * Hook for partner referral statistics
 * 
 * @param partnerId - Partner ID
 * @returns Partner referral statistics
 */
export function usePartnerReferralStats(partnerId: string | null) {
  const [stats, setStats] = useState<{
    totalReferrals: number;
    totalConversions: number;
    conversionRate: number;
    recentReferrals: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!partnerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { getPartnerReferralStats } = await import('@/services/referralService');
      const result = await getPartnerReferralStats(partnerId);
      setStats(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch referral stats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) {
      fetchStats();
    }
  }, [partnerId, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}

/**
 * Hook for partner commission summary
 * 
 * @param partnerId - Partner ID
 * @returns Partner commission summary
 */
export function usePartnerCommissionSummary(partnerId: string | null) {
  const [summary, setSummary] = useState<{
    totalCommissions: number;
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
    recentEntries: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!partnerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { getPartnerCommissionSummary } = await import('@/services/referralService');
      const result = await getPartnerCommissionSummary(partnerId);
      setSummary(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commission summary';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) {
      fetchSummary();
    }
  }, [partnerId, fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary
  };
}

