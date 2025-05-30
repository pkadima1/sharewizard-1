import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Users, Building2, Target, CheckCircle } from 'lucide-react';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';

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
    suggestedAudiences: ['Online Sellers', 'Retail Business Owners', 'Consumers', 'Marketing Professionals'],
    contentTypes: ['selling strategies', 'product guides', 'market trends']
  },
  { 
    value: 'Travel', 
    label: 'Travel & Tourism',
    suggestedAudiences: ['Travelers', 'Travel Agents', 'Tourism Professionals', 'Adventure Seekers'],
    contentTypes: ['travel guides', 'destination reviews', 'travel tips']
  },
  { 
    value: 'Food', 
    label: 'Food & Beverage',
    suggestedAudiences: ['Food Enthusiasts', 'Chefs', 'Restaurant Owners', 'Health-Conscious Consumers'],
    contentTypes: ['recipes', 'restaurant reviews', 'nutrition guides']
  },
  { 
    value: 'Fashion', 
    label: 'Fashion & Beauty',
    suggestedAudiences: ['Fashion Enthusiasts', 'Beauty Lovers', 'Style Influencers', 'Retail Professionals'],
    contentTypes: ['style guides', 'product reviews', 'trend forecasts']
  },
  { 
    value: 'Real Estate', 
    label: 'Real Estate',
    suggestedAudiences: ['Home Buyers', 'Real Estate Agents', 'Property Investors', 'Homeowners'],
    contentTypes: ['market analysis', 'buying guides', 'investment tips']
  },
  { 
    value: 'Entertainment', 
    label: 'Entertainment & Media',
    suggestedAudiences: ['Entertainment Fans', 'Content Creators', 'Media Professionals', 'General Public'],
    contentTypes: ['reviews', 'industry insights', 'entertainment news']
  },
  { 
    value: 'Other', 
    label: 'Other (Custom)',
    suggestedAudiences: ['General Public', 'Professionals', 'Enthusiasts', 'Beginners'],
    contentTypes: ['educational content', 'how-to guides', 'industry insights']
  }
];

// Audience options with tips and descriptions
const AUDIENCE_OPTIONS = [
  { 
    value: 'Beginners', 
    label: 'Beginners & Newcomers',
    tip: 'Focus on explaining basics clearly, avoid jargon, include step-by-step instructions',
    icon: '🎯',
    description: 'People new to your topic who need foundational knowledge'
  },
  { 
    value: 'Professionals', 
    label: 'Industry Professionals',
    tip: 'Use industry terminology, focus on advanced insights, efficiency improvements',
    icon: '👔',
    description: 'Experienced practitioners in your field'
  },
  { 
    value: 'Entrepreneurs', 
    label: 'Entrepreneurs & Founders',
    tip: 'Emphasize ROI, scaling strategies, business growth, and practical applications',
    icon: '🚀',
    description: 'Business owners and startup founders'
  },
  { 
    value: 'Students', 
    label: 'Students & Learners',
    tip: 'Structure content educationally, include examples, provide clear takeaways',
    icon: '📚',
    description: 'People actively learning or in educational programs'
  },
  { 
    value: 'Small Business Owners', 
    label: 'Small Business Owners',
    tip: 'Focus on cost-effective solutions, practical tools, time-saving strategies',
    icon: '🏪',
    description: 'Owners of small to medium businesses'
  },
  { 
    value: 'Corporate Executives', 
    label: 'Corporate Executives',
    tip: 'Emphasize strategic thinking, leadership insights, industry trends',
    icon: '🏢',
    description: 'Senior leaders in large organizations'
  },
  { 
    value: 'Tech Enthusiasts', 
    label: 'Tech Enthusiasts',
    tip: 'Include technical details, latest innovations, future predictions',
    icon: '💻',
    description: 'People passionate about technology and innovation'
  },
  { 
    value: 'General Public', 
    label: 'General Public',
    tip: 'Use accessible language, relatable examples, broad appeal topics',
    icon: '👥',
    description: 'Broad audience with varied backgrounds and interests'
  },
  { 
    value: 'Other', 
    label: 'Other (Custom)',
    tip: 'Define your specific audience clearly to create targeted content',
    icon: '🎯',
    description: 'Specify your unique target audience'
  }
];

