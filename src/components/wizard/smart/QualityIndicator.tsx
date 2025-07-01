import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('longform');
  
  // Topic quality assessment - MOVED BEFORE THE useMemo CALL TO FIX THE REFERENCE ERROR
  const assessTopicQuality = (topic: string, tips: string[], suggestions: string[]): number => {
    let score = 0;

    // Length check (10-120 characters is optimal)
    if (topic.length < 10) {
      tips.push(t('smartComponents.qualityIndicator.tips.topicTooShort'));
    } else if (topic.length > 120) {
      tips.push(t('smartComponents.qualityIndicator.tips.topicTooLong'));
      score += 10;
    } else if (topic.length >= 20 && topic.length <= 80) {
      score += 30;
      tips.push(t('smartComponents.qualityIndicator.tips.goodTopicLength'));
    } else {
      score += 20;
    }

    // Clarity and structure check
    const words = topic.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 3) {
      tips.push(t('smartComponents.qualityIndicator.tips.addMoreDescriptive'));
    } else if (words.length >= 4 && words.length <= 12) {
      score += 25;
      tips.push(t('smartComponents.qualityIndicator.tips.clearDescriptive'));
    } else if (words.length > 12) {
      tips.push(t('smartComponents.qualityIndicator.tips.makeMoreConcise'));
      score += 15;
    } else {
      score += 20;
    }

    // Keyword presence check
    const hasActionWords = /\b(how to|guide|tips|ways|steps|ultimate|best|top|complete)\b/i.test(topic);
    if (hasActionWords) {
      score += 20;
      tips.push(t('smartComponents.qualityIndicator.tips.hasActionWords'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.addActionWords'));
    }

    // Specificity check
    const hasNumbers = /\b\d+\b/.test(topic);
    if (hasNumbers) {
      score += 15;
      tips.push(t('smartComponents.qualityIndicator.tips.hasNumbers'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.addNumbers'));
    }

    // Relevance to suggestions
    if (suggestions.length > 0) {
      const isRelevantToSuggestions = suggestions.some(suggestion => 
        topic.toLowerCase().includes(suggestion.toLowerCase()) || 
        suggestion.toLowerCase().includes(topic.toLowerCase())
      );
      if (isRelevantToSuggestions) {
        score += 10;
        tips.push(t('smartComponents.qualityIndicator.tips.alignsWithSuggestions'));
      }
    }

    return Math.min(score, 100);
  };

  // Title quality assessment (similar to topic but with SEO focus)
  const assessTitleQuality = (title: string, tips: string[], suggestions: string[]): number => {
    let score = 0;

    // SEO-optimal length (50-60 characters)
    if (title.length < 30) {
      tips.push(t('smartComponents.qualityIndicator.tips.titleTooShort'));
    } else if (title.length > 70) {
      tips.push(t('smartComponents.qualityIndicator.tips.titleTooLong'));
      score += 15;
    } else if (title.length >= 50 && title.length <= 60) {
      score += 35;
      tips.push(t('smartComponents.qualityIndicator.tips.perfectSeoLength'));
    } else {
      score += 25;
      tips.push(t('smartComponents.qualityIndicator.tips.goodSeoLength'));
    }

    // Keyword placement (front-loading)
    const words = title.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 3) {
      score += 20;
      tips.push(t('smartComponents.qualityIndicator.tips.multipleKeywords'));
    }

    // Power words and emotional triggers
    const powerWords = /\b(ultimate|complete|essential|proven|powerful|secret|amazing|incredible|breakthrough)\b/i;
    if (powerWords.test(title)) {
      score += 20;
      tips.push(t('smartComponents.qualityIndicator.tips.hasPowerWords'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.addPowerWords'));
    }

    // Clarity and readability
    const hasSpecificBenefit = /\b(increase|improve|boost|reduce|save|learn|master|discover)\b/i.test(title);
    if (hasSpecificBenefit) {
      score += 15;
      tips.push(t('smartComponents.qualityIndicator.tips.hasSpecificBenefit'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.addSpecificBenefit'));
    }

    // Capitalization check
    const isProperlyCapitalized = title.split(' ').every((word, index) => {
      if (index === 0) return /^[A-Z]/.test(word);
      return /^[A-Z]/.test(word) || /^(a|an|and|as|at|but|by|for|if|in|of|on|or|the|to|up|yet)$/i.test(word);
    });
    
    if (isProperlyCapitalized) {
      score += 10;
      tips.push(t('smartComponents.qualityIndicator.tips.properCapitalization'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.useProperCase'));
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
      tips.push(t('smartComponents.qualityIndicator.tips.addAtLeastThree'));
      return 0;
    } else if (keywords.length < 3) {
      tips.push(t('smartComponents.qualityIndicator.tips.addMoreKeywords'));
      score += 20;
    } else if (keywords.length >= 3 && keywords.length <= 7) {
      score += 35;
      tips.push(t('smartComponents.qualityIndicator.tips.optimalKeywordCount'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.reduceKeywords'));
      score += 25;
    }

    // Keyword length and specificity
    const avgLength = keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length;
    if (avgLength < 3) {
      tips.push(t('smartComponents.qualityIndicator.tips.keywordsTooShort'));
    } else if (avgLength >= 4 && avgLength <= 15) {
      score += 25;
      tips.push(t('smartComponents.qualityIndicator.tips.goodKeywordSpecificity'));
    } else if (avgLength > 15) {
      tips.push(t('smartComponents.qualityIndicator.tips.keywordsTooLong'));
      score += 15;
    }

    // Long-tail keyword check
    const longTailCount = keywords.filter(kw => kw.split(' ').length >= 3).length;
    if (longTailCount >= 2) {
      score += 20;
      tips.push(t('smartComponents.qualityIndicator.tips.longTailKeywords'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.addMoreLongTail'));
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
      tips.push(t('smartComponents.qualityIndicator.tips.goodKeywordDiversity'));
    } else {
      tips.push(t('smartComponents.qualityIndicator.tips.increaseKeywordDiversity'));
    }

    // Commercial intent detection
    const commercialWords = /\b(buy|purchase|price|cost|deal|discount|review|best|top|compare)\b/i;
    const hasCommercialIntent = keywords.some(kw => commercialWords.test(kw));
    if (hasCommercialIntent) {
      score += 5;
      tips.push(t('smartComponents.qualityIndicator.tips.commercialIntent'));
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
        tips: [t('smartComponents.qualityIndicator.tips.enterToSee', { type })]
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
      poor: t('smartComponents.qualityIndicator.poor'),
      good: t('smartComponents.qualityIndicator.good'),
      excellent: t('smartComponents.qualityIndicator.excellent')
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
            <span className="capitalize">{t(`smartComponents.qualityIndicator.${qualityAssessment.level}`)}</span>
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
