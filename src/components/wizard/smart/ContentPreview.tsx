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
    const generateOutline = (): OutlineSection[] => {
      const outline: OutlineSection[] = [];
      const remainingWords = wordCount;
      const keywordText = keywords.length > 0 ? keywords[0] : topic.split(' ')[0] || 'topic';

      switch (structureFormat) {
        case 'story-facts-lessons':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.openingStory', 'Opening Story', { ns: 'longform' }),
            type: 'heading',
            content: t('step4.structure.sections.openingStoryDesc', 'Engaging narrative', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '2',
            title: t('step4.structure.sections.keyFactsData', 'Key Facts & Data', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.keyFactsDataDesc', 'Supporting evidence', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '3',
            title: t('step4.structure.sections.analysis', 'Analysis', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.analysisDesc', 'What it means', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '4',
            title: t('step4.structure.sections.lessonsLearned', 'Lessons Learned', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.lessonsLearnedDesc', 'Key takeaways and insights', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '5',
            title: t('step4.structure.sections.application', 'Application', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.applicationDesc', 'How to use', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.05)
          });
          break;
        case 'listicle':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.introduction', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.listOverviewDesc', 'List overview', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          for (let i = 1; i <= 5; i++) {
            outline.push({
              id: `point${i}`,
              title: t(`step4.structure.sections.point${i}`, `Point ${i}`, { ns: 'longform', i }),
              type: 'list',
              content: t(`step4.structure.sections.point${i}Desc`, `Item ${i}`, { ns: 'longform', i }),
              estimatedWords: Math.floor(remainingWords * 0.18)
            });
          }
          break;
        case 'how-to-steps':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.howToIntro', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.howToIntroDesc', 'Overview and what readers will learn', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '2',
            title: t('step4.structure.sections.prerequisites', 'Prerequisites', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.prerequisitesDesc', 'What you need before starting', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          for (let i = 1; i <= 3; i++) {
            outline.push({
              id: `step${i}`,
              title: t(`step4.structure.sections.step${i}`, `Step ${i}`, { ns: 'longform', i }),
              type: 'heading',
              content: t(`step4.structure.sections.step${i}Desc`, `Action step ${i}`, { ns: 'longform', i }),
              estimatedWords: Math.floor(remainingWords * 0.18)
            });
          }
          outline.push({
            id: 'additional',
            title: t('step4.structure.sections.additionalSteps', 'Additional Steps', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.additionalStepsDesc', 'More steps as needed', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: 'conclusion',
            title: t('step4.structure.sections.conclusionTips', 'Conclusion & Tips', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.conclusionTipsDesc', 'Summary and best practices', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;
        case 'faq-qa':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.topicOverview', 'Topic overview', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.topicOverviewDesc', 'Topic overview', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.12)
          });
          for (let i = 1; i <= 3; i++) {
            outline.push({
              id: `faq${i}`,
              title: t(`step4.structure.sections.question${i}Answer`, `Question ${i} + Answer`, { ns: 'longform', i }),
              type: 'heading',
              content: t(`step4.structure.sections.question${i}AnswerDesc`, `FAQ item ${i}`, { ns: 'longform', i }),
              estimatedWords: Math.floor(remainingWords * 0.18)
            });
          }
          outline.push({
            id: 'additional',
            title: t('step4.structure.sections.additionalQAs', 'Additional Q&As', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.additionalQAsDesc', 'More questions as needed', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: 'conclusion',
            title: t('step4.structure.sections.conclusion', 'Conclusion', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.conclusionDesc', 'Summary and next steps', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;
        case 'comparison-vs':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.comparisonIntro', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.comparisonIntroDesc', 'Context and what\'s being compared', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '2',
            title: t('step4.structure.sections.optionAOverview', 'Option A Overview', { ns: 'longform' }),
            type: 'heading',
            content: t('step4.structure.sections.optionAOverviewDesc', 'First option details', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '3',
            title: t('step4.structure.sections.optionBOverview', 'Option B Overview', { ns: 'longform' }),
            type: 'heading',
            content: t('step4.structure.sections.optionBOverviewDesc', 'Second option details', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '4',
            title: t('step4.structure.sections.sideBySideComparison', 'Side-by-side Comparison', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.sideBySideComparisonDesc', 'Direct feature comparison', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.25)
          });
          outline.push({
            id: '5',
            title: t('step4.structure.sections.prosAndCons', 'Pros and Cons', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.prosAndConsDesc', 'Advantages and disadvantages', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '6',
            title: t('step4.structure.sections.recommendation', 'Recommendation', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.recommendationDesc', 'Which option to choose when', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;
        case 'how-to':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.heading', `How to Master ${keywordText}: Complete Guide`, { ns: 'longform', keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.mainTitle', 'Step-by-step guide title', { ns: 'longform' }),
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.whatYouLearn', 'What You\'ll Learn', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.howToIntroDesc', 'Overview of the process and benefits', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          if (includeImages) {
            outline.push({
              id: 'hero-img',
              title: t('step4.preview.sectionType.image', 'Process Overview Image', { ns: 'longform' }),
              type: 'image',
              content: t('step4.preview.sectionContent.image', 'Visual guide or infographic', { ns: 'longform' }),
              estimatedWords: 0,
              imageCount: 1
            });
          }

          // Steps
          for (let i = 1; i <= 5; i++) {
            outline.push({
              id: `step-${i}`,
              title: t('step4.structure.sections.step' + i, `Step ${i}: ${keywordText} Implementation`, { ns: 'longform', i, keywordText }),
              type: 'heading',
              content: t('step4.structure.sections.step' + i + 'Desc', `Detailed instructions for step ${i}`, { ns: 'longform', i, keywordText }),
              estimatedWords: Math.floor(remainingWords * 0.15)
            });
          }

          outline.push({
            id: 'next-steps',
            title: t('step4.structure.sections.nextSteps', 'Next Steps', { ns: 'longform' }),
            type: 'cta',
            content: t('step4.structure.sections.nextStepsDesc', 'What to do after completing the guide', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.05)
          });
          break;

        case 'comparison':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.comparisonTitle', `${keywordText} Comparison: Finding the Best Option`, { ns: 'longform', keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.comparisonTitleDesc', 'Comparison article title', { ns: 'longform', keywordText }),
            estimatedWords: 12
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.comparisonOverview', 'Comparison Overview', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.comparisonOverviewDesc', 'Introduction to what\'s being compared', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          // Comparison items
          ['Option A', 'Option B', 'Option C'].forEach((option, index) => {
            outline.push({
              id: `option-${index + 1}`,
              title: t('step4.structure.sections.comparisonOption', `${option}: ${keywordText} Analysis`, { ns: 'longform', option, keywordText }),
              type: 'heading',
              content: t('step4.structure.sections.comparisonOptionDesc', `Detailed analysis of ${option}`, { ns: 'longform', option, keywordText }),
              estimatedWords: Math.floor(remainingWords * 0.2)
            });

            if (includeImages) {
              outline.push({
                id: `comparison-img-${index + 1}`,
                title: t('step4.structure.sections.comparisonOptionImage', `${option} Screenshot`, { ns: 'longform', option }),
                type: 'image',
                content: t('step4.structure.sections.comparisonOptionImageDesc', 'Visual example or screenshot', { ns: 'longform', option }),
                estimatedWords: 0,
                imageCount: 1
              });
            }
          });

          outline.push({
            id: 'verdict',
            title: t('step4.structure.sections.comparisonFinalVerdict', 'Final Verdict', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.comparisonFinalVerdictDesc', 'Recommendation and summary', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'how-to-steps':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.howToStepsTitle', `How to ${topic || keywordText}: Step-by-Step Guide`, { ns: 'longform', topic, keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.howToStepsTitleDesc', 'Complete tutorial title', { ns: 'longform', topic, keywordText }),
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.introduction', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.howToStepsIntroDesc', 'Overview and what readers will learn', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '3',
            title: t('step4.structure.sections.prerequisites', 'Prerequisites', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.howToStepsPrerequisitesDesc', 'What you need before starting', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });

          // Steps
          for (let i = 1; i <= 5; i++) {
            outline.push({
              id: `step-${i}`,
              title: t('step4.structure.sections.howToStepsStep', `Step ${i}: ${keywordText} Implementation`, { ns: 'longform', i, keywordText }),
              type: 'heading',
              content: t('step4.structure.sections.howToStepsStepDesc', 'Detailed action step with clear instructions', { ns: 'longform', i, keywordText }),
              estimatedWords: Math.floor(remainingWords * 0.12)
            });

            if (includeImages && i % 2 === 0) {
              outline.push({
                id: `step-img-${i}`,
                title: t('step4.structure.sections.howToStepsStepImage', `Step ${i} Visual Guide`, { ns: 'longform', i }),
                type: 'image',
                content: t('step4.structure.sections.howToStepsStepImageDesc', 'Screenshot or diagram showing the step', { ns: 'longform', i }),
                estimatedWords: 0,
                imageCount: 1
              });
            }
          }

          outline.push({
            id: 'conclusion',
            title: t('step4.structure.sections.howToStepsConclusion', 'Conclusion & Tips', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.howToStepsConclusionDesc', 'Summary and best practices', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'faq-qa':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.faqQaTitle', `${topic || keywordText}: Frequently Asked Questions`, { ns: 'longform', topic, keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.faqQaTitleDesc', 'FAQ page title', { ns: 'longform', topic, keywordText }),
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.introduction', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.faqQaIntroDesc', 'Topic overview and scope', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.12)
          });

          // FAQ items
          const faqQuestions = [
            t('step4.structure.sections.faqQaQ1', 'What is the most important thing to know?', { ns: 'longform' }),
            t('step4.structure.sections.faqQaQ2', 'How do I get started?', { ns: 'longform' }),
            t('step4.structure.sections.faqQaQ3', 'What are the common mistakes to avoid?', { ns: 'longform' }),
            t('step4.structure.sections.faqQaQ4', 'How long does it typically take?', { ns: 'longform' }),
            t('step4.structure.sections.faqQaQ5', 'What are the costs involved?', { ns: 'longform' })
          ];

          faqQuestions.forEach((question, index) => {
            outline.push({
              id: `faq-${index + 1}`,
              title: t('step4.structure.sections.faqQaQuestion', `Q${index + 1}: ${question.replace('it', keywordText)}`, { ns: 'longform', index, question, keywordText }),
              type: 'heading',
              content: t('step4.structure.sections.faqQaQuestionDesc', 'Detailed answer with examples', { ns: 'longform', index, question, keywordText }),
              estimatedWords: Math.floor(remainingWords * 0.15)
            });
          });

          outline.push({
            id: 'conclusion',
            title: t('step4.structure.sections.faqQaConclusion', 'Still Have Questions?', { ns: 'longform' }),
            type: 'cta',
            content: t('step4.structure.sections.faqQaConclusionDesc', 'Contact information or next steps', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.05)
          });
          break;

        case 'comparison-vs':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.comparisonIntro', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.comparisonIntroDesc', 'Context and what\'s being compared', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '2',
            title: t('step4.structure.sections.optionAOverview', 'Option A Overview', { ns: 'longform' }),
            type: 'heading',
            content: t('step4.structure.sections.optionAOverviewDesc', 'First option details', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '3',
            title: t('step4.structure.sections.optionBOverview', 'Option B Overview', { ns: 'longform' }),
            type: 'heading',
            content: t('step4.structure.sections.optionBOverviewDesc', 'Second option details', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '4',
            title: t('step4.structure.sections.sideBySideComparison', 'Side-by-side Comparison', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.sideBySideComparisonDesc', 'Direct feature comparison', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.25)
          });
          outline.push({
            id: '5',
            title: t('step4.structure.sections.prosAndCons', 'Pros and Cons', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.prosAndConsDesc', 'Advantages and disadvantages', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '6',
            title: t('step4.structure.sections.recommendation', 'Recommendation', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.recommendationDesc', 'Which option to choose when', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        case 'review-analysis':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.reviewAnalysisTitle', `${topic || keywordText} Review: In-Depth Analysis`, { ns: 'longform', topic, keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.reviewAnalysisDesc', 'Comprehensive review title', { ns: 'longform' }),
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.introduction', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.reviewIntroDesc', `What's being reviewed and why`, { ns: 'longform', topic, keywordText }),
            estimatedWords: Math.floor(remainingWords * 0.12)
          });

          outline.push({
            id: '3',
            title: t('step4.structure.sections.keyFeatures', 'Key Features', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.keyFeaturesDesc', 'Main features and capabilities', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });

          outline.push({
            id: '4',
            title: t('step4.structure.sections.pros', 'What We Liked (Pros)', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.prosDesc', 'Positive aspects and strengths', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '5',
            title: t('step4.structure.sections.cons', 'What Could Be Better (Cons)', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.consDesc', 'Limitations and areas for improvement', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: '6',
            title: t('step4.structure.sections.performanceAnalysis', 'Performance Analysis', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.performanceAnalysisDesc', 'How it performs in real-world use', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          outline.push({
            id: 'verdict',
            title: t('step4.structure.sections.finalVerdict', 'Final Verdict', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.finalVerdictDesc', 'Overall rating and recommendation', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.08)
          });
          break;

        case 'case-study-detailed':
          outline.push({
            id: '1',
            title: t('step4.structure.sections.caseStudyTitle', `${topic || keywordText} Case Study: Real Results`, { ns: 'longform', topic, keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.caseStudyDesc', 'Case study title with outcome focus', { ns: 'longform' }),
            estimatedWords: 12
          });
          outline.push({
            id: '2',
            title: t('step4.structure.sections.executiveSummary', 'Executive Summary', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.executiveSummaryDesc', 'Quick overview of the case study', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          outline.push({
            id: '3',
            title: t('step4.structure.sections.background', 'Background', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.backgroundDesc', 'Context and initial situation', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });
          outline.push({
            id: '4',
            title: t('step4.structure.sections.challenge', 'The Challenge', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.challengeDesc', 'Problems that needed to be solved', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '5',
            title: t('step4.structure.sections.solution', 'Our Solution', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.solutionDesc', 'Approach and implementation strategy', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.25)
          });
          outline.push({
            id: '6',
            title: t('step4.structure.sections.results', 'Results & Metrics', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.resultsDesc', 'Quantifiable outcomes and improvements', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.2)
          });
          outline.push({
            id: '7',
            title: t('step4.structure.sections.lessonsLearned', 'Key Takeaways', { ns: 'longform' }),
            type: 'list',
            content: t('step4.structure.sections.lessonsLearnedDesc', 'Lessons learned and actionable insights', { ns: 'longform' }),
            estimatedWords: Math.floor(remainingWords * 0.1)
          });
          break;

        default: // article
          outline.push({
            id: '1',
            // Use the full topic if available instead of just the keyword
            title: topic && topic.trim() !== ''
              ? topic
              : t('step4.structure.sections.understandingTopic', 'Understanding {{keywordText}}: A Comprehensive Guide', { ns: 'longform', keywordText }),
            type: 'heading',
            content: t('step4.structure.sections.mainTitle', 'Main article title', { ns: 'longform' }),
            estimatedWords: 10
          });

          outline.push({
            id: '2',
            title: t('step4.structure.sections.introduction', 'Introduction', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.introductionDesc', `Introduction to ${keywordText} concepts`, { ns: 'longform', keywordText }),
            estimatedWords: Math.floor(remainingWords * 0.15)
          });

          // Use translation keys for each dynamic section
          const dynamicSections = [
            { key: 'backgroundOfTopic', fallback: 'Background of {{keywordText}}' },
            { key: 'keyConceptsOfTopic', fallback: 'Key Concepts of {{keywordText}}' },
            { key: 'implementationOfTopic', fallback: 'Implementation of {{keywordText}}' },
            { key: 'bestPracticesOfTopic', fallback: 'Best Practices of {{keywordText}}' }
          ];
          dynamicSections.forEach((section, index) => {
            outline.push({
              id: `section-${index + 1}`,
              title: t(`step4.structure.sections.${section.key}`, section.fallback, { ns: 'longform', keywordText }),
              type: 'heading',
              content: t(`step4.structure.sections.${section.key}Desc`, `Detailed explanation of ${section.fallback.toLowerCase()}`, { ns: 'longform', keywordText }),
              estimatedWords: Math.floor(remainingWords * 0.2)
            });

            if (includeImages && index % 2 === 1) {
              outline.push({
                id: `section-img-${index + 1}`,
                title: t('step4.preview.sectionType.image', 'Supporting Visual', { ns: 'longform' }),
                type: 'image',
                content: t('step4.preview.sectionContent.image', 'Relevant image or diagram', { ns: 'longform' }),
                estimatedWords: 0,
                imageCount: 1
              });
            }
          });

          outline.push({
            id: 'conclusion',
            title: t('step4.structure.sections.conclusion', 'Conclusion', { ns: 'longform' }),
            type: 'paragraph',
            content: t('step4.structure.sections.conclusionDesc', 'Summary and key takeaways', { ns: 'longform' }),
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
                <p className="text-sm font-medium">{totalImages}</p>
                <p className="text-xs text-muted-foreground">{t('step4.preview.images', 'Images', { ns: 'longform' })}</p>
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
                            {t('step4.preview.sectionType.image', 'Image', { ns: 'longform' })}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 break-words">
                        {t(`step4.preview.sectionContent.${section.type}`, section.content, { ns: 'longform' })}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {section.estimatedWords > 0 && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <FileText className="h-3 w-3" />
                            ~{section.estimatedWords} {t('common:wordsShort', 'words')}
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
                <h4 className="font-semibold">{t('step4.preview.contentSample', 'Content Sample', { ns: 'longform' })}</h4>
                <Badge variant="secondary" className="text-xs capitalize">
                  {contentTone} {t('common:tone', 'tone')}
                </Badge>
              </div>
                {/* Sample title */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h1 className={`font-bold mb-2 ${viewMode === 'mobile' ? 'text-xl' : 'text-2xl'} break-words`}>
                  {topic && topic.trim() !== '' ? topic : contentOutline[0]?.title || t('step4.preview.sampleTitle', 'Understanding {{keywordText}}: A Comprehensive Guide', { ns: 'longform', keywordText: keywords[0] || 'Content' })}
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
                  {contentOutline.find(s => s.type === 'heading' && s.id !== '1')?.title || t('step4.preview.sampleSectionTitle', 'Key Section', { ns: 'longform' })}
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
                {t('step4.preview.tonePreviewTitle', '{{contentTone}} Tone Preview', { ns: 'longform', contentTone: contentTone.charAt(0).toUpperCase() + contentTone.slice(1) })}
              </h4>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 break-words">
              {t('step4.preview.tonePreviewDesc', 'Your content will be written in a <strong>{{contentTone}}</strong> tone, {{toneExplanation}}', { ns: 'longform', contentTone, toneExplanation: t(`step4.preview.toneExplanation.${contentTone}`, '', { ns: 'longform' }) })}
            </p>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ContentPreview;