const Step2TopicSelector = ({ formData, updateFormData }) => {
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [customAudience, setCustomAudience] = useState('');
  const [showCustomAudience, setShowCustomAudience] = useState(false);
  const [selectedIndustryData, setSelectedIndustryData] = useState(null);
  const [selectedAudienceData, setSelectedAudienceData] = useState(null);

  // Initialize from formData if available
  useEffect(() => {
    const industryMatch = INDUSTRY_OPTIONS.find(ind => ind.value === formData.industry);
    if (industryMatch) {
      setSelectedIndustryData(industryMatch);
    } else if (formData.industry && formData.industry !== 'Other') {
      setCustomIndustry(formData.industry);
      setShowCustomIndustry(true);
    }
    
    const audienceMatch = AUDIENCE_OPTIONS.find(aud => aud.value === formData.audience);
    if (audienceMatch) {
      setSelectedAudienceData(audienceMatch);
    } else if (formData.audience && formData.audience !== 'Other') {
      setCustomAudience(formData.audience);
      setShowCustomAudience(true);
    }
  }, []);

  const handleIndustryChange = (value) => {
    const industryData = INDUSTRY_OPTIONS.find(ind => ind.value === value);
    setSelectedIndustryData(industryData);
    
    if (value === 'Other') {
      setShowCustomIndustry(true);
      updateFormData('industry', customIndustry || '');
    } else {
      setShowCustomIndustry(false);
      updateFormData('industry', value);
    }
  };

  const handleCustomIndustryChange = (e) => {
    setCustomIndustry(e.target.value);
    updateFormData('industry', e.target.value);
  };

  const handleAudienceChange = (value) => {
    const audienceData = AUDIENCE_OPTIONS.find(aud => aud.value === value);
    setSelectedAudienceData(audienceData);
    
    if (value === 'Other') {
      setShowCustomAudience(true);
      updateFormData('audience', customAudience || '');
    } else {
      setShowCustomAudience(false);
      updateFormData('audience', value);
    }
  };

  const handleCustomAudienceChange = (e) => {
    setCustomAudience(e.target.value);
    updateFormData('audience', e.target.value);
  };

  // Generate preview text
  const getPreviewText = () => {
    const industry = formData.industry || '[industry]';
    const audience = formData.audience || '[audience]';
    const contentType = selectedIndustryData?.contentTypes?.[0] || 'content';
    
    return `Creating ${contentType} for ${audience} in ${industry}`;
  };

  // Get suggested audiences based on selected industry
  const getSuggestedAudiences = () => {
    if (!selectedIndustryData) return [];
    return selectedIndustryData.suggestedAudiences || [];
  };
  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Define Your Content Focus</h2>
          <p className="text-muted-foreground mt-1">
            Choose your industry and target audience to create more relevant, engaging content.
          </p>
        </div>

        {/* Preview Banner */}
        {(formData.industry || formData.audience) && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Content Preview
                </p>
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {getPreviewText()}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Industry Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">What's your industry?</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Your industry helps us suggest relevant topics, keywords, and content structures that resonate with your field.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Select 
                value={showCustomIndustry ? 'Other' : formData.industry} 
                onValueChange={handleIndustryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your industry or niche" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomIndustry && (
                <div className="mt-3 space-y-2">
                  <Input
                    id="custom-industry"
                    placeholder="e.g., Sustainable Fashion, Pet Care, Legal Tech, Non-profit..."
                    value={customIndustry}
                    onChange={handleCustomIndustryChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about your niche for better content suggestions
                  </p>
                </div>
              )}

              {/* Industry-based suggestions */}
              {selectedIndustryData && !showCustomIndustry && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Great for creating:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedIndustryData.contentTypes.map((type, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Audience Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Who is this content for?</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Understanding your audience helps tailor the tone, complexity, and focus of your content for maximum impact.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Select 
                value={showCustomAudience ? 'Other' : formData.audience} 
                onValueChange={handleAudienceChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your target audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((audience) => (
                    <SelectItem key={audience.value} value={audience.value}>
                      <div className="flex items-center gap-2">
                        <span>{audience.icon}</span>
                        <span>{audience.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomAudience && (
                <div className="mt-3 space-y-2">
                  <Input
                    id="custom-audience"
                    placeholder="e.g., New parents, Remote software developers, Small restaurant owners..."
                    value={customAudience}
                    onChange={handleCustomAudienceChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe your specific audience with their role, experience level, or interests
                  </p>
                </div>
              )}

              {/* Audience tips */}
              {selectedAudienceData && !showCustomAudience && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {selectedAudienceData.description}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          <strong>Content Tip:</strong> {selectedAudienceData.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested audiences from industry */}
              {selectedIndustryData && getSuggestedAudiences().length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Popular in {selectedIndustryData.label}:</p>
                  <div className="flex flex-wrap gap-1">
                    {getSuggestedAudiences().slice(0, 4).map((audience, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => {
                          const audienceData = AUDIENCE_OPTIONS.find(aud => aud.value === audience);
                          if (audienceData) {
                            handleAudienceChange(audience);
                          }
                        }}
                      >
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Topic Input Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">What's your main topic?</h3>
              </div>
              {formData.topic && (
                <QualityIndicator 
                  input={formData.topic}
                  type="topic"
                  suggestions={[]}
                />
              )}
            </div>
            
            <Textarea
              id="topic"
              placeholder="Examples:
• 10 Effective Digital Marketing Strategies for Small Businesses in 2025
• The Complete Guide to Remote Work Productivity for Tech Teams
• How AI is Transforming Customer Service in E-commerce
• Essential Financial Planning Tips for New Entrepreneurs"
              value={formData.topic || ''}
              onChange={(e) => updateFormData('topic', e.target.value)}
              className="w-full min-h-[120px]"
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Enter a specific title or describe your content focus with keywords</span>
              <span>{formData.topic?.length || 0} characters</span>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Step2TopicSelector;
