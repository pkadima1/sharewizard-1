import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Users, Building2, Target, CheckCircle, Lightbulb, RotateCcw, Save } from 'lucide-react';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';
import TopicSuggestionEngine from '@/components/wizard/smart/TopicSuggestionEngine';
import { useAutoSave, getDraftInfo } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { WizardFormData } from '@/types/components';
import { useTranslation } from 'react-i18next';

// Helper function to get industry options with translations
const getIndustryOptions = (t: (key: string) => string) => [
  { 
    value: 'Marketing', 
    label: t('step1.industries.marketing'),
    suggestedAudiences: [t('step1.audienceTypes.smallBusiness'), t('step1.audienceTypes.marketingPros'), t('step1.audienceTypes.entrepreneurs'), t('step1.audienceTypes.students')],
    contentTypes: ['strategy guides', 'case studies', 'trend analysis']
  },
  { 
    value: 'Health', 
    label: t('step1.industries.health'),
    suggestedAudiences: [t('step1.audienceTypes.generalPublic'), t('step1.audienceTypes.healthcare'), t('step1.audienceTypes.patients'), t('step1.audienceTypes.fitness')],
    contentTypes: ['health tips', 'medical insights', 'wellness guides']
  },
  { 
    value: 'Technology', 
    label: t('step1.industries.technology'),
    suggestedAudiences: [t('step1.audienceTypes.techEnthusiasts'), t('step1.audienceTypes.developers'), t('step1.audienceTypes.itPros'), t('step1.audienceTypes.businessLeaders')],
    contentTypes: ['technical tutorials', 'product reviews', 'industry updates']
  },
  { 
    value: 'Finance', 
    label: t('step1.industries.finance'),
    suggestedAudiences: [t('step1.audienceTypes.investors'), t('step1.audienceTypes.financialPlanners'), t('step1.audienceTypes.smallBusiness'), t('step1.audienceTypes.youngPros')],
    contentTypes: ['investment guides', 'financial tips', 'market analysis']
  },
  { 
    value: 'Education', 
    label: t('step1.industries.education'),
    suggestedAudiences: [t('step1.audienceTypes.students'), t('step1.audienceTypes.educators'), t('step1.audienceTypes.parents'), t('step1.audienceTypes.professionals')],
    contentTypes: ['educational content', 'study guides', 'skill development']
  },
  { 
    value: 'Coaching', 
    label: t('step1.industries.coaching'),
    suggestedAudiences: [t('step1.audienceTypes.entrepreneurs'), t('step1.audienceTypes.professionals'), t('step1.audienceTypes.careerChangers'), t('step1.audienceTypes.personalDev')],
    contentTypes: ['motivational content', 'success strategies', 'personal growth']
  },
  { 
    value: 'E-commerce',
    label: t('step1.industries.ecommerce'),
    suggestedAudiences: [t('step1.audienceTypes.onlineSellers'), t('step1.audienceTypes.retailManagers'), t('step1.audienceTypes.consumers'), t('step1.audienceTypes.dropshippers')],
    contentTypes: ['product guides', 'buying advice', 'industry trends']
  },
  { 
    value: 'Food', 
    label: t('step1.industries.food'),
    suggestedAudiences: [t('step1.audienceTypes.foodEnthusiasts'), t('step1.audienceTypes.restaurantOwners'), t('step1.audienceTypes.homeCooks'), t('step1.audienceTypes.healthConscious')],
    contentTypes: ['recipes', 'restaurant reviews', 'nutrition guides']
  },
  { 
    value: 'Real Estate', 
    label: t('step1.industries.realEstate'),
    suggestedAudiences: [t('step1.audienceTypes.homeBuyers'), t('step1.audienceTypes.realEstateAgents'), t('step1.audienceTypes.investors'), t('step1.audienceTypes.renters')],
    contentTypes: ['market analysis', 'buying guides', 'investment strategies']
  },
  { 
    value: 'Travel', 
    label: t('step1.industries.travel'),
    suggestedAudiences: [t('step1.audienceTypes.travelers'), t('step1.audienceTypes.travelAgents'), t('step1.audienceTypes.localBusinesses'), t('step1.audienceTypes.adventureSeekers')],
    contentTypes: ['travel guides', 'destination reviews', 'travel tips']
  },
  { 
    value: 'Other', 
    label: t('step1.industries.other'),
    suggestedAudiences: [t('step1.audienceTypes.generalAudience'), t('step1.audienceTypes.professionals'), t('step1.audienceTypes.enthusiasts')],
    contentTypes: ['informational content', 'guides', 'insights']
  }
];

interface Step1Props {
  formData: WizardFormData & { customIndustry?: string };
  updateFormData: (key: string, value: string | number | string[]) => void;
}

