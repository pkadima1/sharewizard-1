import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Lightbulb, 
  Search,
  ThumbsUp,
  Eye,
  BookOpen,
  TrendingUp,
  Star,
  BarChart3,
  Zap,
  Target,
  Heart
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface InspirationTopicEngineProps {
  industry?: string;
  audience?: string;
  onTopicSelect: (topic: string) => void;
  currentTopic?: string;
  keywords?: string[]; // NEW: Use existing keywords for better suggestions
  contentGoal?: 'traffic' | 'engagement' | 'conversion' | 'education'; // NEW: Content purpose
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // NEW: Content complexity
  // NEW PROPS FOR AI INTEGRATION
  enableAI: boolean;
  openaiModel?: string;
  onAIIdeas?: (ideas: any[]) => void;
}

interface TopicTemplate {
  id: string;
  template: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  seoScore: number; // NEW: SEO potential
  engagementScore: number; // NEW: Engagement potential
  difficultyLevel: 'easy' | 'medium' | 'hard'; // NEW: Creation difficulty
}

interface TopicSuggestion {
  id: string;
  topic: string;
  template: string;
  confidence: number;
  reason: string;
  trendScore: number; // NEW: Trending potential
  competitionLevel: 'low' | 'medium' | 'high'; // NEW: Competition analysis
  estimatedViews: string; // NEW: Potential reach
  tags: string[]; // NEW: Topic categorization
  isFavorited?: boolean; // NEW: User favorites
}

interface SearchTrend {
  keyword: string;
  growth: number;
  volume: string;
}

