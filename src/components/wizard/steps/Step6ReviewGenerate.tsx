/**
 * Step6ReviewGenerate.tsx
 * v1.0.0
 * Purpose: Enhanced Review & Generate step with SEO scoring, completion checklist,
 * quick edit buttons, generation cost, share draft functionality, export settings,
 * and publish-readiness score
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Edit3, 
  Share2,
  Download,
  Eye,
  Coins,
  Zap,
  Target,
  FileText,
  Image,
  Hash,
  Users,
  TrendingUp,
  Award,
  Clock,
  Link,
  Mail,
  Twitter,
  Facebook,
  Copy,
  ExternalLink,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// SEO scoring weights
const SEO_WEIGHTS = {
  title: 20,
  keywords: 25,
  wordCount: 15,
  structure: 15,
  readability: 10,
  mediaIncluded: 10,
  metaOptimization: 5
};

// Define the interface for the function response
interface GenerateLongformResponse {
  success: boolean;
  content?: string;
  outline?: any;
  metadata?: {
    actualWordCount: number;
    outlineGenerationTime: number;
    contentGenerationTime: number;
    contentQuality: {
      hasEmotionalElements: boolean;
      hasActionableContent: boolean;
      seoOptimized: boolean;
      structureComplexity: number;
    }
  };
  message?: string;
  error?: string;
  requestsRemaining?: number;
  contentId?: string;
  hasUsage?: boolean;
}

interface Step6Props {
  formData: any;
  updateFormData: (key: string, value: any) => void;
  onGenerate: () => void;
  onEditStep: (stepNumber: number) => void;
}

const Step6ReviewGenerate: React.FC<Step6Props> = ({ formData, updateFormData, onGenerate, onEditStep }) => {
  const { t } = useTranslation('longform');
  const [selectedExportFormats, setSelectedExportFormats] = useState(['markdown']);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerateLongformResponse | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'outline' | 'content' | 'complete' | null>(null);
  
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { currentLanguage } = useLanguage();

  // Helper function to ensure progress is always rounded
  const updateProgress = (value: number) => {
    setGenerationProgress(Math.round(value * 10) / 10); // Round to 1 decimal place
  };

  // Create the callable function
  const generateLongformContentFunction = httpsCallable<
    any, 
    GenerateLongformResponse
  >(functions, 'generateLongformContent');

  // Initialize export format from formData
  useEffect(() => {
    if (formData.outputFormat && !selectedExportFormats.includes(formData.outputFormat)) {
      setSelectedExportFormats([formData.outputFormat]);
    }
  }, [formData.outputFormat]);

  // Calculate SEO Score
  const seoScore = useMemo(() => {
    let totalScore = 0;
    const factors = [];

    // Title optimization (20 points)
    const titleScore = formData.optimizedTitle ? 
      (formData.optimizedTitle.length >= 50 && formData.optimizedTitle.length <= 60 ? 20 : 15) : 0;
    totalScore += titleScore;
    factors.push({
      factor: t('step6.seo_score_factor.title'),
      score: titleScore,
      maxScore: SEO_WEIGHTS.title,
      status: titleScore >= 15 ? 'good' : 'needs-work',
      description: titleScore >= 15 ? t('step6.seo_score_description.title_optimized') : t('step6.seo_score_description.title_needs_optimization')
    });

    // Keywords (25 points)
    const keywordScore = formData.keywords?.length >= 3 ? 25 : (formData.keywords?.length || 0) * 8;
    totalScore += keywordScore;
    factors.push({
      factor: t('step6.seo_score_factor.keywords'),
      score: keywordScore,
      maxScore: SEO_WEIGHTS.keywords,
      status: keywordScore >= 20 ? 'good' : 'needs-work',
      description: t('step6.seo_score_description.keywords', { count: formData.keywords?.length || 0 })
    });

    // Word count (15 points)
    const wordCount = formData.wordCount || 800;
    const wordCountScore = wordCount >= 1200 && wordCount <= 1800 ? 15 : 
                          wordCount >= 800 ? 10 : 5;
    totalScore += wordCountScore;
    factors.push({
      factor: t('step6.seo_score_factor.word_count'),
      score: wordCountScore,
      maxScore: SEO_WEIGHTS.wordCount,
      status: wordCountScore >= 12 ? 'good' : 'needs-work',
      description: t('step6.seo_score_description.word_count', { count: wordCount })
    });

    // Structure (15 points)
    const structureScore = formData.structureFormat ? 15 : 0;
    totalScore += structureScore;
    factors.push({
      factor: t('step6.seo_score_factor.structure'),
      score: structureScore,
      maxScore: SEO_WEIGHTS.structure,
      status: structureScore > 0 ? 'good' : 'needs-work',
      description: t('step6.seo_score_description.structure', { structure: formData.structureFormat ? t('step6.seo_score_description.structure_defined') : t('step6.seo_score_description.structure_no_structure') })
    });

    // Readability (10 points)
    const readabilityScore = formData.contentTone ? 10 : 0;
    totalScore += readabilityScore;
    factors.push({
      factor: t('step6.seo_score_factor.readability'),
      score: readabilityScore,
      maxScore: SEO_WEIGHTS.readability,
      status: readabilityScore > 0 ? 'good' : 'needs-work',
      description: t('step6.seo_score_description.readability', { tone: formData.contentTone ? t('step6.seo_score_description.tone_selected') : t('step6.seo_score_description.tone_not_specified') })
    });

    // Media inclusion (10 points)
    const mediaScore = formData.includeImages ? 10 : 0;
    totalScore += mediaScore;
    factors.push({
      factor: t('step6.seo_score_factor.media_integration'),
      score: mediaScore,
      maxScore: SEO_WEIGHTS.mediaIncluded,
      status: mediaScore > 0 ? 'good' : 'could-improve',
      description: formData.includeImages ? t('step6.seo_score_description.media_integration_images_suggested') : t('step6.seo_score_description.media_integration_no_media')
    });

    // Meta optimization (5 points)
    const metaScore = (formData.industry && formData.audience) ? 5 : 0;
    totalScore += metaScore;
    factors.push({
      factor: t('step6.seo_score_factor.meta_optimization'),
      score: metaScore,
      maxScore: SEO_WEIGHTS.metaOptimization,
      status: metaScore > 0 ? 'good' : 'needs-work',
      description: metaScore > 0 ? t('step6.seo_score_description.meta_optimization_industry_audience_defined') : t('step6.seo_score_description.meta_optimization_missing_meta')
    });

    return {
      total: totalScore,
      percentage: Math.round((totalScore / 100) * 100),
      factors,
      grade: totalScore >= 85 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 55 ? 'C' : 'D'
    };
  }, [formData]);

  // Calculate completion checklist
  const completionChecklist = useMemo(() => {
    const items = [
      {
        id: 'topic',
        label: t('step6.completion_checklist.topic'),
        completed: !!formData.topic,
        required: true,
        editStep: 0
      },
      {
        id: 'industry-audience',
        label: t('step6.completion_checklist.industry_audience'),
        completed: !!(formData.industry && formData.audience),
        required: true,
        editStep: 1
      },
      {
        id: 'keywords',
        label: t('step6.completion_checklist.keywords'),
        completed: !!(formData.keywords?.length >= 2),
        required: true,
        editStep: 2
      },
      {
        id: 'title',
        label: t('step6.completion_checklist.title'),
        completed: !!formData.optimizedTitle,
        required: true,
        editStep: 2
      },
      {
        id: 'structure',
        label: t('step6.completion_checklist.structure'),
        completed: !!formData.structureFormat,
        required: true,
        editStep: 3
      },
      {
        id: 'tone',
        label: t('step6.completion_checklist.tone'),
        completed: !!formData.contentTone,
        required: true,
        editStep: 3
      },      {
        id: 'word-count',
        label: t('step6.completion_checklist.word_count'),
        completed: !!(formData.wordCount && formData.wordCount >= 500),
        required: false,
        editStep: 3
      },
      {
        id: 'format',
        label: t('step6.completion_checklist.format'),
        completed: !!formData.outputFormat,
        required: false,
        editStep: 4
      },
      {
        id: 'media',
        label: t('step6.completion_checklist.media'),
        completed: formData.includeImages !== undefined,
        required: false,
        editStep: 4
      },
      {
        id: 'quality-checks',
        label: t('step6.completion_checklist.quality_checks'),
        completed: formData.plagiarismCheck !== false,
        required: false,
        editStep: 4
      }
    ];

    const completedCount = items.filter(item => item.completed).length;
    const requiredCount = items.filter(item => item.required).length;
    const requiredCompleted = items.filter(item => item.required && item.completed).length;

    return {
      items,
      completedCount,
      totalCount: items.length,
      requiredCompleted,
      requiredCount,
      percentage: Math.round((completedCount / items.length) * 100),
      requiredPercentage: Math.round((requiredCompleted / requiredCount) * 100)
    };
  }, [formData]);

  // Calculate generation cost
  const generationCost = useMemo(() => {
    const hasAdvancedFeatures = formData.includeStats || formData.plagiarismCheck;
    const hasMediaFeatures = formData.includeImages || (formData.mediaFiles?.length > 0);
    const hasMultipleFormats = selectedExportFormats.length > 1;

    if (hasAdvancedFeatures || hasMultipleFormats) {
      return { credits: 12, features: [t('step6.generationCost.advancedContent'), t('step6.generationCost.researchIntegration'), t('step6.generationCost.plagiarismCheck'), t('step6.generationCost.multipleFormats')] };
    } else if (hasMediaFeatures) {
      return { credits: 8, features: [t('step6.generationCost.enhancedContent'), t('step6.generationCost.imageSuggestions'), t('step6.generationCost.seoOptimization')] };
    } else {
      return { credits: 5, features: [t('step6.generationCost.basicContent'), t('step6.generationCost.standardFormatting')] };
    }
  }, [formData, selectedExportFormats, t]);

  // Calculate publish-readiness score
  const publishReadinessScore = useMemo(() => {
    let score = 0;
    const factors = [];

    // Content completeness (30%)
    const contentComplete = completionChecklist.requiredPercentage;
    score += (contentComplete / 100) * 30;
    factors.push({
      factor: t('step6.publish_readiness_factor.content_completeness'),
      score: Math.round((contentComplete / 100) * 30),
      maxScore: 30,
      description: t('step6.publish_readiness_description.content_completeness', { completed: completionChecklist.requiredCompleted, total: completionChecklist.requiredCount })
    });

    // SEO optimization (25%)
    const seoOptimization = (seoScore.total / 100) * 25;
    score += seoOptimization;
    factors.push({
      factor: t('step6.publish_readiness_factor.seo_optimization'),
      score: Math.round(seoOptimization),
      maxScore: 25,
      description: t('step6.publish_readiness_description.seo_optimization', { score: seoScore.percentage })
    });

    // Technical setup (20%)
    const technicalSetup = (formData.outputFormat && selectedExportFormats.length > 0) ? 20 : 10;
    score += technicalSetup;
    factors.push({
      factor: t('step6.publish_readiness_factor.technical_setup'),
      score: technicalSetup,
      maxScore: 20,
      description: t('step6.publish_readiness_description.technical_setup')
    });

    // Quality assurance (15%)
    const qualityAssurance = formData.plagiarismCheck ? 15 : 5;
    score += qualityAssurance;
    factors.push({
      factor: t('step6.publish_readiness_factor.quality_assurance'),
      score: qualityAssurance,
      maxScore: 15,
      description: formData.plagiarismCheck ? t('step6.publish_readiness_description.quality_assurance_plagiarism_enabled') : t('step6.publish_readiness_description.quality_assurance_basic_checks')
    });

    // Engagement features (10%)
    const engagementFeatures = (formData.includeImages ? 5 : 0) + (formData.ctaType && formData.ctaType !== 'none' ? 5 : 0);
    score += engagementFeatures;
    factors.push({
      factor: t('step6.publish_readiness_factor.engagement_features'),
      score: engagementFeatures,
      maxScore: 10,
      description: t('step6.publish_readiness_description.engagement_features', { images: formData.includeImages ? t('step6.publish_readiness_description.images_included') : t('step6.publish_readiness_description.no_images'), cta: formData.ctaType && formData.ctaType !== 'none' ? t('step6.publish_readiness_description.cta_included') : t('step6.publish_readiness_description.no_cta') })
    });

    return {
      total: Math.round(score),
      factors,
      grade: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work'
    };
  }, [formData, seoScore, completionChecklist, selectedExportFormats, t]);

  // Handle export format selection
  const handleExportFormatToggle = (format) => {
    const newFormats = selectedExportFormats.includes(format)
      ? selectedExportFormats.filter(f => f !== format)
      : [...selectedExportFormats, format];
    
    setSelectedExportFormats(newFormats);
    if (newFormats.length > 0) {
      updateFormData('outputFormat', newFormats[0]);
    }
  };

  // Handle share draft
  const handleShareDraft = () => {
    // Generate a shareable URL (in a real app, this would be an API call)
    const draftId = Math.random().toString(36).substring(7);
    const shareableUrl = `${window.location.origin}/shared-draft/${draftId}`;
    setShareUrl(shareableUrl);
    setShareModalOpen(true);
  };

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Estimated generation time
  const estimatedTime = useMemo(() => {
    const baseTime = 2.5;
    const wordMultiplier = (formData.wordCount || 800) / 1000;
    const complexityMultiplier = (formData.includeStats ? 1.3 : 1) * (formData.plagiarismCheck ? 1.2 : 1);
    const formatMultiplier = selectedExportFormats.length * 0.3 + 0.7;
    
    const calculatedTime = baseTime * wordMultiplier * complexityMultiplier * formatMultiplier;
    return Math.round(calculatedTime * 10) / 10; // Round to 1 decimal place
  }, [formData, selectedExportFormats]);

  // Handle the generation process
  const handleGenerate = async () => {
    // Check authentication first
    if (!currentUser) {
      toast.error(t('step6.generation_login_error'), {
        description: t('step6.generation_login_description')
      });
      navigate('/login');
      return;
    }

    // Check if user profile is loaded and has sufficient requests
    if (!userProfile) {
      toast.error(t('step6.loading_profile_error'), {
        description: t('step6.loading_profile_description')
      });
      return;
    }

    // Check request limits - Long-form content requires 4 credits
    const requestsRemaining = (userProfile.requests_limit || 0) - (userProfile.requests_used || 0);
    if (requestsRemaining < 4) {
      toast.error(t('step6.insufficient_credits_error'), {
        description: t('step6.insufficient_credits_description', { credits: 4, remaining: requestsRemaining }),
        action: {
          label: t('step6.upgrade_plan_action'),
          onClick: () => navigate('/pricing')
        }
      });
      return;
    }

    if (completionChecklist.requiredCompleted < completionChecklist.requiredCount) {
      toast.error(t('step6.complete_required_items_error'));
      return;
    }
    
    let progressUpdateInterval: NodeJS.Timeout | null = null;
    let contentGenerationInterval: NodeJS.Timeout | null = null;
    
    try {
      setIsGenerating(true);
      setGenerationError(null);
      updateProgress(10);
      setGenerationStage('outline');

      // Prepare the data for the function call
      const functionData = {
        topic: formData.topic,
        audience: formData.audience,
        industry: formData.industry,
        contentType: formData.contentType || 'blog-article',
        contentTone: formData.contentTone || 'professional',
        structureFormat: formData.structureFormat || 'intro-points-cta',
        wordCount: formData.wordCount || 800,
        keywords: formData.keywords || [],
        optimizedTitle: formData.optimizedTitle || formData.topic,
        includeImages: formData.includeImages || false,
        includeStats: formData.includeStats || false,
        includeReferences: formData.includeReferences || false,
        tocRequired: formData.tocRequired || false,
        summaryRequired: formData.summaryRequired || false,
        structuredData: formData.structuredData || false,
        enableMetadataBlock: formData.enableMetadataBlock || false,
        plagiarismCheck: formData.plagiarismCheck !== false,
        outputFormat: selectedExportFormats[0] || 'markdown',
        ctaType: formData.ctaType || 'none',
        structureNotes: formData.structureNotes || '',
        mediaUrls: (formData.mediaFiles || []).map((file: any) => file.url || ''),
        // Enhanced Media Integration Fields
        mediaCaptions: (formData.mediaFiles || []).map((file: any) => file.metadata?.mediaCaption || ''),
        mediaAnalysis: (formData.mediaFiles || []).map((file: any) => file.metadata?.aiAnalysis || ''),
        mediaPlacementStrategy: formData.mediaPlacementStrategy || 'auto', // auto, manual, or semantic
        // Enhanced GEO optimization parameters
        targetLocation: formData.targetLocation || '',
        geographicScope: formData.geographicScope || 'global',
        marketFocus: formData.marketFocus || [],
        localSeoKeywords: formData.localSeoKeywords || [],
        culturalContext: formData.culturalContext || '',
        lang: currentLanguage
      };

      // Update progress based on typical function execution timeline
      progressUpdateInterval = setInterval(() => {
        setGenerationProgress(prev => {
          // Fix floating-point precision by using Math.min and proper rounding
          const newProgress = Math.min(85, Math.round((prev + 0.5) * 10) / 10);
          return newProgress;
        });
      }, 1500); // Slower updates to account for actual generation time
      
      setGenerationStage('outline');

      // Call the Firebase function
      const result = await generateLongformContentFunction(functionData);
      
      // Clear progress intervals immediately after function completes
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);
      if (contentGenerationInterval) clearInterval(contentGenerationInterval);
      
      console.log("Function result:", result); // Debug log
      
      // Handle success - The backend returns success: true and content in result.data
      if (result.data && result.data.success && result.data.content) {
        setGenerationResult(result.data);
        updateProgress(100);
        setGenerationStage('complete');
        setIsGenerating(false);
        
        toast.success(t('step6.generation_success'), {
          description: t('step6.generation_success_description', { 
            wordCount: result.data.metadata?.actualWordCount || formData.wordCount 
          })
        });

        // Navigate to the dashboard longform tab
        setTimeout(() => {
          navigate('/dashboard?tab=longform', { 
            state: { 
              newContentGenerated: true,
              generationCompleted: true,
              contentId: result.data.contentId
            } 
          });
        }, 2000);
      } else if (result.data && result.data.hasUsage === false) {
        // Handle insufficient credits case
        throw new Error(result.data.message || "Insufficient credits to generate content.");
      } else if (result.data && result.data.success === false) {
        // Handle case where function returned an error response
        throw new Error(result.data.message || "Content generation failed. Please try again.");
      } else {
        // Handle unexpected response format
        console.error("Unexpected response format:", result);
        throw new Error("Content generation completed but returned an unexpected response format. Please try again.");
      }

    } catch (error: any) {
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);
      if (contentGenerationInterval) clearInterval(contentGenerationInterval);
      
      // Reset generation state
      setIsGenerating(false);
      updateProgress(0);
      setGenerationStage(null);
      
      console.error("Generation error:", error);
      
      // Enhanced error handling with specific messages for common errors
      let errorMessage = t('step6.generation_unexpected_error');
      let errorAction = null;
      
      if (error.code) {
        // Handle Firebase error codes
        switch (error.code) {
          case 'functions/cancelled':
            errorMessage = t('step6.generation_cancelled_error');
            break;
          case 'functions/deadline-exceeded':
            errorMessage = t('step6.generation_deadline_exceeded_error');
            break;
          case 'functions/resource-exhausted':
            errorMessage = t('step6.generation_resource_exhausted_error');
            errorAction = {
              label: t('step6.upgrade_plan_action'),
              onClick: () => navigate('/pricing')
            };
            break;
          case 'functions/unauthenticated':
          case 'functions/permission-denied':
            errorMessage = t('step6.generation_permission_denied_error');
            errorAction = {
              label: t('step6.log_in_action'),
              onClick: () => navigate('/login')
            };
            break;
          case 'functions/internal':
            if (error.message && error.message.includes('insufficient credits')) {
              errorMessage = t('step6.generation_insufficient_credits_error');
              errorAction = {
                label: t('step6.upgrade_plan_action'),
                onClick: () => navigate('/pricing')
              };
            } else {
              errorMessage = t('step6.generation_internal_error', { message: error.message });
            }
            break;
          case 'functions/invalid-argument':
            errorMessage = t('step6.generation_invalid_argument_error', { message: error.message });
            break;
          default:
            // Use the error message from Firebase if available
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        // Handle non-Firebase errors
        if (error.message.includes('insufficient credits') || error.message.includes('not enough credits')) {
          errorMessage = t('step6.generation_insufficient_credits_per_generation_error');
          errorAction = {
            label: t('step6.upgrade_plan_action'),
            onClick: () => navigate('/pricing')
          };
        } else {
          errorMessage = t('step6.generation_failed', { message: error.message });
        }
      }

      setGenerationError(errorMessage);
      setIsGenerating(false);
      
      toast.error(t('step6.generation_failed_error'), {
        description: errorMessage,
        action: errorAction
      });
    }
  };

  // Retry generation after an error
  const handleRetryGeneration = () => {
    setGenerationError(null);
    handleGenerate();
  };

  // Handle quick edit
  const handleQuickEdit = (field) => {
    onEditStep(field.editStep);
  };

  // Export format options (translation-aware)
  const EXPORT_FORMAT_OPTIONS = useMemo(() => [
    {
      value: 'markdown',
      label: t('step6.export.markdown'),
      icon: FileText,
      description: t('step6.export.markdown.desc'),
      features: [t('step6.export.feature.cleanFormatting'), t('step6.export.feature.platformAgnostic'), t('step6.export.feature.easyEditing')]
    },
    {
      value: 'html',
      label: t('step6.export.html'),
      icon: ExternalLink,
      description: t('step6.export.html.desc'),
      features: [t('step6.export.feature.webReady'), t('step6.export.feature.seoMetaTags'), t('step6.export.feature.styledOutput')]
    },
    {
      value: 'docx',
      label: t('step6.export.docx'),
      icon: FileText,
      description: t('step6.export.docx.desc'),
      features: [t('step6.export.feature.richFormatting'), t('step6.export.feature.commentsSupport'), t('step6.export.feature.trackChanges')]
    },
    {
      value: 'pdf',
      label: t('step6.export.pdf'),
      icon: Download,
      description: t('step6.export.pdf.desc'),
      features: [t('step6.export.feature.printReady'), t('step6.export.feature.universalCompatibility'), t('step6.export.feature.fixedLayout')]
    },
    {
      value: 'gdocs',
      label: t('step6.export.gdocs'),
      icon: Link,
      description: t('step6.export.gdocs.desc'),
      features: [t('step6.export.feature.realTimeCollab'), t('step6.export.feature.commentSystem'), t('step6.export.feature.cloudStorage')]
    }
  ], [t]);

  // Generation cost tiers based on features (translation-aware)
  const GENERATION_COSTS = useMemo(() => ({
    basic: { credits: 5, features: [t('step6.generationCost.basicContent'), t('step6.generationCost.standardFormatting')] },
    standard: { credits: 8, features: [t('step6.generationCost.enhancedContent'), t('step6.generationCost.imageSuggestions'), t('step6.generationCost.seoOptimization')] },
    premium: { credits: 12, features: [t('step6.generationCost.advancedContent'), t('step6.generationCost.researchIntegration'), t('step6.generationCost.plagiarismCheck'), t('step6.generationCost.multipleFormats')] }
  }), [t]);

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">{t('step6.review_generate_title')}</h2>
          <p className="text-muted-foreground">
            {t('step6.review_generate_description')}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* SEO Score Card */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('step6.seo_score_title')}
              </h3>
              <Badge className={`${
                seoScore.grade === 'A' ? 'bg-green-100 text-green-800' :
                seoScore.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                seoScore.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {t('step6.seo_score_grade', { grade: seoScore.grade })}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{seoScore.percentage}%</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <Progress value={seoScore.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('step6.seo_score_total_points', { total: seoScore.total, factors: seoScore.factors.length })}
              </p>
            </div>
          </Card>

          {/* Completion Status Card */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('step6.completion_title')}
              </h3>
              <Badge variant="outline">
                {completionChecklist.completedCount}/{completionChecklist.totalCount}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{completionChecklist.percentage}%</span>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <Progress value={completionChecklist.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('step6.completion_required_items', { completed: completionChecklist.requiredCompleted, total: completionChecklist.requiredCount })}
              </p>
            </div>
          </Card>

          {/* Publish Readiness Card */}
          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t('step6.publish_readiness_title')}
              </h3>
              <Badge className={`${
                publishReadinessScore.grade === 'Excellent' ? 'bg-green-100 text-green-800' :
                publishReadinessScore.grade === 'Good' ? 'bg-blue-100 text-blue-800' :
                publishReadinessScore.grade === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {publishReadinessScore.grade}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{publishReadinessScore.total}%</span>
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <Progress value={publishReadinessScore.total} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('step6.publish_readiness_description')}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Completion Checklist */}
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4" />
                {t('step6.completion_checklist_title')}
              </h3>
              
              <div className="space-y-3">
                {completionChecklist.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        item.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {item.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <span className={`text-sm ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {item.label}
                        </span>
                        {item.required && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {t('step6.completion_checklist_required')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!item.completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStep(item.editStep)}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        {t('step6.completion_checklist_edit_button')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* SEO Score Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4" />
                {t('step6.seo_score_breakdown_title')}
              </h3>
              
              <div className="space-y-3">
                {seoScore.factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{factor.score}/{factor.maxScore}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          factor.status === 'good' ? 'bg-green-500' :
                          factor.status === 'needs-work' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{factor.description}</span>
                      {factor.status !== 'good' && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          {t('step6.seo_score_breakdown_improve_button')}
                        </Button>
                      )}
                    </div>
                    <Progress value={(factor.score / factor.maxScore) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Generation Settings & Cost */}
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Coins className="h-4 w-4" />
                {t('step6.generation_settings_title')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-md">
                  <div>
                    <p className="font-medium">
                      {t('step6.generation_cost_credits', { credits: generationCost.credits })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('step6.generation_estimated_time', { time: estimatedTime })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Coins className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('step6.generation_included_features')}</Label>
                  <div className="space-y-1">
                    {generationCost.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Export Settings */}
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Download className="h-4 w-4" />
                {t('step6.export_settings_title')}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('step6.export_formats_label')}</Label>
                  <div className="grid gap-2">
                    {EXPORT_FORMAT_OPTIONS.map((format) => (
                      <div
                        key={format.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedExportFormats.includes(format.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleExportFormatToggle(format.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <format.icon className="h-4 w-4" />
                            <span className="font-medium">{format.label}</span>
                          </div>
                          {selectedExportFormats.includes(format.value) && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {format.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Share Draft */}
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4" />
                {t('step6.share_draft_title')}
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('step6.share_draft_description')}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareDraft}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    {t('step6.generate_share_link_button')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {t('step6.email_button')}
                  </Button>
                </div>

                {shareModalOpen && (
                  <div className="p-3 bg-muted/50 rounded-md space-y-2">
                    <Label className="text-xs font-medium">{t('step6.shareable_link_label')}</Label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-2 py-1 text-xs border rounded"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1 ${copied ? 'bg-green-600' : ''}`}
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            {t('step6.copy_link_copied')}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            {t('step6.copy_link_button')}
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Twitter className="h-3 w-3" />
                        {t('step6.twitter_button')}
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Facebook className="h-3 w-3" />
                        {t('step6.facebook_button')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Publish Readiness Details */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Award className="h-4 w-4" />
            {t('step6.publish_readiness_analysis_title')}
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {publishReadinessScore.factors.slice(0, 3).map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{factor.score}/{factor.maxScore}</span>
                    <Progress value={(factor.score / factor.maxScore) * 100} className="h-1 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {publishReadinessScore.factors.slice(3).map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{factor.score}/{factor.maxScore}</span>
                    <Progress value={(factor.score / factor.maxScore) * 100} className="h-1 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Generation Progress */}
        {isGenerating && !generationError && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('step6.generating_content_title')}</h3>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {generationStage === 'outline' 
                        ? t('step6.generating_outline_description') 
                        : generationStage === 'content'
                          ? t('step6.generating_content_description')
                          : t('step6.finalizing_content_description')}
                    </span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={Math.round(generationProgress)} className="h-2" />
                </div>
                  <p className="text-sm text-muted-foreground">
                  {generationStage === 'outline' 
                    ? t('step6.generating_outline_explanation') 
                    : generationStage === 'content'
                      ? t('step6.generating_content_explanation')
                      : t('step6.finalizing_content_explanation')}
                </p>
                
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant={generationStage === 'outline' ? 'default' : 'outline'}>
                    {t('step6.outline_badge')}
                  </Badge>
                  <Badge variant={generationStage === 'content' ? 'default' : 'outline'}>
                    {t('step6.content_badge')}
                  </Badge>
                  <Badge variant={generationStage === 'complete' ? 'default' : 'outline'}>
                    {t('step6.finalize_badge')}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {t('step6.generation_time_explanation', { time: estimatedTime })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Alert */}
        {generationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('step6.generation_failed_title')}</AlertTitle>
            <AlertDescription>
              {generationError}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryGeneration}
                className="mt-2 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                {t('step6.retry_generation_button')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        {!isGenerating && !generationError && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t('step6.ready_to_generate_title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('step6.ready_to_generate_description', { time: estimatedTime })}
                </p>
              </div>
              
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={
                  !currentUser || 
                  !userProfile || 
                  (completionChecklist.requiredCompleted < completionChecklist.requiredCount) ||
                  ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) < 4
                }
                className="w-full h-12 text-base"
              >
                <Zap className="h-5 w-5 mr-2" />
                {!currentUser ? t('step6.generate_button_login_text') :
                 !userProfile ? t('step6.generate_button_loading_text') :
                 ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) < 4 ? t('step6.generate_button_insufficient_credits_text') :
                 completionChecklist.requiredCompleted < completionChecklist.requiredCount ? t('step6.generate_button_complete_required_items_text') :
                 t('step6.generate_button_generate_text')}
              </Button>

              {!currentUser && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t('step6.generate_button_login_prompt')}
                </p>
              )}
              
              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) < 4 && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t('step6.generate_button_insufficient_credits_prompt', { credits: 4, remaining: ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) })}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="text-xs"
                  >
                    {t('step6.generate_button_upgrade_plan_button')}
                  </Button>
                </div>
              )}

              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) >= 4 && completionChecklist.requiredCompleted < completionChecklist.requiredCount && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('step6.generate_button_complete_required_items_prompt')}
                </p>
              )}
              
              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) >= 4 && completionChecklist.requiredCompleted >= completionChecklist.requiredCount && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t('step6.generate_button_formats_explanation', { formats: selectedExportFormats.length, format: selectedExportFormats.length > 1 ? 's' : '' })}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ {t('step6.generate_button_credits_available', { credits: ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) })}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Step6ReviewGenerate;
