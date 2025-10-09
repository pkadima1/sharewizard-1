/**
 * Foundry Motion Tab - AI Video Generation
 * Powered by Veo 3
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, Share2, Film } from 'lucide-react';
// Using real Gemini service
import { generateVideo, type GenerateVideoOptions } from '@/services/visuals';
// Mock service (for development only):
// import { generateVideo } from '@/services/visualsMock';
// import type { GenerateVideoOptions } from '@/services/visuals';
import { downloadDataUrl, shareAsset, generateFilename, getExtensionFromMimeType } from '@/utils/download';
import { trackEvent } from '@/utils/analytics';

export const FoundryMotionTab: React.FC = () => {
  const { t } = useTranslation('foundry');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ mimeType: string; dataUrl: string } | null>(null);
  const [error, setError] = useState<string>('');

  // Submit for processing
  const handleRenderMotion = async () => {
    // Validate
    if (!prompt.trim()) {
      setError(t('motion.errors.noPrompt'));
      return;
    }

    if (durationSeconds < 1 || durationSeconds > 8) {
      setError(t('motion.errors.invalidDuration'));
      return;
    }

    setError('');
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress (video generation takes longer)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 1000);

      // Call API
      const options: GenerateVideoOptions = {
        resolution,
        durationSeconds,
      };
      
      const video = await generateVideo(prompt, options);

      clearInterval(progressInterval);
      setProgress(100);

      if (video) {
        setResult(video);
        
        // Analytics
        trackEvent('foundry_motion_run', {
          resolution,
          durationSeconds,
        });
      } else {
        setError(t('motion.errors.processingFailed'));
      }
    } catch (err) {
      // Check if it's a 501 Not Implemented error
      if (err instanceof Error && err.message.includes('not yet implemented')) {
        setError(t('motion.errors.notImplemented'));
      } else {
        setError(t('motion.errors.processingFailed'));
      }
      console.error('Video generation error:', err);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Action handlers
  const handleDownload = () => {
    if (!result) return;
    const extension = getExtensionFromMimeType(result.mimeType);
    const filename = generateFilename('foundry_motion', extension);
    downloadDataUrl(filename, result.dataUrl);
  };

  const handleShare = async () => {
    if (!result) return;
    const extension = getExtensionFromMimeType(result.mimeType);
    const filename = generateFilename('foundry_motion', extension);
    await shareAsset({
      title: 'Foundry Motion',
      text: prompt,
      dataUrl: result.dataUrl,
      filename,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls */}
      <div className="lg:col-span-1 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('motion.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('motion.description')}</p>
        </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('motion.prompt')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Input
              placeholder={t('motion.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={true}
              className="min-h-[100px]"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resolution */}
            <div className="space-y-2">
              <Label>{t('motion.resolution')}</Label>
              <Select
                value={resolution}
                onValueChange={(value) => setResolution(value as '720p' | '1080p')}
                disabled={true}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">{t('motion.resolutions.720p')}</SelectItem>
                  <SelectItem value="1080p">{t('motion.resolutions.1080p')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>
                {t('motion.duration')}: {durationSeconds}s
              </Label>
              <div className="pt-2">
                <Slider
                  value={[durationSeconds]}
                  onValueChange={(value) => setDurationSeconds(value[0])}
                  min={1}
                  max={8}
                  step={1}
                  disabled={true}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('motion.durationHint')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button - Disabled (Coming Soon) */}
      <Button
        onClick={handleRenderMotion}
        disabled={true}
        className="w-full opacity-50 cursor-not-allowed"
        size="lg"
      >
        <Film className="h-4 w-4 mr-2" />
        {t('motion.renderMotion')}
      </Button>
      </div>

      {/* Right Column - Results */}
      <div className="lg:col-span-2">
        {result ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">{t('motion.results')}</h3>
            <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Video Player */}
              <video
                src={result.dataUrl}
                controls
                className="w-full rounded-lg"
                autoPlay
                loop
                muted
              >
                Your browser does not support the video tag.
              </video>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('actions.download')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('actions.share')}
                </Button>
              </div>

              {/* Prompt Display */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Prompt:</p>
                <p className="text-sm">{prompt}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <Film className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-2xl font-semibold text-muted-foreground">
                {t('motion.comingSoon')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
