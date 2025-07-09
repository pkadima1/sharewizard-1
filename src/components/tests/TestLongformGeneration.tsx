/**
 * TestLongformGeneration.tsx
 * 
 * A utility component for testing the longform content generation functionality
 * This component can be used in development to validate the generation process
 * without going through the entire wizard flow.
 */

import React, { useState } from 'react';
import { httpsCallable } from "firebase/functions";
import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Sample test data with all required fields
const TEST_DATA = {
  topic: "Effective Digital Marketing Strategies for 2025",
  audience: "Small Business Owners",
  industry: "E-commerce",
  contentType: "blog-article",
  contentTone: "professional",
  structureFormat: "intro-points-cta",
  wordCount: 1200,
  keywords: ["digital marketing", "small business", "ROI", "social media", "2025 trends"],
  optimizedTitle: "10 Effective Digital Marketing Strategies for Small E-commerce Businesses in 2025",
  includeImages: true,
  includeStats: true,
  plagiarismCheck: true,
  outputFormat: "markdown",
  ctaType: "subscribe",
  structureNotes: "Focus on actionable strategies with real-world examples",
  mediaUrls: []
};

interface GenerateLongformResponse {
  success: boolean;
  contentId: string;
  content: string;
  outline: any;
  metadata: {
    actualWordCount: number;
    estimatedReadingTime: number;
    generationTime: number;
    outlineGenerationTime: number;
    contentGenerationTime: number;
    contentQuality: {
      hasEmotionalElements: boolean;
      hasActionableContent: boolean;
      seoOptimized: boolean;
      structureComplexity: number;
    };
  };
  requestsRemaining: number;
  message: string;
}

const TestLongformGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerateLongformResponse | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'outline' | 'content' | 'complete' | null>(null);
  const [testDataConfig, setTestDataConfig] = useState(TEST_DATA);
  const [resultView, setResultView] = useState<'summary' | 'content' | 'outline'>('summary');
  
  // Create the callable function
  const generateLongformContentFunction = httpsCallable<
    any, 
    GenerateLongformResponse
  >(functions, 'generateLongformContent');

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress(10);
      setGenerationStage('outline');
      
      // Progress simulation
      const progressUpdateInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (generationStage === 'outline' && prev < 30) return prev + 1;
          if (generationStage === 'content' && prev < 95) return prev + 0.5;
          return prev;
        });
      }, 800);
      
      // Call the Firebase function
      const testDataWithLang = { ...testDataConfig, lang: 'en' };
      console.log('Calling generateLongformContent with:', testDataWithLang);
      const result = await generateLongformContentFunction(testDataWithLang);
      
      // Update progress and stage
      setGenerationStage('content');
      setGenerationProgress(50);
      
      // Update progress to simulate content generation phase
      const contentGenerationInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 95) return prev + 1;
          return prev;
        });
      }, 1000);
      
      // Process result
      setTimeout(() => {
        clearInterval(progressUpdateInterval);
        clearInterval(contentGenerationInterval);
        
        // Handle success
        if (result.data) {
          console.log('Generation result:', result.data);
          setGenerationResult(result.data);
          setGenerationProgress(100);
          setGenerationStage('complete');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Enhanced error handling
      let errorMessage = "An unexpected error occurred during content generation. Please try again.";
      
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
            errorMessage = "You've reached your content generation limit. Please upgrade your plan to continue.";
            break;
          case 'functions/unauthenticated':
          case 'functions/permission-denied':
            errorMessage = "You don't have permission to generate content. Please log in again or contact support.";
            break;
          default:
            // Use the error message from Firebase if available
            errorMessage = error.message || errorMessage;
        }
      }
      
      setGenerationError(errorMessage);
      setIsGenerating(false);
    }
  };
  
  const handleReset = () => {
    setIsGenerating(false);
    setGenerationError(null);
    setGenerationResult(null);
    setGenerationProgress(0);
    setGenerationStage(null);
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Longform Content Generation Test</h1>
        <p className="text-muted-foreground mb-6">
          This utility helps test the longform content generation functionality without going through the entire wizard flow.
        </p>
        
        {!isGenerating && !generationResult && !generationError && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Test Data Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Using predefined test data with all required fields. You can modify this data in the code.
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-60">
              {JSON.stringify(testDataConfig, null, 2)}
            </pre>
            <Button onClick={handleGenerate} className="w-full">
              Run Test Generation
            </Button>
          </div>
        )}
        
        {/* Generation Progress */}
        {isGenerating && !generationError && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generation in Progress</h2>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            
            <div className="space-y-2">
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
            
            <div className="flex justify-center gap-2 mt-4">
              <div className={`px-3 py-1 rounded-full text-xs ${
                generationStage === 'outline' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Outline
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${
                generationStage === 'content' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Content
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${
                generationStage === 'complete' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Complete
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {generationError && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handleGenerate} variant="default">
                Retry Generation
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        )}
        
        {/* Result Display */}
        {generationResult && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Generation Completed Successfully</h2>
            </div>
            
            {/* Result Navigation */}
            <div className="flex gap-2 border-b pb-2">
              <Button 
                variant={resultView === 'summary' ? 'default' : 'outline'} 
                onClick={() => setResultView('summary')}
                size="sm"
              >
                Summary
              </Button>
              <Button 
                variant={resultView === 'content' ? 'default' : 'outline'} 
                onClick={() => setResultView('content')}
                size="sm"
              >
                Generated Content
              </Button>
              <Button 
                variant={resultView === 'outline' ? 'default' : 'outline'} 
                onClick={() => setResultView('outline')}
                size="sm"
              >
                Content Outline
              </Button>
            </div>
            
            {/* Summary View */}
            {resultView === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Content ID</p>
                    <p className="text-xs">{generationResult.contentId}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Word Count</p>
                    <p className="text-xs">{generationResult.metadata.actualWordCount} words</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Reading Time</p>
                    <p className="text-xs">{generationResult.metadata.estimatedReadingTime} minutes</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Requests Remaining</p>
                    <p className="text-xs">{generationResult.requestsRemaining}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Total Generation Time</p>
                    <p className="text-xs">{(generationResult.metadata.generationTime / 1000).toFixed(2)} seconds</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-semibold">Quality Metrics</p>
                    <p className="text-xs">
                      {generationResult.metadata.contentQuality.hasEmotionalElements ? '✓' : '✗'} Emotional Elements<br/>
                      {generationResult.metadata.contentQuality.hasActionableContent ? '✓' : '✗'} Actionable Content<br/>
                      {generationResult.metadata.contentQuality.seoOptimized ? '✓' : '✗'} SEO Optimized<br/>
                      Structure Complexity: {generationResult.metadata.contentQuality.structureComplexity}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content View */}
            {resultView === 'content' && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {generationResult.content}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Outline View */}
            {resultView === 'outline' && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(generationResult.outline, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <Button onClick={handleReset} variant="outline">
              Start New Test
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TestLongformGeneration;
