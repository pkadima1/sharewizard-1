/**
 * SmartKeywordGenerator Component
 * v1.0.0
 * 
 * Advanced keyword generation component with:
 * - Auto-generation based on topic/industry changes
 * - Search difficulty indicators (Easy/Medium/Hard)
 * - Estimated monthly searches (simulated data)
 * - Keywords grouped by type: Primary, Secondary, Long-tail
 * - One-click selection for keyword groups
 * - Export/import keywords functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  RefreshCw, 
  TrendingUp, 
  Target, 
  Search, 
  Download, 
  Upload, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  Plus,
  X,
  BarChart3,
  Info
} from 'lucide-react';
import { toast } from "sonner";

interface KeywordData {
  keyword: string;
  type: 'primary' | 'secondary' | 'long-tail';
  difficulty: 'easy' | 'medium' | 'hard';
  monthlySearches: number;
  competition: number; // 0-100
  relevanceScore: number; // 0-100
}

interface SmartKeywordGeneratorProps {
  topic?: string;
  industry?: string;
  audience?: string;
  selectedKeywords?: string[];
  onKeywordsChange?: (keywords: string[]) => void;
  maxKeywords?: number;
  className?: string;
}

const SmartKeywordGenerator: React.FC<SmartKeywordGeneratorProps> = ({
  topic = '',
  industry = '',
  audience = '',
  selectedKeywords = [],
  onKeywordsChange,
  maxKeywords = 15,
  className = ''
}) => {
  // State management
  const [generatedKeywords, setGeneratedKeywords] = useState<KeywordData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');
  const [filter, setFilter] = useState<'all' | 'primary' | 'secondary' | 'long-tail'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-generate keywords when topic/industry changes
  useEffect(() => {
    if (topic && topic.length > 5) {
      generateKeywords();
    }
  }, [topic, industry, audience]);

  // Industry-specific keyword patterns
  const getIndustryKeywords = (industry: string, baseTopic: string): string[] => {
    const industryKeywordMap: Record<string, string[]> = {
      'Marketing': ['strategy', 'campaign', 'ROI', 'conversion', 'brand awareness', 'lead generation', 'analytics', 'automation'],
      'Technology': ['software', 'development', 'API', 'integration', 'innovation', 'digital transformation', 'cloud', 'AI'],
      'Health': ['wellness', 'treatment', 'prevention', 'diagnosis', 'healthcare', 'medical', 'therapy', 'symptoms'],
      'Finance': ['investment', 'portfolio', 'savings', 'budget', 'financial planning', 'returns', 'risk management', 'wealth'],
      'Education': ['learning', 'curriculum', 'training', 'skills', 'knowledge', 'assessment', 'pedagogy', 'certification'],
      'Business': ['growth', 'operations', 'management', 'leadership', 'productivity', 'efficiency', 'scaling', 'innovation']
    };

    const keywords = industryKeywordMap[industry] || industryKeywordMap['Business'];
    return keywords.map(kw => `${baseTopic} ${kw}`).slice(0, 3);
  };

  // Generate difficulty score based on keyword characteristics
  const calculateDifficulty = (keyword: string): 'easy' | 'medium' | 'hard' => {
    const wordCount = keyword.split(' ').length;
    const hasNumbers = /\d/.test(keyword);
    const isLongTail = wordCount >= 3;
    const isSpecific = hasNumbers || keyword.includes('how to') || keyword.includes('best');

    if (isLongTail && isSpecific) return 'easy';
    if (wordCount === 2 && isSpecific) return 'medium';
    if (wordCount === 1 || (!isSpecific && wordCount === 2)) return 'hard';
    return 'medium';
  };

  // Simulate monthly search volumes based on keyword characteristics
  const estimateMonthlySearches = (keyword: string, difficulty: string): number => {
    const baseRanges = {
      'easy': [50, 500],
      'medium': [500, 5000],
      'hard': [2000, 50000]
    };
    
    const [min, max] = baseRanges[difficulty as keyof typeof baseRanges];
    const multiplier = keyword.includes('best') || keyword.includes('how to') ? 1.5 : 1;
    const base = Math.floor(Math.random() * (max - min) + min);
    return Math.floor(base * multiplier);
  };

  // Calculate competition score
  const calculateCompetition = (difficulty: string): number => {
    const baseScores = {
      'easy': [10, 40],
      'medium': [30, 70],
      'hard': [60, 95]
    };
    
    const [min, max] = baseScores[difficulty as keyof typeof baseScores];
    return Math.floor(Math.random() * (max - min) + min);
  };

  // Generate keyword suggestions
  const generateKeywords = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 2);
      const mainKeyword = topicWords.slice(0, 2).join(' ');
      
      // Generate different types of keywords
      const primaryKeywords = [
        mainKeyword,
        topicWords[0],
        `${topicWords[0]} guide`,
        `${topicWords[0]} tips`
      ].filter(Boolean);

      const secondaryKeywords = [
        `best ${mainKeyword}`,
        `${mainKeyword} strategy`,
        `${mainKeyword} benefits`,
        `${topicWords[0]} techniques`,
        `${topicWords[0]} methods`
      ].filter(Boolean);

      const longTailKeywords = [
        `how to ${mainKeyword}`,
        `${mainKeyword} for beginners`,
        `${mainKeyword} step by step`,
        `what is ${mainKeyword}`,
        `${mainKeyword} best practices`,
        `${audience ? `${mainKeyword} for ${audience.toLowerCase()}` : `${mainKeyword} tutorial`}`
      ].filter(Boolean);

      // Add industry-specific keywords
      const industryKeywords = industry ? getIndustryKeywords(industry, topicWords[0]) : [];

      // Combine all keywords and create keyword data objects
      const allKeywords = [
        ...primaryKeywords.map(kw => ({ keyword: kw, type: 'primary' as const })),
        ...secondaryKeywords.map(kw => ({ keyword: kw, type: 'secondary' as const })),
        ...longTailKeywords.map(kw => ({ keyword: kw, type: 'long-tail' as const })),
        ...industryKeywords.map(kw => ({ keyword: kw, type: 'secondary' as const }))
      ];

      // Process keywords with metadata
      const processedKeywords: KeywordData[] = allKeywords
        .slice(0, 20) // Limit to 20 keywords
        .map(({ keyword, type }) => {
          const difficulty = calculateDifficulty(keyword);
          const monthlySearches = estimateMonthlySearches(keyword, difficulty);
          const competition = calculateCompetition(difficulty);
          const relevanceScore = Math.floor(Math.random() * 30) + 70; // 70-100

          return {
            keyword,
            type,
            difficulty,
            monthlySearches,
            competition,
            relevanceScore
          };
        });

      setGeneratedKeywords(processedKeywords);
      toast.success(`Generated ${processedKeywords.length} keyword suggestions!`);
      
    } catch (error) {
      console.error('Error generating keywords:', error);
      toast.error('Failed to generate keywords. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add custom keyword
  const addCustomKeyword = () => {
    if (!customKeyword.trim()) return;
    
    const keyword = customKeyword.trim();
    const difficulty = calculateDifficulty(keyword);
    const newKeyword: KeywordData = {
      keyword,
      type: 'secondary',
      difficulty,
      monthlySearches: estimateMonthlySearches(keyword, difficulty),
      competition: calculateCompetition(difficulty),
      relevanceScore: 75
    };

    setGeneratedKeywords(prev => [...prev, newKeyword]);
    setCustomKeyword('');
    toast.success('Custom keyword added!');
  };

  // Handle keyword selection
  const toggleKeyword = (keyword: string) => {
    const newSelection = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter(k => k !== keyword)
      : [...selectedKeywords, keyword].slice(0, maxKeywords);
    
    onKeywordsChange?.(newSelection);
  };

  // Select keyword group
  const selectKeywordGroup = (type: 'primary' | 'secondary' | 'long-tail') => {
    const groupKeywords = filteredKeywords
      .filter(kw => kw.type === type)
      .map(kw => kw.keyword);
    
    const newSelection = [...new Set([...selectedKeywords, ...groupKeywords])].slice(0, maxKeywords);
    onKeywordsChange?.(newSelection);
    toast.success(`Added ${type} keywords to selection!`);
  };

  // Clear all selections
  const clearAllSelections = () => {
    onKeywordsChange?.([]);
    toast.info('Cleared all keyword selections');
  };

  // Export keywords
  const exportKeywords = () => {
    const exportData = {
      topic,
      industry,
      audience,
      selectedKeywords,
      generatedKeywords,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${topic.slice(0, 20).replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Keywords exported successfully!');
  };

  // Import keywords
  const importKeywords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.generatedKeywords) {
          setGeneratedKeywords(data.generatedKeywords);
          if (data.selectedKeywords) {
            onKeywordsChange?.(data.selectedKeywords);
          }
          toast.success('Keywords imported successfully!');
        }
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    return generatedKeywords.filter(kw => {
      const typeMatch = filter === 'all' || kw.type === filter;
      const difficultyMatch = difficultyFilter === 'all' || kw.difficulty === difficultyFilter;
      return typeMatch && difficultyMatch;
    });
  }, [generatedKeywords, filter, difficultyFilter]);

  // Difficulty badge styling
  const getDifficultyBadge = (difficulty: 'easy' | 'medium' | 'hard') => {
    const styles = {
      easy: { variant: 'secondary' as const, icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-600' },
      medium: { variant: 'outline' as const, icon: <AlertTriangle className="w-3 h-3" />, color: 'text-yellow-600' },
      hard: { variant: 'destructive' as const, icon: <Zap className="w-3 h-3" />, color: 'text-red-600' }
    };
    return styles[difficulty];
  };

  // Type badge styling
  const getTypeBadge = (type: 'primary' | 'secondary' | 'long-tail') => {
    const styles = {
      primary: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      secondary: { variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      'long-tail': { variant: 'outline' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    };
    return styles[type];
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Header with controls */}
        <Card className="p-4 border-l-4 border-l-primary shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Smart Keyword Generator
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered keyword suggestions with search difficulty analysis
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateKeywords}
                disabled={isGenerating || !topic}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Regenerate'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced controls */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Type filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filter by Type</Label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="w-full px-2 py-1 text-sm border rounded-md bg-background"
                  >
                    <option value="all">All Types</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="long-tail">Long-tail</option>
                  </select>
                </div>

                {/* Difficulty filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filter by Difficulty</Label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value as any)}
                    className="w-full px-2 py-1 text-sm border rounded-md bg-background"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Export/Import */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Export/Import</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportKeywords}
                      disabled={generatedKeywords.length === 0}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <label className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-3 w-3" />
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importKeywords}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick group selection */}
        {generatedKeywords.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-sm">Quick Select by Group</h4>
                <p className="text-xs text-muted-foreground">Select entire keyword groups at once</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectKeywordGroup('primary')}
                  className="text-xs"
                >
                  + Primary ({generatedKeywords.filter(kw => kw.type === 'primary').length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectKeywordGroup('secondary')}
                  className="text-xs"
                >
                  + Secondary ({generatedKeywords.filter(kw => kw.type === 'secondary').length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectKeywordGroup('long-tail')}
                  className="text-xs"
                >
                  + Long-tail ({generatedKeywords.filter(kw => kw.type === 'long-tail').length})
                </Button>
                {selectedKeywords.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllSelections}
                    className="text-xs text-red-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Keywords list */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Selected keywords summary */}
            {selectedKeywords.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Selected Keywords ({selectedKeywords.length}/{maxKeywords})</h4>
                  <Badge variant="secondary" className="text-xs">
                    {selectedKeywords.length} selected
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedKeywords.map(keyword => (
                    <Badge
                      key={keyword}
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        onClick={() => toggleKeyword(keyword)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom keyword */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom keyword..."
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomKeyword();
                  }
                }}
                className="text-sm"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addCustomKeyword}
                disabled={!customKeyword.trim()}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>

            {/* Loading state */}
            {isGenerating && (
              <div className="py-8 text-center">
                <div className="animate-pulse space-y-2">
                  <div className="flex justify-center">
                    <TrendingUp className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                  <p className="text-muted-foreground">Analyzing topic and generating smart keyword suggestions...</p>
                  <p className="text-xs text-muted-foreground">This includes search volume and difficulty analysis</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && generatedKeywords.length === 0 && (
              <div className="py-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No keywords generated yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {topic ? 'Click "Regenerate" to create keyword suggestions' : 'Enter a topic to see keyword suggestions'}
                </p>
              </div>
            )}

            {/* Keywords grid */}
            {!isGenerating && filteredKeywords.length > 0 && (
              <div className="space-y-3">
                {filteredKeywords.map((kwData, index) => {
                  const isSelected = selectedKeywords.includes(kwData.keyword);
                  const difficultyBadge = getDifficultyBadge(kwData.difficulty);
                  const typeBadge = getTypeBadge(kwData.type);

                  return (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg transition-all cursor-pointer hover:border-primary/50 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => toggleKeyword(kwData.keyword)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleKeyword(kwData.keyword)}
                            className="mt-0.5"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{kwData.keyword}</span>
                              <Badge {...typeBadge} className="text-xs px-1.5 py-0">
                                {kwData.type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                <span>{kwData.monthlySearches.toLocaleString()}/mo</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>{kwData.relevanceScore}% relevance</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>{kwData.competition}% competition</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                {...difficultyBadge} 
                                className={`text-xs flex items-center gap-1 ${difficultyBadge.color}`}
                              >
                                {difficultyBadge.icon}
                                {kwData.difficulty.charAt(0).toUpperCase() + kwData.difficulty.slice(1)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">SEO Difficulty: {kwData.difficulty}</p>
                                <p className="text-muted-foreground mt-1">
                                  {kwData.difficulty === 'easy' && 'Easy to rank - great for beginners'}
                                  {kwData.difficulty === 'medium' && 'Moderate competition - balanced opportunity'}
                                  {kwData.difficulty === 'hard' && 'High competition - requires strong SEO'}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filter results info */}
            {!isGenerating && generatedKeywords.length > 0 && filteredKeywords.length !== generatedKeywords.length && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredKeywords.length} of {generatedKeywords.length} keywords
                  {filter !== 'all' && ` (filtered by ${filter})`}
                  {difficultyFilter !== 'all' && ` (${difficultyFilter} difficulty)`}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Summary statistics */}
        {selectedKeywords.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">Selection Summary</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Total Keywords</p>
                <p className="text-blue-800 dark:text-blue-200">{selectedKeywords.length}</p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Est. Monthly Searches</p>
                <p className="text-blue-800 dark:text-blue-200">
                  {generatedKeywords
                    .filter(kw => selectedKeywords.includes(kw.keyword))
                    .reduce((sum, kw) => sum + kw.monthlySearches, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Avg. Difficulty</p>
                <p className="text-blue-800 dark:text-blue-200">
                  {generatedKeywords
                    .filter(kw => selectedKeywords.includes(kw.keyword))
                    .reduce((sum, kw, _, arr) => {
                      const difficultyScore = kw.difficulty === 'easy' ? 1 : kw.difficulty === 'medium' ? 2 : 3;
                      return sum + difficultyScore / arr.length;
                    }, 0) > 2 ? 'Hard' : 
                   generatedKeywords
                    .filter(kw => selectedKeywords.includes(kw.keyword))
                    .reduce((sum, kw, _, arr) => {
                      const difficultyScore = kw.difficulty === 'easy' ? 1 : kw.difficulty === 'medium' ? 2 : 3;
                      return sum + difficultyScore / arr.length;
                    }, 0) > 1.5 ? 'Medium' : 'Easy'}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Avg. Relevance</p>
                <p className="text-blue-800 dark:text-blue-200">
                  {Math.round(generatedKeywords
                    .filter(kw => selectedKeywords.includes(kw.keyword))
                    .reduce((sum, kw, _, arr) => sum + kw.relevanceScore / arr.length, 0))}%
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SmartKeywordGenerator;
