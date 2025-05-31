// filepath: f:\Projects\sharewizard-1\src\pages\LongFormWizard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle2, Clock, SkipForward, AlertTriangle } from 'lucide-react';
import Step1MediaUpload from '@/components/wizard/steps/Step1MediaUpload';
import Step2TopicSelector from '@/components/wizard/steps/Step2TopicSelector';
import Step3ContentStructure from '@/components/wizard/steps/Step3ContentStructure';
import Step3KeywordsSEO from '@/components/wizard/steps/Step3KeywordsSEO';
import Step4ToneStructure from '@/components/wizard/steps/Step4ToneStructure';
import Step5GenerationSettings from '@/components/wizard/steps/Step5GenerationSettings';
import Step6ReviewGenerate from '@/components/wizard/steps/Step6ReviewGenerate';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { useWizardValidation } from '@/hooks/useWizardValidation';
import { useAutoSave, getDraftInfo, formatLastSaved } from '@/hooks/useAutoSave';
import TopicSuggestionEngine from '@/components/wizard/smart/TopicSuggestionEngine';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';

// Content tone options
const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'thought-provoking', label: 'Thought-Provoking' },
  { value: 'expert', label: 'Expert' },
  { value: 'persuasive', label: 'Persuasive' }
];

// Content type options
const CONTENT_TYPE_OPTIONS = [
  { value: 'blog-article', label: 'Blog Article' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'guide', label: 'Guide' },
  { value: 'thought-piece', label: 'Thought Piece' }
];

// Structure format options
const STRUCTURE_FORMAT_OPTIONS = [
  { value: 'intro-points-cta', label: 'Intro + 3 Main Points + CTA' },
  { value: 'problem-solution-cta', label: 'Problem → Solution → Call to Action' },
  { value: 'story-facts-lessons', label: 'Story + Facts + Lessons' },
  { value: 'listicle', label: 'Listicle (e.g. 5 ways to...)' },
  { value: 'custom', label: 'Custom outline' }
];

// CTA type options
const CTA_TYPE_OPTIONS = [
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'book-call', label: 'Book a Call' },
  { value: 'download', label: 'Download Freebie' },
  { value: 'visit-website', label: 'Visit Website' },
  { value: 'none', label: 'None' }
];

// Define the steps of our wizard with metadata
const WIZARD_STEPS = [
  { 
    name: 'Media & Topic', 
    optional: false, 
    estimatedTime: 3,
    description: 'Upload media and define your topic'
  },
  { 
    name: 'Industry & Audience', 
    optional: false, 
    estimatedTime: 2,
    description: 'Select industry and target audience'
  },
  { 
    name: 'Keywords & Title', 
    optional: false, 
    estimatedTime: 4,
    description: 'Define keywords and optimize title'
  },
  { 
    name: 'Structure & Tone', 
    optional: false, 
    estimatedTime: 3,
    description: 'Set content structure and tone'
  },
  { 
    name: 'Generation Settings', 
    optional: true, 
    estimatedTime: 2,
    description: 'Configure generation preferences'
  },
  { 
    name: 'Review & Generate', 
    optional: false, 
    estimatedTime: 1,
    description: 'Review and generate your content'
  }
];

// Progress persistence keys
const PROGRESS_STORAGE_KEY = 'longform-wizard-progress';
const COMPLETED_STEPS_KEY = 'longform-wizard-completed';
const SKIPPED_STEPS_KEY = 'longform-wizard-skipped';

const LongFormWizard = () => {
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
    outputFormat: 'markdown',
    plagiarismCheck: true,
  });

  const navigate = useNavigate();
  const { suggestedKeywords, suggestedStructure, suggestedTone, isLoading } = useSmartSuggestions(formData);
  const { isStepValid, getStepErrors, isFormValid } = useWizardValidation(formData);
  
  // Auto-save functionality
  const { hasSavedDraft, lastSaved, restoreDraft, clearDraft, saveNow } = useAutoSave(formData, {
    key: 'longform-wizard-draft',
    debounceMs: 2000,
    autoSaveIntervalMs: 30000,
    showToast: true
  });

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
    // Mark current step as completed if valid
    if (isStepValid(currentStep)) {
      markStepCompleted(currentStep);
    } else {
      const errors = getStepErrors(currentStep);
      const errorMessages = errors.map(error => error.message).join('\n');
      alert(`Please fix the following errors before proceeding:\n\n${errorMessages}`);
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
    setCurrentStep(0);
    setCompletedSteps([]);
    setSkippedSteps([]);
  };

  // Placeholder for the generate function
  const handleGenerate = () => {
    // This would call your AI service to generate the content
    console.log('Generating content with data:', formData);
    // Navigate to a success page or show generated content
    navigate('/dashboard');
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Media & Topic Selection
        return (
          <Step1MediaUpload formData={formData} updateFormData={updateFormData} />
        );
      case 1: // Industry, Audience & Topic
        return (
          <Step2TopicSelector formData={formData} updateFormData={updateFormData} />
        );
      case 2: // Keywords & Title
        return (
          <Step3KeywordsSEO formData={formData} updateFormData={updateFormData} />
        );
      case 3: // Structure & Tone
        return (
          <Step4ToneStructure formData={formData} updateFormData={updateFormData} />
        );
      case 4: // Generation Settings
        return (
          <Step5GenerationSettings formData={formData} updateFormData={updateFormData} />
        );
      case 5: // Review & Generate
        return (
          <Step6ReviewGenerate 
            formData={formData} 
            updateFormData={updateFormData} 
            onGenerate={handleGenerate}
            onEditStep={setCurrentStep} 
          />
        );
      
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 mt-20">
        {/* Draft Restoration Banner */}
        {hasSavedDraft && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                  Draft Available
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You have a saved draft from {formatLastSaved(lastSaved)}. Would you like to restore it?
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreDraft}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  Restore Draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraft}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card className="max-w-4xl mx-auto p-6">
          {/* Enhanced Progress Bar */}
          <div className="mb-6">
            {/* Progress Overview */}
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Content Wizard Progress</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
                  <span>•</span>
                  <span>{Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% Complete</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getEstimatedTimeRemaining()} min remaining
                  </span>
                </div>
              </div>
              
              {/* Auto-save Status */}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${hasSavedDraft ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>
                    {lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : 'Not saved'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveNow}
                  className="text-xs h-6 px-2 py-0"
                >
                  Save Now
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
                                Optional
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-medium">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          <p className="text-xs">Estimated: {step.estimatedTime} min</p>
                          {isCompleted && <p className="text-xs text-green-600">✓ Completed</p>}
                          {isSkipped && <p className="text-xs text-amber-600">⏭ Skipped</p>}
                          {hasError && <p className="text-xs text-red-600">⚠ Needs attention</p>}
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
                Current: {WIZARD_STEPS[currentStep].name}
                {WIZARD_STEPS[currentStep].optional && " (Optional)"}
              </span>
              <span>{completedSteps.length} of {WIZARD_STEPS.length} steps completed</span>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              ← Previous
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
                  Skip Step
                </Button>
              )}
              
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={!isStepValid(currentStep) && !WIZARD_STEPS[currentStep].optional}
                  className="flex items-center gap-2"
                >
                  Next →
                </Button>
              ) : (
                <Button 
                  onClick={handleGenerate}
                  disabled={!isFormValid}
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Generate Content
                </Button>
              )}
            </div>
          </div>

          {/* Step Validation Errors */}
          {!isStepValid(currentStep) && !WIZARD_STEPS[currentStep].optional && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Please complete the following:
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
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default LongFormWizard;
