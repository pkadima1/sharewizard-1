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
    const generateOutline = (): OutlineSection[] => {
      const outline: OutlineSection[] = [];
      const remainingWords = wordCount;
      const keywordText = keywords.length > 0 ? keywords[0] : topic.split(' ')[0] || 'topic';

      switch (structureFormat) {
        case 'listicle':
          // Title
          outline.push({
            id: '1',
            title: `${Math.floor(Math.random() * 5) + 5} ${keywordText} Tips for ${audience || 'Success'}`,
            type: 'heading',
            content: 'Main title with primary keyword placement',
            estimatedWords: 10
          });

          // Introduction
          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: `Hook readers with a compelling opening about ${keywordText}`,
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          // List items
          for (let i = 1; i <= 7; i++) {
            outline.push({
              id: `list-${i}`,
              title: `${i}. ${keywordText} Strategy #${i}`,
              type: 'list',
              content: `Detailed explanation of strategy with examples`,
              estimatedWords: Math.floor(remainingWords * 0.1)
            });

            if (includeImages && i % 2 === 0) {
              outline.push({
                id: `img-${i}`,
                title: 'Supporting Image',
                type: 'image',
                content: 'Visual representation of the strategy',
                estimatedWords: 0,
                imageCount: 1
              });
            }
          }

          // Conclusion
          outline.push({
            id: 'conclusion',
            title: 'Conclusion',
            type: 'paragraph',
            content: 'Summary and call-to-action',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'how-to':
          outline.push({
            id: '1',
            title: `How to Master ${keywordText}: Complete Guide`,
            type: 'heading',
            content: 'Step-by-step guide title',
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: 'What You\'ll Learn',
            type: 'paragraph',
            content: 'Overview of the process and benefits',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          if (includeImages) {
            outline.push({
              id: 'hero-img',
              title: 'Process Overview Image',
              type: 'image',
              content: 'Visual guide or infographic',
              estimatedWords: 0,
              imageCount: 1
            });
          }

          // Steps
          for (let i = 1; i <= 5; i++) {
            outline.push({
              id: `step-${i}`,
              title: `Step ${i}: ${keywordText} Implementation`,
              type: 'heading',
              content: `Detailed instructions for step ${i}`,
              estimatedWords: Math.floor(remainingWords * 0.15)
            });
          }

          outline.push({
            id: 'next-steps',
            title: 'Next Steps',
            type: 'cta',
            content: 'What to do after completing the guide',
            estimatedWords: Math.floor(remainingWords * 0.05)
          });
          break;

        case 'comparison':
          outline.push({
            id: '1',
            title: `${keywordText} Comparison: Finding the Best Option`,
            type: 'heading',
            content: 'Comparison article title',
            estimatedWords: 12
          });

          outline.push({
            id: '2',
            title: 'Comparison Overview',
            type: 'paragraph',
            content: 'Introduction to what\'s being compared',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          // Comparison items
          ['Option A', 'Option B', 'Option C'].forEach((option, index) => {
            outline.push({
              id: `option-${index + 1}`,
              title: `${option}: ${keywordText} Analysis`,
              type: 'heading',
              content: `Detailed analysis of ${option}`,
              estimatedWords: Math.floor(remainingWords * 0.2)
            });

            if (includeImages) {
              outline.push({
                id: `comparison-img-${index + 1}`,
                title: `${option} Screenshot`,
                type: 'image',
                content: 'Visual example or screenshot',
                estimatedWords: 0,
                imageCount: 1
              });
            }
          });

          outline.push({
            id: 'verdict',
            title: 'Final Verdict',
            type: 'paragraph',
            content: 'Recommendation and summary',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'how-to-steps':
          outline.push({
            id: '1',
            title: `How to ${topic || keywordText}: Step-by-Step Guide`,
            type: 'heading',
            content: 'Complete tutorial title',
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: 'Overview and what readers will learn',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '3',
            title: 'Prerequisites',
            type: 'list',
            content: 'What you need before starting',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          // Steps
          for (let i = 1; i <= 5; i++) {
            outline.push({
              id: `step-${i}`,
              title: `Step ${i}: ${keywordText} Implementation`,
              type: 'heading',
              content: `Detailed action step with clear instructions`,
              estimatedWords: Math.floor(remainingWords * 0.12)
            });

            if (includeImages && i % 2 === 0) {
              outline.push({
                id: `step-img-${i}`,
                title: `Step ${i} Visual Guide`,
                type: 'image',
                content: 'Screenshot or diagram showing the step',
                estimatedWords: 0,
                imageCount: 1
              });
            }
          }

          outline.push({
            id: 'conclusion',
            title: 'Conclusion & Tips',
            type: 'paragraph',
            content: 'Summary and best practices',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'faq-qa':
          outline.push({
            id: '1',
            title: `${topic || keywordText}: Frequently Asked Questions`,
            type: 'heading',
            content: 'FAQ page title',
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: 'Topic overview and scope',
            estimatedWords: Math.floor(remainingWords * 0.12)
          });

          // FAQ items
          const faqQuestions = [
            'What is the most important thing to know?',
            'How do I get started?',
            'What are the common mistakes to avoid?',
            'How long does it typically take?',
            'What are the costs involved?'
          ];

          faqQuestions.forEach((question, index) => {
            outline.push({
              id: `faq-${index + 1}`,
              title: `Q${index + 1}: ${question.replace('it', keywordText)}`,
              type: 'heading',
              content: 'Detailed answer with examples',
              estimatedWords: Math.floor(remainingWords * 0.15)
            });
          });

          outline.push({
            id: 'conclusion',
            title: 'Still Have Questions?',
            type: 'cta',
            content: 'Contact information or next steps',
            estimatedWords: Math.floor(remainingWords * 0.05)
          });
          break;

        case 'comparison-vs':
          outline.push({
            id: '1',
            title: `${keywordText} Comparison: Option A vs Option B`,
            type: 'heading',
            content: 'Head-to-head comparison title',
            estimatedWords: 12
          });

          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: 'Context and what\'s being compared',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '3',
            title: 'Option A Overview',
            type: 'heading',
            content: 'Detailed look at first option',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          outline.push({
            id: '4',
            title: 'Option B Overview',
            type: 'heading',
            content: 'Detailed look at second option',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          if (includeImages) {
            outline.push({
              id: 'comparison-table-img',
              title: 'Side-by-side Comparison Table',
              type: 'image',
              content: 'Visual comparison chart or table',
              estimatedWords: 0,
              imageCount: 1
            });
          }

          outline.push({
            id: '5',
            title: 'Feature Comparison',
            type: 'list',
            content: 'Direct feature-by-feature analysis',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          outline.push({
            id: '6',
            title: 'Pros and Cons',
            type: 'list',
            content: 'Advantages and disadvantages of each',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: 'recommendation',
            title: 'Our Recommendation',
            type: 'paragraph',
            content: 'Which option to choose when',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'review-analysis':
          outline.push({
            id: '1',
            title: `${topic || keywordText} Review: In-Depth Analysis`,
            type: 'heading',
            content: 'Comprehensive review title',
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: 'What\'s being reviewed and why',
            estimatedWords: Math.floor(remainingWords * 0.12)
          });

          outline.push({
            id: '3',
            title: 'Key Features',
            type: 'list',
            content: 'Main features and capabilities',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          if (includeImages) {
            outline.push({
              id: 'features-img',
              title: 'Feature Screenshot',
              type: 'image',
              content: 'Visual showing key features',
              estimatedWords: 0,
              imageCount: 1
            });
          }

          outline.push({
            id: '4',
            title: 'What We Liked (Pros)',
            type: 'list',
            content: 'Positive aspects and strengths',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '5',
            title: 'What Could Be Better (Cons)',
            type: 'list',
            content: 'Limitations and areas for improvement',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '6',
            title: 'Performance Analysis',
            type: 'paragraph',
            content: 'How it performs in real-world use',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: 'verdict',
            title: 'Final Verdict',
            type: 'paragraph',
            content: 'Overall rating and recommendation',
            estimatedWords: Math.floor(remainingWords * 0.08)
          });
          break;

        case 'case-study-detailed':
          outline.push({
            id: '1',
            title: `${topic || keywordText} Case Study: Real Results`,
            type: 'heading',
            content: 'Case study title with outcome focus',
            estimatedWords: 12
          });

          outline.push({
            id: '2',
            title: 'Executive Summary',
            type: 'paragraph',
            content: 'Quick overview of the case study',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          outline.push({
            id: '3',
            title: 'Background',
            type: 'paragraph',
            content: 'Context and initial situation',
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '4',
            title: 'The Challenge',
            type: 'paragraph',
            content: 'Problems that needed to be solved',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          if (includeImages) {
            outline.push({
              id: 'challenge-img',
              title: 'Challenge Visualization',
              type: 'image',
              content: 'Chart or diagram showing the problem',
              estimatedWords: 0,
              imageCount: 1
            });
          }

          outline.push({
            id: '5',
            title: 'Our Solution',
            type: 'paragraph',
            content: 'Approach and implementation strategy',
            estimatedWords: Math.floor(remainingWords * 0.25)
          });

          outline.push({
            id: '6',
            title: 'Results & Metrics',
            type: 'list',
            content: 'Quantifiable outcomes and improvements',
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          if (includeImages) {
            outline.push({
              id: 'results-img',
              title: 'Results Dashboard',
              type: 'image',
              content: 'Charts showing before/after metrics',
              estimatedWords: 0,
              imageCount: 1
            });
          }

          outline.push({
            id: '7',
            title: 'Key Takeaways',
            type: 'list',
            content: 'Lessons learned and actionable insights',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;        default: // article
          outline.push({
            id: '1',
            // Use the full topic if available instead of just the keyword
            title: topic && topic.trim() !== '' ? topic : `Understanding ${keywordText}: A Comprehensive Guide`,
            type: 'heading',
            content: 'Main article title',
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: 'Introduction',
            type: 'paragraph',
            content: `Introduction to ${keywordText} concepts`,
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          ['Background', 'Key Concepts', 'Implementation', 'Best Practices'].forEach((section, index) => {
            outline.push({
              id: `section-${index + 1}`,
              title: `${section} of ${keywordText}`,
              type: 'heading',
              content: `Detailed explanation of ${section.toLowerCase()}`,
              estimatedWords: Math.floor(remainingWords * 0.2)
            });

            if (includeImages && index % 2 === 1) {
              outline.push({
                id: `section-img-${index + 1}`,
                title: 'Supporting Visual',
                type: 'image',
                content: 'Relevant image or diagram',
                estimatedWords: 0,
                imageCount: 1
              });
            }
          });

          outline.push({
            id: 'conclusion',
            title: 'Conclusion',
            type: 'paragraph',
            content: 'Summary and key takeaways',
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
      }

      return outline;
    };

    return generateOutline();
  }, [structureFormat, wordCount, keywords, topic, includeImages, audience]);
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
  }, [contentTone, keywords, industry, audience]);

  // Calculate total image count
  const totalImages = useMemo(() => {
    return contentOutline.reduce((count, section) => count + (section.imageCount || 0), 0);
  }, [contentOutline]);

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
  return (
    <TooltipProvider>
      <div className={`max-w-full space-y-6 overflow-hidden ${className}`}>        {/* Header with controls */}
        <Card className="p-4 border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2 truncate">
                <Eye className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">Content Preview</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                See how your content will look and flow
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
                  <span className="hidden xs:inline">Outline</span>
                </Button>
                <Button
                  variant={previewType === 'sample' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewType('sample')}
                  className="text-xs h-8"
                >
                  <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden xs:inline">Sample</span>
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
                  <TooltipContent>Desktop View</TooltipContent>
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
                  <TooltipContent>Mobile View</TooltipContent>
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
                <p className="text-sm font-medium">{readingTime} min read</p>
                <p className="text-xs text-muted-foreground">Est. reading time</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{wordCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{totalImages}</p>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{contentOutline.filter(s => s.type === 'heading').length}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>
          </Card>        </div>

        {/* Main preview area */}
        <Card className={`p-4 shadow-md border-gray-200 dark:border-gray-700 overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
          {previewType === 'outline' ? (
            // Outline view
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Content Outline</h4>
                <Badge variant="secondary" className="text-xs">
                  {structureFormat.charAt(0).toUpperCase() + structureFormat.slice(1)}
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
                        <span className="font-medium text-sm truncate">{section.title}</span>
                        {section.type === 'image' && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Image
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 break-words">
                        {section.content}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {section.estimatedWords > 0 && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <FileText className="h-3 w-3" />
                            ~{section.estimatedWords} words
                          </span>
                        )}
                        {section.imageCount && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <ImageIcon className="h-3 w-3" />
                            {section.imageCount} image{section.imageCount > 1 ? 's' : ''}
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
                <h4 className="font-semibold">Content Sample</h4>
                <Badge variant="secondary" className="text-xs capitalize">
                  {contentTone} tone
                </Badge>
              </div>
                {/* Sample title */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h1 className={`font-bold mb-2 ${viewMode === 'mobile' ? 'text-xl' : 'text-2xl'} break-words`}>
                  {topic && topic.trim() !== '' ? topic : contentOutline[0]?.title || `Understanding ${keywords[0] || 'Content'}`}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {readingTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 flex-shrink-0" />
                    {wordCount} words
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {/* Sample content with tone */}
              <div className="prose prose-sm max-w-none bg-white dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-muted-foreground leading-relaxed break-words">
                  {toneSample}
                </p>
                
                {includeImages && (
                  <div className="my-4 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Featured image will appear here
                    </p>
                  </div>
                )}
                  <h3 className="font-semibold mt-6 mb-2 break-words">
                  {contentOutline.find(s => s.type === 'heading' && s.id !== '1')?.title || 'Key Section'}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed break-words">
                  This section will dive deeper into the specific aspects of {keywords[0] || topic}, 
                  providing actionable insights and practical examples that {audience || 'readers'} can 
                  implement immediately in their {industry || 'work'}.
                </p>
                
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">Key benefit or insight #1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">Key benefit or insight #2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">Key benefit or insight #3</span>
                  </li>
                </ul>
              </div>
              
              {/* Call to action preview */}
              <Card className="p-4 bg-primary/5 border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-primary break-words">Next Steps</span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  Ready to implement these {keywords[0] || topic} strategies? 
                  Start with the first recommendation and track your progress.
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
                {contentTone.charAt(0).toUpperCase() + contentTone.slice(1)} Tone Preview
              </h4>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 break-words">
              Your content will be written in a <strong>{contentTone}</strong> tone, 
              {contentTone === 'professional' && ' maintaining a formal, business-appropriate style with industry expertise.'}
              {contentTone === 'casual' && ' using relaxed, conversational language like talking to a friend over coffee.'}
              {contentTone === 'authoritative' && ' demonstrating strong leadership voice with confidence and credibility through research-backed statements.'}
              {contentTone === 'friendly' && ' creating a warm, welcoming atmosphere that builds connection with readers.'}
              {contentTone === 'conversational' && ' engaging readers as if you\'re speaking directly to them in a natural dialogue.'}
              {contentTone === 'educational' && ' focusing on clear instruction and knowledge transfer with systematic explanations.'}
              {contentTone === 'informative' && ' providing objective, balanced information in an encyclopedic style perfect for factual content.'}
              {contentTone === 'inspirational' && ' motivating and uplifting readers with encouraging language ideal for coaching and wellness content.'}
              {contentTone === 'humorous' && ' incorporating light wit and humor to make content engaging and entertaining.'}
              {contentTone === 'empathetic' && ' using warm, understanding language perfect for sensitive topics like health and mental wellness.'}
            </p>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ContentPreview;
