import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  TrendingUp, 
  Lightbulb, 
  Download,
  MapPin,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Target,
  Search,
  Brain,
  Zap,
  Star,
  Users,
  BarChart3,
  Clock,
  Eye,
  Heart,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  ShoppingCart,
  Building,
  Utensils,
  Dumbbell,
  Plane
} from 'lucide-react';
import { toast } from "sonner";
import SmartKeywordGenerator from './SmartKeywordGenerator';
import TopicSuggestionEngine from './TopicSuggestionEngine';
import GoogleTrendsWidget from './GoogleTrendsWidget';

// Enhanced interfaces for the multi-step flow
export interface InspirationData {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  trendScore: number;
  category: string;
  relatedKeywords: string[];
  lastUpdated: Date;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  estimatedEngagement: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface UserPreferences {
  selectedIndustry: string;
  customIndustry: string;
  selectedKeywords: string[];
  selectedTopics: string[];
  geoLocation: string;
  contentGoals: string[];
  savedIdeas: ContentIdea[];
}

export interface InspirationHubProps {
  onExport?: (ideas: ContentIdea[]) => void;
  initialPreferences?: Partial<UserPreferences>;
  className?: string;
}

// Popular industries with icons and descriptions
const POPULAR_INDUSTRIES = [
  { id: 'marketing', name: 'Marketing', icon: Target, description: 'Digital marketing, content strategy, social media' },
  { id: 'technology', name: 'Technology', icon: Zap, description: 'Software, AI, digital transformation' },
  { id: 'health', name: 'Health & Wellness', icon: Heart, description: 'Fitness, nutrition, mental health' },
  { id: 'finance', name: 'Finance', icon: BarChart3, description: 'Investment, budgeting, financial planning' },
  { id: 'education', name: 'Education', icon: Users, description: 'Learning, training, skill development' },
  { id: 'e-commerce', name: 'E-commerce', icon: ShoppingCart, description: 'Online retail, customer experience' },
  { id: 'real-estate', name: 'Real Estate', icon: Building, description: 'Property, investment, market analysis' },
  { id: 'food-cooking', name: 'Food & Cooking', icon: Utensils, description: 'Recipes, culinary arts, nutrition' },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, description: 'Workouts, training, health goals' },
  { id: 'travel', name: 'Travel', icon: Plane, description: 'Destinations, experiences, adventure' }
];

// Step configuration
const STEPS = [
  { id: 'niche', title: 'Niche Selection', icon: Target, description: 'Choose your industry or niche' },
  { id: 'keywords', title: 'Keywords & Trends', icon: TrendingUp, description: 'Generate keywords and explore trends' },
  { id: 'ideas', title: 'AI Ideas', icon: Brain, description: 'Get AI-powered content ideas' },
  { id: 'export', title: 'Export', icon: Download, description: 'Export selected ideas' }
];

