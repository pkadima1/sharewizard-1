# Complete Google Analytics Implementation Guide

## Overview

This guide explains how to implement comprehensive Google Analytics tracking across every page of your EngagePerfect application using Firebase Analytics.

## Current Implementation Status

✅ **Firebase Analytics Setup**: Already configured in `src/lib/firebase.ts`  
✅ **Analytics Utilities**: Created in `src/utils/analytics.ts`  
✅ **Page Tracking HOC**: Created in `src/components/analytics/PageAnalytics.tsx`  
✅ **Analytics Context**: Created in `src/contexts/AnalyticsContext.tsx`  
✅ **App Integration**: Analytics provider added to `src/App.tsx`  
✅ **Global Page Tracking**: Added to `src/RouterConfig.tsx`  
✅ **Environment Variables**: Added `VITE_FIREBASE_MEASUREMENT_ID` to `.env.example`

## Architecture Overview

### 1. **Analytics Provider Pattern**
- `AnalyticsContext` provides analytics functionality throughout the app
- Automatically initializes when app starts
- Tracks user context changes (login/logout, subscription changes)

### 2. **Automatic Page Tracking**
- `GlobalPageTracker` component in RouterConfig tracks all route changes
- No manual intervention required for basic page views
- Works with your existing language-prefixed routing

### 3. **Manual Event Tracking**
- Utility functions for tracking specific user interactions
- Button clicks, form submissions, feature usage, errors, etc.
- Async imports to avoid bundle bloat

## Implementation Guide

### Step 1: Environment Setup

Add your Google Analytics Measurement ID to your `.env` file:

```bash
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 2: Page-Level Analytics (Choose One Method)

#### Method A: Automatic Hook (Recommended)
```tsx
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';

const YourPage: React.FC = () => {
  // Automatic page tracking with custom title
  usePageAnalytics('Custom Page Title - EngagePerfect');
  
  return <div>Your page content</div>;
};
```

#### Method B: HOC Wrapper
```tsx
import { withPageAnalytics } from '@/components/analytics/PageAnalytics';

const YourPage: React.FC = () => {
  return <div>Your page content</div>;
};

export default withPageAnalytics(YourPage, {
  pageTitle: 'Custom Page Title - EngagePerfect'
});
```

### Step 3: Event Tracking

#### Button Clicks
```tsx
import { trackButtonClick } from '@/utils/analytics';

const handleButtonClick = () => {
  trackButtonClick('subscribe_button', 'pricing_page');
  // Your button logic here
};
```

#### Feature Usage
```tsx
import { trackFeatureUsage } from '@/utils/analytics';

const handleFeatureUse = () => {
  trackFeatureUsage('caption_generation', {
    content_type: 'image',
    platform: 'instagram',
    user_tier: 'premium'
  });
};
```

#### Content Generation
```tsx
import { trackContentGeneration } from '@/utils/analytics';

const handleContentGeneration = async () => {
  const startTime = Date.now();
  
  try {
    // Your generation logic
    const result = await generateContent();
    
    trackContentGeneration('longform_article', {
      word_count: result.wordCount,
      duration_ms: Date.now() - startTime,
      success: true
    });
  } catch (error) {
    trackContentGeneration('longform_article', {
      success: false,
      error: error.message
    });
  }
};
```

#### User Authentication
```tsx
import { trackLogin, trackSignUp } from '@/utils/analytics';

// On successful login
trackLogin('google'); // or 'email'

// On successful signup
trackSignUp('email');
```

#### Error Tracking
```tsx
import { trackError } from '@/utils/analytics';

