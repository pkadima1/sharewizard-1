import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  RefreshCw, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3,
  Lightbulb,
  Eye,
  FileText
} from 'lucide-react';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';
import SmartKeywordGenerator from '@/components/wizard/smart/SmartKeywordGenerator';

const Step3KeywordsSEO = ({ formData, updateFormData }) => {
  const [selectedKeywords, setSelectedKeywords] = useState(formData.keywords || []);
  const [suggestedTitles, setSuggestedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(formData.optimizedTitle || '');
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState([]);

  // SEO Analysis calculations
  const seoAnalysis = useMemo(() => {
    const calculateSEOScore = () => {
      let score = 0;
      const factors = [];

      // Keyword count (0-30 points)
      const keywordCount = selectedKeywords.length;
      if (keywordCount >= 3) {
        score += 30;
        factors.push({ factor: 'Keyword Count', score: 30, status: 'good' });
      } else if (keywordCount >= 1) {
        score += 15;
        factors.push({ factor: 'Keyword Count', score: 15, status: 'warning' });
      } else {
        factors.push({ factor: 'Keyword Count', score: 0, status: 'error' });
      }

      // Title optimization (0-25 points)
      if (selectedTitle) {
        const titleLength = selectedTitle.length;
        const hasKeyword = selectedKeywords.some(kw => 
          selectedTitle.toLowerCase().includes(kw.toLowerCase())
        );

        if (titleLength >= 50 && titleLength <= 60 && hasKeyword) {
          score += 25;
          factors.push({ factor: 'Title Optimization', score: 25, status: 'good' });
        } else if ((titleLength >= 45 && titleLength <= 65) || hasKeyword) {
          score += 15;
          factors.push({ factor: 'Title Optimization', score: 15, status: 'warning' });
        } else {
          factors.push({ factor: 'Title Optimization', score: 0, status: 'error' });
        }
      } else {
        factors.push({ factor: 'Title Optimization', score: 0, status: 'error' });
      }

      // Keyword diversity (0-20 points)
      const primaryKeywords = selectedKeywords.filter(kw => kw.split(' ').length <= 2);
      const longTailKeywords = selectedKeywords.filter(kw => kw.split(' ').length > 2);
      
      if (primaryKeywords.length >= 1 && longTailKeywords.length >= 1) {
        score += 20;
        factors.push({ factor: 'Keyword Diversity', score: 20, status: 'good' });
      } else if (primaryKeywords.length >= 1 || longTailKeywords.length >= 1) {
        score += 10;
        factors.push({ factor: 'Keyword Diversity', score: 10, status: 'warning' });
      } else {
        factors.push({ factor: 'Keyword Diversity', score: 0, status: 'error' });
      }

      // Content relevance (0-25 points) - based on topic matching
      const topicWords = formData.topic?.toLowerCase().split(' ') || [];
      const keywordRelevance = selectedKeywords.some(kw => 
        topicWords.some(word => kw.toLowerCase().includes(word))
      );
      
      if (keywordRelevance && topicWords.length > 0) {
        score += 25;
        factors.push({ factor: 'Content Relevance', score: 25, status: 'good' });
      } else if (topicWords.length > 0) {
        score += 10;
        factors.push({ factor: 'Content Relevance', score: 10, status: 'warning' });
      } else {
        factors.push({ factor: 'Content Relevance', score: 0, status: 'error' });
      }

      return { score: Math.min(score, 100), factors };
    };

    const calculateKeywordDensity = () => {
      if (!selectedTitle || selectedKeywords.length === 0) return [];
      
      return selectedKeywords.map(keyword => {
        const titleWords = selectedTitle.toLowerCase().split(/\s+/);
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        
        let occurrences = 0;
        for (let i = 0; i <= titleWords.length - keywordWords.length; i++) {
          const slice = titleWords.slice(i, i + keywordWords.length);
          if (slice.join(' ') === keywordWords.join(' ')) {
            occurrences++;
          }
        }
        
        const density = titleWords.length > 0 ? (occurrences / titleWords.length) * 100 : 0;
        
        return {
          keyword,
          occurrences,
          density: Math.round(density * 10) / 10,
          status: density > 0 ? 'included' : 'missing'
        };
      });
    };

    const getTitleLengthAnalysis = () => {
      const length = selectedTitle?.length || 0;
      const optimal = length >= 50 && length <= 60;
      const acceptable = length >= 45 && length <= 65;
      
      return {
        length,
        optimal,
        acceptable,
        status: optimal ? 'optimal' : acceptable ? 'acceptable' : 'needs-improvement',
        recommendation: optimal 
          ? 'Perfect length for SEO!'
          : length < 45 
            ? 'Consider adding more descriptive words'
            : 'Consider shortening for better SEO'
      };
    };

    const seoScore = calculateSEOScore();
    const keywordDensity = calculateKeywordDensity();
    const titleAnalysis = getTitleLengthAnalysis();

    return {
      ...seoScore,
      keywordDensity,
      titleAnalysis
    };
  }, [selectedKeywords, selectedTitle, formData.topic]);

  // Generate SEO Impact preview
  const seoImpact = useMemo(() => {
    const impacts = [];
    
    if (selectedKeywords.length > 0) {
      impacts.push({
        metric: 'Search Visibility',
        improvement: `+${Math.min(selectedKeywords.length * 15, 60)}%`,
        description: 'Increased chance of appearing in search results'
      });
      
      impacts.push({
        metric: 'Click-Through Rate',
        improvement: `+${Math.min(selectedKeywords.length * 8, 35)}%`,
        description: 'More compelling titles attract more clicks'
      });
      
      if (selectedKeywords.some(kw => kw.split(' ').length > 2)) {
        impacts.push({
          metric: 'Long-tail Traffic',
          improvement: '+25%',
          description: 'Long-tail keywords capture specific search intent'
        });
      }
    }
    
    return impacts;
  }, [selectedKeywords]);

  // Generate title improvement suggestions
  const generateTitleSuggestions = (currentTitle, keywords) => {
    if (!currentTitle || keywords.length === 0) return [];
    
    const suggestions = [];
    const mainKeyword = keywords[0];
    
    // Length optimization
    if (currentTitle.length < 50) {
      suggestions.push({
        type: 'length',
        suggestion: `${currentTitle} - Complete ${mainKeyword} Guide`,
        reason: 'Increase title length for better SEO (currently too short)'
      });
    } else if (currentTitle.length > 60) {
      const shortened = currentTitle.substring(0, 57) + '...';
      suggestions.push({
        type: 'length',
        suggestion: shortened,
        reason: 'Shorten title for better search display (currently too long)'
      });
    }
    
    // Keyword placement
    if (!currentTitle.toLowerCase().includes(mainKeyword.toLowerCase())) {
      suggestions.push({
        type: 'keyword',
        suggestion: `${mainKeyword}: ${currentTitle}`,
        reason: 'Place primary keyword at the beginning for better SEO'
      });
    }
    
    // Add power words
    const powerWords = ['Ultimate', 'Complete', 'Essential', 'Proven', 'Expert'];
    const hasNoPowerWords = !powerWords.some(word => 
      currentTitle.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasNoPowerWords) {
      suggestions.push({
        type: 'engagement',
        suggestion: `The Ultimate ${currentTitle}`,
        reason: 'Add power words to increase click-through rates'
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };
  // Update parent form data when selections change
  useEffect(() => {
    updateFormData('keywords', selectedKeywords);
  }, [selectedKeywords]);

  useEffect(() => {
    updateFormData('optimizedTitle', selectedTitle);
  }, [selectedTitle]);

  // Generate title suggestions when keywords or title change
  useEffect(() => {
    if (selectedTitle && selectedKeywords.length > 0) {
      const suggestions = generateTitleSuggestions(selectedTitle, selectedKeywords);
      setTitleSuggestions(suggestions);
    } else {
      setTitleSuggestions([]);
    }
  }, [selectedTitle, selectedKeywords]);
  
  // Handle keyword changes from SmartKeywordGenerator
  const handleKeywordsChange = (newKeywords) => {
    setSelectedKeywords(newKeywords);
    
    // Generate titles when keywords change
    if (newKeywords.length > 0) {
      generateTitles(newKeywords);
    } else {
      setSuggestedTitles([]);
      setSelectedTitle('');
    }
  };
  // Function to generate SEO blog titles when keywords selected
  const generateTitles = (keywordsToUse = selectedKeywords) => {
    if (keywordsToUse.length === 0) return;
    
    setIsLoadingTitles(true);
    
    // Simulate API delay
    setTimeout(() => {
      const topic = formData.topic || 'Content';
      const industry = formData.industry || 'Business';
      const audience = formData.audience || 'Professionals';
      
      // Template patterns for titles
      const titleTemplates = [
        `The Ultimate Guide to ${keywordsToUse[0]} for ${audience}`,
        `How to Boost Your ${industry} Results with ${keywordsToUse.slice(0, 2).join(' & ')}`,
        `${keywordsToUse[0].charAt(0).toUpperCase() + keywordsToUse[0].slice(1)}: The Secret Ingredient for ${industry} Success`,
        `${Math.floor(Math.random() * 10) + 5} ${keywordsToUse[0]} Strategies That Transform Your ${industry} Approach`,
        `Why ${keywordsToUse[0]} is Essential for ${audience} in ${new Date().getFullYear()}`
      ];
      
      // Use the topic if it looks like a title (capitalized words, longer phrase)
      let topicBasedTitle = '';
      if (topic.length > 20 || topic.split(' ').length > 3) {
        // Extract a keyword if possible
        const keyword = keywordsToUse[0] || '';
        if (keyword && !topic.toLowerCase().includes(keyword.toLowerCase())) {
          topicBasedTitle = `${topic}: Leveraging the Power of ${keyword}`;
        } else {
          topicBasedTitle = topic;
        }
      }
      
      // If we have a topic-based title, replace one of the templates
      const titles = [...titleTemplates];
      if (topicBasedTitle) {
        titles[Math.floor(Math.random() * titles.length)] = topicBasedTitle;
      }
      
      setSuggestedTitles(titles);
      setSelectedTitle(titles[0]);
      setIsLoadingTitles(false);
    }, 1200);
  };
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">SEO Keywords & Optimized Title</h2>
          <p className="text-muted-foreground">
            Select keywords and get AI-suggested titles optimized for search engines with real-time SEO analysis.
          </p>
        </div>

        {/* Real-time SEO Score */}
        {selectedKeywords.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">Real-time SEO Score</h3>
              </div>
              <Badge 
                variant={seoAnalysis.score >= 80 ? 'default' : seoAnalysis.score >= 60 ? 'secondary' : 'destructive'}
                className="text-sm font-bold"
              >
                {seoAnalysis.score}/100
              </Badge>
            </div>
            
            <Progress value={seoAnalysis.score} className="mb-4" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {seoAnalysis.factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2">
                  {factor.status === 'good' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : factor.status === 'warning' ? (
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className="font-medium">{factor.factor}</span>
                  <span className={factor.status === 'good' ? 'text-green-600' : factor.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}>
                    {factor.score}pts
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-1">
          {/* Smart Keyword Generator */}
          <SmartKeywordGenerator
            topic={formData.topic}
            industry={formData.industry}
            audience={formData.audience}
            selectedKeywords={selectedKeywords}
            onKeywordsChange={handleKeywordsChange}
            maxKeywords={15}
          />

          {/* SEO Impact Preview */}
          {seoImpact.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">SEO Impact Preview</h3>
              </div>
              <div className="grid gap-3">
                {seoImpact.map((impact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{impact.metric}</p>
                      <p className="text-xs text-muted-foreground">{impact.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30">
                      {impact.improvement}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Title Suggestions Card */}
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">SEO-Optimized Title Suggestions</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateTitles()}
                disabled={isLoadingTitles || selectedKeywords.length === 0}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingTitles ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            
            {selectedKeywords.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Select at least one keyword to generate title suggestions.</p>
              </div>
            ) : isLoadingTitles ? (
              <div className="py-8 flex justify-center">
                <div className="animate-pulse text-center">
                  <p className="text-muted-foreground">Crafting SEO-optimized titles...</p>
                </div>
              </div>
            ) : suggestedTitles.length > 0 ? (
              <>
                <RadioGroup 
                  value={selectedTitle} 
                  onValueChange={setSelectedTitle}
                  className="space-y-2"
                >
                  {suggestedTitles.map((title, index) => (
                    <div key={index} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-accent">
                      <RadioGroupItem value={title} id={`title-${index}`} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={`title-${index}`} className="font-medium cursor-pointer block">{title}</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            title.length >= 50 && title.length <= 60 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : title.length >= 45 && title.length <= 65
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {title.length} chars
                          </span>
                        </div>
                      </div>
                      <QualityIndicator 
                        input={title}
                        type="title"
                        suggestions={selectedKeywords}
                        className="mt-0.5"
                      />
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="custom-title" className="block">Customize selected title</Label>
                    {selectedTitle && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          seoAnalysis.titleAnalysis.status === 'optimal' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : seoAnalysis.titleAnalysis.status === 'acceptable'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {seoAnalysis.titleAnalysis.length}/60 chars
                        </span>
                        <QualityIndicator 
                          input={selectedTitle}
                          type="title"
                          suggestions={selectedKeywords}
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    id="custom-title"
                    placeholder="Edit your selected title..."
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full"
                  />
                  {seoAnalysis.titleAnalysis.recommendation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {seoAnalysis.titleAnalysis.recommendation}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </Card>

          {/* Title Improvement Suggestions */}
          {titleSuggestions.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Title Improvement Suggestions</h3>
              </div>
              <div className="space-y-3">
                {titleSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                          {suggestion.suggestion}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          {suggestion.reason}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTitle(suggestion.suggestion)}
                        className="text-xs"
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Keyword Density Analysis */}
          {seoAnalysis.keywordDensity.length > 0 && selectedTitle && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Keyword Density Analysis</h3>
              </div>
              <div className="space-y-2">
                {seoAnalysis.keywordDensity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      {item.status === 'included' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{item.keyword}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {item.occurrences} occurrence{item.occurrences !== 1 ? 's' : ''}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {item.status === 'missing' ? 'Consider including in title' : 'Good keyword placement'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Recommendation:</strong> Include 1-2 primary keywords in your title for optimal SEO impact.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Step3KeywordsSEO;
