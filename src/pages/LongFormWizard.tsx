// filepath: f:\Projects\sharewizard-1\src\pages\LongFormWizard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle2, Clock, SkipForward, AlertTriangle, Keyboard, X, Command } from 'lucide-react';
import Step1WhatWho from '@/components/wizard/steps/Step1WhatWho';
// import Step2MediaVisuals from '@/components/wizard/steps/Step2MediaVisuals';
import Step3KeywordsSEO from '@/components/wizard/steps/Step3KeywordsSEO';
import Step4ToneStructure from '@/components/wizard/steps/Step4ToneStructure';
import Step5GenerationSettings from '@/components/wizard/steps/Step5GenerationSettings';
import Step6ReviewGenerate from '@/components/wizard/steps/Step6ReviewGenerate';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { useWizardValidation } from '@/hooks/useWizardValidation';
import { useAutoSave, getDraftInfo, formatLastSaved } from '@/hooks/useAutoSave';
import TopicSuggestionEngine from '@/components/wizard/smart/TopicSuggestionEngine';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';
import ContextualHelp from '@/components/wizard/smart/ContextualHelp';
import { useTranslation } from 'react-i18next';
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';
import { trackContentGeneration, trackButtonClick, trackFeatureUsage, trackError } from '@/utils/analytics';
import { WizardFormData } from '@/types/components';

// Helper function to get translated wizard steps
const getWizardSteps = (t: any) => [
  { 
    name: t('wizard.steps.whatWho.name'), 
    optional: false, 
    estimatedTime: 4,
    description: t('wizard.steps.whatWho.description')
  },
  // { 
  //   name: t('wizard.steps.mediaVisuals.name'), 
  //   optional: false, 
  //   estimatedTime: 3,
  //   description: t('wizard.steps.mediaVisuals.description')
  // },
  { 
    name: t('wizard.steps.seoKeywords.name'), 
    optional: false, 
    estimatedTime: 4,
    description: t('wizard.steps.seoKeywords.description')
  },
  { 
    name: t('wizard.steps.structureTone.name'), 
    optional: false, 
    estimatedTime: 3,
    description: t('wizard.steps.structureTone.description')
  },
  { 
    name: t('wizard.steps.generationSettings.name'), 
    optional: true, 
    estimatedTime: 2,
    description: t('wizard.steps.generationSettings.description')
  },
  { 
    name: t('wizard.steps.reviewGenerate.name'), 
    optional: false, 
    estimatedTime: 1,
    description: t('wizard.steps.reviewGenerate.description')
  }
];

// Helper function to get translated tone options
const getToneOptions = (t: any) => [
  { value: 'friendly', label: t('step4.tone.options.friendly') },
  { value: 'professional', label: t('step4.tone.options.professional') },
  { value: 'thought-provoking', label: t('step4.tone.options.thoughtProvoking') },
  { value: 'expert', label: t('step4.tone.options.expert') },
  { value: 'persuasive', label: t('step4.tone.options.persuasive') },
  { value: 'informative', label: t('step4.tone.options.informative') },
  { value: 'casual', label: t('step4.tone.options.casual') },
  { value: 'authoritative', label: t('step4.tone.options.authoritative') },
  { value: 'inspirational', label: t('step4.tone.options.inspirational') },
  { value: 'humorous', label: t('step4.tone.options.humorous') },
  { value: 'empathetic', label: t('step4.tone.options.empathetic') }
];

// Helper function to get translated content type options
const getContentTypeOptions = (t: any) => [
  { value: 'blog-article', label: t('step4.contentType.options.blogArticle') },
  { value: 'newsletter', label: t('step4.contentType.options.newsletter') },
  { value: 'case-study', label: t('step4.contentType.options.caseStudy') },
  { value: 'guide', label: t('step4.contentType.options.guide') },
  { value: 'thought-piece', label: t('step4.contentType.options.thoughtPiece') }
];

