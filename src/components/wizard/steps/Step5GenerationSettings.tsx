/**
 * Step5GenerationSettings.tsx
 * v1.0.0
 * Purpose: Enhanced generation settings with smart content recommendations,
 * SEO optimization badges, reading level indicators, format selection,
 * estimated generation time, and plagiarism check toggle
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  Info, 
  Clock, 
  Target, 
  Shield,
  FileText,
  Download,
  Globe,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  BookOpen,
  Star,
  Zap
} from 'lucide-react';

// Content type configurations for smart recommendations
const CONTENT_TYPE_CONFIGS = {
  'blog-article': {
    optimalRange: [1200, 1800],
    readingLevel: 'Intermediate',
    avgGenerationTime: 3.5,
    description: 'Blog articles perform best with comprehensive coverage'
  },
  'newsletter': {
    optimalRange: [800, 1200],
    readingLevel: 'Beginner',
    avgGenerationTime: 2.5,
    description: 'Newsletters should be concise and easily digestible'
  },
  'case-study': {
    optimalRange: [1500, 2500],
    readingLevel: 'Advanced',
    avgGenerationTime: 4.5,
    description: 'Case studies require detailed analysis and examples'
  },
  'guide': {
    optimalRange: [2000, 3000],
    readingLevel: 'Intermediate',
    avgGenerationTime: 5.0,
    description: 'Comprehensive guides need thorough step-by-step coverage'
  },
  'thought-piece': {
    optimalRange: [1000, 1500],
    readingLevel: 'Advanced',
    avgGenerationTime: 3.0,
    description: 'Thought pieces balance depth with readability'
  }
};

// Format options
const FORMAT_OPTIONS = [
  {
    value: 'markdown',
    label: 'Markdown',
    icon: FileText,
    description: 'Perfect for developers and technical content',
    features: ['Clean formatting', 'GitHub compatible', 'Easy to edit']
  },
  {
    value: 'html',
    label: 'HTML',
    icon: Globe,
    description: 'Ready for web publishing',
    features: ['Web-ready', 'SEO optimized', 'Styled output']
  },
  {
    value: 'gdocs',
    label: 'Google Docs',
    icon: Download,
    description: 'Collaborative editing and sharing',
    features: ['Team collaboration', 'Comment system', 'Version history']
  }
];

// Reading level configurations
const READING_LEVELS = {
  'Beginner': {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: Users,
    description: 'Easy to understand for general audiences'
  },
  'Intermediate': {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: BookOpen,
    description: 'Suitable for informed readers'
  },
  'Advanced': {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: Star,
    description: 'Detailed content for experts'
  }
};

const Step5GenerationSettings = ({ formData, updateFormData }) => {
  // Initialize default values
  useEffect(() => {
    if (!formData.outputFormat) updateFormData('outputFormat', 'markdown');
    if (formData.plagiarismCheck === undefined) updateFormData('plagiarismCheck', true);
  }, []);

  // Get content type configuration
  const contentConfig = useMemo(() => {
    return CONTENT_TYPE_CONFIGS[formData.contentType] || CONTENT_TYPE_CONFIGS['blog-article'];
  }, [formData.contentType]);

  // Calculate word count recommendations
  const getWordCountRecommendations = () => {
    const currentCount = formData.wordCount || 800;
    const [min, max] = contentConfig.optimalRange;
    
    if (currentCount >= 1200 && currentCount <= 1800) {
      return {
        status: 'seo-optimal',
        message: 'SEO Optimal Range',
        color: 'text-green-600',
        icon: CheckCircle2
      };
    } else if (currentCount >= min && currentCount <= max) {
      return {
        status: 'content-optimal',
        message: 'Optimal for Content Type',
        color: 'text-blue-600',
        icon: Target
      };
    } else if (currentCount < min) {
      return {
        status: 'too-short',
        message: 'Consider adding more content',
        color: 'text-amber-600',
        icon: AlertTriangle
      };
    } else {
      return {
        status: 'too-long',
        message: 'May be too long for engagement',
        color: 'text-amber-600',
        icon: AlertTriangle
      };
    }
  };

  // Calculate estimated generation time
  const getEstimatedTime = () => {
    const baseTime = contentConfig.avgGenerationTime;
    const wordCountMultiplier = (formData.wordCount || 800) / 1000;
    const complexityMultiplier = formData.includeStats ? 1.3 : 1;
    const mediaMultiplier = formData.includeImages ? 1.2 : 1;
    
    return Math.round(baseTime * wordCountMultiplier * complexityMultiplier * mediaMultiplier * 10) / 10;
  };

  const wordCountRec = getWordCountRecommendations();
  const estimatedTime = getEstimatedTime();

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">Generation Settings</h2>
          <p className="text-muted-foreground">
            Customize your content generation with smart recommendations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Word Count & Recommendations */}
          <Card className="p-4 space-y-4 border-l-4 border-l-blue-500 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Content Length
            </h3>

            {/* Word Count Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="word-count" className="text-sm font-medium">
                  Word Count: {formData.wordCount || 800}
                </Label>
                <div className="flex gap-2">
                  {/* SEO Optimal Badge */}
                  {wordCountRec.status === 'seo-optimal' && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      SEO Optimal
                    </Badge>
                  )}                  <Badge variant="outline" className={wordCountRec.color}>
                    {(() => {
                      const IconComponent = wordCountRec.icon;
                      return <IconComponent className="h-3 w-3 mr-1" />;
                    })()}
                    {wordCountRec.message}
                  </Badge>
                </div>
              </div>
              
              <input
                id="word-count"
                type="range"
                className="w-full accent-blue-500 h-2 bg-blue-100 dark:bg-blue-900 rounded-full appearance-none cursor-pointer"
                min="300"
                max="3000"
                step="100"
                value={formData.wordCount || 800}
                onChange={(e) => updateFormData('wordCount', parseInt(e.target.value))}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300</span>
                <span className="font-medium text-green-600">1200-1800 (SEO Optimal)</span>
                <span>3000</span>
              </div>
            </div>

            {/* Content Type Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Recommendation for {formData.contentType || 'blog-article'}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {contentConfig.description}
              </p>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-blue-600 dark:text-blue-400">
                  Optimal: {contentConfig.optimalRange[0]}-{contentConfig.optimalRange[1]} words
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  Level: {contentConfig.readingLevel}
                </span>
              </div>
            </div>
          </Card>

          {/* Reading Level & Time Estimate */}
          <Card className="p-4 space-y-4 border-l-4 border-l-purple-500 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Generation Details
            </h3>

            {/* Reading Level Indicator */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reading Level</Label>              <div className="flex items-center gap-3">
                <Badge className={READING_LEVELS[contentConfig.readingLevel].color}>
                  {(() => {
                    const IconComponent = READING_LEVELS[contentConfig.readingLevel].icon;
                    return <IconComponent className="h-3 w-3 mr-1" />;
                  })()}
                  {contentConfig.readingLevel}
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{READING_LEVELS[contentConfig.readingLevel].description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Estimated Generation Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estimated Generation Time</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{estimatedTime} minutes</span>
                </div>
                <div className="flex-1">
                  <Progress value={Math.min((estimatedTime / 8) * 100, 100)} className="h-2" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on content complexity, word count, and additional features
              </p>
            </div>

            {/* Generation Features */}
            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md space-y-2">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Generation Features
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.includeImages ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Image suggestions {formData.includeImages ? 'enabled' : 'disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.includeStats ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Statistics & data {formData.includeStats ? 'enabled' : 'disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.keywords?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>SEO optimization {formData.keywords?.length > 0 ? 'active' : 'basic'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Format Selection */}
        <Card className="p-4 space-y-4 border-l-4 border-l-green-500 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Output Format
          </h3>

          <div className="grid gap-3 md:grid-cols-3">
            {FORMAT_OPTIONS.map((format) => (
              <div
                key={format.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-green-500 ${
                  formData.outputFormat === format.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border'
                }`}
                onClick={() => updateFormData('outputFormat', format.value)}
              >                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const IconComponent = format.icon;
                    return <IconComponent className="h-4 w-4 text-green-600" />;
                  })()}
                  <span className="font-medium">{format.label}</span>
                  {formData.outputFormat === format.value && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {format.description}
                </p>
                <div className="space-y-1">
                  {format.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Advanced Options */}
        <Card className="p-4 space-y-4 border-l-4 border-l-amber-500 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Advanced Options
          </h3>

          <div className="space-y-4">
            {/* Plagiarism Check Toggle */}
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-amber-600" />
                <div>
                  <Label htmlFor="plagiarismCheck" className="text-sm font-medium">
                    Plagiarism Check
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verify content originality and detect potential issues
                  </p>
                </div>
              </div>
              <Switch
                id="plagiarismCheck"
                checked={formData.plagiarismCheck !== false}
                onCheckedChange={(checked) => updateFormData('plagiarismCheck', checked)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            {/* Additional Image Suggestions */}
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <Label htmlFor="includeImages" className="text-sm font-medium">
                    Include Image Suggestions
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will suggest relevant images and visual elements
                  </p>
                </div>
              </div>
              <Switch
                id="includeImages"
                checked={formData.includeImages}
                onCheckedChange={(checked) => updateFormData('includeImages', checked)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </Card>

        {/* Smart Recommendations Summary */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Info className="h-4 w-4" />
            Smart Recommendations Summary
          </h3>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Optimization Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>SEO Optimization:</span>
                  <Badge className={wordCountRec.status === 'seo-optimal' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                    {wordCountRec.status === 'seo-optimal' ? 'Optimal' : 'Good'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Content Length:</span>
                  <Badge variant="outline">{formData.wordCount || 800} words</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reading Level:</span>
                  <Badge className={READING_LEVELS[contentConfig.readingLevel].color}>
                    {contentConfig.readingLevel}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">Generation Settings</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Estimated Time:</span>
                  <span className="font-medium">{estimatedTime} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Output Format:</span>
                  <span className="font-medium capitalize">{formData.outputFormat || 'Markdown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quality Checks:</span>
                  <span className="font-medium">{formData.plagiarismCheck !== false ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Step5GenerationSettings;
