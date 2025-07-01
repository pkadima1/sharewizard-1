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

// Export format options
const EXPORT_FORMAT_OPTIONS = [
  {
    value: 'markdown',
    label: 'Markdown (.md)',
    icon: FileText,
    description: 'Perfect for developers and version control',
    features: ['Clean formatting', 'Platform agnostic', 'Easy editing']
  },
  {
    value: 'html',
    label: 'HTML (.html)',
    icon: ExternalLink,
    description: 'Ready for web publishing',
    features: ['Web-ready', 'SEO meta tags', 'Styled output']
  },
  {
    value: 'docx',
    label: 'Microsoft Word (.docx)',
    icon: FileText,
    description: 'Professional document format',
    features: ['Rich formatting', 'Comments support', 'Track changes']
  },
  {
    value: 'pdf',
    label: 'PDF (.pdf)',
    icon: Download,
    description: 'Professional presentation format',
    features: ['Print ready', 'Universal compatibility', 'Fixed layout']
  },
  {
    value: 'gdocs',
    label: 'Google Docs',
    icon: Link,
    description: 'Collaborative editing and sharing',
    features: ['Real-time collaboration', 'Comment system', 'Cloud storage']
  }
];

// Generation cost tiers based on features
const GENERATION_COSTS = {
  basic: { credits: 5, features: ['Basic content generation', 'Standard formatting'] },
  standard: { credits: 8, features: ['Enhanced content', 'Image suggestions', 'SEO optimization'] },
  premium: { credits: 12, features: ['Advanced content', 'Research integration', 'Plagiarism check', 'Multiple formats'] }
};

// Define the interface for the function response
interface GenerateLongformResponse {
  content: string;
  outline: any;
  metadata: {
    actualWordCount: number;
    outlineGenerationTime: number;
    contentGenerationTime: number;
    contentQuality: {
      hasEmotionalElements: boolean;
      hasActionableContent: boolean;
      seoOptimized: boolean;
      structureComplexity: number;
    }
  }
}

interface Step6Props {
  formData: any;
  updateFormData: (key: string, value: any) => void;
  onGenerate: () => void;
  onEditStep: (stepNumber: number) => void;
}

