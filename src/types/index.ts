
export type SubscriptionTier = 'Free' | 'Lite' | 'Pro' | 'Flex';

export interface ShareCounts {
  twitter: number;
  linkedin: number;
  facebook: number;
  other: number; // For shares via web API (WhatsApp, Telegram, etc.)
}

export interface Post {
  id: string;
  content: string;
  createdAt: Date;
  platform: string;
  shareCounts: ShareCounts;
  imageUrl?: string;
}

export interface UserStats {
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  postsGenerated: number;
  postsDrafted: number;
  postsShared: {
    total: number;
    byPlatform: ShareCounts;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  profilePictureUrl: string;
  subscriptionTier: SubscriptionTier;
  planExpiryDate?: Date; // Only for Lite and Pro plans
  dateJoined: Date;
  stats: UserStats;
  recentPosts: Post[];
}