const Step1WhatWho: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  const { t } = useTranslation('longform');
  const [topic, setTopic] = useState(formData.topic || '');
  const [audience, setAudience] = useState(formData.audience || '');
  const [industry, setIndustry] = useState(formData.industry || '');
  const [customIndustry, setCustomIndustry] = useState(formData.customIndustry || ''); // NEW: Custom industry field
  const [selectedAudienceType, setSelectedAudienceType] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const { toast } = useToast();

  // Get industry options with translations
  const INDUSTRY_OPTIONS = getIndustryOptions(t);

  // Auto-save functionality for this step
  const { hasSavedDraft, lastSaved, lastSavedFormatted, restoreDraft, clearDraft, saveNow } = useAutoSave(formData, {
    key: 'step1-what-who-draft',
    debounceMs: 1500,
    autoSaveIntervalMs: 20000,
    showToast: false
  });

  // Update parent form data when local state changes
  useEffect(() => {
    updateFormData('topic', topic);
  }, [topic]);

  useEffect(() => {
    updateFormData('audience', audience);
  }, [audience]);

  useEffect(() => {
    updateFormData('industry', industry);
  }, [industry]);

  // NEW: Update custom industry
  useEffect(() => {
    updateFormData('customIndustry', customIndustry);
  }, [customIndustry]);

  // Handle industry selection and suggest audiences
  const handleIndustryChange = (selectedIndustry) => {
    setIndustry(selectedIndustry);
    
    // Clear custom industry if not "Other"
    if (selectedIndustry !== 'Other') {
      setCustomIndustry('');
    }
    
    const industryData = INDUSTRY_OPTIONS.find(opt => opt.value === selectedIndustry);
    if (industryData && industryData.suggestedAudiences.length > 0) {
      // Don't auto-select, just make suggestions available
      setSelectedAudienceType('');
    }
  };

  // Handle audience type selection
  const handleAudienceTypeSelect = (audienceType) => {
    setSelectedAudienceType(audienceType);
    setAudience(audienceType);
  };

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setTopic(restoredData.topic || '');
      setAudience(restoredData.audience || '');
      setIndustry(restoredData.industry || '');
      setCustomIndustry(restoredData.customIndustry || ''); // NEW: Restore custom industry
      toast({
        title: t('wizard.draft.restored'),
        description: t('wizard.draft.restoredDesc'),
      });
    }
  };

  // Handle manual save
  const handleManualSave = () => {
    saveNow();
    toast({
      title: t('wizard.draft.saved'),
      description: t('wizard.draft.savedDesc'),
    });
  };

  // Get selected industry data for suggestions
  const selectedIndustryData = INDUSTRY_OPTIONS.find(opt => opt.value === industry);

  // Calculate completion score
  const completionScore = () => {
    let score = 0;
    if (topic.trim().length > 10) score += 40;
    if (audience.trim().length > 5) score += 30;
    if (industry) {
      if (industry === 'Other' && customIndustry.trim().length > 2) {
        score += 30; // Custom industry counts as valid
      } else if (industry !== 'Other') {
        score += 30; // Predefined industry counts as valid
      }
    }
    return Math.min(score, 100);
  };

  // Get the effective industry for suggestions (custom or selected)
  const getEffectiveIndustry = () => {
    if (industry === 'Other' && customIndustry.trim()) {
      return customIndustry;
    }
    return industry;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('step1.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('step1.subtitle')}
          </p>
        </div>

        {/* Draft Restoration */}
        {hasSavedDraft && (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  {t('wizard.draft.foundSaved', { 
                    time: getDraftInfo('step1-what-who-draft').timestamp?.toLocaleString() 
                  })}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRestoreDraft}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {t('wizard.draft.restore')}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearDraft}
                  className="text-amber-700 hover:bg-amber-100"
                >
                  {t('wizard.draft.dismiss')}
                </Button>
              </div>
            </div>
          </Card>
        )}        {/* Progress Indicator */}
        <QualityIndicator 
          input={topic || ''}
          type="topic"
          suggestions={[
            'Add a clear, specific topic (10+ characters)',
            'Define your target audience (5+ characters)',
            'Select an industry for better suggestions'
          ]}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Topic */}
          <Card className="p-6 border-2 border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t('step1.topic.title')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('step1.topic.subtitle')}</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('step1.topic.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('step1.topic.label')}
                  </Label>
                  <Textarea
                    id="topic"
                    placeholder={t('step1.topic.placeholder')}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[120px] resize-none border-2 focus:border-blue-500 transition-colors"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {t('step1.topic.characters', { count: topic.length })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTopicSuggestions(!showTopicSuggestions)}
                      className="flex items-center space-x-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span>{t('step1.topic.getIdeas')}</span>
                    </Button>
                  </div>
                </div>

                {/* Topic Quality Indicator */}
                {topic.trim().length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {topic.length >= 20 ? t('step1.qualityLabels.excellent') : topic.length >= 10 ? t('step1.qualityLabels.good') : t('step1.qualityLabels.addMoreDetails')}
                        </span>
                      </div>
                      <Badge variant={topic.length >= 20 ? 'default' : topic.length >= 10 ? 'secondary' : 'outline'}>
                        {topic.length >= 20 ? t('step1.qualityLabels.excellentBadge') : topic.length >= 10 ? t('step1.qualityLabels.goodBadge') : t('step1.qualityLabels.needsWork')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {showTopicSuggestions && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded">
                      <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-200">{t('step1.suggestions.smartTopicSuggestions')}</h4>
                  </div>
                  <TopicSuggestionEngine
                    industry={getEffectiveIndustry()}
                    audience={audience}
                    currentTopic={topic}
                    keywords={topic ? [topic] : []}
                    onTopicSelect={setTopic}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Right Column - Audience */}
          <Card className="p-6 border-2 border-green-100 dark:border-green-900/50 hover:border-green-200 dark:hover:border-green-800/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t('step1.audience.title')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('step1.audience.subtitle')}</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('step1.audience.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('step1.audience.industryLabel')}
                  </Label>
                  <Select value={industry} onValueChange={handleIndustryChange}>
                    <SelectTrigger className="border-2 focus:border-green-500 transition-colors">
                      <SelectValue placeholder={t('step1.audience.industryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced Custom Industry Field */}
                {industry === 'Other' && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                        <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Label htmlFor="customIndustry" className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                        {t('step1.audience.customIndustryLabel')}
                      </Label>
                    </div>
                    <Input
                      id="customIndustry"
                      placeholder={t('step1.audience.customIndustryPlaceholder')}
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      className="transition-all duration-200 border-2 border-blue-200 focus:border-blue-400 bg-white dark:bg-blue-950/50"
                    />
                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {t('step1.audience.customIndustryHint')}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Industry Status Indicator */}
                {industry && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {industry === 'Other' && customIndustry.trim() 
                          ? t('step1.completion.customIndustry', { industry: customIndustry })
                          : industry === 'Other' 
                          ? t('step1.completion.specifyCustom')
                          : t('step1.completion.selected', { industry: selectedIndustryData?.label })
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Audiences */}
              {selectedIndustryData && (
                <div className="space-y-3">
                  <Label>{t('step1.audience.suggestedAudiences', { industry: selectedIndustryData.label })}</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedIndustryData.suggestedAudiences.map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant={selectedAudienceType === suggestion ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleAudienceTypeSelect(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('step1.audience.audienceLabel')}
                  </Label>
                  <Textarea
                    id="audience"
                    placeholder={t('step1.audience.audiencePlaceholder')}
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="min-h-[120px] resize-none border-2 focus:border-green-500 transition-colors"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {t('step1.topic.characters', { count: audience.length })}
                    </span>
                    {audience.trim().length > 0 && (
                      <Badge variant={audience.length >= 20 ? 'default' : audience.length >= 10 ? 'secondary' : 'outline'}>
                        {audience.length >= 20 ? t('step1.qualityLabels.detailed') : audience.length >= 10 ? t('step1.qualityLabels.goodBadge') : t('step1.qualityLabels.addMore')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Audience Quality Indicator */}
                {audience.trim().length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {audience.length >= 20 ? t('step1.qualityLabels.greatAudience') : audience.length >= 10 ? t('step1.qualityLabels.goodAudience') : t('step1.qualityLabels.addMoreAudience')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Completion Status & Actions */}
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${completionScore() >= 80 ? 'bg-green-500' : completionScore() >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {t('step1.completion.stepCompletion', { score: completionScore() })}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {completionScore() >= 80 ? t('step1.completion.readyToProceed') : 
                 completionScore() >= 50 ? t('step1.completion.almostThere') : 
                 t('step1.completion.keepFilling')}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {lastSavedFormatted && (
                <span className="text-xs text-gray-500">
                  💾 {t('wizard.draft.savedTime', { time: lastSavedFormatted })}
                </span>
              )}
              <Button 
                onClick={handleManualSave}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 hover:bg-gray-100"
              >
                <Save className="h-4 w-4" />
                <span>{t('wizard.navigation.saveNow')}</span>
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  completionScore() >= 80 ? 'bg-green-500' : 
                  completionScore() >= 50 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${completionScore()}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Step1WhatWho;