const InspirationTopicEngine: React.FC<InspirationTopicEngineProps> = ({
  industry,
  audience,
  onTopicSelect,
  currentTopic,
  keywords = [], // NEW
  contentGoal = 'traffic', // NEW
  difficulty = 'intermediate', // NEW
  // NEW PROPS
  enableAI: enableAIProp,
  openaiModel = 'gpt-4o-mini',
  onAIIdeas
}) => {
  const { t } = useTranslation('longform');
  const { currentUser, userProfile } = useAuth();
  // --- AI toggle state with localStorage persistence ---
  const [enableAI, setEnableAI] = useState(() => {
    const stored = localStorage.getItem('topicEngineEnableAI');
    return stored ? stored === 'true' : false;
  });
  useEffect(() => {
    localStorage.setItem('topicEngineEnableAI', enableAI ? 'true' : 'false');
  }, [enableAI]);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [generatedTopics, setGeneratedTopics] = useState<Set<string>>(new Set()); // Track already generated topics

  // TODO: Add OpenAI integration for AI-powered topic suggestions
  // TODO: Implement AI idea generation when enableAI is true
  // TODO: Add OpenAI API calls using the openaiModel prop
  // TODO: Handle AI-generated ideas through onAIIdeas callback

  // Enhanced topic templates with more metadata
  const topicTemplates: TopicTemplate[] = useMemo(() => [
    {
      id: 'how-to',
      template: 'How to',
      icon: <BookOpen className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.howTo.description'),
      examples: ['How to start', 'How to improve', 'How to master'],
      seoScore: 95,
      engagementScore: 85,
      difficultyLevel: 'easy'
    },
    {
      id: 'ultimate-guide',
      template: 'Ultimate Guide',
      icon: <TrendingUp className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.ultimateGuide.description'),
      examples: ['The Ultimate Guide to', 'Complete Guide to', "Beginner's Guide to"],
      seoScore: 90,
      engagementScore: 80,
      difficultyLevel: 'hard'
    },
    {
      id: 'ways-to',
      template: 'X Ways to',
      icon: <Lightbulb className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.waysTo.description'),
      examples: ['5 Ways to', '10 Tips for', '7 Strategies to'],
      seoScore: 85,
      engagementScore: 90,
      difficultyLevel: 'medium'
    },
    {
      id: 'best-practices',
      template: 'Best Practices',
      icon: <Star className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.bestPractices.description'),
      examples: ['Best Practices for', 'Top Strategies for', 'Essential Tips for'],
      seoScore: 80,
      engagementScore: 75,
      difficultyLevel: 'medium'
    },
    {
      id: 'case-study',
      template: 'Case Study',
      icon: <BarChart3 className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.caseStudy.description'),
      examples: ['Case Study:', 'Success Story:', 'How [Company] Achieved'],
      seoScore: 75,
      engagementScore: 85,
      difficultyLevel: 'hard'
    },
    {
      id: 'trending',
      template: 'Trending',
      icon: <Zap className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.trending.description'),
      examples: ['2024 Trends in', 'What\'s New in', 'Future of'],
      seoScore: 70,
      engagementScore: 95,
      difficultyLevel: 'easy'
    },
    {
      id: 'comparison',
      template: 'VS Comparison',
      icon: <Target className="w-4 h-4" />,
      description: t('smartComponents.topicEngine.templates.comparison.description'),
      examples: ['X vs Y', 'Best X for', 'X Alternatives'],
      seoScore: 85,
      engagementScore: 80,
      difficultyLevel: 'medium'
    }
  ], [t]);

  // Enhanced industry topics with more granular categorization
  const industryTopics: Record<string, { 
    primary: string[], 
    trending: string[], 
    evergreen: string[] 
  }> = useMemo(() => ({
    'marketing': {
      primary: ['content marketing strategy', 'social media engagement', 'email marketing campaigns', 'brand storytelling'],
      trending: ['AI-powered marketing', 'voice search optimization', 'micro-influencer partnerships', 'privacy-first marketing'],
      evergreen: ['customer acquisition', 'conversion optimization', 'digital advertising', 'marketing analytics']
    },
    'technology': {
      primary: ['artificial intelligence implementation', 'cloud migration', 'cybersecurity best practices', 'software development lifecycle'],
      trending: ['quantum computing', 'edge computing', 'blockchain integration', 'no-code development'],
      evergreen: ['data analytics', 'automation tools', 'digital transformation', 'API integration']
    },
    'health': {
      primary: ['mental wellness', 'nutrition planning', 'fitness routines', 'preventive healthcare'],
      trending: ['telemedicine', 'wearable health tech', 'personalized medicine', 'mental health apps'],
      evergreen: ['stress management', 'healthy lifestyle habits', 'medical technology', 'patient care']
    },
    'finance': {
      primary: ['investment strategies', 'budgeting techniques', 'retirement planning', 'tax optimization'],
      trending: ['cryptocurrency investing', 'robo-advisors', 'sustainable investing', 'fintech innovations'],
      evergreen: ['financial literacy', 'wealth building', 'risk management', 'insurance planning']
    },
    'education': {
      primary: ['online learning strategies', 'student engagement', 'curriculum development', 'educational technology'],
      trending: ['AI tutoring', 'virtual reality learning', 'microlearning', 'gamified education'],
      evergreen: ['assessment methods', 'classroom management', 'skill development', 'learning analytics']
    },
    'e-commerce': {
      primary: ['online store optimization', 'customer experience', 'inventory management', 'conversion rate optimization'],
      trending: ['social commerce', 'AR shopping experiences', 'sustainable e-commerce', 'headless commerce'],
      evergreen: ['product photography', 'shipping strategies', 'customer retention', 'marketplace selling']
    }
  }), []);

  // NEW: Generate trending topics based on current events and seasonality
  const getTrendingTopics = useCallback((): SearchTrend[] => {
    const currentMonth = new Date().getMonth();
    const seasonalTopics: Record<number, SearchTrend[]> = {
      0: [{ keyword: 'New Year productivity', growth: 150, volume: '50K' }],
      1: [{ keyword: 'Valentine\'s Day marketing', growth: 200, volume: '30K' }],
      2: [{ keyword: 'Spring cleaning organization', growth: 120, volume: '40K' }],
      // Add more seasonal trends...
    };

    const industryTrends: SearchTrend[] = [
      { keyword: 'AI automation tools', growth: 180, volume: '80K' },
      { keyword: 'remote work best practices', growth: 90, volume: '60K' },
      { keyword: 'sustainable business practices', growth: 140, volume: '45K' }
    ];

    return [...(seasonalTopics[currentMonth] || []), ...industryTrends];
  }, []);

  // TODO: Add AI-powered topic generation when enableAI is true
  // TODO: Integrate OpenAI API for enhanced topic suggestions
  // TODO: Implement AI idea generation with proper error handling

  // 🧠 PERFECT INTELLIGENCE: Enhanced topic generation with multi-dimensional analysis
  const generateTopicSuggestions = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate realistic processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const newSuggestions: TopicSuggestion[] = [];
      const userTopic = currentTopic?.trim() || (keywords.length > 0 ? keywords[0] : '');
      
      // Generate more suggestions to ensure we can filter out duplicates
      const allPossibleSuggestions: TopicSuggestion[] = [];
      
      // 📊 INTELLIGENCE LAYER 1: Topic-Centric Suggestions
      if (userTopic) {
        const topicSuggestions = await generateTopicCentricSuggestions(userTopic, industry, audience);
        allPossibleSuggestions.push(...topicSuggestions);
      }
      
      // 🏭 INTELLIGENCE LAYER 2: Industry-Topic Fusion
      if (industry && userTopic) {
        const industryFusion = await generateIndustryTopicFusion(userTopic, industry, audience);
        allPossibleSuggestions.push(...industryFusion);
      }
      
      // 👥 INTELLIGENCE LAYER 3: Audience-Specific Adaptations
      if (audience && userTopic) {
        const audienceSpecific = await generateAudienceSpecificSuggestions(userTopic, audience, industry);
        allPossibleSuggestions.push(...audienceSpecific.slice(0, 2)); // Add some audience-specific
      }
      
      // 📈 INTELLIGENCE LAYER 4: Trend-Enhanced Topics
      if (userTopic) {
        const trendEnhanced = await generateTrendEnhancedTopics(userTopic, industry);
        allPossibleSuggestions.push(...trendEnhanced.slice(0, 2)); // Add some trend-enhanced
      }
      
      // 🎯 INTELLIGENCE LAYER 5: Fallback High-Quality Suggestions
      const fallbackSuggestions = await generateFallbackSuggestions(industry, audience, userTopic);
      allPossibleSuggestions.push(...fallbackSuggestions);
      
      // 🔥 INTELLIGENCE SCORING: Multi-factor relevance analysis
      const scoredSuggestions = allPossibleSuggestions.map(suggestion => ({
        ...suggestion,
        confidence: calculatePerfectScore(suggestion, userTopic, industry, audience),
        trendScore: calculateTrendScore(suggestion, userTopic),
        competitionLevel: analyzeCompetition(suggestion) as 'low' | 'medium' | 'high'
      }));
      
      // 🎲 INTELLIGENCE RANKING: Smart deduplication and ranking
      const uniqueSuggestions = deduplicateAndRank(scoredSuggestions);
      
      // 🎯 ENSURE DIFFERENT SUGGESTIONS: Filter out previously generated topics
      const newUniqueSuggestions = uniqueSuggestions.filter(suggestion => 
        !generatedTopics.has(suggestion.topic.toLowerCase())
      );
      
      // Take top 3 new suggestions, or fall back to any suggestions if we don't have enough new ones
      const finalSuggestions = newUniqueSuggestions.length >= 3 
        ? newUniqueSuggestions.slice(0, 3)
        : [...newUniqueSuggestions, ...uniqueSuggestions.filter(s => 
            !newUniqueSuggestions.includes(s)
          )].slice(0, 3);
      
      // Track generated topics to avoid repeats
      setGeneratedTopics(prev => {
        const updated = new Set(prev);
        finalSuggestions.forEach(suggestion => {
          updated.add(suggestion.topic.toLowerCase());
        });
        return updated;
      });
      
      setSuggestions(finalSuggestions);
      toast.success(t('smartComponents.topicEngine.messages.suggestionsGenerated', { count: finalSuggestions.length }));
      
    } catch (error) {
      console.error(t('smartComponents.topicEngine.debug.errorGenerating'), error);
      toast.error(t('smartComponents.topicEngine.messages.generationFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [industry, audience, keywords, currentTopic, topicTemplates, industryTopics, generatedTopics, t]);

  // 🎯 INTELLIGENCE FUNCTION 1: Topic-Centric Suggestions (ENHANCED FOR VARIETY)
  const generateTopicCentricSuggestions = async (topic: string, industry?: string, audience?: string): Promise<TopicSuggestion[]> => {
    const suggestions: TopicSuggestion[] = [];
    const cleanTopic = topic.toLowerCase().trim();
    
    // Expanded templates for more variety
    const topTemplates = [
      {
        pattern: `How ${topic} is Revolutionizing ${industry || t('smartComponents.topicEngine.fallbacks.industries')}`,
        reason: t('smartComponents.topicEngine.reasons.transformativeImpact', { topic }),
        confidence: 92,
        contentType: 'thought-leadership'
      },
      {
        pattern: `The Complete ${topic} Guide for ${audience || t('smartComponents.topicEngine.fallbacks.professionals')} in ${industry || t('smartComponents.topicEngine.fallbacks.anyIndustry')}`,
        reason: t('smartComponents.topicEngine.reasons.comprehensiveResource'),
        confidence: 89,
        contentType: 'ultimate-guide'
      },
      {
        pattern: `${topic} Strategy: ${new Date().getFullYear()} Implementation Roadmap`,
        reason: t('smartComponents.topicEngine.reasons.currentYearStrategy'),
        confidence: 87,
        contentType: 'strategy-guide'
      },
      {
        pattern: `10 Essential ${topic} Skills Every ${audience || t('smartComponents.topicEngine.fallbacks.professional')} Needs`,
        reason: t('smartComponents.topicEngine.reasons.skillFocused', { topic }),
        confidence: 85,
        contentType: 'skills-guide'
      },
      {
        pattern: `${topic} Mistakes That Are Costing ${industry || t('smartComponents.topicEngine.fallbacks.companies')} Millions`,
        reason: t('smartComponents.topicEngine.reasons.problemFocused'),
        confidence: 88,
        contentType: 'problem-solving'
      },
      {
        pattern: `The Future of ${topic}: What ${audience || t('smartComponents.topicEngine.fallbacks.experts')} Predict for ${new Date().getFullYear() + 1}`,
        reason: t('smartComponents.topicEngine.reasons.forwardLooking', { topic }),
        confidence: 84,
        contentType: 'future-trends'
      }
    ];
    
    // Randomize order to ensure variety
    const shuffledTemplates = topTemplates.sort(() => Math.random() - 0.5);
    
    shuffledTemplates.forEach((template, index) => {
      suggestions.push({
        id: `topic-centric-${Date.now()}-${index}`,
        topic: template.pattern,
        template: template.contentType,
        confidence: template.confidence,
        reason: template.reason,
        trendScore: Math.floor(Math.random() * 20) + 75,
        competitionLevel: 'medium',
        estimatedViews: calculateEstimatedViews(template.confidence),
        tags: ['topic-focused', template.contentType, cleanTopic.replace(/\s+/g, '-')]
      });
    });
    
    return suggestions;
  };

  // 🏭 INTELLIGENCE FUNCTION 2: Industry-Topic Fusion (ENHANCED FOR VARIETY)
  const generateIndustryTopicFusion = async (topic: string, industry: string, audience?: string): Promise<TopicSuggestion[]> => {
    const suggestions: TopicSuggestion[] = [];
    
    // Expanded industry-specific angles for more variety
    const topIndustryTemplates = [
      {
        pattern: `${topic} Investment Opportunities in ${industry}`,
        reason: t('smartComponents.topicEngine.reasons.financialPerspective', { topic, industry }),
        confidence: 88
      },
      {
        pattern: `${topic} Best Practices from Leading ${industry} Companies`,
        reason: t('smartComponents.topicEngine.reasons.caseStudies', { industry }),
        confidence: 89
      },
      {
        pattern: `How ${industry} Leaders Use ${topic} to Drive Growth`,
        reason: t('smartComponents.topicEngine.reasons.leadershipInsights', { topic, industry }),
        confidence: 86
      },
      {
        pattern: `${topic} Compliance and Regulations in ${industry}`,
        reason: t('smartComponents.topicEngine.reasons.regulatoryPerspective', { topic, industry }),
        confidence: 83
      },
      {
        pattern: `ROI of ${topic} Implementation in ${industry}`,
        reason: t('smartComponents.topicEngine.reasons.businessValue', { topic, industry }),
        confidence: 87
      }
    ];
    
    // Randomize order for variety
    const shuffledTemplates = topIndustryTemplates.sort(() => Math.random() - 0.5);
    
    shuffledTemplates.forEach((template, index) => {
      suggestions.push({
        id: `industry-fusion-${Date.now()}-${index}`,
        topic: template.pattern,
        template: 'industry-analysis',
        confidence: template.confidence,
        reason: template.reason,
        trendScore: Math.floor(Math.random() * 25) + 70,
        competitionLevel: 'medium',
        estimatedViews: calculateEstimatedViews(template.confidence),
        tags: ['industry-fusion', industry.toLowerCase().replace(/\s+/g, '-'), topic.toLowerCase().replace(/\s+/g, '-')]
      });
    });
    
    return suggestions;
  };

  // 👥 INTELLIGENCE FUNCTION 3: Audience-Specific Adaptations
  const generateAudienceSpecificSuggestions = async (topic: string, audience: string, industry?: string): Promise<TopicSuggestion[]> => {
    const suggestions: TopicSuggestion[] = [];
    
    // Audience intelligence mapping
    const audiencePatterns = {
      beginners: [
        `${topic} 101: Essential Basics for Newcomers`,
        `Getting Started with ${topic}: A Beginner's Journey`,
        `${topic} Explained Simply: No Prior Knowledge Required`
      ],
      professionals: [
        `Advanced ${topic} Strategies for Industry Professionals`,
        `${topic} Leadership: Executive Decision-Making Guide`,
        `${topic} Implementation: Professional Best Practices`
      ],
      entrepreneurs: [
        `${topic} Business Opportunities for Entrepreneurs`,
        `Building a ${topic}-Focused Startup in ${new Date().getFullYear()}`,
        `${topic} Revenue Streams: Entrepreneur's Guide`
      ],
      students: [
        `${topic} Research: Academic Perspectives and Findings`,
        `${topic} Career Paths: Student's Guide to the Future`,
        `${topic} Study Guide: Essential Knowledge for Students`
      ],
      investors: [
        `${topic} Investment Thesis: Portfolio Opportunities`,
        `${topic} Market Valuation and Investment Potential`,
        `${topic} Due Diligence: Investor's Checklist`
      ]
    };
    
    // Smart audience detection
    const audienceKey = Object.keys(audiencePatterns).find(key => 
      audience.toLowerCase().includes(key)
    ) || 'professionals';
    
    const patterns = audiencePatterns[audienceKey as keyof typeof audiencePatterns] || audiencePatterns.professionals;
    
    patterns.forEach((pattern, index) => {
      suggestions.push({
        id: `audience-${audienceKey}-${index}`,
        topic: pattern,
        template: 'audience-tailored',
        confidence: Math.floor(Math.random() * 15) + 80,
        reason: t('smartComponents.topicEngine.reasons.audienceSpecific', { audience, topic }),
        trendScore: Math.floor(Math.random() * 20) + 70,
        competitionLevel: 'low',
        estimatedViews: calculateEstimatedViews(80),
        tags: ['audience-specific', audienceKey, topic.toLowerCase().replace(/\s+/g, '-')]
      });
    });
    
    return suggestions;
  };

  // 📈 INTELLIGENCE FUNCTION 4: Trend-Enhanced Topics
  const generateTrendEnhancedTopics = async (topic: string, industry?: string): Promise<TopicSuggestion[]> => {
    const suggestions: TopicSuggestion[] = [];
    const currentYear = new Date().getFullYear();
    
    // Trend intelligence patterns
    const trendPatterns = [
      `${topic} Trends Shaping ${currentYear + 1}: What's Next?`,
      `${topic} Innovation Report: ${currentYear} Breakthrough Technologies`,
      `${topic} Market Predictions: ${currentYear}-${currentYear + 5} Outlook`,
      `${topic} Disruption: How It's Changing ${industry || t('smartComponents.topicEngine.fallbacks.industries')} Forever`
    ];
    
    trendPatterns.forEach((pattern, index) => {
      suggestions.push({
        id: `trend-${index}`,
        topic: pattern,
        template: 'trend-analysis',
        confidence: Math.floor(Math.random() * 20) + 75,
        reason: t('smartComponents.topicEngine.reasons.trendCapitalizes', { topic }),
        trendScore: Math.floor(Math.random() * 25) + 85,
        competitionLevel: 'low',
        estimatedViews: calculateEstimatedViews(85),
        tags: ['trending', 'future-focused', topic.toLowerCase().replace(/\s+/g, '-')]
      });
    });
    
    return suggestions;
  };

  // 🎯 INTELLIGENCE FUNCTION 5: Fallback High-Quality Suggestions (ENHANCED FOR VARIETY)
  const generateFallbackSuggestions = async (industry?: string, audience?: string, topic?: string): Promise<TopicSuggestion[]> => {
    const suggestions: TopicSuggestion[] = [];
    
    // Multiple high-quality fallback options
    const fallbackPatterns = [
      `Industry Insights: Latest Developments in ${industry || t('smartComponents.topicEngine.fallbacks.yourField')}`,
      `Expert Interview: ${audience || t('smartComponents.topicEngine.fallbacks.professional')} Perspectives on ${topic || t('smartComponents.topicEngine.fallbacks.industryTrends')}`,
      `Market Analysis: ${industry || t('smartComponents.topicEngine.fallbacks.industry')} Growth Opportunities in ${new Date().getFullYear()}`,
      `Technology Review: Essential Tools for ${audience || t('smartComponents.topicEngine.fallbacks.professionals')} in ${industry || t('smartComponents.topicEngine.fallbacks.anyField')}`,
      `Success Stories: How ${audience || t('smartComponents.topicEngine.fallbacks.companies')} Achieve Excellence in ${industry || t('smartComponents.topicEngine.fallbacks.theirIndustry')}`
    ];
    
    // Randomize and create suggestions
    const shuffledPatterns = fallbackPatterns.sort(() => Math.random() - 0.5);
    
    shuffledPatterns.forEach((pattern, index) => {
      suggestions.push({
        id: `fallback-${Date.now()}-${index}`,
        topic: pattern,
        template: 'general-guide',
        confidence: Math.floor(Math.random() * 15) + 65,
        reason: t('smartComponents.topicEngine.reasons.highQuality'),
        trendScore: Math.floor(Math.random() * 20) + 60,
        competitionLevel: 'medium',
        estimatedViews: '5K-15K',
        tags: ['fallback', 'general']
      });
    });
    
    return suggestions;
  };

  // 🔥 PERFECT SCORING ALGORITHM
  const calculatePerfectScore = (suggestion: TopicSuggestion, topic?: string, industry?: string, audience?: string): number => {
    let score = 0;
    const topicLower = topic?.toLowerCase() || '';
    const suggestionLower = suggestion.topic.toLowerCase();
    
    // Topic relevance (40% weight) - HIGHEST PRIORITY
    if (topic) {
      if (suggestionLower.includes(topicLower)) {
        score += 40;
      } else {
        // Semantic similarity check
        const topicWords = topicLower.split(' ').filter(word => word.length > 3);
        const matchingWords = topicWords.filter(word => suggestionLower.includes(word));
        score += (matchingWords.length / topicWords.length) * 30;
      }
    }
    
    // Industry alignment (25% weight)
    if (industry && suggestionLower.includes(industry.toLowerCase())) {
      score += 25;
    }
    
    // Audience targeting (20% weight)
    if (audience && suggestionLower.includes(audience.toLowerCase())) {
      score += 20;
    }
    
    // Content quality indicators (10% weight)
    const qualityTerms = ['guide', 'complete', 'how', 'strategies', 'analysis', 'trends', 'future'];
    const qualityMatches = qualityTerms.filter(term => suggestionLower.includes(term));
    score += (qualityMatches.length / qualityTerms.length) * 10;
    
    // SEO optimization (5% weight)
    const idealLength = suggestion.topic.length >= 30 && suggestion.topic.length <= 80;
    if (idealLength) score += 5;
    
    return Math.min(Math.round(score), 100);
  };

  // 📈 Trend Score Calculation
  const calculateTrendScore = (suggestion: TopicSuggestion, topic?: string): number => {
    const suggestionLower = suggestion.topic.toLowerCase();
    const currentYear = new Date().getFullYear();
    
    let trendScore = 60; // Base score
    
    // Trending keywords
    const trendingTerms = [currentYear.toString(), 'future', 'innovation', 'trends', 'disruption', 'transformation'];
    const trendMatches = trendingTerms.filter(term => suggestionLower.includes(term));
    trendScore += trendMatches.length * 8;
    
    // Topic freshness
    if (topic && suggestionLower.includes(topic.toLowerCase())) {
      trendScore += 15;
    }
    
    // Content type freshness
    const freshContentTypes = ['analysis', 'prediction', 'roadmap', 'strategy'];
    const freshMatches = freshContentTypes.filter(type => suggestionLower.includes(type));
    trendScore += freshMatches.length * 5;
    
    return Math.min(trendScore, 100);
  };

  // 🎲 Competition Analysis
  const analyzeCompetition = (suggestion: TopicSuggestion): string => {
    const topic = suggestion.topic.toLowerCase();
    
    // High competition indicators
    const highCompTerms = ['how to', 'guide', 'best', 'top'];
    const mediumCompTerms = ['strategies', 'analysis', 'overview'];
    
    const hasHighComp = highCompTerms.some(term => topic.includes(term));
    const hasMediumComp = mediumCompTerms.some(term => topic.includes(term));
    
    if (hasHighComp) return 'high';
    if (hasMediumComp) return 'medium';
    return 'low';
  };

  // 📊 Estimated Views Calculation
  const calculateEstimatedViews = (confidence: number): string => {
    if (confidence >= 90) return '50K-100K';
    if (confidence >= 85) return '30K-70K';
    if (confidence >= 80) return '20K-50K';
    if (confidence >= 75) return '15K-35K';
    if (confidence >= 70) return '10K-25K';
    return '5K-15K';
  };

  // 🎯 Smart Deduplication and Ranking
  const deduplicateAndRank = (suggestions: TopicSuggestion[]): TopicSuggestion[] => {
    // Remove duplicates based on semantic similarity
    const unique = suggestions.filter((suggestion, index, array) => {
      return !array.slice(0, index).some(existing => 
        calculateSimilarity(suggestion.topic, existing.topic) > 0.8
      );
    });
    
    // Rank by weighted score
    return unique.sort((a, b) => {
      const scoreA = (a.confidence * 0.6) + (a.trendScore * 0.4);
      const scoreB = (b.confidence * 0.6) + (b.trendScore * 0.4);
      return scoreB - scoreA;
    });
  };

  // 📊 Similarity Calculation (simplified)
  const calculateSimilarity = (topic1: string, topic2: string): number => {
    const words1 = topic1.toLowerCase().split(' ').filter(word => word.length > 3);
    const words2 = topic2.toLowerCase().split(' ').filter(word => word.length > 3);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  };

  // Auto-generate when dependencies change
  useEffect(() => {
    if (industry || audience || keywords.length > 0 || currentTopic) {
      generateTopicSuggestions();
    }
  }, [industry, audience, keywords.length, currentTopic]); // Fixed: Removed generateTopicSuggestions to prevent infinite loop

  // Handle topic selection with analytics
  const handleTopicSelect = useCallback((suggestion: TopicSuggestion) => {
    onTopicSelect(suggestion.topic);
    
    // Track selection analytics
    console.log(t('smartComponents.topicEngine.debug.topicSelected'), {
      topic: suggestion.topic,
      template: suggestion.template,
      confidence: suggestion.confidence,
      trendScore: suggestion.trendScore
    });
    
    toast.success(t('smartComponents.topicEngine.messages.topicSelected', { topic: suggestion.topic.slice(0, 50) }));
  }, [onTopicSelect, t]);

  // Handle favorites
  const toggleFavorite = useCallback((suggestionId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(suggestionId)) {
        newFavorites.delete(suggestionId);
        toast.info(t('smartComponents.topicEngine.messages.removedFromFavorites'));
      } else {
        newFavorites.add(suggestionId);
        toast.success(t('smartComponents.topicEngine.messages.addedToFavorites'));
      }
      return newFavorites;
    });
  }, [t]);

  // Copy topic to clipboard
  const copyToClipboard = useCallback(async (topic: string) => {
    try {
      await navigator.clipboard.writeText(topic);
      toast.success(t('smartComponents.topicEngine.messages.copiedToClipboard'));
    } catch (err) {
      toast.error(t('smartComponents.topicEngine.messages.copyFailed'));
    }
  }, [t]);

  // Get competition color
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  // --- UI: Add toggle switch ---
  return (
    <div className="space-y-4">
      {/* Toggle Switch for Template vs AI Enhanced */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('topicEngine.templatesLabel', 'Templates')}</span>
          <Switch
            checked={enableAI}
            onCheckedChange={setEnableAI}
            disabled={!currentUser}
            className="mx-2"
            aria-label={t('topicEngine.toggleLabel', 'Toggle AI Enhanced')}
          />
          <span className="text-sm font-medium flex items-center gap-1">
            <span>AI Enhanced</span>
            <span role="img" aria-label="AI">🤖</span>
          </span>
        </div>
        {/* Usage/plan/cost info will be added here in next step */}
      </div>
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t('smartComponents.topicEngine.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('smartComponents.topicEngine.description')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGeneratedTopics(new Set());
              generateTopicSuggestions();
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
            title={t('smartComponents.topicEngine.buttons.newTopicsTooltip')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('smartComponents.topicEngine.buttons.generating') : t('smartComponents.topicEngine.buttons.newTopics')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateTopicSuggestions}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('smartComponents.topicEngine.buttons.generating') : t('smartComponents.topicEngine.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* AI Disclaimer - Simplified */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <span className="text-sm font-medium">
            {t('smartComponents.topicEngine.disclaimer')}
          </span>
        </div>
      </div>

        {/* Topic Suggestions */}
        <div className="space-y-3">
          {isLoading ? (
            // Simple Loading Animation
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-yellow-500 animate-pulse" />
              </div>
              <h4 className="font-medium text-lg mb-2">{t('smartComponents.topicEngine.loading.title')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('smartComponents.topicEngine.loading.description')}
              </p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <Card 
                key={suggestion.id} 
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                  currentTopic === suggestion.topic 
                    ? 'border-l-primary bg-primary/5' 
                    : 'border-l-transparent hover:border-l-primary/50'
                }`}
                onClick={() => handleTopicSelect(suggestion)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="font-medium text-base leading-relaxed flex-1">
                        {suggestion.topic}
                      </h4>
                      {favorites.has(suggestion.id) && (
                        <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Simple metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {suggestion.confidence}% {t('smartComponents.topicEngine.metrics.match')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={`text-xs ${getCompetitionColor(suggestion.competitionLevel)}`}>
                          {t(`smartComponents.topicEngine.competition.${suggestion.competitionLevel}`)} {t('smartComponents.topicEngine.competition.label')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {suggestion.estimatedViews} {t('smartComponents.topicEngine.metrics.views')}
                      </div>
                    </div>
                    
                    {/* Reason */}
                    <p className="text-sm text-muted-foreground italic">
                      {suggestion.reason}
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(suggestion.id);
                      }}
                      className="h-8 w-8 p-0"
                      title={favorites.has(suggestion.id) ? t('smartComponents.topicEngine.buttons.removeFromFavorites') : t('smartComponents.topicEngine.buttons.addToFavorites')}
                    >
                      <Heart className={`h-4 w-4 ${favorites.has(suggestion.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTopicSelect(suggestion);
                      }}
                      className="text-sm"
                    >
                      {t('smartComponents.topicEngine.buttons.select')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {industry || audience || keywords.length > 0
                  ? t('smartComponents.topicEngine.noSuggestions.tryRefresh')
                  : t('smartComponents.topicEngine.noSuggestions.selectContext')
                }
              </p>
            </Card>
          )}
        </div>

        {/* Favorited Topics Section */}
        {favorites.size > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                {t('smartComponents.topicEngine.favorites.title', { count: favorites.size })}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFavorites(new Set())}
                className="text-xs h-6 px-2 text-red-600"
              >
                {t('smartComponents.topicEngine.favorites.clearAll')}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              {Array.from(favorites).map(id => {
                const suggestion = suggestions.find(s => s.id === id);
                return suggestion ? (
                  <div key={id} className="p-2 bg-red-50 dark:bg-red-950/30 rounded border-l-2 border-red-200">
                    <span className="font-medium text-sm">{suggestion.topic}</span>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTopicSelect(suggestion)}
                        className="text-xs h-6 px-2"
                      >
                        {t('smartComponents.topicEngine.buttons.select')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(id)}
                        className="text-xs h-6 px-2 text-red-600"
                      >
                        {t('smartComponents.topicEngine.buttons.remove')}
                      </Button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

export default InspirationTopicEngine; 