try {
  // Your code that might fail
} catch (error) {
  trackError('api_call_failed', error.message, 'caption_generator');
}
```

## Complete Implementation Checklist

### Core Pages (High Priority)

- [ ] **Dashboard** (`src/pages/Dashboard.tsx`)
  - [ ] Add `usePageAnalytics('Dashboard - EngagePerfect')`
  - [ ] Track "Create Content" button clicks
  - [ ] Track "Generate Caption" button clicks
  - [ ] Track tab switches (overview, longform, captions)

- [ ] **Caption Generator** (`src/pages/CaptionGenerator.tsx`)
  - [ ] Add page tracking
  - [ ] Track content generation starts/completions
  - [ ] Track platform selections
  - [ ] Track tone/style selections
  - [ ] Track save/share actions

- [ ] **Long-form Wizard** (`src/pages/LongFormWizard.tsx`)
  - [ ] Add page tracking
  - [ ] Track content generation
  - [ ] Track word count selections
  - [ ] Track industry/topic selections
  - [ ] Track export actions

- [ ] **Pricing** (`src/pages/Pricing.tsx`)
  - [ ] Add page tracking
  - [ ] Track subscription button clicks
  - [ ] Track plan comparisons
  - [ ] Track upgrade flows

- [ ] **Login/Signup** (`src/pages/Login.tsx`, `src/pages/SignUp.tsx`)
  - [ ] Add page tracking
  - [ ] Track login attempts (email vs Google)
  - [ ] Track signup completions
  - [ ] Track authentication errors

### Content Pages (Medium Priority)

- [ ] **Home Page** (`src/pages/Index.tsx`)
  - [ ] Track hero CTA clicks
  - [ ] Track feature exploration
  - [ ] Track demo interactions

- [ ] **Contact** (`src/pages/Contact.tsx`)
  - [ ] Track form submissions
  - [ ] Track WhatsApp button clicks
  - [ ] Track contact method preferences

- [ ] **Blog** (`src/pages/Blog.tsx`)
  - [ ] Track article views
  - [ ] Track search usage
  - [ ] Track category filtering

- [ ] **Gallery** (`src/pages/Gallery.tsx`)
  - [ ] Track image views
  - [ ] Track gallery navigation

### User Pages (Medium Priority)

- [ ] **Profile** (`src/pages/Profile.tsx`)
  - [ ] Track profile updates
  - [ ] Track content management actions
  - [ ] Track sharing activities

- [ ] **Preview/Repost** (`src/pages/PreviewRepost.tsx`)
  - [ ] Track content sharing
  - [ ] Track download actions
  - [ ] Track editing actions

### Administrative (Low Priority)

- [ ] **Admin Dashboard** (`src/pages/admin/AdminDashboard.tsx`)
  - [ ] Track admin actions
  - [ ] Track system monitoring

- [ ] **Legal Pages** (`src/pages/TermsAndConditions.tsx`, `src/pages/PrivacyPolicy.tsx`)
  - [ ] Basic page tracking only

## Key Analytics Events to Track

### 1. **Content Creation Events**
```tsx
trackContentGeneration('caption', { platform: 'instagram', tone: 'professional' });
trackContentGeneration('longform', { word_count: 1000, industry: 'technology' });
```

### 2. **User Engagement Events**
```tsx
trackButtonClick('cta_get_started', 'home_page');
trackFeatureUsage('content_sharing', { platform: 'twitter', content_type: 'image' });
```

### 3. **Business Events**
```tsx
trackSubscription('purchase_initiated', 'premium_monthly');
trackSubscription('trial_started', 'premium');
```

### 4. **User Journey Events**
```tsx
trackPageView('/pricing', 'Pricing - EngagePerfect');
trackSearch('marketing tips', 5, 'blog_search');
```

## Performance Considerations

1. **Lazy Loading**: Analytics utilities use dynamic imports to avoid bundle bloat
2. **Error Handling**: All tracking functions fail silently to prevent app disruption
3. **Development Mode**: Analytics is disabled in development to avoid test data
4. **Async Operations**: All tracking is non-blocking

## Testing Your Implementation

### 1. **Development Testing**
```javascript
// Check if analytics is initialized
console.log('Analytics available:', window.gtag ? 'Yes' : 'No');

// Test event tracking in console
import { trackEvent } from '/src/utils/analytics';
trackEvent('test_event', { test: true });
```

### 2. **Production Verification**
- Use Google Analytics Real-Time reports
- Verify page views are coming through
- Check custom events in the Events report
- Monitor user flows in the User Explorer

### 3. **Common Issues**
- **Missing Measurement ID**: Check environment variables
- **Events not showing**: Verify analytics initialization
- **Duplicate tracking**: Check for multiple page tracking calls

## Advanced Features

### Custom Dimensions (Optional)
```tsx
setAnalyticsUserProperties({
  subscription_tier: 'premium',
  user_segment: 'power_user',
  content_preference: 'longform'
});
```

### E-commerce Tracking (For Subscriptions)
```tsx
trackEvent('purchase', {
  transaction_id: 'sub_123',
  value: 29.99,
  currency: 'USD',
  items: [{
    item_id: 'premium_monthly',
    item_name: 'Premium Monthly',
    item_category: 'subscription',
    quantity: 1,
    price: 29.99
  }]
});
```

### Conversion Tracking
```tsx
// Track key conversion events
trackEvent('generate_lead', { method: 'contact_form' });
trackEvent('begin_checkout', { currency: 'USD', value: 29.99 });
```

## Privacy Compliance

- ✅ IP anonymization enabled by default in Firebase Analytics
- ✅ GDPR compliant (user consent handled by Firebase)
- ✅ Privacy policy mentions analytics usage

## Next Steps

1. **Set up your Google Analytics Measurement ID**
2. **Start with high-priority pages** (Dashboard, CaptionGenerator, LongFormWizard)
3. **Test in development** using browser console
4. **Deploy and verify** in Google Analytics Real-Time reports
5. **Gradually add event tracking** to all user interactions
6. **Set up custom reports** and dashboards in Google Analytics

This implementation provides comprehensive analytics coverage while maintaining performance and user privacy.