const InspirationHub: React.FC<InspirationHubProps> = ({
  onExport,
  initialPreferences,
  className = ''
}) => {
  const { t } = useTranslation('inspiration-hub');
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    selectedIndustry: '',
    customIndustry: '',
    selectedKeywords: [],
    selectedTopics: [],
    geoLocation: '',
    contentGoals: [],
    savedIdeas: [],
    ...initialPreferences
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geoLocation, setGeoLocation] = useState<string>('');

  // Auto-detect user location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // Use reverse geocoding to get location name
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const data = await response.json();
              const location = data.countryName || 'United States';
              setGeoLocation(location);
              setUserPreferences(prev => ({ ...prev, geoLocation: location }));
            },
            () => {
              // Fallback to IP-based location or default
              setGeoLocation('United States');
              setUserPreferences(prev => ({ ...prev, geoLocation: 'United States' }));
            }
          );
        } else {
          setGeoLocation('United States');
          setUserPreferences(prev => ({ ...prev, geoLocation: 'United States' }));
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        setGeoLocation('United States');
        setUserPreferences(prev => ({ ...prev, geoLocation: 'United States' }));
      }
    };

    detectLocation();
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('inspirationHubPreferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inspirationHubPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    }
  }, []);

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle industry selection
  const handleIndustrySelect = useCallback((industry: string) => {
    updatePreferences({ selectedIndustry: industry, customIndustry: '' });
  }, [updatePreferences]);

  const handleCustomIndustry = useCallback((custom: string) => {
    updatePreferences({ customIndustry: custom, selectedIndustry: '' });
  }, [updatePreferences]);

  // Handle keyword selection
  const handleKeywordsChange = useCallback((keywords: string[]) => {
    updatePreferences({ selectedKeywords: keywords });
  }, [updatePreferences]);

  // Handle topic selection
  const handleTopicSelect = useCallback((topic: string) => {
    updatePreferences({ 
      selectedTopics: [...userPreferences.selectedTopics, topic]
    });
  }, [updatePreferences, userPreferences.selectedTopics]);

  // Handle idea generation
  const handleGenerateIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate AI idea generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const ideas: ContentIdea[] = [
        {
          id: '1',
          title: `Ultimate Guide to ${userPreferences.selectedIndustry || 'Your Industry'}`,
          description: 'Comprehensive resource covering all aspects of your chosen niche',
          platform: 'Blog',
          contentType: 'Guide',
          estimatedEngagement: 85,
          difficulty: 'medium',
          tags: ['guide', 'comprehensive', 'educational']
        },
        {
          id: '2',
          title: `Top 10 Trends in ${userPreferences.selectedIndustry || 'Your Industry'} for 2024`,
          description: 'Explore the latest trends and innovations in your field',
          platform: 'Social Media',
          contentType: 'Trend Analysis',
          estimatedEngagement: 92,
          difficulty: 'easy',
          tags: ['trends', '2024', 'innovation']
        },
        {
          id: '3',
          title: `How to Master ${userPreferences.selectedKeywords[0] || 'Key Skills'}`,
          description: 'Step-by-step tutorial for mastering essential skills',
          platform: 'Video',
          contentType: 'Tutorial',
          estimatedEngagement: 78,
          difficulty: 'hard',
          tags: ['tutorial', 'skills', 'mastery']
        }
      ];
      
      setGeneratedIdeas(ideas);
      toast.success(t('aiIdeas.ideasGenerated', { count: 3 }));
    } catch (error) {
      toast.error(t('aiIdeas.generationFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences.selectedIndustry, userPreferences.selectedKeywords]);

  // Handle idea selection
  const handleIdeaSelect = useCallback((idea: ContentIdea) => {
    updatePreferences({
      savedIdeas: [...userPreferences.savedIdeas, idea]
    });
    toast.success(t('aiIdeas.ideaAdded'));
  }, [updatePreferences, userPreferences.savedIdeas]);

  // Handle export
  const handleExport = useCallback(() => {
    if (userPreferences.savedIdeas.length === 0) {
      toast.error(t('export.noIdeasForExport'));
      return;
    }
    
    onExport?.(userPreferences.savedIdeas);
    toast.success(t('export.exportedIdeas', { count: userPreferences.savedIdeas.length }));
  }, [userPreferences.savedIdeas, onExport]);

  // Calculate progress
  const progress = useMemo(() => {
    return ((currentStep + 1) / STEPS.length) * 100;
  }, [currentStep]);

  // Check if current step is complete
  const isStepComplete = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Niche selection
        return userPreferences.selectedIndustry || userPreferences.customIndustry;
      case 1: // Keywords
        return userPreferences.selectedKeywords.length > 0;
      case 2: // AI Ideas
        return generatedIdeas.length > 0;
      case 3: // Export
        return userPreferences.savedIdeas.length > 0;
      default:
        return false;
    }
  }, [userPreferences, generatedIdeas]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <NicheSelectionStep 
          selectedIndustry={userPreferences.selectedIndustry}
          customIndustry={userPreferences.customIndustry}
          onIndustrySelect={handleIndustrySelect}
          onCustomIndustry={handleCustomIndustry}
          geoLocation={geoLocation}
        />;
      case 1:
        return <KeywordsTrendsStep 
          industry={userPreferences.selectedIndustry || userPreferences.customIndustry}
          selectedKeywords={userPreferences.selectedKeywords}
          onKeywordsChange={handleKeywordsChange}
          geoLocation={geoLocation}
        />;
      case 2:
        return <AIIdeasStep 
          industry={userPreferences.selectedIndustry || userPreferences.customIndustry}
          keywords={userPreferences.selectedKeywords}
          generatedIdeas={generatedIdeas}
          onGenerateIdeas={handleGenerateIdeas}
          onIdeaSelect={handleIdeaSelect}
          isLoading={isLoading}
        />;
      case 3:
        return <ExportStep 
          savedIdeas={userPreferences.savedIdeas}
          onExport={handleExport}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Lightbulb className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('progress.label')}</span>
              <span className="text-sm text-muted-foreground">
                {t('progress.step', { current: currentStep + 1, total: STEPS.length })}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{t(`steps.${step.id}.title`)}</div>
                    <div className="text-xs text-muted-foreground">{t(`steps.${step.id}.description`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('navigation.previous')}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={goToNextStep}
              disabled={!isStepComplete(currentStep)}
              className="flex items-center gap-2"
            >
              {t('navigation.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={userPreferences.savedIdeas.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('navigation.exportIdeas')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Components
interface NicheSelectionStepProps {
  selectedIndustry: string;
  customIndustry: string;
  onIndustrySelect: (industry: string) => void;
  onCustomIndustry: (custom: string) => void;
  geoLocation: string;
}

const NicheSelectionStep: React.FC<NicheSelectionStepProps> = ({
  selectedIndustry,
  customIndustry,
  onIndustrySelect,
  onCustomIndustry,
  geoLocation
}) => {
  const { t } = useTranslation('inspiration-hub');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('nicheSelection.title')}</h2>
        <p className="text-muted-foreground">
          {t('nicheSelection.description')}
        </p>
        {geoLocation && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {t('nicheSelection.detectedLocation', { location: geoLocation })}
          </div>
        )}
      </div>

      {/* Popular Industries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {POPULAR_INDUSTRIES.map((industry) => (
          <Card
            key={industry.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedIndustry === industry.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onIndustrySelect(industry.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <industry.icon className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                </div>
                {selectedIndustry === industry.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Industry */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">{t('nicheSelection.or')}</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-industry">{t('nicheSelection.customIndustry.label')}</Label>
          <div className="flex gap-2">
            <Input
              id="custom-industry"
              placeholder={t('nicheSelection.customIndustry.placeholder')}
              value={customIndustry}
              onChange={(e) => onCustomIndustry(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowCustom(!showCustom)}
            >
              {showCustom ? t('nicheSelection.customIndustry.hideExamples') : t('nicheSelection.customIndustry.showExamples')}
            </Button>
          </div>
        </div>

        {showCustom && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Sustainable Fashion', 'Digital Art', 'Pet Care', 'Home Improvement', 'Personal Finance', 'Mental Health'].map((example) => (
              <Badge
                key={example}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => onCustomIndustry(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface KeywordsTrendsStepProps {
  industry: string;
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  geoLocation: string;
}

const KeywordsTrendsStep: React.FC<KeywordsTrendsStepProps> = ({
  industry,
  selectedKeywords,
  onKeywordsChange,
  geoLocation
}) => {
  const { t } = useTranslation('inspiration-hub');
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('keywordsTrends.title')}</h2>
        <p className="text-muted-foreground">
          {t('keywordsTrends.description')}
        </p>
        {industry && (
          <Badge variant="secondary" className="text-sm">
            {t('keywordsTrends.industry', { industry })}
          </Badge>
        )}
      </div>

      <SmartKeywordGenerator
        industry={industry}
        selectedKeywords={selectedKeywords}
        onKeywordsChange={onKeywordsChange}
        enableTrendsIntegration={true}
        maxKeywords={20}
      />

              {geoLocation && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('keywordsTrends.regionalTrends')}</h3>
            </div>
            <GoogleTrendsWidget
              keywords={selectedKeywords.slice(0, 3)}
              geo={geoLocation}
            />
          </div>
        )}
    </div>
  );
};

interface AIIdeasStepProps {
  industry: string;
  keywords: string[];
  generatedIdeas: ContentIdea[];
  onGenerateIdeas: () => void;
  onIdeaSelect: (idea: ContentIdea) => void;
  isLoading: boolean;
}

const AIIdeasStep: React.FC<AIIdeasStepProps> = ({
  industry,
  keywords,
  generatedIdeas,
  onGenerateIdeas,
  onIdeaSelect,
  isLoading
}) => {
  const { t } = useTranslation('inspiration-hub');
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('aiIdeas.title')}</h2>
        <p className="text-muted-foreground">
          {t('aiIdeas.description')}
        </p>
      </div>

      {generatedIdeas.length === 0 ? (
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">{t('aiIdeas.readyToGenerate.title')}</h3>
            <p className="text-muted-foreground">
              {t('aiIdeas.readyToGenerate.description')}
            </p>
          </div>
          <Button
            onClick={onGenerateIdeas}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('aiIdeas.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('aiIdeas.generateIdeas')}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('aiIdeas.generatedIdeas')}</h3>
            <Button
              variant="outline"
              onClick={onGenerateIdeas}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('aiIdeas.generateMore')}
            </Button>
          </div>

          <div className="grid gap-4">
            {generatedIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {idea.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {idea.contentType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {idea.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onIdeaSelect(idea)}
                      className="ml-2"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ExportStepProps {
  savedIdeas: ContentIdea[];
  onExport: () => void;
}

const ExportStep: React.FC<ExportStepProps> = ({ savedIdeas, onExport }) => {
  const { t } = useTranslation('inspiration-hub');
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('export.title')}</h2>
        <p className="text-muted-foreground">
          {t('export.description')}
        </p>
      </div>

      {savedIdeas.length === 0 ? (
        <div className="text-center space-y-4">
          <Download className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">{t('export.noIdeasSelected.title')}</h3>
            <p className="text-muted-foreground">
              {t('export.noIdeasSelected.description')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('export.selectedIdeas', { count: savedIdeas.length })}</h3>
            <Button onClick={onExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('export.exportAll')}
            </Button>
          </div>

          <div className="grid gap-4">
            {savedIdeas.map((idea) => (
              <Card key={idea.id} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {idea.estimatedEngagement}% engagement
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {idea.difficulty} difficulty
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationHub; 