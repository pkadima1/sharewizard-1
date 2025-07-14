# Content Idea Usage Tracker

## Overview

The ContentIdeaUsageTracker component provides comprehensive usage tracking for content idea generation with real-time monitoring, upgrade prompts, usage history, analytics, and sharing functionality. It integrates seamlessly with the existing billing system and user management.

## Features

### 🎯 Core Features

- **Real-time Usage Display**: Shows current usage (X/3 requests used today; unlimited for premium)
- **Daily Reset Tracking**: Displays when usage resets (daily reset at midnight)
- **Upgrade Prompts**: Smart upgrade suggestions when approaching limits
- **Usage History**: Complete history of generated content ideas
- **Analytics Dashboard**: Detailed analytics and performance metrics
- **Cost Tracking**: Cost estimates for premium users
- **Sharing Functionality**: Built-in sharing for generated ideas

### 📊 Analytics & Insights

- **Usage Analytics**: Total ideas, average cost, engagement scores
- **Platform Breakdown**: Most used platforms and content types
- **Performance Metrics**: Top-performing ideas and engagement trends
- **Cost Analysis**: Detailed cost breakdown by model and time period
- **Export Functionality**: CSV and JSON export options

### 🔄 Integration Features

- **Billing System Integration**: Works with existing subscription plans
- **User Management**: Integrates with AuthContext and user profiles
- **Real-time Updates**: Live usage tracking with Firestore
- **Custom Handlers**: Flexible upgrade and sharing callbacks
- **Responsive Design**: Mobile-friendly interface

## Component Usage

### Basic Integration

```tsx
import ContentIdeaUsageTracker from '@/components/ContentIdeaUsageTracker';

<ContentIdeaUsageTracker />
```

### Advanced Integration

```tsx
<ContentIdeaUsageTracker
  className="w-full"
  showHistory={true}
  showAnalytics={true}
  showSharing={true}
  onUpgrade={() => navigate('/pricing')}
  onShare={(idea) => {
    // Custom sharing logic
    shareToSocialMedia(idea);
  }}
/>
```

### Hook Integration

```tsx
import useContentIdeaUsage from '@/hooks/useContentIdeaUsage';

const { usageStatus, canGenerateContentIdea, recordContentIdea } = useContentIdeaUsage();

// Check if user can generate
if (!canGenerateContentIdea()) {
  return <UpgradePrompt />;
}

// Record a new content idea
const newIdea = await recordContentIdea({
  title: "5 Quick Tips for Marketing Success",
  description: "Share actionable tips that your audience can implement immediately",
  platform: "Instagram",
  contentType: "social_post",
  cost: 0.002,
  tokensUsed: 1200,
  engagementScore: 85,
  seoPotential: 70
});
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `onUpgrade` | `() => void` | `undefined` | Custom upgrade handler |
| `onShare` | `(idea: ContentIdeaUsage) => void` | `undefined` | Custom sharing handler |
| `showHistory` | `boolean` | `true` | Show usage history modal |
| `showAnalytics` | `boolean` | `true` | Show analytics dashboard |
| `showSharing` | `boolean` | `true` | Show sharing functionality |

## User Scenarios

### Free User (3 requests)
- Limited usage with clear upgrade prompts
- Daily reset at midnight
- Basic analytics and history
- Upgrade suggestions when approaching limits

### Trial User (5 requests)
- 5-day trial with premium features
- Trial expiration countdown
- Enhanced analytics during trial
- Upgrade prompts before trial ends

### Basic User (70/month)
- Monthly plan with 70 requests
- Cost tracking and detailed analytics
- Flex pack purchase options
- Platform-specific insights

### Premium User (500/month)
- Unlimited requests with cost tracking
- Advanced analytics and performance metrics
- Detailed cost breakdown
- Priority support features

## Usage Status

The component tracks various usage states:

```tsx
interface UsageStatus {
  canGenerate: boolean;           // Can user generate content
  requestsUsed: number;           // Number of requests used
  requestsLimit: number;          // Total request limit
  requestsRemaining: number;      // Remaining requests
  usagePercentage: number;        // Usage percentage (0-100)
  planType: string;              // Current plan type
  isPremium: boolean;            // Is premium user
  isTrial: boolean;              // Is trial user
  isFree: boolean;               // Is free user
  isRunningLow: boolean;         // Running low on requests
  isOutOfRequests: boolean;      // No requests remaining
  resetTime?: { hours: number; minutes: number }; // Time until reset
  daysRemaining?: number;        // Days until plan renewal
  estimatedCostPerIdea?: number; // Cost per idea (premium)
}
```

## Analytics Features

### Usage Analytics
- Total ideas generated
- Average cost per idea
- Total cost over time
- Most used platform
- Average engagement score

### Performance Metrics
- Top-performing ideas
- Platform breakdown
- Daily usage trends
- Monthly usage patterns
- Cost breakdown by model

### Export Options
- CSV export with detailed data
- JSON export for API integration
- Custom date range selection
- Platform-specific filtering

## Integration Examples

### Dashboard Integration

```tsx
// In your dashboard component
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <ContentIdeaUsageTracker className="lg:col-span-2" />
  <div className="space-y-4">
    <QuickStats />
    <RecentActivity />
  </div>
