/**
 * Analytics Context Provider
 * Provides analytics functionality throughout the app and handles initialization
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initAnalytics, 
  setAnalyticsUserId, 
  setAnalyticsUserProperties,
  trackEvent
} from '@/utils/analytics';

interface AnalyticsContextType {
  isInitialized: boolean;
  trackEvent: typeof trackEvent;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize analytics when provider mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await initAnalytics();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize analytics in provider:', error);
      }
    };

    initialize();
  }, []);

  // Update user tracking when user changes
  useEffect(() => {
    if (!isInitialized || !currentUser) return;

    // Set user ID for analytics
    setAnalyticsUserId(currentUser.uid);

    // Set user properties
    const userProperties: Record<string, any> = {
      user_id: currentUser.uid,
      email_verified: currentUser.emailVerified,
    };

    // Add profile information if available
    if (userProfile) {
      userProperties.subscription_tier = userProfile.subscriptionTier;
      userProperties.date_joined = userProfile.dateJoined?.toISOString();
    }

    setAnalyticsUserProperties(userProperties);

    console.log('📊 Analytics user context updated for:', currentUser.uid);
  }, [currentUser, userProfile, isInitialized]);

  const value: AnalyticsContextType = {
    isInitialized,
    trackEvent,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

/**
 * Hook to use analytics context
 */
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
