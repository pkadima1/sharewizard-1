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
import { Separator } from '@/components/ui/separator';
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
import { useTranslation } from 'react-i18next';

interface Step5Props {
  formData: any;
  updateFormData: (key: string, value: any) => void;
}

const Step5GenerationSettings: React.FC<Step5Props> = ({ formData, updateFormData }) => {
  const { t } = useTranslation('longform');

  // Content type configurations for smart recommendations (now translation-aware)
  const CONTENT_TYPE_CONFIGS = useMemo(() => ({
    'blog-article': {
      optimalRange: [1200, 1800],
      readingLevel: 'Intermediate',
      avgGenerationTime: 3.5,
      description: t('step5.contentType.blogArticle')
    },
    'newsletter': {
      optimalRange: [800, 1200],
      readingLevel: 'Beginner',
      avgGenerationTime: 2.5,
      description: t('step5.contentType.newsletter')
    },
    'case-study': {
      optimalRange: [1500, 2500],
      readingLevel: 'Advanced',
      avgGenerationTime: 4.5,
      description: t('step5.contentType.caseStudy')
    },
    'guide': {
      optimalRange: [2000, 3000],
      readingLevel: 'Intermediate',
      avgGenerationTime: 5.0,
      description: t('step5.contentType.guide')
    },
    'thought-piece': {
      optimalRange: [1000, 1500],
      readingLevel: 'Advanced',
      avgGenerationTime: 3.0,
      description: t('step5.contentType.thoughtPiece')
    },
    'how-to-steps': {
      optimalRange: [1200, 2000],
      readingLevel: 'Beginner',
      avgGenerationTime: 4.0,
      description: t('step5.contentType.howToSteps')
    },
    'faq-qa': {
      optimalRange: [800, 1500],
      readingLevel: 'Beginner',
      avgGenerationTime: 3.0,
      description: t('step5.contentType.faqQa')
    },
    'comparison-vs': {
      optimalRange: [1500, 2200],
      readingLevel: 'Intermediate',
      avgGenerationTime: 4.5,
      description: t('step5.contentType.comparisonVs')
    },
    'review-analysis': {
      optimalRange: [1200, 1800],
      readingLevel: 'Intermediate',
      avgGenerationTime: 4.0,
      description: t('step5.contentType.reviewAnalysis')
    },
    'case-study-detailed': {
      optimalRange: [1800, 2800],
      readingLevel: 'Advanced',
      avgGenerationTime: 5.5,
      description: t('step5.contentType.caseStudyDetailed')
    }
  }), [t]);

  // Format options (translation-aware)
  const FORMAT_OPTIONS = useMemo(() => [
    {
      value: 'markdown',
      label: t('step5.outputFormat.markdown.label'),
      icon: FileText,
      description: t('step5.outputFormat.markdown.desc'),
      features: [t('step5.outputFormat.markdown.cleanFormatting'), t('step5.outputFormat.markdown.githubCompatible'), t('step5.outputFormat.markdown.easyToEdit')]
    },
    {
      value: 'html',
      label: t('step5.outputFormat.html.label'),
      icon: Globe,
      description: t('step5.outputFormat.html.desc'),
      features: [t('step5.outputFormat.html.webReady'), t('step5.outputFormat.html.seoOptimized'), t('step5.outputFormat.html.styledOutput')]
    },
    {
      value: 'gdocs',
      label: t('step5.outputFormat.gdocs.label'),
      icon: Download,
      description: t('step5.outputFormat.gdocs.desc'),
      features: [t('step5.outputFormat.gdocs.teamCollab'), t('step5.outputFormat.gdocs.commentSystem'), t('step5.outputFormat.gdocs.versionHistory')]
    }
  ], [t]);

  // Reading level configurations (translation-aware)
  const READING_LEVELS = useMemo(() => ({
    'Beginner': {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: Users,
      description: t('step5.readingLevel.beginner')
    },
    'Intermediate': {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: BookOpen,
      description: t('step5.readingLevel.intermediate')
    },
    'Advanced': {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      icon: Star,
      description: t('step5.readingLevel.advanced')
    }
  }), [t]);

  // Mapping from feature string to translation key
  const FEATURE_TRANSLATION_KEYS: Record<string, string> = {
    'Clean formatting': 'cleanFormatting',
    'GitHub compatible': 'githubCompatible',
    'Easy to edit': 'easyToEdit',
    'Web-ready': 'webReady',
    'SEO optimized': 'seoOptimized',
    'Styled output': 'styledOutput',
    'Team collaboration': 'teamCollab',
    'Comment system': 'commentSystem',
    'Version history': 'versionHistory',
  };

  // Initialize default values
  useEffect(() => {
    if (!formData.outputFormat) updateFormData('outputFormat', 'markdown');
    if (formData.plagiarismCheck === undefined) updateFormData('plagiarismCheck', true);
  }, []);

  // Get content type configuration
  const contentConfig = useMemo(() => {
    return CONTENT_TYPE_CONFIGS[formData.contentType] || CONTENT_TYPE_CONFIGS['blog-article'];
  }, [formData.contentType, CONTENT_TYPE_CONFIGS]);
  // Content status for summary display
  const getContentStatus = () => {
    const currentCount = formData.wordCount || 800;
    const [min, max] = contentConfig.optimalRange;
    
    if (currentCount >= 1200 && currentCount <= 1800) {
      return {
        status: 'seo-optimal',
        message: t('step5.contentSummary.seoOptimal'),
        color: 'text-green-600',
        icon: CheckCircle2
      };
    } else if (currentCount >= min && currentCount <= max) {
      return {
        status: 'content-optimal',
        message: t('step5.contentSummary.goodLength'),
        color: 'text-blue-600',
        icon: Target
      };
    } else if (currentCount < min) {
      return {
        status: 'too-short',
        message: t('step5.contentSummary.tooShort'),
        color: 'text-amber-600',
        icon: AlertTriangle
      };
    } else {
      return {
        status: 'too-long',
        message: t('step5.contentSummary.tooLong'),
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
  const contentStatus = getContentStatus();
  const estimatedTime = getEstimatedTime();

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">{t('step5.title')}</h2>
          <p className="text-muted-foreground">
            {t('step5.subtitle')}
          </p>
        </div>        <div className="grid gap-6 md:grid-cols-2">
          {/* Word Count Summary Card */}
          <Card className="p-4 space-y-4 border-l-4 border-l-blue-500 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('step5.contentSummary.title')}
            </h3>

            <div className="space-y-4">
              {/* Content Type Information */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('step5.contentSummary.contentType')}</Label>
                <Badge className="font-medium">
                  {formData.contentType ? formData.contentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : t('step5.contentSummary.contentType')}
                </Badge>
              </div>
              
              {/* Word Count Information */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('step5.contentSummary.wordCount')}</Label>              <Badge className={`flex items-center gap-1 ${contentStatus.status === 'seo-optimal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                  {(() => {
                    const IconComponent = contentStatus.icon;
                    return <IconComponent className="h-3 w-3 mr-1" />;
                  })()}
                  {formData.wordCount || 800} {t('step5.contentSummary.wordCount').replace(':', '')}
                </Badge>
              </div>
              
              {/* Reading Level Information */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('step5.contentSummary.readingLevel')}</Label>
                <Badge className={READING_LEVELS[contentConfig.readingLevel].color}>
                  {contentConfig.readingLevel}
                </Badge>
              </div>
              
              <Separator />
              
              {/* Content Type Description */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  {t('step5.contentSummary.detailsTitle')}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('step5.contentSummary.details')}
                </p>
              </div>
            </div>
          </Card>

          {/* Reading Level & Time Estimate */}
          <Card className="p-4 space-y-4 border-l-4 border-l-purple-500 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('step5.generationDetails.title')}
            </h3>

            {/* Reading Level Indicator */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('step5.generationDetails.readingLevel')}</Label>              <div className="flex items-center gap-3">
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
              <Label className="text-sm font-medium">{t('step5.generationDetails.estimatedTime')}</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{estimatedTime} {t('step5.summary.estimatedTime').replace(':', '')}</span>
                </div>
                <div className="flex-1">
                  <Progress value={Math.min((estimatedTime / 8) * 100, 100)} className="h-2" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('step5.estimatedTime.basedOn')}
              </p>
            </div>

            {/* Generation Features */}
            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md space-y-2">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                {t('step5.generationDetails.featuresTitle')}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.includeImages ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('step5.generationDetails.imageSuggestions', { status: formData.includeImages ? t('step5.status.optimal') : t('step5.status.good') })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.includeStats ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('step5.generationDetails.stats', { status: formData.includeStats ? t('step5.status.optimal') : t('step5.status.good') })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.keywords?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{t('step5.generationDetails.seoOptimization', { status: formData.keywords?.length > 0 ? t('step5.status.optimal') : t('step5.status.good') })}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Format Selection */}
        <Card className="p-4 space-y-4 border-l-4 border-l-green-500 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('step5.outputFormat.title')}
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
                  <span className="font-medium">{t(`step5.outputFormat.${format.value}.desc`)}</span>
                  {formData.outputFormat === format.value && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t(`step5.outputFormat.${format.value}.desc`)}
                </p>
                <div className="space-y-1">
                  {format.features.map((feature, index) => {
                    const key = FEATURE_TRANSLATION_KEYS[feature] || feature;
                    return (
                      <div key={index} className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{t(`step5.outputFormat.${format.value}.${key}`)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Advanced Options */}
        <Card className="p-4 space-y-4 border-l-4 border-l-amber-500 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('step5.advancedOptions.title')}
          </h3>

          <div className="space-y-4">
            {/* Plagiarism Check Toggle */}
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-amber-600" />
                <div>
                  <Label htmlFor="plagiarismCheck" className="text-sm font-medium">
                    {t('step5.advancedOptions.plagiarismCheck')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('step5.advancedOptions.plagiarismCheckDesc')}
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
                    {t('step5.advancedOptions.includeImages')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('step5.advancedOptions.includeImagesDesc')}
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
            {t('step5.summary.title')}
          </h3>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('step5.summary.optimizationStatus')}</h4>              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.seoOptimization')}</span>
                  <Badge className={contentStatus.status === 'seo-optimal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}>
                    {contentStatus.status === 'seo-optimal' ? t('step5.status.optimal') : t('step5.status.good')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.contentLength')}</span>
                  <Badge variant="outline">{formData.wordCount || 800} {t('step5.contentSummary.wordCount').replace(':', '')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.readingLevel')}</span>
                  <Badge className={READING_LEVELS[contentConfig.readingLevel].color}>
                    {contentConfig.readingLevel}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">{t('step5.summary.generationSettings')}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.estimatedTime')}</span>
                  <span className="font-medium">{estimatedTime} {t('step5.summary.estimatedTime').replace(':', '')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.outputFormat')}</span>
                  <span className="font-medium capitalize">{formData.outputFormat || t('step5.outputFormat.markdown.desc')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('step5.summary.qualityChecks')}</span>
                  <span className="font-medium">{formData.plagiarismCheck !== false ? t('step5.status.optimal') : t('step5.status.good')}</span>
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
