
import { UserProfile } from "@/types";

// Default request limits for each plan
export const DEFAULT_REQUEST_LIMIT = {
  free: 3,          // Free users get 3 requests
  trial: 5,         // Trial users get 5 requests
  basic: 70,        // Basic plan users get 70 requests
  basicMonth: 70,   // Basic month users get 70 requests
  basicYear: 900,   // Basic year users get 900 requests (75 per month)
  flexy: 20         // Flexy one-time purchase gives 20 requests
};

// Mock user data for development
export const MOCK_USER_PROFILE: UserProfile = {  id: "user123",
  fullName: "Alex Morgan",
  email: "alex.morgan@example.com",
  profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
  subscriptionTier: "basicMonth",
  planExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  dateJoined: new Date(2023, 2, 15), // March 15, 2023
  stats: {
    aiRequestsUsed: 78,
    aiRequestsLimit: 100,
    postsGenerated: 42,
    postsDrafted: 15,
    postsShared: {
      total: 27,
      byPlatform: {
        twitter: 12,
        linkedin: 8,
        facebook: 5,
        other: 2
      }
    }
  },
  recentPosts: [
    {
      id: "post1",
      content: "Excited to announce our latest product update! Check out the new features that will transform your experience. #ProductLaunch #Innovation",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      platform: "Twitter",
      shareCounts: {
        twitter: 5,
        linkedin: 0,
        facebook: 0,
        other: 0
      }
    },
    {
      id: "post2",
      content: "Our team has been working tirelessly to bring you the best user experience possible. We're proud to share our latest achievements and the roadmap for the future. What features are you most excited about?",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      platform: "LinkedIn",
      shareCounts: {
        twitter: 0,
        linkedin: 3,
        facebook: 0,
        other: 1
      },
      imageUrl: "https://images.unsplash.com/photo-1661956602868-6ae368943878?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    },
    {
      id: "post3",
      content: "We're thrilled to be recognized as a leader in our industry! Thank you to all our customers and partners who have supported us on this journey. 🎉",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      platform: "Facebook",
      shareCounts: {
        twitter: 2,
        linkedin: 4,
        facebook: 8,
        other: 0
      }
    }
  ]
};

// Subscription plan limits
export const PLAN_LIMITS = {
  free: {
    aiRequests: 3,
    postsPerMonth: 3,
    drafts: 3
  },
  trial: {
    aiRequests: 5,
    postsPerMonth: 5,
    drafts: 5
  },
  basicMonth: {
    aiRequests: 70,
    postsPerMonth: 70,
    drafts: 30
  },
  basicYear: {
    aiRequests: 900,
    postsPerMonth: 75,  // 900/12 = 75 per month
    drafts: 30
  },
  flexy: {
    aiRequests: 20,
    postsPerMonth: 20,
    drafts: 10
  }
};

// Format date to readable string
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Calculate days remaining until expiry
export const getDaysRemaining = (expiryDate?: Date): number | null => {
  if (!expiryDate) return null;
  
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get subscription badge color class
export const getSubscriptionBadgeClass = (tier: string): string => {
  switch (tier) {
    case 'free': return 'status-badge-free';
    case 'trial': return 'status-badge-trial';
    case 'basicMonth': 
    case 'basicYear': return 'status-badge-basic';
    case 'flexy': return 'status-badge-flex';
    default: return 'status-badge-free';
  }
};