const Step6ReviewGenerate: React.FC<Step6Props> = ({ formData, updateFormData, onGenerate, onEditStep }) => {
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
      factor: 'SEO-Optimized Title',
      score: titleScore,
      maxScore: SEO_WEIGHTS.title,
      status: titleScore >= 15 ? 'good' : 'needs-work',
      description: titleScore >= 15 ? 'Title is properly optimized' : 'Title needs optimization'
    });

    // Keywords (25 points)
    const keywordScore = formData.keywords?.length >= 3 ? 25 : (formData.keywords?.length || 0) * 8;
    totalScore += keywordScore;
    factors.push({
      factor: 'Target Keywords',
      score: keywordScore,
      maxScore: SEO_WEIGHTS.keywords,
      status: keywordScore >= 20 ? 'good' : 'needs-work',
      description: `${formData.keywords?.length || 0} keywords selected`
    });

    // Word count (15 points)
    const wordCount = formData.wordCount || 800;
    const wordCountScore = wordCount >= 1200 && wordCount <= 1800 ? 15 : 
                          wordCount >= 800 ? 10 : 5;
    totalScore += wordCountScore;
    factors.push({
      factor: 'Content Length',
      score: wordCountScore,
      maxScore: SEO_WEIGHTS.wordCount,
      status: wordCountScore >= 12 ? 'good' : 'needs-work',
      description: `${wordCount} words (optimal: 1200-1800)`
    });

    // Structure (15 points)
    const structureScore = formData.structureFormat ? 15 : 0;
    totalScore += structureScore;
    factors.push({
      factor: 'Content Structure',
      score: structureScore,
      maxScore: SEO_WEIGHTS.structure,
      status: structureScore > 0 ? 'good' : 'needs-work',
      description: formData.structureFormat ? 'Structure defined' : 'No structure selected'
    });

    // Readability (10 points)
    const readabilityScore = formData.contentTone ? 10 : 0;
    totalScore += readabilityScore;
    factors.push({
      factor: 'Readability',
      score: readabilityScore,
      maxScore: SEO_WEIGHTS.readability,
      status: readabilityScore > 0 ? 'good' : 'needs-work',
      description: formData.contentTone ? 'Tone selected for target audience' : 'No tone specified'
    });

    // Media inclusion (10 points)
    const mediaScore = formData.includeImages ? 10 : 0;
    totalScore += mediaScore;
    factors.push({
      factor: 'Media Integration',
      score: mediaScore,
      maxScore: SEO_WEIGHTS.mediaIncluded,
      status: mediaScore > 0 ? 'good' : 'could-improve',
      description: formData.includeImages ? 'Images will be suggested' : 'No media integration'
    });

    // Meta optimization (5 points)
    const metaScore = (formData.industry && formData.audience) ? 5 : 0;
    totalScore += metaScore;
    factors.push({
      factor: 'Meta Optimization',
      score: metaScore,
      maxScore: SEO_WEIGHTS.metaOptimization,
      status: metaScore > 0 ? 'good' : 'needs-work',
      description: metaScore > 0 ? 'Industry and audience defined' : 'Missing meta information'
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
        label: 'Topic defined',
        completed: !!formData.topic,
        required: true,
        editStep: 0
      },
      {
        id: 'industry-audience',
        label: 'Industry & Audience selected',
        completed: !!(formData.industry && formData.audience),
        required: true,
        editStep: 1
      },
      {
        id: 'keywords',
        label: 'Keywords added',
        completed: !!(formData.keywords?.length >= 2),
        required: true,
        editStep: 2
      },
      {
        id: 'title',
        label: 'SEO title optimized',
        completed: !!formData.optimizedTitle,
        required: true,
        editStep: 2
      },
      {
        id: 'structure',
        label: 'Content structure defined',
        completed: !!formData.structureFormat,
        required: true,
        editStep: 3
      },
      {
        id: 'tone',
        label: 'Content tone selected',
        completed: !!formData.contentTone,
        required: true,
        editStep: 3
      },      {
        id: 'word-count',
        label: 'Word count configured',
        completed: !!(formData.wordCount && formData.wordCount >= 500),
        required: false,
        editStep: 3
      },
      {
        id: 'format',
        label: 'Output format selected',
        completed: !!formData.outputFormat,
        required: false,
        editStep: 4
      },
      {
        id: 'media',
        label: 'Media preferences set',
        completed: formData.includeImages !== undefined,
        required: false,
        editStep: 4
      },
      {
        id: 'quality-checks',
        label: 'Quality checks enabled',
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
      return GENERATION_COSTS.premium;
    } else if (hasMediaFeatures) {
      return GENERATION_COSTS.standard;
    } else {
      return GENERATION_COSTS.basic;
    }
  }, [formData, selectedExportFormats]);

  // Calculate publish-readiness score
  const publishReadinessScore = useMemo(() => {
    let score = 0;
    const factors = [];

    // Content completeness (30%)
    const contentComplete = completionChecklist.requiredPercentage;
    score += (contentComplete / 100) * 30;
    factors.push({
      factor: 'Content Completeness',
      score: Math.round((contentComplete / 100) * 30),
      maxScore: 30,
      description: `${completionChecklist.requiredCompleted}/${completionChecklist.requiredCount} required items complete`
    });

    // SEO optimization (25%)
    const seoOptimization = (seoScore.total / 100) * 25;
    score += seoOptimization;
    factors.push({
      factor: 'SEO Optimization',
      score: Math.round(seoOptimization),
      maxScore: 25,
      description: `SEO score: ${seoScore.percentage}%`
    });

    // Technical setup (20%)
    const technicalSetup = (formData.outputFormat && selectedExportFormats.length > 0) ? 20 : 10;
    score += technicalSetup;
    factors.push({
      factor: 'Technical Setup',
      score: technicalSetup,
      maxScore: 20,
      description: 'Export formats and settings configured'
    });

    // Quality assurance (15%)
    const qualityAssurance = formData.plagiarismCheck ? 15 : 5;
    score += qualityAssurance;
    factors.push({
      factor: 'Quality Assurance',
      score: qualityAssurance,
      maxScore: 15,
      description: formData.plagiarismCheck ? 'Plagiarism checking enabled' : 'Basic quality checks'
    });

    // Engagement features (10%)
    const engagementFeatures = (formData.includeImages ? 5 : 0) + (formData.ctaType && formData.ctaType !== 'none' ? 5 : 0);
    score += engagementFeatures;
    factors.push({
      factor: 'Engagement Features',
      score: engagementFeatures,
      maxScore: 10,
      description: `${formData.includeImages ? 'Images' : 'No images'}, ${formData.ctaType && formData.ctaType !== 'none' ? 'CTA included' : 'No CTA'}`
    });

    return {
      total: Math.round(score),
      factors,
      grade: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work'
    };
  }, [formData, seoScore, completionChecklist, selectedExportFormats]);

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
    
    return Math.round(baseTime * wordMultiplier * complexityMultiplier * formatMultiplier * 10) / 10;
  }, [formData, selectedExportFormats]);

  // Handle the generation process
  const handleGenerate = async () => {
    // Check authentication first
    if (!currentUser) {
      toast.error("Please log in to generate content", {
        description: "You need to be logged in to use the content generator."
      });
      navigate('/login');
      return;
    }

    // Check if user profile is loaded and has sufficient requests
    if (!userProfile) {
      toast.error("Loading user profile...", {
        description: "Please wait while we load your account information."
      });
      return;
    }

    // Check request limits - Long-form content requires 4 credits
    const requestsRemaining = (userProfile.requests_limit || 0) - (userProfile.requests_used || 0);
    if (requestsRemaining < 4) {
      toast.error("Insufficient credits for long-form content", {
        description: `Long-form content requires 4 credits. You have ${requestsRemaining} credits remaining. Please upgrade your plan to continue.`,
        action: {
          label: "Upgrade Plan",
          onClick: () => navigate('/pricing')
        }
      });
      return;
    }

    if (completionChecklist.requiredCompleted < completionChecklist.requiredCount) {
      toast.error("Please complete all required items before generating content.");
      return;
    }
    
    let progressUpdateInterval: NodeJS.Timeout | null = null;
    let contentGenerationInterval: NodeJS.Timeout | null = null;
    
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress(10);
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
        plagiarismCheck: formData.plagiarismCheck !== false,
        outputFormat: selectedExportFormats[0] || 'markdown',
        ctaType: formData.ctaType || 'none',
        structureNotes: formData.structureNotes || '',
        mediaUrls: (formData.mediaFiles || []).map(file => file.url || ''),
        // Enhanced Media Integration Fields
        mediaCaptions: (formData.mediaFiles || []).map(file => file.metadata?.mediaCaption || ''),
        mediaAnalysis: (formData.mediaFiles || []).map(file => file.metadata?.aiAnalysis || ''),
        mediaPlacementStrategy: formData.mediaPlacementStrategy || 'auto' // auto, manual, or semantic
      };

      // Update progress based on typical function execution timeline
      progressUpdateInterval = setInterval(() => {
        setGenerationProgress(prev => {
          // Outline generation typically takes ~30% of the total time
          if (generationStage === 'outline' && prev < 30) return prev + 1;
          // Content generation takes ~65% of the total time
          if (generationStage === 'content' && prev < 95) return prev + 0.5;
          // Keep progress steady if we're at the expected stage limit
          return prev;
        });
      }, 800); // Slightly faster updates for smoother progress      // Call the Firebase function
      const result = await generateLongformContentFunction(functionData);
      
      // Update progress and stage based on function response
      setGenerationStage('content');
      setGenerationProgress(50);
      
      // Update progress to simulate content generation phase
      contentGenerationInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 95) return prev + 1;
          return prev;
        });
      }, 1000);
      
      // Short delay to simulate content processing
      setTimeout(() => {
        if (progressUpdateInterval) clearInterval(progressUpdateInterval);
        if (contentGenerationInterval) clearInterval(contentGenerationInterval);
        
        // Handle success - Only show success if we actually have content
        if (result.data && result.data.content) {
          setGenerationResult(result.data);
          setGenerationProgress(100);
          setGenerationStage('complete');
          
          toast.success("Long-form content generated successfully!", {
            description: `Generated ${result.data.metadata?.actualWordCount || formData.wordCount} words of high-quality content. Used 4 credits.`
          });

          // Navigate to the dashboard longform tab
          setTimeout(() => {
            navigate('/dashboard?tab=longform', { 
              state: { 
                newContentGenerated: true,
                generationCompleted: true
              } 
            });
          }, 2000);
        } else {
          // Handle case where function succeeded but no content was returned
          throw new Error("Content generation completed but no content was returned. This may be due to insufficient credits or a processing error.");
        }
      }, 1500);

    } catch (error: any) {
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);
      if (contentGenerationInterval) clearInterval(contentGenerationInterval);
      
      console.error("Generation error:", error);
      
      // Enhanced error handling with specific messages for common errors
      let errorMessage = "An unexpected error occurred during content generation. Please try again.";
      let errorAction = null;
      
      if (error.code) {
        // Handle Firebase error codes
        switch (error.code) {
          case 'functions/cancelled':
            errorMessage = "The generation process was cancelled. Please try again.";
            break;
          case 'functions/deadline-exceeded':
            errorMessage = "The generation process took too long. Try reducing the word count or simplifying your request.";
            break;
          case 'functions/resource-exhausted':
            errorMessage = "You've reached your content generation limit or don't have enough credits.";
            errorAction = {
              label: "Upgrade Plan",
              onClick: () => navigate('/pricing')
            };
            break;
          case 'functions/unauthenticated':
          case 'functions/permission-denied':
            errorMessage = "You don't have permission to generate content. Please log in again or contact support.";
            errorAction = {
              label: "Log In",
              onClick: () => navigate('/login')
            };
            break;
          case 'functions/internal':
            if (error.message && error.message.includes('insufficient credits')) {
              errorMessage = "Insufficient credits to generate long-form content. You need 4 credits for this operation.";
              errorAction = {
                label: "Upgrade Plan",
                onClick: () => navigate('/pricing')
              };
            } else {
              errorMessage = `Content generation failed due to an internal error: ${error.message}. Please try again or contact support if this persists.`;
            }
            break;
          case 'functions/invalid-argument':
            errorMessage = `Invalid input provided: ${error.message}. Please check your inputs and try again.`;
            break;
          default:
            // Use the error message from Firebase if available
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        // Handle non-Firebase errors
        if (error.message.includes('insufficient credits') || error.message.includes('not enough credits')) {
          errorMessage = "Insufficient credits to generate long-form content. You need 4 credits per generation.";
          errorAction = {
            label: "Upgrade Plan",
            onClick: () => navigate('/pricing')
          };
        } else {
          errorMessage = `Generation failed: ${error.message}`;
        }
      }

      setGenerationError(errorMessage);
      setIsGenerating(false);
      
      toast.error("Failed to generate long-form content", {
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

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold">Review & Generate</h2>
          <p className="text-muted-foreground">
            Review your content settings, check optimization scores, and generate your content
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* SEO Score Card */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                SEO Score
              </h3>
              <Badge className={`${
                seoScore.grade === 'A' ? 'bg-green-100 text-green-800' :
                seoScore.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                seoScore.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Grade {seoScore.grade}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{seoScore.percentage}%</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <Progress value={seoScore.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {seoScore.total}/100 points across {seoScore.factors.length} factors
              </p>
            </div>
          </Card>

          {/* Completion Status Card */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completion
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
                {completionChecklist.requiredCompleted}/{completionChecklist.requiredCount} required items complete
              </p>
            </div>
          </Card>

          {/* Publish Readiness Card */}
          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" />
                Publish Ready
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
                Overall readiness for publication
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
                Content Completion Checklist
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
                          <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
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
                        Edit
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
                SEO Score Breakdown
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
                          Improve
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
                Generation Cost & Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-md">
                  <div>
                    <p className="font-medium">
                      {generationCost.credits} Credits Required
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated generation time: {estimatedTime} minutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Coins className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Included Features:</Label>
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
                Export Settings
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Export Formats:</Label>
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
                Share Draft
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share your content settings with team members or collaborators before generating.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareDraft}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Generate Share Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>

                {shareModalOpen && (
                  <div className="p-3 bg-muted/50 rounded-md space-y-2">
                    <Label className="text-xs font-medium">Shareable Link:</Label>
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
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Twitter className="h-3 w-3" />
                        Twitter
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Facebook className="h-3 w-3" />
                        Facebook
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
            Publish Readiness Analysis
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
              <h3 className="text-lg font-semibold">Generating Your Content</h3>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {generationStage === 'outline' 
                        ? 'Creating intelligent content outline...' 
                        : generationStage === 'content'
                          ? 'Generating human-like content...'
                          : 'Finalizing content...'}
                    </span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
                  <p className="text-sm text-muted-foreground">
                  {generationStage === 'outline' 
                    ? 'Using Gemini AI to create a sophisticated content outline with intelligent structure' 
                    : generationStage === 'content'
                      ? 'Using GPT to transform the outline into engaging, human-like content optimized for your audience'
                      : 'Applying final formatting, quality checks, and SEO optimization'}
                </p>
                
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant={generationStage === 'outline' ? 'default' : 'outline'}>Outline</Badge>
                  <Badge variant={generationStage === 'content' ? 'default' : 'outline'}>Content</Badge>
                  <Badge variant={generationStage === 'complete' ? 'default' : 'outline'}>Finalize</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This process takes approximately {estimatedTime} minutes. Please don't close this window.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Alert */}
        {generationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {generationError}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryGeneration}
                className="mt-2 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Generation
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        {!isGenerating && !generationError && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Ready to Generate Your Content?</h3>
                <p className="text-sm text-muted-foreground">
                  Your content will be generated with the current settings. This process will take approximately {estimatedTime} minutes.
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
                {!currentUser ? "Please Log In" :
                 !userProfile ? "Loading..." :
                 ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) < 4 ? "Insufficient Credits (Need 4)" :
                 completionChecklist.requiredCompleted < completionChecklist.requiredCount ? "Complete Required Items" :
                 `Generate Content (4 Credits)`}
              </Button>

              {!currentUser && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Please log in to generate content.
                </p>
              )}
              
              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) < 4 && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Insufficient credits: You have {((userProfile.requests_limit || 0) - (userProfile.requests_used || 0))} credits, but need 4 for long-form content.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="text-xs"
                  >
                    Upgrade Plan
                  </Button>
                </div>
              )}

              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) >= 4 && completionChecklist.requiredCompleted < completionChecklist.requiredCount && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please complete all required items before generating content.
                </p>
              )}
              
              {currentUser && userProfile && ((userProfile.requests_limit || 0) - (userProfile.requests_used || 0)) >= 4 && completionChecklist.requiredCompleted >= completionChecklist.requiredCount && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Content will be generated in {selectedExportFormats.length} format{selectedExportFormats.length > 1 ? 's' : ''}: {selectedExportFormats.join(', ')}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ You have {((userProfile.requests_limit || 0) - (userProfile.requests_used || 0))} credits available
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
