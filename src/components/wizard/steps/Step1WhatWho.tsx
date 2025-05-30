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

// Predefined industry options with audience suggestions
const INDUSTRY_OPTIONS = [
  { 
    value: 'Marketing', 
    label: 'Marketing & Advertising',
    suggestedAudiences: ['Small Business Owners', 'Marketing Professionals', 'Entrepreneurs', 'Students'],
    contentTypes: ['strategy guides', 'case studies', 'trend analysis']
  },
  { 
    value: 'Health', 
    label: 'Health & Wellness',
    suggestedAudiences: ['General Public', 'Healthcare Providers', 'Patients', 'Fitness Enthusiasts'],
    contentTypes: ['health tips', 'medical insights', 'wellness guides']
  },
  { 
    value: 'Technology', 
    label: 'Technology & Software',
    suggestedAudiences: ['Tech Enthusiasts', 'Software Developers', 'IT Professionals', 'Business Leaders'],
    contentTypes: ['technical tutorials', 'product reviews', 'industry updates']
  },
  { 
    value: 'Finance', 
    label: 'Finance & Investment',
    suggestedAudiences: ['Investors', 'Financial Planners', 'Small Business Owners', 'Young Professionals'],
    contentTypes: ['investment guides', 'financial tips', 'market analysis']
  },
  { 
    value: 'Education', 
    label: 'Education & Learning',
    suggestedAudiences: ['Students', 'Educators', 'Parents', 'Professionals'],
    contentTypes: ['educational content', 'study guides', 'skill development']
  },
  { 
    value: 'Coaching', 
    label: 'Life & Business Coaching',
    suggestedAudiences: ['Entrepreneurs', 'Professionals', 'Career Changers', 'Personal Development Seekers'],
    contentTypes: ['motivational content', 'success strategies', 'personal growth']
  },
  { 
    value: 'E-commerce',
    label: 'E-commerce & Retail',
    suggestedAudiences: ['Online Sellers', 'Retail Managers', 'Consumers', 'Dropshippers'],
    contentTypes: ['product guides', 'buying advice', 'industry trends']
  },
  { 
    value: 'Food', 
    label: 'Food & Beverage',
    suggestedAudiences: ['Food Enthusiasts', 'Restaurant Owners', 'Home Cooks', 'Health-Conscious Consumers'],
    contentTypes: ['recipes', 'restaurant reviews', 'nutrition guides']
  },
  { 
    value: 'Real Estate', 
    label: 'Real Estate',
    suggestedAudiences: ['Home Buyers', 'Real Estate Agents', 'Investors', 'Renters'],
    contentTypes: ['market analysis', 'buying guides', 'investment strategies']
  },
  { 
    value: 'Travel', 
    label: 'Travel & Tourism',
    suggestedAudiences: ['Travelers', 'Travel Agents', 'Local Businesses', 'Adventure Seekers'],
    contentTypes: ['travel guides', 'destination reviews', 'travel tips']
  },
  { 
    value: 'Other', 
    label: 'Other Industry',
    suggestedAudiences: ['General Audience', 'Professionals', 'Enthusiasts'],
    contentTypes: ['informational content', 'guides', 'insights']
  }
];

const Step1WhatWho = ({ formData, updateFormData }) => {
  const [topic, setTopic] = useState(formData.topic || '');
  const [audience, setAudience] = useState(formData.audience || '');
  const [industry, setIndustry] = useState(formData.industry || '');
  const [selectedAudienceType, setSelectedAudienceType] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const { toast } = useToast();

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

  // Handle industry selection and suggest audiences
  const handleIndustryChange = (selectedIndustry) => {
    setIndustry(selectedIndustry);
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
      toast({
        title: "Draft Restored",
        description: "Your saved progress has been restored.",
      });
    }
  };

  // Handle manual save
  const handleManualSave = () => {
    saveNow();
    toast({
      title: "Progress Saved",
      description: "Your current progress has been saved.",
    });
  };

  // Get selected industry data for suggestions
  const selectedIndustryData = INDUSTRY_OPTIONS.find(opt => opt.value === industry);

  // Calculate completion score
  const completionScore = () => {
    let score = 0;
    if (topic.trim().length > 10) score += 40;
    if (audience.trim().length > 5) score += 30;
    if (industry) score += 30;
    return Math.min(score, 100);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            What & Who
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Define your topic and target audience to create focused, engaging content
          </p>
        </div>

        {/* Draft Restoration */}
        {hasSavedDraft && (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  Found saved draft from {getDraftInfo('step1-what-who-draft').timestamp?.toLocaleString()}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRestoreDraft}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Restore
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearDraft}
                  className="text-amber-700 hover:bg-amber-100"
                >
                  Dismiss
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
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">What will you write about?</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Be specific about your main topic. This helps generate more targeted content.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-3">
                <Label htmlFor="topic">Content Topic *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., 'How to improve email marketing open rates for small businesses' or 'The best productivity tools for remote teams'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {topic.length} characters
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTopicSuggestions(!showTopicSuggestions)}
                    className="flex items-center space-x-1"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Get Ideas</span>
                  </Button>
                </div>
              </div>

              {showTopicSuggestions && (
                <div className="mt-4">
                  <TopicSuggestionEngine
                    industry={industry}
                    audience={audience}
                    onTopicSelect={setTopic}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Right Column - Audience */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Who are you writing for?</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Understanding your audience helps tailor the content tone and complexity.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-3">
                <Label htmlFor="industry">Industry (optional)</Label>
                <Select value={industry} onValueChange={handleIndustryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry for better suggestions" />
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

              {/* Suggested Audiences */}
              {selectedIndustryData && (
                <div className="space-y-3">
                  <Label>Suggested Audiences</Label>
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

              <div className="space-y-3">
                <Label htmlFor="audience">Target Audience *</Label>
                <Textarea
                  id="audience"
                  placeholder="e.g., 'Small business owners who struggle with email marketing' or 'Remote workers looking to improve productivity'"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <span className="text-sm text-gray-500">
                  {audience.length} characters
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Manual Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleManualSave}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Progress</span>
          </Button>
        </div>        {/* Auto-save indicator */}
        {lastSavedFormatted && (
          <div className="text-center text-sm text-gray-500">
            Auto-saved {lastSavedFormatted}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Step1WhatWho;
