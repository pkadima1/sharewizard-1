/**
 * Foundry Image Tab - AI Image Generation
 * Powered by Imagen 4
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, Copy, Share2, Sparkles } from 'lucide-react';
// Using real Gemini service
import { generateImages, type GenerateImagesOptions } from '@/services/visuals';
// Mock service (for development only):
// import { generateImages } from '@/services/visualsMock';
// import type { GenerateImagesOptions } from '@/services/visuals';
import { downloadDataUrl, copyDataUrl, shareAsset, generateFilename } from '@/utils/download';
import { trackEvent } from '@/utils/analytics';

export const FoundryImageTab: React.FC = () => {
  const { t } = useTranslation('foundry');
  const [prompt, setPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState<1 | 2 | 3 | 4>(1);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
  const [personGeneration, setPersonGeneration] = useState<'dont_allow' | 'allow_adult'>('dont_allow');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Submit for processing
  const handleRenderImage = async () => {
    // Validate
    if (!prompt.trim()) {
      setError(t('image.errors.noPrompt'));
      return;
    }

    setError('');
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 600);

      // Call API
      const options: GenerateImagesOptions = {
        numberOfImages,
        aspectRatio,
        personGeneration,
      };
      
      const images = await generateImages(prompt, options);

      clearInterval(progressInterval);
      setProgress(100);

      if (images.length > 0) {
        setResults(images);
        
        // Analytics
        trackEvent('foundry_image_run', {
          count: images.length,
          aspectRatio,
        });
      } else {
        setError(t('image.errors.processingFailed'));
      }
    } catch (err) {
      setError(t('image.errors.processingFailed'));
      console.error('Image generation error:', err);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Action handlers
  const handleDownload = (dataUrl: string, index: number) => {
    const filename = generateFilename(`foundry_image_${index + 1}`, 'png');
    downloadDataUrl(filename, dataUrl);
  };

  const handleCopy = async (dataUrl: string) => {
    await copyDataUrl(dataUrl);
  };

  const handleShare = async (dataUrl: string, index: number) => {
    const filename = generateFilename(`foundry_image_${index + 1}`, 'png');
    await shareAsset({
      title: 'Foundry Image',
      text: prompt,
      dataUrl,
      filename,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls */}
      <div className="lg:col-span-1 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('image.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('image.description')}</p>
        </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('image.prompt')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Input
              placeholder={t('image.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
              className="min-h-[100px]"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Images */}
            <div className="space-y-2">
              <Label>{t('image.numberOfImages')}</Label>
              <Select
                value={numberOfImages.toString()}
                onValueChange={(value) => setNumberOfImages(parseInt(value) as 1 | 2 | 3 | 4)}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>{t('image.aspectRatio')}</Label>
              <Select
                value={aspectRatio}
                onValueChange={(value) => setAspectRatio(value as any)}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">{t('image.aspectRatios.1:1')}</SelectItem>
                  <SelectItem value="3:4">{t('image.aspectRatios.3:4')}</SelectItem>
                  <SelectItem value="4:3">{t('image.aspectRatios.4:3')}</SelectItem>
                  <SelectItem value="9:16">{t('image.aspectRatios.9:16')}</SelectItem>
                  <SelectItem value="16:9">{t('image.aspectRatios.16:9')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Person Generation */}
            <div className="space-y-2">
              <Label>{t('image.personGeneration')}</Label>
              <Select
                value={personGeneration}
                onValueChange={(value) => setPersonGeneration(value as any)}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dont_allow">
                    {t('image.personGenerationOptions.dont_allow')}
                  </SelectItem>
                  <SelectItem value="allow_adult">
                    {t('image.personGenerationOptions.allow_adult')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleRenderImage}
        disabled={isProcessing || !prompt.trim()}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('image.processing')}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {t('image.renderImage')}
          </>
        )}
      </Button>

      {/* Progress */}
      {isProcessing && (
        <Progress value={progress} className="w-full" />
      )}
      </div>

      {/* Right Column - Results */}
      <div className="lg:col-span-2">
        {results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">{t('image.results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((dataUrl, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <img
                    src={dataUrl}
                    alt={`Generated ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(dataUrl, index)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('actions.download')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(dataUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(dataUrl, index)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground text-center">
              {isProcessing ? t('image.processing') : t('image.results')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
