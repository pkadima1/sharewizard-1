import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, XCircle, Info, TrendingUp, Target } from 'lucide-react';

interface QualityIndicatorProps {
  input: string;
  type: 'topic' | 'keywords' | 'title';
  suggestions?: string[];
  className?: string;
}

interface QualityScore {
  score: number; // 0-100
  level: 'poor' | 'good' | 'excellent';
  color: 'red' | 'yellow' | 'green';
  icon: React.ReactNode;
  tips: string[];
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  input,
  type,
  suggestions = [],
  className = ''
}) => {
  // Topic quality assessment - MOVED BEFORE THE useMemo CALL TO FIX THE REFERENCE ERROR
  const assessTopicQuality = (topic: string, tips: string[], suggestions: string[]): number => {
    let score = 0;

    // Length check (10-120 characters is optimal)
    if (topic.length < 10) {
      tips.push('Topic is too short. Aim for at least 10 characters.');
    } else if (topic.length > 120) {
      tips.push('Topic is too long. Keep it under 120 characters.');
      score += 10;
    } else if (topic.length >= 20 && topic.length <= 80) {
      score += 30;
      tips.push('✓ Good topic length');
    } else {
      score += 20;
    }

    // Clarity and structure check
    const words = topic.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 3) {
      tips.push('Add more descriptive words for clarity.');
    } else if (words.length >= 4 && words.length <= 12) {
      score += 25;
      tips.push('✓ Clear and descriptive');
    } else if (words.length > 12) {
      tips.push('Consider making the topic more concise.');
      score += 15;
    } else {
      score += 20;
    }

    // Keyword presence check
    const hasActionWords = /\b(how to|guide|tips|ways|steps|ultimate|best|top|complete)\b/i.test(topic);
    if (hasActionWords) {
      score += 20;
      tips.push('✓ Contains engaging action words');
    } else {
      tips.push('Consider adding action words like "How to", "Ultimate Guide", or "Best Ways".');
    }

    // Specificity check
    const hasNumbers = /\b\d+\b/.test(topic);
    if (hasNumbers) {
      score += 15;
      tips.push('✓ Includes specific numbers for engagement');
    } else {
      tips.push('Consider adding specific numbers (e.g., "5 Ways", "10 Tips").');
    }

    // Relevance to suggestions
    if (suggestions.length > 0) {
      const isRelevantToSuggestions = suggestions.some(suggestion => 
        topic.toLowerCase().includes(suggestion.toLowerCase()) || 
        suggestion.toLowerCase().includes(topic.toLowerCase())
      );
      if (isRelevantToSuggestions) {
        score += 10;
        tips.push('✓ Aligns with suggested topics');
      }
    }

    return Math.min(score, 100);
  };

  // Title quality assessment (similar to topic but with SEO focus)
  const assessTitleQuality = (title: string, tips: string[], suggestions: string[]): number => {
    let score = 0;

    // SEO-optimal length (50-60 characters)
    if (title.length < 30) {
      tips.push('Title is too short for SEO. Aim for 50-60 characters.');
    } else if (title.length > 70) {
      tips.push('Title may be truncated in search results. Keep under 60 characters.');
      score += 15;
    } else if (title.length >= 50 && title.length <= 60) {
      score += 35;
      tips.push('✓ Perfect SEO length');
    } else {
      score += 25;
      tips.push('✓ Good length for SEO');
    }

    // Keyword placement (front-loading)
    const words = title.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 3) {
      score += 20;
      tips.push('✓ Contains multiple keywords');
    }

    // Power words and emotional triggers
    const powerWords = /\b(ultimate|complete|essential|proven|powerful|secret|amazing|incredible|breakthrough)\b/i;
    if (powerWords.test(title)) {
      score += 20;
      tips.push('✓ Contains engaging power words');
    } else {
      tips.push('Consider adding power words like "Ultimate", "Essential", or "Proven".');
    }

    // Clarity and readability
    const hasSpecificBenefit = /\b(increase|improve|boost|reduce|save|learn|master|discover)\b/i.test(title);
    if (hasSpecificBenefit) {
      score += 15;
      tips.push('✓ Promises clear benefits');
    } else {
      tips.push('Include specific benefits (increase, improve, save, etc.).');
    }

    // Capitalization check
    const isProperlyCapitalized = title.split(' ').every((word, index) => {
      if (index === 0) return /^[A-Z]/.test(word);
      return /^[A-Z]/.test(word) || /^(a|an|and|as|at|but|by|for|if|in|of|on|or|the|to|up|yet)$/i.test(word);
    });
    
    if (isProperlyCapitalized) {
      score += 10;
      tips.push('✓ Proper title capitalization');
    } else {
      tips.push('Use proper title case capitalization.');
    }

    return Math.min(score, 100);
  };

  // Keywords quality assessment
  const assessKeywordsQuality = (keywordsInput: string, tips: string[], suggestions: string[]): number => {
    // Handle both string and array inputs
    let keywords: string[];
    if (typeof keywordsInput === 'string') {
      keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } else {
      keywords = Array.isArray(keywordsInput) ? keywordsInput : [];
    }

    let score = 0;

    // Quantity check (3-7 keywords is optimal)
    if (keywords.length === 0) {
      tips.push('Add at least 3 keywords for SEO optimization.');
      return 0;
    } else if (keywords.length < 3) {
      tips.push('Add more keywords. Aim for 3-7 keywords.');
      score += 20;
    } else if (keywords.length >= 3 && keywords.length <= 7) {
      score += 35;
      tips.push('✓ Optimal number of keywords');
    } else {
      tips.push('Consider reducing keywords. 3-7 is optimal for focus.');
      score += 25;
    }

    // Keyword length and specificity
    const avgLength = keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length;
    if (avgLength < 3) {
      tips.push('Keywords are too short. Use more specific phrases.');
    } else if (avgLength >= 4 && avgLength <= 15) {
      score += 25;
      tips.push('✓ Good keyword specificity');
    } else if (avgLength > 15) {
      tips.push('Keywords might be too long. Aim for 2-4 words each.');
      score += 15;
    }

    // Long-tail keyword check
    const longTailCount = keywords.filter(kw => kw.split(' ').length >= 3).length;
    if (longTailCount >= 2) {
      score += 20;
      tips.push('✓ Includes long-tail keywords');
    } else {
      tips.push('Add more long-tail keywords (3+ words) for better targeting.');
    }

    // Keyword diversity
    const uniqueWords = new Set();
    keywords.forEach(kw => {
      kw.split(' ').forEach(word => {
        if (word.length > 2) uniqueWords.add(word.toLowerCase());
      });
    });
    
    if (uniqueWords.size >= keywords.length * 1.5) {
      score += 15;
      tips.push('✓ Good keyword diversity');
    } else {
      tips.push('Increase keyword diversity to cover more search terms.');
    }

    // Commercial intent detection
    const commercialWords = /\b(buy|purchase|price|cost|deal|discount|review|best|top|compare)\b/i;
    const hasCommercialIntent = keywords.some(kw => commercialWords.test(kw));
    if (hasCommercialIntent) {
      score += 5;
      tips.push('✓ Includes commercial intent keywords');
    }

    return Math.min(score, 100);
  };
  
  // Quality assessment logic
  const qualityAssessment = useMemo((): QualityScore => {
    if (!input || input.trim().length === 0) {
      return {
        score: 0,
        level: 'poor',
        color: 'red',
        icon: <XCircle className="w-3 h-3" />,
        tips: [`Enter a ${type} to see quality assessment`]
      };
    }

    let score = 0;
    const tips: string[] = [];
    const trimmedInput = input.trim();

    switch (type) {
      case 'topic':
        score = assessTopicQuality(trimmedInput, tips, suggestions);
        break;
      case 'title':
        score = assessTitleQuality(trimmedInput, tips, suggestions);
        break;
      case 'keywords':
        score = assessKeywordsQuality(trimmedInput, tips, suggestions);
        break;
    }

    // Determine quality level and styling
    let level: 'poor' | 'good' | 'excellent';
    let color: 'red' | 'yellow' | 'green';
    let icon: React.ReactNode;

    if (score >= 80) {
      level = 'excellent';
      color = 'green';
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (score >= 60) {
      level = 'good';
      color = 'yellow';
      icon = <AlertCircle className="w-3 h-3" />;
    } else {
      level = 'poor';
      color = 'red';
      icon = <XCircle className="w-3 h-3" />;
    }

    return { score, level, color, icon, tips };
  }, [input, type, suggestions]);

  // Get badge variant based on quality level
  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'green':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'red':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format quality level for display
  const getQualityLabel = (level: string, score: number) => {
    const labels = {
      poor: 'Poor',
      good: 'Good',
      excellent: 'Excellent'
    };
    return `${labels[level as keyof typeof labels]} (${score}%)`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getBadgeVariant(qualityAssessment.color)}
            className={`inline-flex items-center gap-1 text-xs cursor-help ${className}`}
          >
            {qualityAssessment.icon}
            <span className="capitalize">{qualityAssessment.level}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <div className="flex items-center gap-1">
                {type === 'topic' && <Target className="w-3 h-3" />}
                {type === 'title' && <TrendingUp className="w-3 h-3" />}
                {type === 'keywords' && <Info className="w-3 h-3" />}
                <span className="capitalize">{type} Quality: {getQualityLabel(qualityAssessment.level, qualityAssessment.score)}</span>
              </div>
            </div>
            <div className="space-y-1">
              {qualityAssessment.tips.map((tip, index) => (
                <div key={index} className="text-xs flex items-start gap-1">
                  <span className={tip.startsWith('✓') ? 'text-green-600' : 'text-muted-foreground'}>
                    {tip.startsWith('✓') ? '•' : '→'}
                  </span>
                  <span className={tip.startsWith('✓') ? 'text-green-600' : ''}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>

            {qualityAssessment.score > 0 && (
              <div className="pt-1 border-t">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        qualityAssessment.color === 'green' ? 'bg-green-500' :
                        qualityAssessment.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${qualityAssessment.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono">
                    {qualityAssessment.score}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QualityIndicator;
