/**
 * useContentIdeaUsage Hook
 * 
 * Custom hook for managing content idea usage tracking with:
 * - Real-time usage monitoring
 * - Analytics and history tracking
 * - Integration with billing system
 * - Cost estimation for premium users
 * - Sharing functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, increment, collection, query, where, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_REQUEST_LIMIT } from '@/lib/constants';

// Enhanced interfaces for content idea tracking
export interface ContentIdeaUsage {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'social_post' | 'blog_article';
  generatedAt: Date;
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

export interface UsageAnalytics {
  totalIdeas: number;
  averageCost: number;
  totalCost: number;
  mostUsedPlatform: string;
  averageEngagement: number;
  topPerformingIdeas: ContentIdeaUsage[];
  dailyUsage: { date: string; count: number; cost: number }[];
  platformBreakdown: { platform: string; count: number }[];
  monthlyTrends: { month: string; count: number; cost: number }[];
  costBreakdown: { model: string; count: number; totalCost: number }[];
}

export interface UsageStatus {
  canGenerate: boolean;
  requestsUsed: number;
  requestsLimit: number;
  requestsRemaining: number;
  usagePercentage: number;
  planType: string;
  isPremium: boolean;
  isTrial: boolean;
  isFree: boolean;
  isRunningLow: boolean;
  isOutOfRequests: boolean;
  resetTime?: { hours: number; minutes: number };
  daysRemaining?: number;
  estimatedCostPerIdea?: number;
}

export interface UsageHistory {
  ideas: ContentIdeaUsage[];
  analytics: UsageAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

export const useContentIdeaUsage = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [usageHistory, setUsageHistory] = useState<ContentIdeaUsage[]>([]);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate current usage status
  const usageStatus: UsageStatus = useMemo(() => {
    if (!userProfile) {
      return {
        canGenerate: false,
        requestsUsed: 0,
        requestsLimit: 0,
        requestsRemaining: 0,
        usagePercentage: 0,
        planType: 'free',
        isPremium: false,
        isTrial: false,
        isFree: true,
        isRunningLow: false,
        isOutOfRequests: false
      };
    }

    const planType = userProfile.plan_type || 'free';
    const requestsUsed = userProfile.requests_used || 0;
    const requestsLimit = userProfile.requests_limit || DEFAULT_REQUEST_LIMIT.free;
    const requestsRemaining = requestsLimit - requestsUsed;
    const usagePercentage = Math.min((requestsUsed / requestsLimit) * 100, 100);

    const isPremium = planType.includes('premium');
    const isTrial = planType === 'trial';
    const isFree = planType === 'free';
    const isRunningLow = usagePercentage >= 80;
    const isOutOfRequests = usagePercentage >= 100;
    const canGenerate = !isOutOfRequests;

    // Calculate reset time
    const endDate = userProfile.trial_end_date || userProfile.reset_date;
    let resetTime: { hours: number; minutes: number } | undefined;
    let daysRemaining: number | undefined;

    if (endDate) {
      const resetDate = new Date(endDate);
      const now = new Date();
      const timeUntilReset = resetDate.getTime() - now.getTime();
      
      if (timeUntilReset > 0) {
        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        resetTime = { hours, minutes };
        daysRemaining = Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24));
      }
    }

    // Estimate cost for premium users
    const estimatedCostPerIdea = isPremium ? 0.002 : undefined; // $0.002 per idea estimate

    return {
      canGenerate,
      requestsUsed,
      requestsLimit,
      requestsRemaining,
      usagePercentage,
      planType,
      isPremium,
      isTrial,
      isFree,
      isRunningLow,
      isOutOfRequests,
      resetTime,
      daysRemaining,
      estimatedCostPerIdea
    };
  }, [userProfile]);

  // Load usage history
  const loadUsageHistory = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get usage history from Firestore
      const usageRef = collection(db, 'users', currentUser.uid, 'contentIdeas');
      const q = query(usageRef, orderBy('generatedAt', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ideas: ContentIdeaUsage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ideas.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            platform: data.platform,
            contentType: data.contentType,
            generatedAt: data.generatedAt?.toDate() || new Date(),
            cost: data.cost,
            tokensUsed: data.tokensUsed,
            engagementScore: data.engagementScore,
            seoPotential: data.seoPotential,
            shared: data.shared,
            shareCount: data.shareCount,
            userId: currentUser.uid,
            planType: data.planType || 'free',
            modelUsed: data.modelUsed,
            language: data.language
          });
        });
        
        setUsageHistory(ideas);
        calculateAnalytics(ideas);
      }, (error) => {
        console.error('Error loading usage history:', error);
        setError('Failed to load usage history');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading usage history:', error);
      setError('Failed to load usage history');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Calculate analytics from usage history
  const calculateAnalytics = useCallback((ideas: ContentIdeaUsage[]) => {
    if (ideas.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalIdeas = ideas.length;
    const totalCost = ideas.reduce((sum, idea) => sum + (idea.cost || 0), 0);
    const averageCost = totalCost / totalIdeas;

    // Platform breakdown
    const platformCounts = ideas.reduce((acc, idea) => {
      acc[idea.platform] = (acc[idea.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedPlatform = Object.entries(platformCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    const averageEngagement = ideas.reduce((sum, idea) => 
      sum + (idea.engagementScore || 0), 0) / totalIdeas;

    const topPerformingIdeas = [...ideas]
      .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
      .slice(0, 3);

    // Daily usage (last 30 days)
    const dailyUsage = ideas.reduce((acc, idea) => {
      const date = idea.generatedAt.toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.count++;
        existing.cost += idea.cost || 0;
      } else {
        acc.push({ date, count: 1, cost: idea.cost || 0 });
      }
      return acc;
    }, [] as { date: string; count: number; cost: number }[]);

    // Monthly trends
    const monthlyTrends = ideas.reduce((acc, idea) => {
      const month = idea.generatedAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = acc.find(m => m.month === month);
      if (existing) {
        existing.count++;
        existing.cost += idea.cost || 0;
      } else {
        acc.push({ month, count: 1, cost: idea.cost || 0 });
      }
      return acc;
    }, [] as { month: string; count: number; cost: number }[]);

    // Platform breakdown
    const platformBreakdown = Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count
    }));

    // Cost breakdown by model
    const costBreakdown = ideas.reduce((acc, idea) => {
      const model = idea.modelUsed || 'unknown';
      const existing = acc.find(c => c.model === model);
      if (existing) {
        existing.count++;
        existing.totalCost += idea.cost || 0;
      } else {
        acc.push({ model, count: 1, totalCost: idea.cost || 0 });
      }
      return acc;
    }, [] as { model: string; count: number; totalCost: number }[]);

    setAnalytics({
      totalIdeas,
      averageCost,
      totalCost,
      mostUsedPlatform,
      averageEngagement,
      topPerformingIdeas,
      dailyUsage: dailyUsage.slice(0, 30), // Last 30 days
      platformBreakdown,
      monthlyTrends,
      costBreakdown
    });
  }, []);

  // Record a new content idea generation
  const recordContentIdea = useCallback(async (idea: Omit<ContentIdeaUsage, 'id' | 'userId' | 'generatedAt'>) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const ideaData = {
        ...idea,
        userId: currentUser.uid,
        generatedAt: new Date(),
        planType: userProfile?.plan_type || 'free'
      };

      // Add to Firestore
      const usageRef = collection(db, 'users', currentUser.uid, 'contentIdeas');
      const docRef = await addDoc(usageRef, ideaData);

      // Update usage count
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        requests_used: increment(1)
      });

      // Add to local state
      const newIdea: ContentIdeaUsage = {
        ...ideaData,
        id: docRef.id
      };

      setUsageHistory(prev => [newIdea, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Content idea recorded successfully',
      });
      return newIdea;
    } catch (error) {
      console.error('Error recording content idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to record content idea',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentUser, userProfile, toast]);

  // Share a content idea
  const shareContentIdea = useCallback(async (ideaId: string, platform?: string) => {
    try {
      const idea = usageHistory.find(i => i.id === ideaId);
      if (!idea) {
        throw new Error('Idea not found');
      }

      // Update share count in Firestore
      const ideaRef = doc(db, 'users', currentUser!.uid, 'contentIdeas', ideaId);
      await updateDoc(ideaRef, {
        shared: true,
        shareCount: increment(1)
      });

      // Update local state
      setUsageHistory(prev => prev.map(i => 
        i.id === ideaId 
          ? { ...i, shared: true, shareCount: (i.shareCount || 0) + 1 }
          : i
      ));

      // Handle actual sharing
      const shareText = `${idea.title}\n\n${idea.description}\n\nGenerated with EngagePerfect AI`;
      
      if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(idea.title)}&summary=${encodeURIComponent(idea.description)}`);
      } else if (navigator.share) {
        await navigator.share({
          title: idea.title,
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast({
          title: 'Success',
          description: 'Content idea copied to clipboard',
        });
      }

      return true;
    } catch (error) {
      console.error('Error sharing content idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to share content idea',
        variant: 'destructive',
      });
      return false;
    }
  }, [usageHistory, currentUser, toast]);

  // Export usage data
  const exportUsageData = useCallback((format: 'csv' | 'json') => {
    try {
      const data = usageHistory.map(idea => ({
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        contentType: idea.contentType,
        generatedAt: idea.generatedAt.toISOString(),
        cost: idea.cost,
        engagementScore: idea.engagementScore,
        seoPotential: idea.seoPotential,
        shared: idea.shared,
        shareCount: idea.shareCount,
        modelUsed: idea.modelUsed,
        language: idea.language
      }));

      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'csv') {
        const headers = 'Title,Description,Platform,Content Type,Generated At,Cost,Engagement Score,SEO Potential,Shared,Share Count,Model Used,Language\n';
        const rows = data.map(row => 
          `"${row.title}","${row.description}","${row.platform}","${row.contentType}","${row.generatedAt}",${row.cost},${row.engagementScore},${row.seoPotential},${row.shared},${row.shareCount},"${row.modelUsed}","${row.language}"`
        ).join('\n');
        content = headers + rows;
        filename = `content-ideas-usage-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(data, null, 2);
        filename = `content-ideas-usage-${Date.now()}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Usage data exported as ${format.toUpperCase()}`,
      });
      return true;
    } catch (error) {
      console.error('Error exporting usage data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export usage data',
        variant: 'destructive',
      });
      return false;
    }
  }, [usageHistory, toast]);

  // Check if user can generate content ideas
  const canGenerateContentIdea = useCallback(() => {
    return usageStatus.canGenerate;
  }, [usageStatus.canGenerate]);

  // Get cost estimate for next generation
  const getCostEstimate = useCallback(() => {
    if (!usageStatus.isPremium) return 0;
    return usageStatus.estimatedCostPerIdea || 0;
  }, [usageStatus.isPremium, usageStatus.estimatedCostPerIdea]);

  // Load history on mount
  useEffect(() => {
    if (currentUser) {
      loadUsageHistory();
    }
  }, [currentUser, loadUsageHistory]);

  return {
    // State
    usageStatus,
    usageHistory: {
      ideas: usageHistory,
      analytics,
      isLoading,
      error
    },
    
    // Actions
    recordContentIdea,
    shareContentIdea,
    exportUsageData,
    loadUsageHistory,
    
    // Utilities
    canGenerateContentIdea,
    getCostEstimate
  };
};

export default useContentIdeaUsage; 