</div>
```

### Content Generation Flow

```tsx
const handleGenerateContent = async () => {
  // Check usage limits
  if (!canGenerateContentIdea()) {
    setShowUsageTracker(true);
    return;
  }

  // Generate content
  const idea = await generateContentIdea();
  
  // Record usage
  await recordContentIdea({
    title: idea.title,
    description: idea.description,
    platform: idea.platform,
    contentType: idea.contentType,
    cost: estimatedCost,
    tokensUsed: tokensUsed,
    engagementScore: idea.engagementScore,
    seoPotential: idea.seoPotential
  });
};
```

### Custom Sharing Implementation

```tsx
const handleShare = async (idea: ContentIdeaUsage) => {
  // Custom sharing logic
  const shareText = `${idea.title}\n\n${idea.description}\n\nGenerated with EngagePerfect AI`;
  
  if (navigator.share) {
    await navigator.share({
      title: idea.title,
      text: shareText,
      url: window.location.href
    });
  } else {
    await navigator.clipboard.writeText(shareText);
    toast.success('Content idea copied to clipboard');
  }
  
  // Update share count
  await shareContentIdea(idea.id);
};
```

## Translation Keys

The component uses the following translation keys:

```json
{
  "contentIdeaUsageTracker": {
    "title": "Content Idea Usage",
    "subtitle": {
      "free": "Track your content idea generation usage",
      "premium": "Unlimited content ideas with cost tracking"
    },
    "currentUsage": "Current Usage",
    "remaining": "remaining",
    "used": "used",
    "reset": {
      "trialEnds": "Trial ends in {{days}} days",
      "resetsIn": "Resets in {{days}} days"
    },
    "cost": {
      "title": "Cost Tracking",
      "perIdea": "Cost per idea"
    },
    "buttons": {
      "history": "History",
      "analytics": "Analytics",
      "upgrade": "Upgrade",
      "manage": "Manage Plan",
      "close": "Close",
      "cancel": "Cancel"
    },
    "badges": {
      "premium": "Premium",
      "trial": "Trial",
      "free": "Free"
    },
    "warnings": {
      "limitReached": "Request limit reached",
      "runningLow": "Running low on requests",
      "considerUpgrade": "Consider upgrading to continue generating content ideas"
    },
    "history": {
      "title": "Usage History",
      "description": "View your content idea generation history and performance",
      "empty": "No usage history found"
    },
    "analytics": {
      "title": "Usage Analytics",
      "description": "Detailed analytics of your content idea generation",
      "totalIdeas": "Total Ideas",
      "totalCost": "Total Cost",
      "avgEngagement": "Avg Engagement",
      "topPlatform": "Top Platform",
      "topPerformers": "Top Performing Ideas",
      "engagement": "Engagement",
      "platformBreakdown": "Platform Breakdown"
    },
    "upgrade": {
      "title": "Upgrade Your Plan",
      "description": "Choose a plan that fits your content creation needs",
      "flexTitle": "Flex Packs",
      "flexDescription": "Add more requests without a monthly commitment",
      "buyFlex": "Buy Flex Pack"
    },
    "tooltips": {
      "shareIdea": "Share this content idea"
    },
    "messages": {
      "sharedToClipboard": "Content idea copied to clipboard",
      "exported": "Usage data exported as {{format}}"
    },
    "errors": {
      "loginRequired": "Login Required",
      "mustBeLoggedIn": "You must be logged in to perform this action",
      "invalidPlan": "Invalid Plan",
      "planSelectionError": "Please select a valid plan",
      "upgradeFailed": "Upgrade Failed",
      "flexPurchaseFailed": "Flex Purchase Failed",
      "portalError": "Portal Error",
      "loadHistoryFailed": "Failed to load usage history"
    }
  }
}
```

## Firestore Schema

The component uses the following Firestore collections:

### Users Collection
```typescript
interface UserProfile {
  plan_type: 'free' | 'trial' | 'basicMonth' | 'basicYear' | 'premiumMonth' | 'premiumYear';
  requests_used: number;
  requests_limit: number;
  reset_date?: Timestamp;
  trial_end_date?: Timestamp;
}
```

### Content Ideas Subcollection
```typescript
interface ContentIdeaUsage {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'social_post' | 'blog_article';
  generatedAt: Timestamp;
  cost?: number;
  tokensUsed?: number;
  engagementScore?: number;
  seoPotential?: number;
  shared?: boolean;
  shareCount?: number;
  userId: string;
  planType: string;
  modelUsed?: string;
  language?: string;
}
```

## Best Practices

### 1. Usage Monitoring
- Always check `canGenerateContentIdea()` before generating content
- Show usage tracker when limits are reached
- Provide clear upgrade paths for free users

### 2. Analytics Integration
- Use analytics data to optimize content generation
- Track performance metrics for improvement
- Export data for external analysis

### 3. User Experience
- Show clear progress indicators
- Provide helpful upgrade suggestions
- Maintain responsive design across devices

### 4. Error Handling
- Handle network errors gracefully
- Provide fallback options for sharing
- Show appropriate error messages

## Troubleshooting

### Common Issues

1. **Usage not updating**: Check Firestore rules and user authentication
2. **Analytics not loading**: Verify collection permissions and data structure
3. **Sharing not working**: Check browser compatibility and permissions
4. **Export failing**: Ensure proper file permissions and blob handling

### Debug Tips

- Enable Firestore debug mode for detailed logs
- Check browser console for error messages
- Verify user authentication status
- Test with different user scenarios

## Future Enhancements

- **Advanced Analytics**: Machine learning insights and predictions
- **Team Collaboration**: Multi-user usage tracking
- **API Integration**: Third-party analytics platforms
- **Mobile App**: Native mobile usage tracking
- **Advanced Sharing**: Social media API integration
- **Custom Dashboards**: User-configurable analytics views 