/**
 * Example implementations for adding analytics to different pages
 * Copy these patterns to implement analytics across your application
 */

// =============================================================================
// METHOD 1: Using the usePageAnalytics Hook (Recommended)
// =============================================================================

import React, { useEffect } from 'react';
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';
import { 
  trackButtonClick, 
  trackFeatureUsage, 
  trackContentGeneration,
  trackError 
} from '@/utils/analytics';

// Example: Dashboard Page with Analytics
export const DashboardWithAnalytics: React.FC = () => {
  // Automatic page view tracking
  usePageAnalytics('Dashboard - EngagePerfect');

  const handleCreateContent = () => {
    // Track button click
    trackButtonClick('create_content', 'dashboard');
    
    // Track feature usage
    trackFeatureUsage('content_creation', {
      source: 'dashboard',
      type: 'longform'
    });
    
    // Your existing function logic here...
  };

  const handleGenerateCaption = () => {
    trackButtonClick('generate_caption', 'dashboard');
    trackFeatureUsage('caption_generation', { source: 'dashboard' });
    
    // Your existing function logic here...
  };

  useEffect(() => {
    // Track when dashboard data loads
    trackFeatureUsage('dashboard_view', {
      user_type: 'authenticated',
      section: 'overview'
    });
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleCreateContent}>Create Content</button>
      <button onClick={handleGenerateCaption}>Generate Caption</button>
    </div>
  );
};

// =============================================================================
// METHOD 2: Using the HOC (Higher-Order Component)
// =============================================================================

import { withPageAnalytics } from '@/components/analytics/PageAnalytics';

const PricingPage: React.FC = () => {
  const handleSubscribe = (planType: string) => {
    trackButtonClick('subscribe', 'pricing_page');
    trackFeatureUsage('subscription_attempt', {
      plan_type: planType,
      source: 'pricing_page'
    });
    
    // Your subscription logic here...
  };

  return (
    <div>
      <h1>Pricing</h1>
      <button onClick={() => handleSubscribe('basic')}>Subscribe Basic</button>
      <button onClick={() => handleSubscribe('premium')}>Subscribe Premium</button>
    </div>
  );
};

// Wrap with analytics HOC
export const PricingWithAnalytics = withPageAnalytics(PricingPage, {
  pageTitle: 'Pricing - EngagePerfect'
});

// =============================================================================
// METHOD 3: Content Generation with Analytics
// =============================================================================

export const ContentGeneratorWithAnalytics: React.FC = () => {
  usePageAnalytics('Content Generator - EngagePerfect');

  const handleContentGeneration = async (contentType: string, params: any) => {
    const startTime = Date.now();
    
    try {
      // Track generation start
      trackContentGeneration(contentType, {
        ...params,
        status: 'started'
      });

      // Your content generation logic here...
      const result = await generateContent(contentType, params);
      
      // Track successful generation
      const duration = Date.now() - startTime;
      trackContentGeneration(contentType, {
        ...params,
        status: 'completed',
        duration_ms: duration,
        word_count: result.wordCount,
        success: true
      });

      return result;
    } catch (error) {
      // Track generation error
      trackError('content_generation_failed', error.message, 'content_generator');
      trackContentGeneration(contentType, {
        ...params,
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};

// =============================================================================
// METHOD 4: Login/Signup Pages with Analytics
// =============================================================================

export const LoginWithAnalytics: React.FC = () => {
  usePageAnalytics('Login - EngagePerfect');

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      
      // Track successful login
      import('@/utils/analytics').then(({ trackLogin }) => {
        trackLogin('email');
      });
      
    } catch (error) {
      // Track login error
      trackError('login_failed', error.message, 'login_page');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      
      // Track successful login
      import('@/utils/analytics').then(({ trackLogin }) => {
        trackLogin('google');
      });
      
    } catch (error) {
      trackError('google_login_failed', error.message, 'login_page');
    }
  };

  return (
    <div>
      {/* Your login form */}
    </div>
  );
};

// =============================================================================
// METHOD 5: E-commerce/Subscription Analytics
// =============================================================================

export const CheckoutWithAnalytics: React.FC = () => {
  usePageAnalytics('Checkout - EngagePerfect');

  const handlePurchase = async (planType: string, amount: number) => {
    try {
      // Track purchase attempt
      import('@/utils/analytics').then(({ trackSubscription }) => {
        trackSubscription('purchase_initiated', planType);
      });

      const result = await processPayment(planType, amount);
      
      // Track successful purchase
      import('@/utils/analytics').then(({ trackSubscription }) => {
        trackSubscription('purchase_completed', planType);
      });

      return result;
    } catch (error) {
      trackError('payment_failed', error.message, 'checkout');
      
      import('@/utils/analytics').then(({ trackSubscription }) => {
        trackSubscription('purchase_failed', planType);
      });
      
      throw error;
    }
  };

  return (
    <div>
      {/* Your checkout form */}
    </div>
  );
};

// =============================================================================
// METHOD 6: Search and Discovery Analytics
// =============================================================================

export const SearchWithAnalytics: React.FC = () => {
  usePageAnalytics('Search - EngagePerfect');

  const handleSearch = async (searchTerm: string) => {
    try {
      const results = await performSearch(searchTerm);
      
      // Track search
      import('@/utils/analytics').then(({ trackSearch }) => {
        trackSearch(searchTerm, results.length, 'main_search');
      });

      return results;
    } catch (error) {
      trackError('search_failed', error.message, 'search_page');
    }
  };

  return (
    <div>
      {/* Your search interface */}
    </div>
  );
};

// =============================================================================
// UTILITY: Analytics Event Helpers
// =============================================================================

// Helper for tracking form interactions
export const trackFormInteraction = (formName: string, action: string, field?: string) => {
  import('@/utils/analytics').then(({ trackEvent }) => {
    trackEvent('form_interaction', {
      form_name: formName,
      action,
      field,
      timestamp: Date.now()
    });
  });
};

// Helper for tracking navigation
export const trackNavigation = (from: string, to: string, method: string = 'click') => {
  import('@/utils/analytics').then(({ trackEvent }) => {
    trackEvent('navigation', {
      from_page: from,
      to_page: to,
      method,
      timestamp: Date.now()
    });
  });
};

// Helper for tracking performance metrics
export const trackPerformance = (metricName: string, value: number, unit: string = 'ms') => {
  import('@/utils/analytics').then(({ trackTiming }) => {
    trackTiming(metricName, value, 'performance');
  });
};

// =============================================================================
// IMPLEMENTATION CHECKLIST
// =============================================================================

/*
To implement analytics across your entire app, follow these steps:

1. ✅ Add VITE_FIREBASE_MEASUREMENT_ID to your .env file
2. ✅ Ensure AnalyticsProvider is wrapped around your app in App.tsx
3. ✅ Router-level tracking is handled automatically by GlobalPageTracker

For each page/component:
4. Add usePageAnalytics() hook for automatic page tracking
5. Add trackButtonClick() for important button interactions
6. Add trackFeatureUsage() for feature usage tracking
7. Add trackContentGeneration() for AI content creation
8. Add trackError() for error tracking
9. Add custom events for page-specific interactions

Key Analytics Events to Track:
- Page views (automatic)
- User authentication (login, signup, logout)
- Content generation (captions, longform content)
- Content sharing (social media platforms)
- Subscription events (subscribe, cancel, upgrade)
- Feature usage (specific tool usage)
- Errors and failures
- Search queries
- Button clicks and user interactions
- Performance metrics (generation time, load times)

*/