// Helper function to get translated structure format options
const getStructureFormatOptions = (t: any) => [
  { value: 'intro-points-cta', label: t('step4.structure.options.introPointsCta') },
  { value: 'problem-solution-cta', label: t('step4.structure.options.problemSolutionCta') },
  { value: 'story-facts-lessons', label: t('step4.structure.options.storyFactsLessons') },
  { value: 'listicle', label: t('step4.structure.options.listicle') },
  { value: 'how-to-step-by-step', label: t('step4.structure.options.howToStepByStep') },
  { value: 'faq-qa', label: t('step4.structure.options.faqQa') },
  { value: 'comparison-vs', label: t('step4.structure.options.comparisonVs') },
  { value: 'review-analysis', label: t('step4.structure.options.reviewAnalysis') },
  { value: 'case-study', label: t('step4.structure.options.caseStudy') },
  { value: 'custom', label: t('step4.structure.options.custom') }
];

// Helper function to get translated CTA type options
const getCtaTypeOptions = (t: any) => [
  { value: 'subscribe', label: t('step5.cta.options.subscribe') },
  { value: 'book-call', label: t('step5.cta.options.bookCall') },
  { value: 'download', label: t('step5.cta.options.download') },
  { value: 'visit-website', label: t('step5.cta.options.visitWebsite') },
  { value: 'none', label: t('step5.cta.options.none') }
];

