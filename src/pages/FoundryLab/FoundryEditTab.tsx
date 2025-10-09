/**
 * Foundry Edit Tab - Multi-prompt Image Editor
 * Powered by Gemini 2.5 Flash Image (Nano Banana)
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Plus, Loader2, Download, Copy, Share2 } from 'lucide-react';
// Using real Gemini service
import { editImage, type EditImageResult } from '@/services/visuals';
// Mock service (for development only):
// import { editImage } from '@/services/visualsMock';
// import type { EditImageResult } from '@/services/visuals';
import { downloadDataUrl, copyDataUrl, shareAsset, generateFilename } from '@/utils/download';
import { trackEvent } from '@/utils/analytics';

export const FoundryEditTab: React.FC = () => {
  const { t } = useTranslation('foundry');
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string>('');
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<EditImageResult[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t('edit.errors.fileTooLarge'));
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('edit.errors.invalidFileType'));
      return;
    }

    setError('');
    setBaseImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBaseImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle prompt changes
  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  // Add a new prompt
  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  // Remove a prompt
  const removePrompt = (index: number) => {
    if (prompts.length === 1) return; // Keep at least one
    const newPrompts = prompts.filter((_, i) => i !== index);
    setPrompts(newPrompts);
  };

  // Submit for processing
  const handleForgeEdits = async () => {
    console.log('🔨 Forge Edits clicked');
    
    // Validate
    if (!baseImage) {
      console.warn('No base image');
      setError(t('edit.errors.noImage'));
      return;
    }

    const validPrompts = prompts.filter(p => p.trim().length > 0);
    console.log('Valid prompts:', validPrompts);
    
    if (validPrompts.length === 0) {
      console.warn('No valid prompts');
      setError(t('edit.errors.noPrompts'));
      return;
    }

    console.log('Starting edit process...');
    setError('');
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      console.log('Calling editImage with:', baseImage.name, validPrompts);
      
      // Call API
      const editResults = await editImage(baseImage, validPrompts);

      console.log('Edit results received:', editResults);

      clearInterval(progressInterval);
      setProgress(100);

      if (editResults.length > 0) {
        console.log('✓ Setting results:', editResults.length);
        setResults(editResults);
        
        // Analytics
        trackEvent('foundry_edit_run', {
          count: editResults.length,
          prompts: validPrompts.length,
        });
      } else {
        console.error('No results returned');
        setError(t('edit.errors.processingFailed'));
      }
    } catch (err) {
      console.error('✗ Edit error:', err);
      setError(t('edit.errors.processingFailed'));
    } finally {
      console.log('Process complete, resetting state');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Action handlers
  const handleDownload = (result: EditImageResult, index: number) => {
    const filename = generateFilename(`foundry_edit_${index + 1}`, 'png');
    downloadDataUrl(filename, result.dataUrl);
  };

  const handleCopy = async (result: EditImageResult) => {
    await copyDataUrl(result.dataUrl);
  };

  const handleShare = async (result: EditImageResult, index: number) => {
    const filename = generateFilename(`foundry_edit_${index + 1}`, 'png');
    await shareAsset({
      title: 'Foundry Edit',
      text: result.prompt,
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
          <h2 className="text-2xl font-bold mb-2">{t('edit.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('edit.description')}</p>
        </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('edit.uploadImage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {baseImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={baseImagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBaseImage(null);
                      setBaseImagePreview('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">{t('edit.uploadPlaceholder')}</p>
                  <p className="text-sm text-muted-foreground">{t('edit.uploadHint')}</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prompts Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('edit.prompts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={t('edit.promptPlaceholder')}
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  disabled={isProcessing}
                />
                {prompts.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removePrompt(index)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addPrompt}
              disabled={isProcessing}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('edit.addPrompt')}
            </Button>
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
        onClick={handleForgeEdits}
        disabled={isProcessing || !baseImage}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('edit.processing')}
          </>
        ) : (
          t('edit.forgeEdits')
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
            <h3 className="text-2xl font-bold">{t('edit.results')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardDescription>{result.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img
                    src={result.dataUrl}
                    alt={result.prompt}
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(result, index)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('actions.download')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(result)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(result, index)}
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
              {isProcessing ? t('edit.processing') : t('edit.results')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
