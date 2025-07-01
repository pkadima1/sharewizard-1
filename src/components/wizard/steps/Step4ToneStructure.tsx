/**
 * Step4ToneStructure.jsx
 * v2.0.0
 * Purpose: Enhanced step with structure preview, tone examples, visual sections,
 * word count estimates, and CTA previews. Two-column layout with real-time preview.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Info, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Clock, 
  Quote, 
  Target, 
  Hash,
  CheckCircle2,
  ExternalLink,
  Download,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  List,
  HelpCircle,
  Scale,
  Star,
  Briefcase,
  Lightbulb,
  PenTool,
  Zap,
  Users,
  Award
} from 'lucide-react';
import ContentPreview from '@/components/wizard/smart/ContentPreview';

// Content type options (now handled by getContentTypeOptions useMemo hook)

// Structure format options (now handled by getStructureFormatOptions useMemo hook)

// CTA type options (now handled by getCtaTypeOptions useMemo hook)

const Step4ToneStructure = ({ formData, updateFormData }) => {
  const { t } = useTranslation('longform');
  
  // State for UI interactions
  const [showStructureNotes, setShowStructureNotes] = useState(
    formData.structureFormat === 'custom' || !!formData.structureNotes
  );
  const [expandedSections, setExpandedSections] = useState(new Set(['tone', 'structure']));
  const [showToneExample, setShowToneExample] = useState(false);

  // Get translated tone options
  const getToneOptions = useMemo(() => {
    return [
      { 
        value: 'friendly', 
        label: t('step4.tone.options.friendly', 'Friendly'), 
        description: t('step4.tone.examples.friendly.description', 'Approachable and conversational'),
        example: t('step4.tone.examples.friendly.example', "Hey there! Let's talk about something that could completely change how you approach..."),
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      { 
        value: 'professional', 
        label: t('step4.tone.options.professional', 'Professional'), 
        description: t('step4.tone.examples.professional.description', 'Formal and authoritative'),
        example: t('step4.tone.examples.professional.example', "Studies indicate that strategic implementation of these methodologies can significantly..."),
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      { 
        value: 'thought-provoking', 
        label: t('step4.tone.options.thoughtProvoking', 'Thought-Provoking'), 
        description: t('step4.tone.examples.thoughtProvoking.description', 'Challenging and reflective'),
        example: t('step4.tone.examples.thoughtProvoking.example', "What if everything you thought you knew about this topic was fundamentally flawed?"),
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      { 
        value: 'expert', 
        label: t('step4.tone.options.expert', 'Expert'), 
        description: t('step4.tone.examples.expert.description', 'Technical and detailed'),
        example: t('step4.tone.examples.expert.example', "The implementation leverages advanced algorithms and established frameworks to optimize..."),
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      },
      { 
        value: 'persuasive', 
        label: t('step4.tone.options.persuasive', 'Persuasive'), 
        description: t('step4.tone.examples.persuasive.description', 'Compelling and influential'),
        example: t('step4.tone.examples.persuasive.example', "You're just three steps away from achieving results that others can only dream of..."),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      { 
        value: 'informative', 
        label: t('step4.tone.options.informative', 'Informative / Neutral'), 
        description: t('step4.tone.examples.informative.description', 'Objective, balanced tone for encyclopedic or factual content'),
        example: t('step4.tone.examples.informative.example', "This comprehensive overview examines the key factors, providing balanced analysis of the available data and methodologies..."),
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      },
      { 
        value: 'casual', 
        label: t('step4.tone.options.casual', 'Casual / Conversational'), 
        description: t('step4.tone.examples.casual.description', 'More relaxed than friendly, like talking to a friend over coffee'),
        example: t('step4.tone.examples.casual.example', "So here's the thing about this topic - it's way more straightforward than most people make it out to be..."),
        color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
      },
      { 
        value: 'authoritative', 
        label: t('step4.tone.options.authoritative', 'Authoritative / Confident'), 
        description: t('step4.tone.examples.authoritative.description', 'Strong leadership voice, often used in white papers or B2B blogs'),
        example: t('step4.tone.examples.authoritative.example', "Industry leaders recognize this as the definitive approach to achieving sustainable, measurable outcomes..."),
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      },
      { 
        value: 'inspirational', 
        label: t('step4.tone.options.inspirational', 'Inspirational / Motivational'), 
        description: t('step4.tone.examples.inspirational.description', 'Ideal for coaching, leadership, wellness content'),
        example: t('step4.tone.examples.inspirational.example', "Every breakthrough starts with a single step. Today, you have the opportunity to transform your approach and unlock your true potential..."),
        color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      },
      { 
        value: 'humorous', 
        label: t('step4.tone.options.humorous', 'Humorous / Witty'), 
        description: t('step4.tone.examples.humorous.description', 'Lightens content; great for social posts or creative brands'),
        example: t('step4.tone.examples.humorous.example', "Let's face it - this topic has about as much excitement as watching paint dry. But stick with me, because I promise to make this surprisingly entertaining..."),
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      { 
        value: 'empathetic', 
        label: t('step4.tone.options.empathetic', 'Empathetic'), 
        description: t('step4.tone.examples.empathetic.description', 'Warm, understanding tone for sensitive topics (health, mental wellness)'),
        example: t('step4.tone.examples.empathetic.example', "I understand this can feel overwhelming, and it's completely normal to have these concerns. Let's work through this together, at your own pace..."),
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      }
    ];
  }, [t]);

  // Get translated content type options
  const getContentTypeOptions = useMemo(() => {
    return [
      { value: 'blog-article', label: t('step4.contentType.options.blogArticle', 'Blog Article') },
      { value: 'newsletter', label: t('step4.contentType.options.newsletter', 'Newsletter') },
      { value: 'case-study', label: t('step4.contentType.options.caseStudy', 'Case Study') },
      { value: 'guide', label: t('step4.contentType.options.guide', 'Guide') },
      { value: 'thought-piece', label: t('step4.contentType.options.thoughtPiece', 'Thought Piece') },
      { value: 'how-to-steps', label: t('step4.contentType.options.howToSteps', 'How-To / Step-by-Step') },
      { value: 'faq-qa', label: t('step4.contentType.options.faqQa', 'FAQ / Q&A') },
      { value: 'comparison-vs', label: t('step4.contentType.options.comparisonVs', 'Comparison / vs.') },
      { value: 'review-analysis', label: t('step4.contentType.options.reviewAnalysis', 'Review / Analysis') },
      { value: 'case-study-detailed', label: t('step4.contentType.options.caseStudyDetailed', 'Case Study (Detailed)') }
    ];
  }, [t]);

  // Get translated CTA type options
  const getCtaTypeOptions = useMemo(() => {
    return [
      { 
        value: 'subscribe', 
        label: t('step4.cta.options.subscribe', 'Subscribe'), 
        icon: Mail,
        preview: t('step4.cta.previews.subscribe', 'Ready to get more insights like this? Subscribe to our newsletter for weekly tips delivered straight to your inbox.'),
        buttonText: t('step4.cta.buttons.subscribeNow', 'Subscribe Now')
      },
      { 
        value: 'book-call', 
        label: t('step4.cta.options.bookCall', 'Book a Call'), 
        icon: Phone,
        preview: t('step4.cta.previews.bookCall', 'Want to dive deeper? Book a free 30-minute consultation to discuss your specific needs and goals.'),
        buttonText: t('step4.cta.buttons.scheduleCall', 'Schedule Call')
      },
      { 
        value: 'download', 
        label: t('step4.cta.options.download', 'Download Freebie'), 
        icon: Download,
        preview: t('step4.cta.previews.download', 'Take action today! Download our free resource guide with templates and checklists to get started.'),
        buttonText: t('step4.cta.buttons.downloadGuide', 'Download Free Guide')
      },
      { 
        value: 'visit-website', 
        label: t('step4.cta.options.visitWebsite', 'Visit Website'), 
        icon: Globe,
        preview: t('step4.cta.previews.visitWebsite', 'Learn more about our solutions and see how we can help you achieve your goals.'),
        buttonText: t('step4.cta.buttons.visitWebsite', 'Visit Our Website')
      },
      { 
        value: 'none', 
        label: t('step4.cta.options.none', 'None'), 
        icon: ExternalLink,
        preview: t('step4.cta.previews.none', 'Content ends with a strong conclusion without a specific call to action.'),
        buttonText: ""
      }
    ];
  }, [t]);

  // Get translated structure format options
  const getStructureFormatOptions = useMemo(() => {
    return [
      { 
        value: 'intro-points-cta', 
        label: t('step4.structure.options.introPointsCta.label', 'Intro + 3 Main Points + CTA'),
        category: t('step4.structure.categories.classic', 'Classic'),
        icon: BookOpen,
        useCase: t('step4.structure.options.introPointsCta.useCase', 'General blog posts, thought leadership'),
        flow: t('step4.structure.options.introPointsCta.flow', 'Hook → Point 1 → Point 2 → Point 3 → Action'),
        difficulty: t('step4.structure.difficulty.easy', 'Easy'),
        seoScore: t('step4.structure.seoScore.high', 'High'),
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 150, description: t('step4.structure.sections.introductionDesc', 'Hook and overview') },
          { name: t('step4.structure.sections.mainPoint1', 'Main Point 1'), words: 200, description: t('step4.structure.sections.mainPoint1Desc', 'First key concept') },
          { name: t('step4.structure.sections.mainPoint2', 'Main Point 2'), words: 200, description: t('step4.structure.sections.mainPoint2Desc', 'Second key concept') },
          { name: t('step4.structure.sections.mainPoint3', 'Main Point 3'), words: 200, description: t('step4.structure.sections.mainPoint3Desc', 'Third key concept') },
          { name: t('step4.structure.sections.callToAction', 'Call to Action'), words: 50, description: t('step4.structure.sections.callToActionDesc', 'Clear next step') }
        ]
      },
      { 
        value: 'problem-solution-cta', 
        label: t('step4.structure.options.problemSolutionCta.label', 'Problem → Solution → Call to Action'),
        category: t('step4.structure.categories.business', 'Business'),
        icon: Lightbulb,
        useCase: t('step4.structure.options.problemSolutionCta.useCase', 'Sales content, service explanations'),
        flow: t('step4.structure.options.problemSolutionCta.flow', 'Problem → Impact → Solution → Steps → Action'),
        difficulty: t('step4.structure.difficulty.medium', 'Medium'),
        seoScore: t('step4.structure.seoScore.high', 'High'),
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        sections: [
          { name: t('step4.structure.sections.problemIdentification', 'Problem Identification'), words: 200, description: t('step4.structure.sections.problemIdentificationDesc', 'Define the challenge') },
          { name: t('step4.structure.sections.impactConsequences', 'Impact & Consequences'), words: 150, description: t('step4.structure.sections.impactConsequencesDesc', 'Why it matters') },
          { name: t('step4.structure.sections.solutionOverview', 'Solution Overview'), words: 250, description: t('step4.structure.sections.solutionOverviewDesc', 'Your approach') },
          { name: t('step4.structure.sections.implementationSteps', 'Implementation Steps'), words: 150, description: t('step4.structure.sections.implementationStepsDesc', 'How to apply') },
          { name: t('step4.structure.sections.callToAction', 'Call to Action'), words: 50, description: t('step4.structure.sections.callToActionDesc', 'Next steps') }
        ]
      },
      { 
        value: 'how-to-steps', 
        label: t('step4.structure.options.howToSteps.label', 'How-To / Step-by-Step'),
        category: t('step4.structure.categories.tutorial', 'Tutorial'),
        icon: List,
        useCase: t('step4.structure.options.howToSteps.useCase', 'Tutorials, process guides, actionable posts'),
        flow: t('step4.structure.options.howToSteps.flow', 'Intro → Prerequisites → Step 1 → Step 2 → Step 3 → Tips'),
        difficulty: t('step4.structure.difficulty.easy', 'Easy'),
        seoScore: t('step4.structure.seoScore.veryHigh', 'Very High'),
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 150, description: t('step4.structure.sections.howToIntroDesc', 'Overview and what readers will learn') },
          { name: t('step4.structure.sections.prerequisites', 'Prerequisites'), words: 100, description: t('step4.structure.sections.prerequisitesDesc', 'What you need before starting') },
          { name: t('step4.structure.sections.step1', 'Step 1'), words: 150, description: t('step4.structure.sections.step1Desc', 'First action step') },
          { name: t('step4.structure.sections.step2', 'Step 2'), words: 150, description: t('step4.structure.sections.step2Desc', 'Second action step') },
          { name: t('step4.structure.sections.step3', 'Step 3'), words: 150, description: t('step4.structure.sections.step3Desc', 'Third action step') },
          { name: t('step4.structure.sections.additionalSteps', 'Additional Steps'), words: 200, description: t('step4.structure.sections.additionalStepsDesc', 'More steps as needed') },
          { name: t('step4.structure.sections.conclusionTips', 'Conclusion & Tips'), words: 100, description: t('step4.structure.sections.conclusionTipsDesc', 'Summary and best practices') }
        ]
      },
      { 
        value: 'faq-qa', 
        label: t('step4.structure.options.faqQa.label', 'FAQ / Q&A Format'),
        category: t('step4.structure.categories.support', 'Support'),
        icon: HelpCircle,
        useCase: t('step4.structure.options.faqQa.useCase', 'SEO pages, product explanations, service overviews'),
        flow: t('step4.structure.options.faqQa.flow', 'Intro → Q1+A → Q2+A → Q3+A → More Q&As → Conclusion'),
        difficulty: t('step4.structure.difficulty.easy', 'Easy'),
        seoScore: t('step4.structure.seoScore.veryHigh', 'Very High'),
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 120, description: t('step4.structure.sections.topicOverviewDesc', 'Topic overview') },
          { name: t('step4.structure.sections.question1Answer', 'Question 1 + Answer'), words: 150, description: t('step4.structure.sections.question1AnswerDesc', 'Most common question') },
          { name: t('step4.structure.sections.question2Answer', 'Question 2 + Answer'), words: 150, description: t('step4.structure.sections.question2AnswerDesc', 'Second most common question') },
          { name: t('step4.structure.sections.question3Answer', 'Question 3 + Answer'), words: 150, description: t('step4.structure.sections.question3AnswerDesc', 'Third most common question') },
          { name: t('step4.structure.sections.additionalQAs', 'Additional Q&As'), words: 180, description: t('step4.structure.sections.additionalQAsDesc', 'More questions as needed') },
          { name: t('step4.structure.sections.conclusion', 'Conclusion'), words: 50, description: t('step4.structure.sections.conclusionDesc', 'Summary and next steps') }
        ]
      },
      { 
        value: 'comparison-vs', 
        label: t('step4.structure.options.comparisonVs.label', 'Comparison / vs.'),
        category: t('step4.structure.categories.analysis', 'Analysis'),
        icon: Scale,
        useCase: t('step4.structure.options.comparisonVs.useCase', 'Product comparisons, software alternatives, decision-making content'),
        flow: t('step4.structure.options.comparisonVs.flow', 'Intro → Option A → Option B → Side-by-Side → Pros/Cons → Recommendation'),
        difficulty: t('step4.structure.difficulty.medium', 'Medium'),
        seoScore: t('step4.structure.seoScore.high', 'High'),
        color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 150, description: t('step4.structure.sections.comparisonIntroDesc', 'Context and what\'s being compared') },
          { name: t('step4.structure.sections.optionAOverview', 'Option A Overview'), words: 200, description: t('step4.structure.sections.optionAOverviewDesc', 'First option details') },
          { name: t('step4.structure.sections.optionBOverview', 'Option B Overview'), words: 200, description: t('step4.structure.sections.optionBOverviewDesc', 'Second option details') },
          { name: t('step4.structure.sections.sideBySideComparison', 'Side-by-side Comparison'), words: 250, description: t('step4.structure.sections.sideBySideComparisonDesc', 'Direct feature comparison') },
          { name: t('step4.structure.sections.prosAndCons', 'Pros and Cons'), words: 150, description: t('step4.structure.sections.prosAndConsDesc', 'Advantages and disadvantages') },
          { name: t('step4.structure.sections.recommendation', 'Recommendation'), words: 100, description: t('step4.structure.sections.recommendationDesc', 'Which option to choose when') }
        ]
      },
      { 
        value: 'review-analysis', 
        label: t('step4.structure.options.reviewAnalysis.label', 'Review / Analysis'),
        category: t('step4.structure.categories.analysis', 'Analysis'),
        icon: Star,
        useCase: t('step4.structure.options.reviewAnalysis.useCase', 'Product reviews, service evaluations'),
        flow: t('step4.structure.options.reviewAnalysis.flow', 'Intro → Features → Pros → Cons → Performance → Verdict'),
        difficulty: t('step4.structure.difficulty.medium', 'Medium'),
        seoScore: t('step4.structure.seoScore.high', 'High'),
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 120, description: t('step4.structure.sections.reviewIntroDesc', 'What\'s being reviewed') },
          { name: t('step4.structure.sections.keyFeatures', 'Key Features'), words: 200, description: t('step4.structure.sections.keyFeaturesDesc', 'Main features and capabilities') },
          { name: t('step4.structure.sections.pros', 'Pros'), words: 150, description: t('step4.structure.sections.prosDesc', 'What works well') },
          { name: t('step4.structure.sections.cons', 'Cons'), words: 150, description: t('step4.structure.sections.consDesc', 'Limitations and drawbacks') },
          { name: t('step4.structure.sections.performanceAnalysis', 'Performance Analysis'), words: 150, description: t('step4.structure.sections.performanceAnalysisDesc', 'How it performs in practice') },
          { name: t('step4.structure.sections.finalVerdict', 'Final Verdict'), words: 80, description: t('step4.structure.sections.finalVerdictDesc', 'Overall recommendation') }
        ]
      },
      { 
        value: 'case-study-detailed', 
        label: t('step4.structure.options.caseStudyDetailed.label', 'Case Study'),
        category: t('step4.structure.categories.business', 'Business'),
        icon: Briefcase,
        useCase: t('step4.structure.options.caseStudyDetailed.useCase', 'Showcasing client success stories'),
        flow: t('step4.structure.options.caseStudyDetailed.flow', 'Intro → Background → Challenge → Solution → Results → Lessons'),
        difficulty: t('step4.structure.difficulty.hard', 'Hard'),
        seoScore: t('step4.structure.seoScore.medium', 'Medium'),
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 100, description: t('step4.structure.sections.caseStudyOverviewDesc', 'Case study overview') },
          { name: t('step4.structure.sections.background', 'Background'), words: 150, description: t('step4.structure.sections.backgroundDesc', 'Context and situation') },
          { name: t('step4.structure.sections.challenge', 'Challenge'), words: 200, description: t('step4.structure.sections.challengeDesc', 'The problem that needed solving') },
          { name: t('step4.structure.sections.solution', 'Solution'), words: 250, description: t('step4.structure.sections.solutionDesc', 'Approach and implementation') },
          { name: t('step4.structure.sections.results', 'Results'), words: 200, description: t('step4.structure.sections.resultsDesc', 'Outcomes and metrics') },
          { name: t('step4.structure.sections.lessonsLearned', 'Lessons Learned'), words: 100, description: t('step4.structure.sections.lessonsLearnedDesc', 'Key takeaways and insights') }
        ]
      },
      { 
        value: 'story-facts-lessons', 
        label: t('step4.structure.options.storyFactsLessons.label', 'Story + Facts + Lessons'),
        category: t('step4.structure.categories.narrative', 'Narrative'),
        icon: PenTool,
        useCase: t('step4.structure.options.storyFactsLessons.useCase', 'Engaging storytelling with data backing'),
        flow: t('step4.structure.options.storyFactsLessons.flow', 'Story → Facts → Analysis → Lessons → Application'),
        difficulty: t('step4.structure.difficulty.medium', 'Medium'),
        seoScore: t('step4.structure.seoScore.medium', 'Medium'),
        color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
        sections: [
          { name: t('step4.structure.sections.openingStory', 'Opening Story'), words: 200, description: t('step4.structure.sections.openingStoryDesc', 'Engaging narrative') },
          { name: t('step4.structure.sections.keyFactsData', 'Key Facts & Data'), words: 200, description: t('step4.structure.sections.keyFactsDataDesc', 'Supporting evidence') },
          { name: t('step4.structure.sections.analysis', 'Analysis'), words: 200, description: t('step4.structure.sections.analysisDesc', 'What it means') },
          { name: t('step4.structure.sections.lessonsLearned', 'Lessons Learned'), words: 150, description: t('step4.structure.sections.lessonsLearnedDesc', 'Takeaways') },
          { name: t('step4.structure.sections.application', 'Application'), words: 50, description: t('step4.structure.sections.applicationDesc', 'How to use') }
        ]
      },
      { 
        value: 'listicle', 
        label: t('step4.structure.options.listicle.label', 'Listicle (e.g. 5 ways to...)'),
        category: t('step4.structure.categories.classic', 'Classic'),
        icon: Zap,
        useCase: t('step4.structure.options.listicle.useCase', 'Social media friendly, quick consumption'),
        flow: t('step4.structure.options.listicle.flow', 'Intro → Point 1 → Point 2 → Point 3 → Point 4 → Point 5'),
        difficulty: t('step4.structure.difficulty.easy', 'Easy'),
        seoScore: t('step4.structure.seoScore.medium', 'Medium'),
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        sections: [
          { name: t('step4.structure.sections.introduction', 'Introduction'), words: 100, description: t('step4.structure.sections.listOverviewDesc', 'List overview') },
          { name: t('step4.structure.sections.point1', 'Point 1'), words: 140, description: t('step4.structure.sections.point1Desc', 'First item') },
          { name: t('step4.structure.sections.point2', 'Point 2'), words: 140, description: t('step4.structure.sections.point2Desc', 'Second item') },
          { name: t('step4.structure.sections.point3', 'Point 3'), words: 140, description: t('step4.structure.sections.point3Desc', 'Third item') },
          { name: t('step4.structure.sections.point4', 'Point 4'), words: 140, description: t('step4.structure.sections.point4Desc', 'Fourth item') },
          { name: t('step4.structure.sections.point5', 'Point 5'), words: 140, description: t('step4.structure.sections.point5Desc', 'Fifth item') }
        ]
      },
      { 
        value: 'custom', 
        label: t('step4.structure.options.custom.label', 'Custom outline'),
        category: t('step4.structure.categories.advanced', 'Advanced'),
        icon: Users,
        useCase: t('step4.structure.options.custom.useCase', 'Unique content structures'),
        flow: t('step4.structure.options.custom.flow', 'Define your own flow'),
        difficulty: t('step4.structure.difficulty.hard', 'Hard'),
        seoScore: t('step4.structure.seoScore.variable', 'Variable'),
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        sections: [
          { name: t('step4.structure.sections.customStructure', 'Custom Structure'), words: 800, description: t('step4.structure.sections.customStructureDesc', 'Define your own sections') }
        ]
      }
    ];
  }, [t]);

  // Initialize from formData
  useEffect(() => {
    // Set default values for any missing fields
    if (!formData.contentTone) updateFormData('contentTone', 'professional');
    if (!formData.contentType) updateFormData('contentType', 'blog-article');
    if (!formData.structureFormat) updateFormData('structureFormat', 'intro-points-cta');
    if (!formData.ctaType) updateFormData('ctaType', 'none');
    if (formData.includeStats === undefined) updateFormData('includeStats', false);
    if (!formData.wordCount) updateFormData('wordCount', 800);
    
    // Check if we should show structure notes based on selection
    if (formData.structureFormat === 'custom') {
      setShowStructureNotes(true);
    }
  }, []);

  // Handle structure format change
  const handleStructureFormatChange = (value) => {
    updateFormData('structureFormat', value);
    if (value === 'custom') {
      setShowStructureNotes(true);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Get selected tone details
  const getSelectedTone = () => {
    return getToneOptions.find(t => t.value === formData.contentTone) || getToneOptions[1];
  };

  // Get selected structure details
  const getSelectedStructure = () => {
    return getStructureFormatOptions.find(s => s.value === formData.structureFormat) || getStructureFormatOptions[0];
  };

  // Get selected CTA details
  const getSelectedCTA = () => {
    return getCtaTypeOptions.find(c => c.value === formData.ctaType) || getCtaTypeOptions[4];
  };

  // Get SEO score styling
  const getSEOScoreStyle = (score) => {
    const veryHigh = t('step4.structure.seoScore.veryHigh', 'Very High');
    const high = t('step4.structure.seoScore.high', 'High');
    const medium = t('step4.structure.seoScore.medium', 'Medium');
    
    switch (score) {
      case veryHigh:
        return 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400';
      case high:
        return 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
      case medium:
        return 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400';
      default:
        return 'border-gray-300 text-gray-600 bg-gray-50 dark:bg-gray-950/20 dark:text-gray-400';
    }
  };

  // Get difficulty styling
  const getDifficultyStyle = (difficulty) => {
    const easy = t('step4.structure.difficulty.easy', 'Easy');
    const medium = t('step4.structure.difficulty.medium', 'Medium');
    const hard = t('step4.structure.difficulty.hard', 'Hard');
    
    switch (difficulty) {
      case easy:
        return 'text-green-600 dark:text-green-400';
      case medium:
        return 'text-yellow-600 dark:text-yellow-400';
      case hard:
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };
  // Calculate total word count
  const calculateTotalWords = () => {
    const structure = getSelectedStructure();
    return structure.sections.reduce((total, section) => total + section.words, 0);
  };
  // Get content length recommendation based on content type and tone
  const getContentLengthRecommendation = () => {
    const currentCount = formData.wordCount || 800;
    
    // Define optimal ranges for different content types
    const contentRanges = {
      'blog-article': [1200, 1800],
      'newsletter': [800, 1200],
      'case-study': [1500, 2500],
      'guide': [2000, 3000],
      'thought-piece': [1000, 1500]
    };
    
    const contentType = formData.contentType || 'blog-article';
    const [min, max] = contentRanges[contentType] || [1200, 1800];
    
    if (currentCount >= 1200 && currentCount <= 1800) {
      return t('step4.wordCount.recommendations.seoIdeal', ' this length is ideal for SEO and reader engagement.');
    } else if (currentCount >= min && currentCount <= max) {
      return t('step4.wordCount.recommendations.optimal', ' a length of {{min}}-{{max}} words is recommended for optimal results.', { min, max });
    } else if (currentCount < min) {
      return t('step4.wordCount.recommendations.tooShort', ' consider adding more content. At least {{min}} words is recommended.', { min });
    } else {
      return t('step4.wordCount.recommendations.tooLong', ' your content might be too lengthy for optimal engagement. Consider breaking it into multiple pieces.');
    }
  };
  
  // Get word count status for badge and visual indicators
  const getWordCountStatus = () => {
    const currentCount = formData.wordCount || 800;
    const contentType = formData.contentType || 'blog-article';
    
    // Define optimal ranges for different content types
    const contentRanges = {
      'blog-article': [1200, 1800],
      'newsletter': [800, 1200],
      'case-study': [1500, 2500],
      'guide': [2000, 3000],
      'thought-piece': [1000, 1500]
    };
    
    const [min, max] = contentRanges[contentType] || [1200, 1800];
    
    // SEO optimal range always takes precedence
    if (currentCount >= 1200 && currentCount <= 1800) {
      return { status: 'optimal', message: t('step4.wordCount.status.seoOptimal', 'SEO Optimal') };
    } else if (currentCount < min) {
      return { status: 'warning', message: t('step4.wordCount.status.tooShort', 'Too Short') };
    } else if (currentCount > max) {
      return { status: 'warning', message: t('step4.wordCount.status.veryLong', 'Very Long') };
    } else {
      return { status: 'normal', message: t('step4.wordCount.status.wordCount', '{{count}} words', { count: currentCount }) };
    }
  };
  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">{t('step4.title', 'Content Structure & Tone')}</h2>
          <p className="text-muted-foreground">
            {t('step4.subtitle', 'Define how your blog content should be structured and the tone it should have.')}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Tone Selection Card */}
            <Card className="p-4 border-l-4 border-l-primary shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Quote className="h-4 w-4" />
                    {t('step4.tone.title', 'Content Tone')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToneExample(!showToneExample)}
                  >
                    {showToneExample ? t('common.hide', 'Hide') : t('common.show', 'Show')} {t('step4.tone.example', 'Example')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.contentTone}
                    onValueChange={(value) => updateFormData('contentTone', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('step4.tone.placeholder', 'Select a tone')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getToneOptions.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex items-center gap-2">
                            <span>{tone.label}</span>
                            <Badge variant="secondary" className={tone.color}>
                              {tone.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone Description */}
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {getSelectedTone().description}
                  </p>
                </div>

                {/* Tone Example */}
                {showToneExample && (
                  <div className="p-3 border rounded-md bg-background">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {t('step4.tone.writingSample', 'WRITING SAMPLE')}
                    </Label>
                    <p className="text-sm italic">
                      "{getSelectedTone().example}"
                    </p>
                  </div>
                )}

                {/* Content Type */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium">{t('step4.contentType.title', 'Content Type')}</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => updateFormData('contentType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('step4.contentType.placeholder', 'Select content type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getContentTypeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Structure Format Card */}            {/* Word Count Card - NEW */}
            <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    {t('step4.wordCount.title', 'Content Length')}
                  </h3>
                  
                  {/* Word Count Status Badge */}
                  {getWordCountStatus().status === 'optimal' ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {getWordCountStatus().message}
                    </Badge>
                  ) : getWordCountStatus().status === 'warning' ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getWordCountStatus().message}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getWordCountStatus().message}
                    </Badge>
                  )}
                </div>

                {/* Word Count Slider with Current Value Display */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="word-count" className="text-sm font-medium flex items-center gap-1.5">
                      <span>{t('step4.wordCount.label', 'Word Count')}:</span> 
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {formData.wordCount || 800}
                      </span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <input
                      id="word-count"
                      type="range"
                      className="w-full accent-purple-500 h-2 bg-purple-100 dark:bg-purple-900 rounded-full appearance-none cursor-pointer"
                      min="300"
                      max="3000"
                      step="100"
                      value={formData.wordCount || 800}
                      onChange={(e) => updateFormData('wordCount', parseInt(e.target.value))}
                    />
                    
                    {/* SEO Optimal Range Highlight */}
                    <div 
                      className="absolute top-0 h-2 bg-green-300 dark:bg-green-800/50 rounded-full pointer-events-none"
                      style={{ 
                        left: `${(1200 - 300) / (3000 - 300) * 100}%`, 
                        width: `${(1800 - 1200) / (3000 - 300) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>300</span>
                    <span className="font-medium text-green-600">{t('step4.wordCount.seoRange', '1200-1800 (SEO Optimal)')}</span>
                    <span>3000</span>
                  </div>
                </div>

                {/* Content Length Recommendation */}
                <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      {t('step4.wordCount.contentLengthImpact', 'Content Length Impact')}
                    </h4>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {t('step4.wordCount.impactText', 'For {{contentType}} content with a {{tone}} tone,', { 
                      contentType: formData.contentType || 'blog-article', 
                      tone: formData.contentTone || 'professional' 
                    })}
                    {getContentLengthRecommendation()}
                  </p>
                  
                  {/* Reading Time Estimate */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-purple-600 dark:text-purple-400">
                    <Clock className="h-3 w-3" />
                    <span>{t('step4.wordCount.estimatedReading', 'Estimated reading time: {{minutes}} minutes', { 
                      minutes: Math.ceil((formData.wordCount || 800) / 200) 
                    })}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('step4.structure.title', 'Structure Format')}
                  </h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateTotalWords()} {t('common.wordsShort', 'words')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Select
                    value={formData.structureFormat}
                    onValueChange={handleStructureFormatChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('step4.structure.placeholder', 'Select structure format')} />
                    </SelectTrigger>
                    <SelectContent 
                      className="max-h-[280px] min-w-[320px] overflow-y-auto"
                      position="popper"
                      sideOffset={4}
                    >
                      {getStructureFormatOptions.map((format) => {
                        const IconComponent = format.icon;
                        return (
                          <SelectItem 
                            key={format.value} 
                            value={format.value} 
                            className="p-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className={`p-1 rounded ${format.color} flex-shrink-0`}>
                                <IconComponent className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate">{format.label}</span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-1 py-0"
                                    >
                                      {format.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {format.category} • {format.sections.reduce((total, section) => total + section.words, 0)} {t('common.wordsShort', 'words')}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced Structure Preview Card */}
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSelectedStructure().color} flex-shrink-0`}>
                      {React.createElement(getSelectedStructure().icon, { className: "h-5 w-5" })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{getSelectedStructure().label}</h4>
                          <p className="text-xs text-muted-foreground">{getSelectedStructure().useCase}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className={`text-xs ${getDifficultyStyle(getSelectedStructure().difficulty)}`}>
                            {getSelectedStructure().difficulty}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSEOScoreStyle(getSelectedStructure().seoScore)}`}
                          >
                            {getSelectedStructure().seoScore} SEO
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded border text-xs font-mono text-muted-foreground">
                        <strong>{t('step4.structure.flow', 'Flow')}:</strong> {getSelectedStructure().flow}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Structure Sections Preview */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t('step4.structure.structureBreakdown', 'STRUCTURE BREAKDOWN')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateTotalWords()} {t('step4.structure.totalWords', 'total words')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('structure')}
                        className="h-6 w-6 p-0"
                      >
                        {expandedSections.has('structure') ? 
                          <ChevronDown className="h-3 w-3" /> : 
                          <ChevronRight className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {expandedSections.has('structure') && (
                    <div className="space-y-2">
                      {getSelectedStructure().sections.map((section, index) => (
                        <div key={index} className="group relative">
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Badge 
                                  variant="outline" 
                                  className="w-7 h-7 p-0 flex items-center justify-center text-xs font-semibold border-2"
                                >
                                  {index + 1}
                                </Badge>
                                {/* Connection line to next section */}
                                {index < getSelectedStructure().sections.length - 1 && (
                                  <div className="absolute top-7 left-1/2 w-0.5 h-4 bg-border -translate-x-px"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  {section.name}
                                  {section.name.includes('Step') && <List className="h-3 w-3 text-purple-500" />}
                                  {section.name.includes('Question') && <HelpCircle className="h-3 w-3 text-orange-500" />}
                                  {section.name.includes('CTA') && <Target className="h-3 w-3 text-green-500" />}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                                
                                {/* Progress bar for word allocation */}
                                <div className="mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                                    style={{ 
                                      width: `${(section.words / Math.max(...getSelectedStructure().sections.map(s => s.words))) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs font-mono">
                                {section.words}w
                              </Badge>
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                {Math.round((section.words / calculateTotalWords()) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Structure Summary */}
                      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('step4.structure.analysis', 'Structure Analysis')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">{t('step4.structure.sections', 'Sections')}:</span>
                            <span className="ml-1 font-medium">{getSelectedStructure().sections.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('step4.structure.avgPerSection', 'Avg per section')}:</span>
                            <span className="ml-1 font-medium">{Math.round(calculateTotalWords() / getSelectedStructure().sections.length)}{t('common.wordsShort', 'w')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('step4.structure.readingTime', 'Reading time')}:</span>
                            <span className="ml-1 font-medium">{Math.ceil(calculateTotalWords() / 200)} {t('step4.structure.minutes', 'min')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('step4.structure.seoPotential', 'SEO potential')}:</span>
                            <Badge 
                              variant="outline" 
                              className={`ml-1 text-xs ${getSEOScoreStyle(getSelectedStructure().seoScore)}`}
                            >
                              {getSelectedStructure().seoScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistics Toggle */}
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                  <div>
                    <Label className="text-sm font-medium">{t('step4.structure.includeStats.label', 'Include Statistics & Data')}</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('step4.structure.includeStats.description', 'Add relevant statistics and data to support your points.')}
                    </p>
                  </div>
                  <Switch
                    checked={formData.includeStats}
                    onCheckedChange={(checked) => updateFormData('includeStats', checked)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {/* Custom Structure Notes */}
                {(formData.structureFormat === 'custom' || showStructureNotes) && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">
                      {t('step4.structure.structureNotes', 'Structure Notes')} {formData.structureFormat === 'custom' ? `(${t('common.required', 'Required')})` : `(${t('common.optional', 'Optional')})`}
                    </Label>
                    <Textarea
                      placeholder={t('step4.structure.notesPlaceholder', 'e.g. Include an introduction, 3 key sections, and a conclusion with call to action')}
                      value={formData.structureNotes || ''}
                      onChange={(e) => updateFormData('structureNotes', e.target.value)}
                      rows={4}
                      className="w-full resize-y"
                    />
                  </div>
                )}

                {!showStructureNotes && formData.structureFormat !== 'custom' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStructureNotes(true)}
                    className="w-full"
                  >
                    {t('step4.structure.addCustomNotes', 'Add Custom Structure Notes')}
                  </Button>
                )}
              </div>
            </Card>

            {/* CTA Selection Card */}
            <Card className="p-4 border-l-4 border-l-green-500 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('step4.cta.title', 'Call to Action')}
                </h3>

                <div className="space-y-2">
                  <Select
                    value={formData.ctaType}
                    onValueChange={(value) => updateFormData('ctaType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('step4.cta.placeholder', 'Select CTA type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCtaTypeOptions.map((cta) => {
                        const IconComponent = cta.icon;
                        return (
                          <SelectItem key={cta.value} value={cta.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {cta.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* CTA Preview */}
                {formData.ctaType && formData.ctaType !== 'none' && (
                  <div className="p-3 border rounded-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {t('step4.cta.ctaPreview', 'CTA PREVIEW')}
                    </Label>
                    <p className="text-sm mb-3">{getSelectedCTA().preview}</p>                    {getSelectedCTA().buttonText && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        {React.createElement(getSelectedCTA().icon, { className: "h-4 w-4 mr-2" })}
                        {getSelectedCTA().buttonText}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('step4.preview.title', 'Content Preview')}
                </h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('step4.preview.livePreview', 'Live Preview')}
                </Badge>
              </div>
              
              <ContentPreview
                topic={formData.topic}
                keywords={formData.keywords || []}
                contentTone={formData.contentTone}
                structureFormat={formData.structureFormat}                wordCount={formData.wordCount || calculateTotalWords()}
                includeImages={formData.includeImages}
                audience={formData.audience}
                industry={formData.industry}
                className="border-0 shadow-none"
              />
            </Card>
          </div>
        </div>

        {/* Helper tip box */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900 rounded-md">
          <h3 className="font-medium text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <span>{t('step4.tips.title', 'Smart Structure Selection Guide')}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>{t('step4.tips.seoImpact.title', 'SEO Impact')}:</strong> {t('step4.tips.seoImpact.description', 'How-To and FAQ formats typically rank highest in search results. Tutorial content with step-by-step instructions receives more engagement and better SERP features.')}
              </p>
            </div>
            <div>
              <p className="text-purple-700 dark:text-purple-300">
                <strong>{t('step4.tips.structureFlow.title', 'Structure Flow')}:</strong> {t('step4.tips.structureFlow.description', 'Each format shows its content flow for easy visualization. The difficulty rating helps you choose based on your writing experience and time constraints.')}
              </p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300">
                <strong>{t('step4.tips.bestPractices.title', 'Best Practices')}:</strong> {t('step4.tips.bestPractices.description', 'Use comparison structures for decision-making content, case studies for showcasing results, and FAQ formats for addressing common user questions.')}
              </p>
            </div>
          </div>
          
          {/* Quick recommendations based on content type */}
          <div className="mt-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded border">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              💡 {t('step4.tips.recommendation', 'Recommendation for {{contentType}}:', { contentType: formData.contentType || t('step4.tips.yourContent', 'your content') })}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formData.contentType === 'guide' && t('step4.tips.recommendations.guide', 'How-To/Step-by-Step structure works best for guides - high SEO value and user engagement.')}
              {formData.contentType === 'blog-article' && t('step4.tips.recommendations.blogArticle', 'Intro + 3 Main Points or Problem→Solution structures are ideal for blog articles.')}
              {formData.contentType === 'case-study' && t('step4.tips.recommendations.caseStudy', 'Case Study structure is perfect - tells a complete story from challenge to results.')}
              {formData.contentType === 'newsletter' && t('step4.tips.recommendations.newsletter', 'Story + Facts + Lessons keeps newsletter readers engaged with narrative flow.')}
              {(!formData.contentType || formData.contentType === 'thought-piece') && t('step4.tips.recommendations.default', 'Choose based on your goal: How-To for tutorials, FAQ for SEO, Comparison for decision-making content.')}
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Step4ToneStructure;
