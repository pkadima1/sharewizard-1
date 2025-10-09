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

    // Return the simplified layout focused on the main content
    return (
      <div className="w-full max-w-4xl mx-auto">
        {stepComponent}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Draft Restoration Banner */}
          {hasSavedDraft && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
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
          )}

          {/* Main Content Card */}
          <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            {/* Simplified Progress Section */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {WIZARD_STEPS[currentStep].name}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {WIZARD_STEPS[currentStep].description}
                  </p>
                </div>
                
                {/* Auto-save indicator */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className={`w-2 h-2 rounded-full ${hasSavedDraft ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>
                    {lastSaved ? formatSavedTime(lastSaved) : t('wizard.draft.notSaved')}
                  </span>
                </div>
              </div>

              {/* Simplified Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t('wizard.progress.step', { current: currentStep + 1, total: WIZARD_STEPS.length })}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% {t('wizard.progress.complete', { percent: '' }).replace('%', '').trim()}
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                  ></div>
                </div>
                
                {/* Step dots */}
                <div className="flex justify-between">
                  {WIZARD_STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isCurrent = index === currentStep;
                    const isAccessible = index <= Math.max(...completedSteps, -1) + 1;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => isAccessible && navigateToStep(index)}
                        disabled={!isAccessible}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          isCurrent
                            ? 'bg-blue-500 scale-125'
                            : isCompleted
                              ? 'bg-green-500'
                              : isAccessible
                                ? 'bg-slate-300 hover:bg-slate-400'
                                : 'bg-slate-200'
                        } ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        title={step.name}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 md:p-8">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 order-2 sm:order-1"
                >
                  ← {t('wizard.navigation.previous')}
                </Button>
                
                <div className="flex gap-2 order-1 sm:order-2">
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
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {t('wizard.navigation.next')} →
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGenerate}
                      disabled={!isFormValid}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      <Info className="h-4 w-4" />
                      {t('wizard.navigation.generate')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Step Validation Errors */}
              {!isStepValid(currentStep) && !WIZARD_STEPS[currentStep].optional && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
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
              )}
            </div>
          </Card>

          {/* Floating Help Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
            className="fixed bottom-6 right-6 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 z-40"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            {t('wizard.navigation.shortcuts')}
          </Button>

          {/* Keyboard Shortcuts Help Overlay */}
          {showKeyboardHelp && <KeyboardShortcutsOverlay />}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LongFormWizard;