const LongFormWizard = () => {
  // Analytics: Track page view automatically
  usePageAnalytics('Long-form Content Wizard - EngagePerfect');

  const { t } = useTranslation('longform');
  
  // Helper function to format last saved time with proper translation context
  // Import the translation function directly from the common namespace
  const { t: tCommon } = useTranslation('common');
  
  const formatSavedTime = (lastSaved: Date | null): string => {
    if (!lastSaved) return tCommon('time.never');
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) {
      return tCommon('time.justNow');
    } else if (diffMinutes < 60) {
      // Now using the tCommon function that points directly to the common namespace
      return tCommon('time.minutesAgo', { count: diffMinutes });
    } else if (diffHours < 24) {
      return tCommon('time.hoursAgo', { count: diffHours });
    } else {
      return lastSaved.toLocaleDateString();
    }
  };
  
  // Get translated options
  const WIZARD_STEPS = getWizardSteps(t);
  const TONE_OPTIONS = getToneOptions(t);
  const CONTENT_TYPE_OPTIONS = getContentTypeOptions(t);
  const STRUCTURE_FORMAT_OPTIONS = getStructureFormatOptions(t);
  const CTA_TYPE_OPTIONS = getCtaTypeOptions(t);

  // Progress persistence keys
  const PROGRESS_STORAGE_KEY = 'longform-wizard-progress';
  const COMPLETED_STEPS_KEY = 'longform-wizard-completed';
  const SKIPPED_STEPS_KEY = 'longform-wizard-skipped';
  // Load saved progress
  const loadSavedProgress = () => {
    try {
      const savedStep = localStorage.getItem(PROGRESS_STORAGE_KEY);
      const savedCompleted = localStorage.getItem(COMPLETED_STEPS_KEY);
      const savedSkipped = localStorage.getItem(SKIPPED_STEPS_KEY);
      return {
        currentStep: savedStep ? parseInt(savedStep) : 0,
        completedSteps: savedCompleted ? JSON.parse(savedCompleted) : [],
        skippedSteps: savedSkipped ? JSON.parse(savedSkipped) : []
      };
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
      return { currentStep: 0, completedSteps: [], skippedSteps: [] };
    }
  };
  const { currentStep: initialStep, completedSteps: initialCompleted, skippedSteps: initialSkipped } = loadSavedProgress();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialCompleted);
  const [skippedSteps, setSkippedSteps] = useState<number[]>(initialSkipped);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const [formData, setFormData] = useState({
    topic: '',
    audience: '',
    tone: '',
    industry: '',
    contentType: 'blog',
    structure: [],
    structureNotes: '',
    keywords: [],
    optimizedTitle: '',
    wordCount: 800,
    includeImages: false,
    mediaFiles: [],
    contentTone: '',
    structureFormat: '',
    includeStats: false,
    ctaType: '',
    outputFormat: 'markdown' as const,
    plagiarismCheck: true,
    // Add missing properties
    includeMedia: false,
    qualityLevel: 'medium',
    // Add other required properties from WizardFormData interface
    mediaUrls: [],
    mediaCaptions: [],
    mediaAnalysis: [],
    includeReferences: false,
    tocRequired: false,
    summaryRequired: false,
    structuredData: false,
    enableMetadataBlock: false,
    writingPersonality: '',
    readingLevel: '',
    targetLocation: '',
    geographicScope: 'global' as const,
    marketFocus: [],
    localSeoKeywords: [],
    culturalContext: '',
    lang: 'en' as const,
    customIndustry: ''
  });
  const navigate = useNavigate();
  const safeNavigate = useSafeNavigation();
  const { suggestedKeywords, suggestedStructure, suggestedTone, isLoading } = useSmartSuggestions(formData);
  const { isStepValid, getStepErrors, isFormValid } = useWizardValidation(formData, t);
  
  // Auto-save functionality
  const { hasSavedDraft, lastSaved, lastSavedFormatted, restoreDraft, clearDraft, saveNow } = useAutoSave(formData, {
    key: 'longform-wizard-draft',
    debounceMs: 2000,
    autoSaveIntervalMs: 30000,
    showToast: true
  });

  // Keyboard shortcuts handlers
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    // Ignore if user is typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    // Handle Escape key (always works)
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
      } else {
        setShowKeyboardHelp(true);
      }
      return;
    }

    // Skip other shortcuts if typing in input fields
    if (isInputField && !event.ctrlKey) return;

    // Ctrl+Enter: Next step
    if (event.ctrlKey && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (currentStep < WIZARD_STEPS.length - 1) {
        if (isStepValid(currentStep) || WIZARD_STEPS[currentStep].optional) {
          handleNext();
        }
      } else {
        // On last step, trigger generate
        if (isFormValid) {
          handleGenerate();
        }
      }
    }

    // Ctrl+Shift+Enter: Previous step
    if (event.ctrlKey && event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      if (currentStep > 0) {
        handlePrevious();
      }
    }

    // Ctrl+S: Manual save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      saveNow();
    }
  };

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [currentStep, showKeyboardHelp, isStepValid, isFormValid]);

  // Tab navigation enhancement
  useEffect(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Set proper tab indexes for form elements
    focusableElements.forEach((element, index) => {
      if (element.getAttribute('tabindex') === null) {
        element.setAttribute('tabindex', '0');
      }
    });

    // Enhance focus visibility for keyboard users
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [currentStep]);

  // Focus management for step changes
  useEffect(() => {
    // Focus on the main content area when step changes
    const mainContent = document.querySelector('[role="main"]') as HTMLElement;
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  // Progress persistence utility functions
  const saveProgress = (step: number, completed: number[], skipped: number[]) => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, step.toString());
      localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(completed));
      localStorage.setItem(SKIPPED_STEPS_KEY, JSON.stringify(skipped));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  };

  const getEstimatedTimeRemaining = () => {
    const remainingSteps = WIZARD_STEPS.slice(currentStep);
    return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  };

  const navigateToStep = (stepIndex: number) => {
    // Allow navigation to completed steps or the next immediate step
    const maxCompletedStep = Math.max(...completedSteps, -1);
    if (stepIndex <= maxCompletedStep + 1 || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex);
      saveProgress(stepIndex, completedSteps, skippedSteps);
    }
  };

  const markStepCompleted = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      const newCompleted = [...completedSteps, stepIndex];
      setCompletedSteps(newCompleted);
      saveProgress(currentStep, newCompleted, skippedSteps);
    }
  };

  const skipCurrentStep = () => {
    if (WIZARD_STEPS[currentStep].optional) {
      const newSkipped = [...skippedSteps, currentStep];
      setSkippedSteps(newSkipped);
      
      // Mark as completed for navigation purposes
      markStepCompleted(currentStep);
      
      // Move to next step
      if (currentStep < WIZARD_STEPS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveProgress(nextStep, completedSteps, newSkipped);
      }
    }
  };

  // Effect to save progress when step changes
  useEffect(() => {
    saveProgress(currentStep, completedSteps, skippedSteps);
  }, [currentStep, completedSteps, skippedSteps]);

  // Handle moving to the next step
  const handleNext = () => {
    // Analytics: Track step progression
    trackButtonClick('wizard_next', `longform_step_${currentStep}`);
    
    // Mark current step as completed if valid
    if (isStepValid(currentStep)) {
      markStepCompleted(currentStep);
      
      // Analytics: Track step completion
      trackFeatureUsage('wizard_step_completed', {
        step: currentStep,
        step_name: WIZARD_STEPS[currentStep],
        wizard_type: 'longform'
      });
      
    } else {
      const errors = getStepErrors(currentStep);
      const errorMessages = errors.map(error => error.message).join('\n');
      
      // Analytics: Track validation errors
      trackError('wizard_validation_error', `Step ${currentStep} validation failed`, 'longform_wizard');
      
      alert(`${t('wizard.errors.beforeProceed')}\n\n${errorMessages}`);
      return;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep, completedSteps, skippedSteps);
    }
  };

  // Handle moving to the previous step
  const handlePrevious = () => {
    // Analytics: Track backward navigation
    trackButtonClick('wizard_previous', `longform_step_${currentStep}`);
    
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep, completedSteps, skippedSteps);
    }
  };

  // Function to update form data
  const updateFormData = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value
    });
  };

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setFormData(restoredData);
    }
  };

  // Handle clearing draft
  const handleClearDraft = () => {
    clearDraft();
    // Also clear progress
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(COMPLETED_STEPS_KEY);
    localStorage.removeItem(SKIPPED_STEPS_KEY);
    // Reset to first step
    setCurrentStep(0);
    setCompletedSteps([]);
    setSkippedSteps([]);
  };

  // Handle generation
  const handleGenerate = () => {
    if (!isFormValid) {
      trackError('validation_error', 'Form validation failed', 'longform_wizard');
      alert(t('wizard.errors.allRequired'));
      return;
    }

    // Analytics: Track longform content generation start
    const generationStartTime = Date.now();
    
    trackContentGeneration('longform', {
      status: 'started',
      topic: formData.topic,
      audience: formData.audience,
      industry: formData.industry,
      content_type: formData.contentType,
      tone: formData.contentTone,
      structure: formData.structureFormat,
      word_count: formData.wordCount,
      keywords: formData.keywords,
      include_media: formData.includeMedia,
      include_images: formData.includeImages,
      quality_level: formData.qualityLevel
    });

    trackFeatureUsage('longform_generation', {
      content_type: formData.contentType,
      word_count: formData.wordCount,
      source: 'longform_wizard'
    });

    console.log('Generating content with data:', formData);
    
    // Store start time for completion tracking
    sessionStorage.setItem('longform_generation_start', generationStartTime.toString());
  };

  // Keyboard Shortcuts Help Overlay Component
  const KeyboardShortcutsOverlay = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('wizard.keyboard.title')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardHelp(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('wizard.keyboard.nextStep')}</span>
            <Badge variant="outline" className="font-mono text-xs">
              <Command className="h-3 w-3 mr-1" />
              Ctrl + Enter
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('wizard.keyboard.prevStep')}</span>
            <Badge variant="outline" className="font-mono text-xs">
              <Command className="h-3 w-3 mr-1" />
              Ctrl + Shift + Enter
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('wizard.keyboard.manualSave')}</span>
            <Badge variant="outline" className="font-mono text-xs">
              <Command className="h-3 w-3 mr-1" />
              Ctrl + S
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('wizard.keyboard.navigate')}</span>
            <Badge variant="outline" className="font-mono text-xs">
              Tab / Shift + Tab
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('wizard.keyboard.showHelp')}</span>
            <Badge variant="outline" className="font-mono text-xs">
              Esc
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>💡 {t('wizard.keyboard.tip')}</p>
        </div>
      </Card>
    </div>  );
  
  // Render different content based on the current step
  const renderStepContent = () => {
    let stepComponent;
    
    switch (currentStep) {
      case 0: // What & Who (Topic + Audience)
        stepComponent = (
          <Step1WhatWho formData={formData as WizardFormData & { customIndustry?: string }} updateFormData={updateFormData} />
        );
        break;
      // case 1: // Media & Visuals
      //   stepComponent = (
      //     <Step2MediaVisuals formData={formData} updateFormData={updateFormData} />
      //   );
      //   break;
      case 1: // SEO & Keywords
        stepComponent = (
          <Step3KeywordsSEO formData={formData as WizardFormData & { optimizedTitle?: string }} updateFormData={updateFormData} />
        );
        break;
      case 2: // Structure & Tone
        stepComponent = (
          <Step4ToneStructure formData={formData} updateFormData={updateFormData} />
        );
        break;
      case 3: // Generation Settings
        stepComponent = (
          <Step5GenerationSettings formData={formData as WizardFormData & { outputFormat?: string; plagiarismCheck?: boolean; includeImages?: boolean }} updateFormData={updateFormData} />
        );
        break;
      case 4: // Review & Generate
        stepComponent = (
          <Step6ReviewGenerate 
            formData={formData as WizardFormData & Record<string, unknown>} 
            updateFormData={updateFormData} 
            onGenerate={handleGenerate}
            onEditStep={setCurrentStep} 
          />
        );
        break;
      
      default:
        stepComponent = <div>Unknown step</div>;
    }

    // Return the layout with step content and contextual help
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Step Content - Takes up 2/3 of the width on large screens */}
        <div className="lg:col-span-2">
          {stepComponent}
        </div>
        
        {/* Contextual Help - Takes up 1/3 of the width on large screens */}
        <div className="lg:col-span-1">
          <ContextualHelp 
            currentStep={currentStep} 
            className="sticky top-4"
          />
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 mt-20">
        {/* Draft Restoration Banner */}
        {hasSavedDraft && (
          <div className="max-w-7xl mx-auto mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                  {t('wizard.draft.available')}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('wizard.draft.foundSaved', { time: formatSavedTime(lastSaved) })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreDraft}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  {t('wizard.draft.restore')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraft}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {t('wizard.draft.dismiss')}
                </Button>
              </div>
            </div>
          </div>
        )}        <Card className="max-w-7xl mx-auto p-6">
          {/* Enhanced Progress Bar */}
          <div className="mb-6">
            {/* Progress Overview */}
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">{t('wizard.progress.title')}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{t('wizard.progress.step', { current: currentStep + 1, total: WIZARD_STEPS.length })}</span>
                  <span>•</span>
                  <span>{t('wizard.progress.complete', { percent: Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100) })}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('wizard.progress.remaining', { time: getEstimatedTimeRemaining() })}
                  </span>
                </div>
              </div>
              
              {/* Auto-save Status */}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${hasSavedDraft ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>
                    {lastSaved ? formatSavedTime(lastSaved) : t('wizard.draft.notSaved')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveNow}
                  className="text-xs h-6 px-2 py-0"
                >
                  {t('wizard.navigation.saveNow')}
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex justify-between flex-1">
                {WIZARD_STEPS.map((step, index) => {
                  const isCompleted = completedSteps.includes(index);
                  const isCurrent = index === currentStep;
                  const isSkipped = skippedSteps.includes(index);
                  const hasError = !isStepValid(index) && index < currentStep && !isSkipped;
                  
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`text-xs cursor-pointer transition-all ${
                            isCurrent
                              ? 'text-primary font-medium' 
                              : isCompleted
                                ? 'text-green-600 dark:text-green-400'
                                : hasError
                                  ? 'text-red-500' 
                                  : isSkipped
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-muted-foreground'
                          }`}
                          style={{ width: `${100 / WIZARD_STEPS.length}%`, textAlign: 'center' }}
                          onClick={() => navigateToStep(index)}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            {/* Step Icon */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                              isCurrent
                                ? 'border-primary bg-primary text-primary-foreground'
                                : isCompleted
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : hasError
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-500'
                                    : isSkipped
                                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-600'
                                      : 'border-muted-foreground/30 bg-background'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : hasError ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : isSkipped ? (
                                <SkipForward className="h-3 w-3" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            
                            {/* Step Name */}
                            <span className="leading-tight">{step.name}</span>
                            
                            {/* Optional Badge */}
                            {step.optional && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                {t('wizard.progress.optional').replace('(', '').replace(')', '')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-medium">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          <p className="text-xs">{t('contextualHelp.estimatedTime', { time: `${step.estimatedTime} min` })}</p>
                          {isCompleted && <p className="text-xs text-green-600">✓ {t('wizard.status.completed')}</p>}
                          {isSkipped && <p className="text-xs text-amber-600">⏭ {t('wizard.status.skipped')}</p>}
                          {hasError && <p className="text-xs text-red-600">⚠ {t('wizard.status.needsAttention')}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
              ></div>
            </div>

            {/* Current Step Info */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {t('wizard.progress.current', { name: WIZARD_STEPS[currentStep].name })}
                {WIZARD_STEPS[currentStep].optional && ` ${t('wizard.progress.optional')}`}
              </span>
              <span>{t('wizard.progress.completed', { completed: completedSteps.length, total: WIZARD_STEPS.length })}</span>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              ← {t('wizard.navigation.previous')}
            </Button>
            
            <div className="flex gap-2">
              {/* Skip Button for Optional Steps */}
              {WIZARD_STEPS[currentStep].optional && (
                <Button 
                  variant="ghost" 
                  onClick={skipCurrentStep}
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                >
                  <SkipForward className="h-4 w-4" />
                  {t('wizard.navigation.skip')}
                </Button>
              )}
              
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={!isStepValid(currentStep) && !WIZARD_STEPS[currentStep].optional}
                  className="flex items-center gap-2"
                >
                  {t('wizard.navigation.next')} →
                </Button>
              ) : (
                <Button 
                  onClick={handleGenerate}
                  disabled={!isFormValid}
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  {t('wizard.navigation.generate')}
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Footer */}
          <div className="mt-6 pt-4 border-t border-muted">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  Ctrl + Enter: {t('wizard.navigation.next')}
                </span>
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  Ctrl + S: {t('wizard.navigation.saveNow')}
                </span>
                <span>Esc: {t('wizard.keyboard.showHelp')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardHelp(true)}
                className="h-6 px-2 py-0 text-xs"
              >
                <Keyboard className="h-3 w-3 mr-1" />
                {t('wizard.navigation.shortcuts')}
              </Button>
            </div>
          </div>

          {/* Step Validation Errors */}
          {!isStepValid(currentStep) && !WIZARD_STEPS[currentStep].optional && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t('wizard.errors.completeRequired')}
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                    {getStepErrors(currentStep).map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}          {/* Keyboard Shortcuts Help Overlay */}
          {showKeyboardHelp && <KeyboardShortcutsOverlay />}
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default LongFormWizard;
