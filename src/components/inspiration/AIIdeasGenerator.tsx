/**
 * AIIdeasGenerator Component
 * v1.0.0 - Production Ready
 * 
 * Advanced AI-powered content idea generation with:
 * - Firebase Functions integration
 * - Authentication and usage tracking
 * - Retry logic with exponential backoff
 * - Fallback template-based ideas
 * - Offline support
 * - Usage limits and upgrade prompts
 * - Caching and duplicate prevention
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  Lightbulb, 
  Zap, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Users,
  FileText,
  BarChart3,
  Crown,
  Lock,
  Wifi,
  WifiOff,
  Info,
  ArrowRight,
  Star,
  Activity,
  Calendar,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';

// TypeScript interfaces
interface ContentIdea {
  title: string;
  description: string;
  targetKeywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'social_post' | 'blog_article';
  estimatedReadTime?: string;
  engagementScore?: number;
  seoPotential?: number;
}

interface GenerateContentIdeasResponse {
  socialPosts: ContentIdea[];
  blogArticles: ContentIdea[];
  requestsRemaining: number;
  usageStats: {
    totalRequests: number;
    dailyRequests: number;
    resetDate: string;
  };
  costInfo: {
    modelUsed: string;
    estimatedCost: number;
    tokensUsed?: number;
  };
}

interface AIIdeasGeneratorProps {
  keywords: string[];
  niche: string;
  trendingData?: string[];
  onIdeasGenerated?: (ideas: ContentIdea[]) => void;
  className?: string;
}

// Fallback template ideas for offline/error scenarios
const FALLBACK_TEMPLATES: ContentIdea[] = [
  {
    title: "5 Quick Tips for {niche} Success",
    description: "Share actionable tips that your audience can implement immediately to improve their {niche} results.",
    targetKeywords: ["tips", "success", "{niche}"],
    difficulty: "beginner",
    contentType: "social_post",
    estimatedReadTime: "2 min",
    engagementScore: 85,
    seoPotential: 70
  },
  {
    title: "Behind the Scenes: {niche} Insights",
    description: "Give your audience a peek into your {niche} process and share valuable insights from your experience.",
    targetKeywords: ["behind the scenes", "insights", "{niche}"],
    difficulty: "intermediate",
    contentType: "social_post",
    estimatedReadTime: "3 min",
    engagementScore: 90,
    seoPotential: 65
  },
  {
    title: "Common {niche} Mistakes to Avoid",
    description: "Help your audience learn from common pitfalls in the {niche} industry with practical advice.",
    targetKeywords: ["mistakes", "avoid", "{niche}"],
    difficulty: "intermediate",
    contentType: "social_post",
    estimatedReadTime: "4 min",
    engagementScore: 88,
    seoPotential: 75
  },
  {
    title: "The Ultimate Guide to {niche}",
    description: "Create a comprehensive resource that covers everything your audience needs to know about {niche}.",
    targetKeywords: ["guide", "ultimate", "{niche}"],
    difficulty: "advanced",
    contentType: "blog_article",
    estimatedReadTime: "8 min",
    engagementScore: 92,
    seoPotential: 90
  },
  {
    title: "How to Get Started with {niche}",
    description: "A beginner-friendly guide that helps newcomers understand the basics of {niche} and take their first steps.",
    targetKeywords: ["beginner", "get started", "{niche}"],
    difficulty: "beginner",
    contentType: "blog_article",
    estimatedReadTime: "6 min",
    engagementScore: 87,
    seoPotential: 80
  },
  {
    title: "Advanced {niche} Strategies for Experts",
    description: "Deep dive into advanced techniques and strategies for experienced {niche} professionals.",
    targetKeywords: ["advanced", "strategies", "{niche}"],
    difficulty: "advanced",
    contentType: "blog_article",
    estimatedReadTime: "10 min",
    engagementScore: 95,
    seoPotential: 85
  }
];

// Cache for storing generated ideas to prevent duplicate API calls
const ideaCache = new Map<string, { ideas: ContentIdea[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const AIIdeasGenerator: React.FC<AIIdeasGeneratorProps> = ({
  keywords,
  niche,
  trendingData = [],
  onIdeasGenerated,
  className = ''
}) => {
  const { t } = useTranslation('longform');
  const { currentUser, userProfile, checkRequestAvailability } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Firebase function call
  const generateContentIdeasFunction = httpsCallable<
    {
      niche: string;
      keywords: string[];
      trendingData?: string[];
      userId: string;
      language?: string;
    },
    GenerateContentIdeasResponse
  >(functions, 'generateContentIdeas');

  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Check usage limits on mount
  useEffect(() => {
    const checkUsage = async () => {
      if (!currentUser) return;
      
      try {
        const availability = await checkRequestAvailability();
        setRequestsRemaining(availability.canMakeRequest ? 3 : 0);
      } catch (error) {
        console.error('Error checking usage:', error);
      }
    };

    checkUsage();
  }, [currentUser, checkRequestAvailability]);

  // Generate cache key
  const cacheKey = useMemo(() => {
    const sortedKeywords = [...keywords].sort().join(',');
    const sortedTrends = [...trendingData].sort().join(',');
    return `${niche}:${sortedKeywords}:${sortedTrends}`;
  }, [niche, keywords, trendingData]);

  // Check cache for existing ideas
  const getCachedIdeas = useCallback(() => {
    const cached = ideaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.ideas;
    }
    return null;
  }, [cacheKey]);

  // Exponential backoff retry logic
  const retryWithBackoff = useCallback(async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Generate ideas with AI
  const generateIdeas = useCallback(async () => {
    if (!currentUser) {
      toast.error(t('aiIdeasGenerator.errors.notAuthenticated'));
      navigate('/login');
      return;
    }

    // Check if we have cached results
    const cachedIdeas = getCachedIdeas();
    if (cachedIdeas) {
      setGeneratedIdeas(cachedIdeas);
      onIdeasGenerated?.(cachedIdeas);
      toast.success(t('aiIdeasGenerator.messages.cachedIdeasLoaded'));
      return;
    }

    // Check usage limits
    try {
      const availability = await checkRequestAvailability();
      if (!availability.canMakeRequest) {
        setShowUpgradePrompt(true);
        toast.error(availability.message);
        return;
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }

    setIsGenerating(true);
    setError(null);
    setRetryCount(0);
    setGenerationProgress(0);
    setGenerationStage(t('aiIdeasGenerator.stages.initializing'));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const stageInterval = setInterval(() => {
        setGenerationStage(prev => {
          const stages = [
            t('aiIdeasGenerator.stages.analyzing'),
            t('aiIdeasGenerator.stages.generating'),
            t('aiIdeasGenerator.stages.optimizing'),
            t('aiIdeasGenerator.stages.finalizing')
          ];
          const currentIndex = stages.indexOf(prev);
          return stages[Math.min(currentIndex + 1, stages.length - 1)];
        });
      }, 1500);

      // Call Firebase function with retry logic
      const result = await retryWithBackoff(async () => {
        const response = await generateContentIdeasFunction({
          niche,
          keywords,
          trendingData,
          userId: currentUser.uid,
          language: 'en' // TODO: Get from language context
        });

        return response.data;
      });

      clearInterval(progressInterval);
      clearInterval(stageInterval);
      setGenerationProgress(100);
      setGenerationStage(t('aiIdeasGenerator.stages.complete'));

      // Combine social posts and blog articles
      const allIdeas = [...(result.socialPosts || []), ...(result.blogArticles || [])];
      
      // Cache the results
      ideaCache.set(cacheKey, {
        ideas: allIdeas,
        timestamp: Date.now()
      });

      setGeneratedIdeas(allIdeas);
      setRequestsRemaining(result.requestsRemaining);
      setUsageStats(result.usageStats);
      onIdeasGenerated?.(allIdeas);

      toast.success(t('aiIdeasGenerator.messages.ideasGenerated', { count: allIdeas.length }));

    } catch (error: any) {
      console.error('Error generating ideas:', error);
      
      // Handle specific error types
      if (error.code === 'unauthenticated') {
        toast.error(t('aiIdeasGenerator.errors.notAuthenticated'));
        navigate('/login');
        return;
      }
      
      if (error.code === 'resource-exhausted') {
        setShowUpgradePrompt(true);
        toast.error(t('aiIdeasGenerator.errors.limitReached'));
        return;
      }

      // Use fallback templates
      setError(t('aiIdeasGenerator.errors.generationFailed'));
      const fallbackIdeas = FALLBACK_TEMPLATES.map(template => ({
        ...template,
        title: template.title.replace(/{niche}/g, niche),
        description: template.description.replace(/{niche}/g, niche),
        targetKeywords: template.targetKeywords.map(kw => kw.replace(/{niche}/g, niche))
      }));
      
      setGeneratedIdeas(fallbackIdeas);
      onIdeasGenerated?.(fallbackIdeas);
      
      toast.warning(t('aiIdeasGenerator.messages.fallbackUsed'));
      
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('');
    }
  }, [currentUser, niche, keywords, trendingData, cacheKey, getCachedIdeas, checkRequestAvailability, generateContentIdeasFunction, retryWithBackoff, onIdeasGenerated, navigate, t]);

  // Handle idea selection
  const handleUseIdea = (idea: ContentIdea) => {
    toast.success(t('aiIdeasGenerator.messages.ideaSelected', { title: idea.title }));
    // TODO: Implement idea usage tracking
  };

  // Get difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: { variant: 'secondary' as const, color: 'text-green-600', icon: <CheckCircle2 className="w-3 h-3" /> },
      intermediate: { variant: 'outline' as const, color: 'text-yellow-600', icon: <AlertTriangle className="w-3 h-3" /> },
      advanced: { variant: 'destructive' as const, color: 'text-red-600', icon: <Zap className="w-3 h-3" /> }
    };
    return styles[difficulty as keyof typeof styles] || styles.beginner;
  };

  // Get content type badge styling
  const getContentTypeBadge = (contentType: string) => {
    const styles = {
      social_post: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Share2 className="w-3 h-3" /> },
      blog_article: { variant: 'outline' as const, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: <FileText className="w-3 h-3" /> }
    };
    return styles[contentType as keyof typeof styles] || styles.social_post;
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Header with AI Intelligence Indicators */}
        <Card className="p-4 border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {t('aiIdeasGenerator.title')}
                <Badge variant="secondary" className="text-xs">{t('aiIdeasGenerator.version')}</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('aiIdeasGenerator.subtitle')}
              </p>
              
              {/* AI Disclaimer */}
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <span className="text-xs font-medium">{t('aiIdeasGenerator.aiDisclaimer.title')}</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                  {t('aiIdeasGenerator.aiDisclaimer.text')}
                </p>
              </div>
              
              {/* Intelligence indicators */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t('aiIdeasGenerator.indicators.enhancedAi')}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {keywords.length} {t('aiIdeasGenerator.indicators.keywords')}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {trendingData.length} {t('aiIdeasGenerator.indicators.trends')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Usage indicator */}
              {requestsRemaining !== null && (
                <div className="flex items-center gap-2 text-xs">
                  <Crown className="h-3 w-3 text-yellow-600" />
                  <span className="text-muted-foreground">
                    {requestsRemaining}/3 {t('aiIdeasGenerator.usage.requestsRemaining')}
                  </span>
                </div>
              )}
              
              {/* Offline indicator */}
              {isOffline && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <WifiOff className="h-3 w-3" />
                  {t('aiIdeasGenerator.status.offline')}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateIdeas}
                disabled={isGenerating || !currentUser || isOffline}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? t('aiIdeasGenerator.buttons.generating') : t('aiIdeasGenerator.buttons.generate')}
              </Button>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{generationStage}</span>
                <span className="font-medium">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
        </Card>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                  {t('aiIdeasGenerator.upgrade.title')}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  {t('aiIdeasGenerator.upgrade.description')}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="flex items-center gap-1"
                  >
                    <Crown className="h-3 w-3" />
                    {t('aiIdeasGenerator.upgrade.upgradeButton')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpgradePrompt(false)}
                  >
                    {t('aiIdeasGenerator.upgrade.laterButton')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {t('aiIdeasGenerator.errors.fallbackMessage')}
            </p>
          </Card>
        )}

        {/* Generated Ideas Grid */}
        {generatedIdeas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                {t('aiIdeasGenerator.results.title')} ({generatedIdeas.length})
              </h4>
              
              {usageStats && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {usageStats.dailyRequests} {t('aiIdeasGenerator.usage.today')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('aiIdeasGenerator.usage.resetDate')}: {new Date(usageStats.resetDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedIdeas.map((idea, index) => {
                const difficultyBadge = getDifficultyBadge(idea.difficulty);
                const contentTypeBadge = getContentTypeBadge(idea.contentType);
                
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {idea.title}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2 line-clamp-3">
                            {idea.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge 
                          {...difficultyBadge} 
                          className={`text-xs flex items-center gap-1 ${difficultyBadge.color}`}
                        >
                          {difficultyBadge.icon}
                          {t(`aiIdeasGenerator.difficulty.${idea.difficulty}`)}
                        </Badge>
                        
                        <Badge 
                          {...contentTypeBadge} 
                          className={`text-xs flex items-center gap-1 ${contentTypeBadge.color}`}
                        >
                          {contentTypeBadge.icon}
                          {t(`aiIdeasGenerator.contentType.${idea.contentType}`)}
                        </Badge>
                      </div>
                      
                      {/* Keywords */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('aiIdeasGenerator.keywords.label')}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {idea.targetKeywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {idea.targetKeywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{idea.targetKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-blue-600" />
                          <span className="text-muted-foreground">{t('aiIdeasGenerator.metrics.engagement')}:</span>
                          <span className="font-medium">{idea.engagementScore || 85}%</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-muted-foreground">{t('aiIdeasGenerator.metrics.seo')}:</span>
                          <span className="font-medium">{idea.seoPotential || 75}%</span>
                        </div>
                        
                        {idea.estimatedReadTime && (
                          <div className="flex items-center gap-1 col-span-2">
                            <Clock className="h-3 w-3 text-purple-600" />
                            <span className="text-muted-foreground">{t('aiIdeasGenerator.metrics.readTime')}:</span>
                            <span className="font-medium">{idea.estimatedReadTime}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button
                        onClick={() => handleUseIdea(idea)}
                        className="w-full flex items-center gap-2"
                        size="sm"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {t('aiIdeasGenerator.buttons.useIdea')}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && generatedIdeas.length === 0 && !error && (
          <Card className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('aiIdeasGenerator.empty.title')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('aiIdeasGenerator.empty.description')}
            </p>
            <Button
              onClick={generateIdeas}
              disabled={!currentUser || isOffline}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {t('aiIdeasGenerator.buttons.generateFirst')}
            </Button>
          </Card>
        )}

        {/* Usage Statistics */}
        {usageStats && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">{t('aiIdeasGenerator.analytics.title')}</h4>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">{t('aiIdeasGenerator.analytics.totalRequests')}</p>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">{usageStats.totalRequests}</p>
              </div>
              
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">{t('aiIdeasGenerator.analytics.dailyRequests')}</p>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">{usageStats.dailyRequests}</p>
              </div>
              
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">{t('aiIdeasGenerator.analytics.requestsRemaining')}</p>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">{requestsRemaining}</p>
              </div>
              
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">{t('aiIdeasGenerator.analytics.resetDate')}</p>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">
                  {new Date(usageStats.resetDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AIIdeasGenerator; 