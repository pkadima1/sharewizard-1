/**
 * Analytics utilities for comprehensive Google Analytics tracking
 * Provides page view tracking, event tracking, and user property tracking
 */

import { Analytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { initializeAnalytics } from '@/lib/firebase';

let analytics: Analytics | null = null;

/**
 * Initialize Google Analytics
 * Call this once when the app starts
 */
export const initAnalytics = async (): Promise<void> => {
  try {
    analytics = await initializeAnalytics();
    if (analytics) {
      console.log('✅ Google Analytics initialized successfully');
    } else {
      console.log('⚠️ Google Analytics not initialized (development mode or unsupported)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics:', error);
  }
};

/**
 * Track page views
 * @param pagePath - The path of the page being viewed
 * @param pageTitle - The title of the page
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
    console.log(`📊 Page view tracked: ${pagePath}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track custom events
 * @param eventName - Name of the event
 * @param parameters - Event parameters
 */
export const trackEvent = (
  eventName: string, 
  parameters?: Record<string, any>
): void => {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, parameters);
    console.log(`📊 Event tracked: ${eventName}`, parameters);
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
};

/**
 * Track user login
 * @param method - Login method (google, email, etc.)
 */
export const trackLogin = (method: string): void => {
  trackEvent('login', { method });
};

/**
 * Track user signup
 * @param method - Signup method (google, email, etc.)
 */
export const trackSignUp = (method: string): void => {
  trackEvent('sign_up', { method });
};

/**
 * Track content generation
 * @param contentType - Type of content generated (caption, longform, etc.)
 * @param parameters - Additional parameters
 */
export const trackContentGeneration = (
  contentType: string, 
  parameters?: Record<string, any>
): void => {
  trackEvent('generate_content', {
    content_type: contentType,
    ...parameters
  });
};

/**
 * Track content sharing
 * @param platform - Platform where content was shared
 * @param contentType - Type of content shared
 * @param success - Whether sharing was successful
 */
export const trackContentShare = (
  platform: string, 
  contentType: string, 
  success: boolean = true
): void => {
  trackEvent('share', {
    method: platform,
    content_type: contentType,
    success,
  });
};

/**
 * Track button clicks
 * @param buttonName - Name or identifier of the button
 * @param location - Where the button was clicked
 */
export const trackButtonClick = (buttonName: string, location?: string): void => {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
  });
};

/**
 * Track feature usage
 * @param featureName - Name of the feature used
 * @param parameters - Additional parameters
 */
export const trackFeatureUsage = (
  featureName: string, 
  parameters?: Record<string, any>
): void => {
  trackEvent('feature_use', {
    feature_name: featureName,
    ...parameters
  });
};

/**
 * Track subscription events
 * @param action - Action taken (subscribe, cancel, upgrade, etc.)
 * @param planType - Type of subscription plan
 */
export const trackSubscription = (action: string, planType?: string): void => {
  trackEvent('subscription', {
    action,
    plan_type: planType,
  });
};

/**
 * Track user errors
 * @param errorType - Type of error encountered
 * @param errorMessage - Error message
 * @param location - Where the error occurred
 */
export const trackError = (
  errorType: string, 
  errorMessage: string, 
  location?: string
): void => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    location,
  });
};

/**
 * Set user ID for tracking
 * @param userId - User ID
 */
export const setAnalyticsUserId = (userId: string): void => {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
    console.log(`👤 Analytics user ID set: ${userId}`);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

/**
 * Set user properties
 * @param properties - User properties to set
 */
export const setAnalyticsUserProperties = (
  properties: Record<string, any>
): void => {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
    console.log('👤 Analytics user properties set:', properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

/**
 * Track search queries
 * @param searchTerm - The search term used
 * @param resultCount - Number of results returned
 * @param location - Where the search was performed
 */
export const trackSearch = (
  searchTerm: string, 
  resultCount?: number, 
  location?: string
): void => {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
    location,
  });
};

/**
 * Track timing events (performance metrics)
 * @param name - Name of the timing event
 * @param value - Time value in milliseconds
 * @param category - Category of the timing event
 */
export const trackTiming = (
  name: string, 
  value: number, 
  category?: string
): void => {
  trackEvent('timing_complete', {
    name,
    value,
    category,
  });
};

/**
 * Check if analytics is available
 */
export const isAnalyticsAvailable = (): boolean => {
  return analytics !== null;
};
