/**
 * useReferralCapture Hook
 * 
 * React hook for capturing and managing referral codes.
 * Handles URL parameter detection, validation, and toast notifications.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  getReferralCode,
  validateReferralCode,
  saveReferralCodeToStorage,
  getReferralStatus,
  type PartnerInfo
} from '@/lib/referrals';

export interface ReferralCaptureState {
  isLoading: boolean;
  hasReferral: boolean;
  referralCode: string | null;
  partnerInfo: PartnerInfo | null;
  timestamp: number | null;
}

export interface ReferralCaptureActions {
  checkForReferral: () => Promise<void>;
  clearReferral: () => void;
}

/**
 * Hook for capturing and managing referral codes
 * @param autoCapture - Whether to automatically capture referral codes on mount (default: true)
 */
export function useReferralCapture(autoCapture: boolean = true): ReferralCaptureState & ReferralCaptureActions {
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('partners');
  
  const [state, setState] = useState<ReferralCaptureState>(() => {
    const status = getReferralStatus();
    return {
      isLoading: false,
      hasReferral: status.hasReferral,
      referralCode: status.code,
      partnerInfo: status.partnerInfo,
      timestamp: status.timestamp
    };
  });

  /**
   * Check for referral code in URL and validate it
   */
  const checkForReferral = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const searchParams = new URLSearchParams(location.search);
      const urlReferralCode = getReferralCode(searchParams);
      
      if (!urlReferralCode) {
        // No new referral code in URL, just update state with cached data
        const status = getReferralStatus();
        setState({
          isLoading: false,
          hasReferral: status.hasReferral,
          referralCode: status.code,
          partnerInfo: status.partnerInfo,
          timestamp: status.timestamp
        });
        return;
      }
      
      console.log('🔍 Checking referral code:', urlReferralCode);
      
      // Validate the referral code against Firestore
      const partnerInfo = await validateReferralCode(urlReferralCode);
      
      if (partnerInfo) {
        // Valid referral code - save to storage
        saveReferralCodeToStorage(urlReferralCode, partnerInfo);
        
        // Show success toast
        const welcomeMessage = partnerInfo.companyName 
          ? t('referral.welcomeWithCompany', { 
              partnerName: partnerInfo.displayName, 
              companyName: partnerInfo.companyName 
            })
          : t('referral.welcome', { partnerName: partnerInfo.displayName });
        
        toast({
          title: "🎉 " + t('referral.captured', { code: urlReferralCode }),
          description: welcomeMessage,
          duration: 6000,
        });
        
        // Update state
        setState({
          isLoading: false,
          hasReferral: true,
          referralCode: urlReferralCode,
          partnerInfo,
          timestamp: Date.now()
        });
        
        console.log('✅ Referral captured successfully:', {
          code: urlReferralCode,
          partner: partnerInfo.displayName,
          company: partnerInfo.companyName
        });
        
      } else {
        // Invalid referral code
        console.log('❌ Invalid referral code:', urlReferralCode);
        
        toast({
          title: "❌ " + t('referral.invalid', { code: urlReferralCode }),
          description: t('referral.inactive'),
          variant: "destructive",
          duration: 5000,
        });
        
        // Keep existing state if we have valid cached data
        const status = getReferralStatus();
        setState({
          isLoading: false,
          hasReferral: status.hasReferral,
          referralCode: status.code,
          partnerInfo: status.partnerInfo,
          timestamp: status.timestamp
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking referral code:', error);
      
      toast({
        title: "❌ " + t('messages.error'),
        description: "Unable to validate referral code. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Clear current referral data
   */
  const clearReferral = (): void => {
    try {
      // Clear from storage
      localStorage.removeItem('sharewizard_referral_code');
      localStorage.removeItem('sharewizard_partner_info');
      localStorage.removeItem('sharewizard_referral_timestamp');
      
      // Clear cookies
      const pastDate = new Date(0).toUTCString();
      document.cookie = `sharewizard_referral_code=; expires=${pastDate}; path=/`;
      document.cookie = `sharewizard_partner_info=; expires=${pastDate}; path=/`;
      document.cookie = `sharewizard_referral_timestamp=; expires=${pastDate}; path=/`;
      
      // Update state
      setState({
        isLoading: false,
        hasReferral: false,
        referralCode: null,
        partnerInfo: null,
        timestamp: null
      });
      
      console.log('🧹 Referral data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing referral data:', error);
    }
  };

  // Auto-capture on mount and location change
  useEffect(() => {
    if (autoCapture) {
      checkForReferral();
    }
  }, [location.search, autoCapture]);

  return {
    ...state,
    checkForReferral,
    clearReferral
  };
}

/**
 * Simplified hook to just get current referral status without auto-capture
 */
export function useReferralStatus(): ReferralCaptureState {
  const [state, setState] = useState<ReferralCaptureState>(() => {
    const status = getReferralStatus();
    return {
      isLoading: false,
      hasReferral: status.hasReferral,
      referralCode: status.code,
      partnerInfo: status.partnerInfo,
      timestamp: status.timestamp
    };
  });

  // Update state when localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const status = getReferralStatus();
      setState({
        isLoading: false,
        hasReferral: status.hasReferral,
        referralCode: status.code,
        partnerInfo: status.partnerInfo,
        timestamp: status.timestamp
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return state;
}
