/**
 * ContentPreview Component
 * v1.0.0
 * 
 * Real-time content preview component that shows:
 * - Content outline based on structure format
 * - Estimated reading time calculation
 * - Image placement preview
 * - Tone sample text preview
 * - Mobile/desktop responsive preview
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  Clock, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  FileText,
  List,
  Hash,
  Quote,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';
import { calculateWordDistribution } from '@/utils/wordDistribution';
import { getStructureFormatOptions } from '@/utils/structureFormatOptions';
import { getToneOptions } from '@/utils/toneOptions';

interface ContentPreviewProps {
  topic?: string;
  keywords?: string[];
  contentTone?: string;
  structureFormat?: string;
  wordCount?: number;
  includeImages?: boolean;
  audience?: string;
  industry?: string;
  className?: string;
}

interface OutlineSection {
  id: string;
  title: string;
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'quote' | 'cta';
  content: string;
  estimatedWords: number;
  imageCount?: number;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  topic = '',
  keywords = [],
  contentTone = 'professional',
  structureFormat = 'article',
  wordCount = 800,
  includeImages = false,
  audience = '',
  industry = '',
  className = ''
}) => {
  const { t } = useTranslation(['longform', 'common']);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewType, setPreviewType] = useState<'outline' | 'sample'>('outline');

  // Calculate reading time (average 200 words per minute)
  const readingTime = useMemo(() => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  }, [wordCount]);

  // Generate content outline based on structure format
  const contentOutline = useMemo(() => {
    // Provide a translation function matching (key, defaultValue?) => string
    const translate = (key: string, defaultValue?: string) => t(key, defaultValue ?? key);
    return calculateWordDistribution(
      structureFormat || 'intro-points-cta',
      wordCount || 800,
      { t: translate }
    );
  }, [structureFormat, wordCount, t]);

  // Generate tone sample text
  const toneSample = useMemo(() => {
    const keywordText = keywords.length > 0 ? keywords[0] : (topic && topic.trim() !== '' ? topic : 'your topic');
    const toneExamples: Record<string, string> = {
      professional: `In today's competitive ${industry || 'business'} landscape, understanding ${keywordText} has become essential for ${audience || 'professionals'}. This comprehensive approach will help you implement effective strategies that drive measurable results.`,
      
      casual: `So here's the thing about ${keywordText} - it's way more straightforward than most people make it out to be. Whether you're just getting started or looking to level up, I've got some practical insights that actually work in the real world.`,
      
      authoritative: `Industry leaders consistently recognize ${keywordText} as a critical success factor in ${industry || 'modern business'} strategy. Our research-backed methodology provides ${audience || 'organizations'} with proven frameworks for achieving sustainable outcomes.`,
      
      friendly: `Hey there! Ready to dive into the world of ${keywordText}? I'm excited to share some amazing insights that'll help you succeed in ${industry || 'your field'}. Let's make this journey fun and rewarding!`,
      
      conversational: `You know what's interesting about ${keywordText}? Most ${audience || 'people'} think it's way more complicated than it actually is. Today, I want to show you how simple and effective it can be when you know the right approach.`,
      
      educational: `To understand ${keywordText} effectively, we must first examine its fundamental principles and applications within ${industry || 'the field'}. This systematic approach ensures comprehensive knowledge transfer for ${audience || 'learners'}.`,
      
      informative: `${keywordText} represents a multifaceted concept within ${industry || 'the industry'}, encompassing various methodologies and applications. This analysis examines the key components, benefits, and implementation considerations based on current research and industry standards.`,
      
      inspirational: `Every breakthrough in ${keywordText} starts with a single step toward transformation. Today, you have the opportunity to unlock your potential and achieve remarkable results in ${industry || 'your field'}. The journey begins with understanding these fundamental principles.`,
      
      humorous: `Let's be honest - ${keywordText} has about as much natural excitement as watching paint dry on a rainy Tuesday. But stick with me here, because I promise to make this surprisingly entertaining and maybe even useful for your ${industry || 'work'}.`,
      
      empathetic: `I understand that approaching ${keywordText} can feel overwhelming, especially in the complex world of ${industry || 'business'}. It's completely normal to have questions and concerns. Let's work through this together, taking it one step at a time at your own pace.`
    };

    return toneExamples[contentTone] || toneExamples.professional;
  }, [contentTone, keywords, industry, audience, topic]);

  // Get section icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'heading': return <Hash className="h-4 w-4" />;
      case 'paragraph': return <FileText className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'quote': return <Quote className="h-4 w-4" />;
      case 'cta': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get translated structure format label
  const structureFormatOptions = getStructureFormatOptions(t);
  const structureFormatLabel = structureFormatOptions.find(opt => opt.value === structureFormat)?.label || structureFormat;

  // Get translated tone label
  const toneOptions = getToneOptions(t);
  const toneLabel = toneOptions.find(opt => opt.value === contentTone)?.label || contentTone;

  return (
    <TooltipProvider>
      <div className={`max-w-full space-y-6 overflow-hidden ${className}`}>        {/* Header with controls */}
        <Card className="p-4 border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2 truncate">
                <Eye className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{t('step4.preview.title', 'Content Preview', { ns: 'longform' })}</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {t('step4.preview.description', 'See how your content will look and flow', { ns: 'longform' })}
              </p>
            </div>
              <div className="flex items-center gap-2 flex-shrink-0">
              {/* Preview type toggle */}
              <div className="flex rounded-lg border p-1 bg-background">
                <Button
                  variant={previewType === 'outline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewType('outline')}
                  className="text-xs h-8"
                >
                  <List className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden xs:inline">{t('step4.preview.contentOutline', 'Outline', { ns: 'longform' })}</span>
                </Button>
                <Button
                  variant={previewType === 'sample' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewType('sample')}
                  className="text-xs h-8"
                >
                  <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden xs:inline">{t('step4.preview.live', 'Sample', { ns: 'longform' })}</span>
                </Button>
              </div>
              
              {/* Device toggle */}
              <div className="flex rounded-lg border p-1 bg-background">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('desktop')}
                      className="text-xs"
                    >
                      <Monitor className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('step4.preview.desktopView', 'Desktop View', { ns: 'longform' })}</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('mobile')}
                      className="text-xs"
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('step4.preview.mobileView', 'Mobile View', { ns: 'longform' })}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>

        {/* Content stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{readingTime} {t('step4.preview.minRead', 'min de lecture', { ns: 'longform' })}</p>
                <p className="text-xs text-muted-foreground">{t('step4.preview.estReadingTime', 'Temps de lecture estimé', { ns: 'longform' })}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{wordCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('common:words', 'mots')}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{contentOutline.filter(s => s.type === 'heading').length}</p>
                <p className="text-xs text-muted-foreground">{t('step4.preview.sections', 'Sections', { ns: 'longform' })}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{contentOutline.filter(s => s.type === 'heading').length}</p>
                <p className="text-xs text-muted-foreground">{t('step4.preview.sections', 'Sections', { ns: 'longform' })}</p>
              </div>
            </div>
          </Card>        </div>

        {/* Main preview area */}
        <Card className={`p-4 shadow-md border-gray-200 dark:border-gray-700 overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
          {previewType === 'outline' ? (
            // Outline view
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{t('step4.preview.contentOutline', 'Content Outline', { ns: 'longform' })}</h4>
                <Badge variant="secondary" className="text-xs">
                  {structureFormatLabel}
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {contentOutline.map((section, index) => (
                  <div key={section.id} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="flex-shrink-0">{getSectionIcon(section.type)}</span>
                        <span className="font-medium text-sm truncate">{t(section.nameKey)}</span>
                        {section.type === 'image' && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {t('step4.preview.sectionType.image', 'Image', { ns: 'longform' })}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 break-words">
                        {t(section.descriptionKey)}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {section.estimated > 0 && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <FileText className="h-3 w-3" />
                            ~{section.estimated} {t('common:wordsShort', 'words')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}              </div>
            </div>
          ) : (
            // Sample content view
            <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pt-1 pb-2 z-10">
                <h4 className="font-semibold">{t('step4.preview.contentSample', 'Content Sample', { ns: 'longform' })}</h4>
                <Badge variant="secondary" className="text-xs capitalize">
                  {contentTone} {t('common:tone', 'tone')}
                </Badge>
              </div>
                {/* Sample title */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h1 className={`font-bold mb-2 ${viewMode === 'mobile' ? 'text-xl' : 'text-2xl'} break-words`}>
                  {topic && topic.trim() !== '' ? topic : (contentOutline[0] ? t(contentOutline[0].nameKey) : t('step4.preview.sampleTitle', 'Understanding {{keywordText}}: A Comprehensive Guide', { ns: 'longform', keywordText: keywords[0] || 'Content' }))}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {readingTime} {t('step4.preview.minRead', 'min de lecture', { ns: 'longform' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 flex-shrink-0" />
                    {wordCount} {t('common:wordsShort', 'mots')}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {/* Sample content with tone */}
              <div className="prose prose-sm max-w-none bg-white dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-muted-foreground leading-relaxed break-words">
                  {t('step4.preview.sampleIntro', 'In today\'s competitive business landscape, understanding your topic has become essential for professionals. This comprehensive approach will help you implement effective strategies that drive measurable results.', { ns: 'longform', keywordText: keywords[0] || topic })}
                </p>
                
                {includeImages && (
                  <div className="my-4 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('step4.preview.featuredImage', 'L\'image principale apparaîtra ici', { ns: 'longform' })}
                    </p>
                  </div>
                )}
                  <h3 className="font-semibold mt-6 mb-2 break-words">
                  {contentOutline.find(s => s.type === 'heading' && s.id !== '1') ? t(contentOutline.find(s => s.type === 'heading' && s.id !== '1')!.nameKey) : t('step4.preview.sampleSectionTitle', 'Key Section', { ns: 'longform' })}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed break-words">
                  {t('step4.preview.sampleSectionDesc', 'This section will dive deeper into the specific aspects of {{keywordText}}, providing actionable insights and practical examples that {{audience}} can implement immediately in their {{industry}}.', { ns: 'longform', keywordText: keywords[0] || topic, audience: audience || t('step4.preview.defaultAudience', 'readers', { ns: 'longform' }), industry: industry || t('step4.preview.defaultIndustry', 'work', { ns: 'longform' }) })}
                </p>
                
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">{t('step4.preview.sampleBenefit1', 'Key benefit or insight #1', { ns: 'longform' })}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">{t('step4.preview.sampleBenefit2', 'Key benefit or insight #2', { ns: 'longform' })}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">{t('step4.preview.sampleBenefit3', 'Key benefit or insight #3', { ns: 'longform' })}</span>
                  </li>
                </ul>
              </div>
              
              {/* Call to action preview */}
              <Card className="p-4 bg-primary/5 border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-primary break-words">{t('step4.preview.sampleCtaTitle', 'Next Steps', { ns: 'longform' })}</span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {t('step4.preview.sampleCtaDesc', 'Ready to implement these {{keywordText}} strategies? Start with the first recommendation and track your progress.', { ns: 'longform', keywordText: keywords[0] || topic })}
                </p>
              </Card>            </div>
          )}
        </Card>

        {/* Tone explanation */}
        {contentTone && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-md overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100 break-words">
                {t('step4.preview.tonePreviewTitle', '{{contentTone}} Tone Preview', { ns: 'longform', contentTone: toneLabel })}
              </h4>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 break-words" 
               dangerouslySetInnerHTML={{ __html: t('step4.preview.tonePreviewDesc', 'Your content will be written in a <strong>{{contentTone}}</strong> tone, {{toneExplanation}}', { ns: 'longform', contentTone: toneLabel, toneExplanation: t(`step4.preview.toneExplanation.${contentTone}`, '', { ns: 'longform' }) }) }} />
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ContentPreview;
