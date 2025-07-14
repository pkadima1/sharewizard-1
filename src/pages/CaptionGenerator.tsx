import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WizardLayout, WizardStep } from '@/components/WizardLayout';
import MediaUploader from '@/components/MediaUploader';
import NicheSelector from '@/components/NicheSelector';
import PlatformSelector from '@/components/PlatformSelector';
import GoalSelector from '@/components/GoalSelector';
import ToneSelector from '@/components/ToneSelector';
import GeneratedCaptions from '@/components/GeneratedCaptions';
import { toast } from "sonner";
import { usePageAnalytics } from '@/components/analytics/PageAnalytics';
import { trackContentGeneration, trackButtonClick, trackFeatureUsage, trackError } from '@/utils/analytics';

const CaptionGenerator: React.FC = () => {
  // Analytics: Track page view automatically
  usePageAnalytics('Caption Generator - EngagePerfect');

  const { t } = useTranslation('caption-generator');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isTextOnly, setIsTextOnly] = useState<boolean>(false);
  const [captionOverlayMode, setCaptionOverlayMode] = useState<'overlay' | 'below'>('below');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const steps: WizardStep[] = [{
    title: t('steps.uploadMedia.title'),
    description: t('steps.uploadMedia.description'),
    isCompleted: !!selectedMedia || isTextOnly
  }, {
    title: t('steps.selectNiche.title'),
    description: t('steps.selectNiche.description'),
    isCompleted: !!selectedNiche
  }, {
    title: t('steps.platform.title'),
    description: t('steps.platform.description'),
    isCompleted: !!selectedPlatform
  }, {
    title: t('steps.goal.title'),
    description: t('steps.goal.description'),
    isCompleted: !!selectedGoal
  }, {
    title: t('steps.tone.title'),
    description: t('steps.tone.description'),
    isCompleted: !!selectedTone
  }, {
    title: t('steps.generatedCaptions.title'),
    description: t('steps.generatedCaptions.description'),
    isCompleted: false
  }];
  const handleMediaSelect = (file: File | null) => {
    if (!file) {
      setSelectedMedia(null);
      setPreviewUrl(null);
      return;
    }
    setSelectedMedia(file);
    setIsTextOnly(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // For videos, always set the caption mode to overlay
    if (file.type.startsWith('video')) {
      setCaptionOverlayMode('overlay');
    }
  };

  const handleTextOnlySelect = () => {
    setIsTextOnly(true);
    setSelectedMedia(null);
    setPreviewUrl(null);

    setCurrentStep(prev => prev + 1);
    toast.success(t('toasts.textOnlyEnabled'));
  };

  const handleNicheChange = (niche: string) => {
    setSelectedNiche(niche);
    // Analytics: Track niche selection
    trackFeatureUsage('niche_selection', {
      niche: niche,
      step: 'wizard_step_1'
    });
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    // Analytics: Track platform selection
    trackFeatureUsage('platform_selection', {
      platform: platform,
      step: 'wizard_step_2'
    });
  };

  const handleGoalChange = (goal: string) => {
    setSelectedGoal(goal);
    // Analytics: Track goal selection
    trackFeatureUsage('goal_selection', {
      goal: goal,
      step: 'wizard_step_3'
    });
  };

  const handleToneChange = (tone: string) => {
    setSelectedTone(tone);
    // Analytics: Track tone selection
    trackFeatureUsage('tone_selection', {
      tone: tone,
      step: 'wizard_step_4'
    });
  };

  const handleGenerate = () => {
    // Analytics: Track caption generation start
    const generationStartTime = Date.now();
    
    trackContentGeneration('caption', {
      status: 'started',
      platform: selectedPlatform,
      niche: selectedNiche,
      goal: selectedGoal,
      tone: selectedTone,
      has_media: !!selectedMedia,
      media_type: selectedMedia?.type || 'text_only',
      text_only_mode: isTextOnly
    });
    
    trackFeatureUsage('caption_generation', {
      platform: selectedPlatform,
      niche: selectedNiche,
      source: 'caption_wizard'
    });

    setIsGenerating(true);
    setCurrentStep(prev => prev + 1);

    // Store start time for completion tracking
    sessionStorage.setItem('caption_generation_start', generationStartTime.toString());
  };
  const handleCaptionOverlayModeChange = (mode: 'overlay' | 'below') => {
    // Only change the mode if we're not dealing with a video
    if (!(selectedMedia && selectedMedia.type.startsWith('video'))) {
      setCaptionOverlayMode(mode);
    }
  };

  const handleNext = () => {
    // Analytics: Track wizard step progression
    trackButtonClick('wizard_next', `step_${currentStep}`);
    
    if (currentStep === 0 && !selectedMedia && !isTextOnly) {
      trackError('validation_error', 'Media upload required', 'caption_generator');
      toast.error(t('toasts.uploadMediaRequired'));
      return;
    }
    if (currentStep === 1 && !selectedNiche) {
      trackError('validation_error', 'Niche selection required', 'caption_generator');
      toast.error(t('toasts.nicheRequired'));
      return;
    }
    if (currentStep === 2 && !selectedPlatform) {
      trackError('validation_error', 'Platform selection required', 'caption_generator');
      toast.error(t('toasts.platformRequired'));
      return;
    }
    if (currentStep === 3 && !selectedGoal) {
      trackError('validation_error', 'Goal selection required', 'caption_generator');
      toast.error(t('toasts.goalRequired'));
      return;
    }
    if (currentStep === 4 && !selectedTone) {
      toast.error(t('toasts.toneRequired'));
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-adaptive-primary">
      <div className="px-4 py-[100px]">
        <h1 className="text-2xl md:text-3xl font-bold text-adaptive-primary text-center">
          {t('title')}
        </h1>
        <p className="mt-2 text-adaptive-secondary text-center max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>        <div className="container mx-auto flex-1 p-4 md:p-6 max-w-7xl">
        <div className="card-adaptive backdrop-blur-md shadow-md overflow-hidden">
          <WizardLayout 
            currentStep={currentStep} 
            steps={steps} 
            onNext={handleNext} 
            onPrev={handlePrev} 
            isNextDisabled={
              currentStep === 0 && !selectedMedia && !isTextOnly || 
              currentStep === 1 && !selectedNiche || 
              currentStep === 2 && !selectedPlatform || 
              currentStep === 3 && !selectedGoal || 
              currentStep === 4 && !selectedTone
            } 
            isGenerating={isGenerating} 
            hideNextButton={currentStep === 4 || currentStep === 5}
          >
            {currentStep === 0 && 
              <MediaUploader 
                onMediaSelect={handleMediaSelect} 
                selectedMedia={selectedMedia} 
                previewUrl={previewUrl} 
                onTextOnlySelect={handleTextOnlySelect} 
              />
            }
            
            {currentStep === 1 && 
              <NicheSelector 
                selectedNiche={selectedNiche} 
                onNicheChange={handleNicheChange} 
              />
            }
            
            {currentStep === 2 && 
              <PlatformSelector 
                selectedPlatform={selectedPlatform} 
                onPlatformChange={handlePlatformChange} 
              />
            }
            
            {currentStep === 3 && 
              <GoalSelector 
                selectedGoal={selectedGoal} 
                onGoalChange={handleGoalChange} 
              />
            }
            
            {currentStep === 4 && 
              <ToneSelector 
                selectedTone={selectedTone} 
                onToneChange={handleToneChange} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
              />
            }
            
            {currentStep === 5 && 
              <GeneratedCaptions 
                selectedMedia={selectedMedia} 
                previewUrl={previewUrl} 
                selectedNiche={selectedNiche} 
                selectedPlatform={selectedPlatform} 
                selectedGoal={selectedGoal} 
                selectedTone={selectedTone} 
                isGenerating={isGenerating} 
                setIsGenerating={setIsGenerating} 
                isTextOnly={isTextOnly} 
                captionOverlayMode={captionOverlayMode} 
                onCaptionOverlayModeChange={handleCaptionOverlayModeChange} 
              />
            }
          </WizardLayout>
        </div>
      </div>
    </div>
  );
};

export default CaptionGenerator;
