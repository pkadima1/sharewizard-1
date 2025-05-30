import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, TrendingUp, BookOpen } from 'lucide-react';

interface TopicSuggestionEngineProps {
  industry?: string;
  audience?: string;
  onTopicSelect: (topic: string) => void;
  currentTopic?: string;
}

interface TopicTemplate {
  id: string;
  template: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
}

interface TopicSuggestion {
  id: string;
  topic: string;
  template: string;
  confidence: number;
  reason: string;
}

const TopicSuggestionEngine: React.FC<TopicSuggestionEngineProps> = ({
  industry,
  audience,
  onTopicSelect,
  currentTopic
}) => {
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Define topic templates
  const topicTemplates: TopicTemplate[] = useMemo(() => [
    {
      id: 'how-to',
      template: 'How to',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Step-by-step guides',
      examples: ['How to start', 'How to improve', 'How to master']
    },
    {
      id: 'ultimate-guide',
      template: 'Ultimate Guide',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Comprehensive guides',
      examples: ['The Ultimate Guide to', 'Complete Guide to', 'Beginner\'s Guide to']
    },
    {
      id: 'ways-to',
      template: 'X Ways to',
      icon: <Lightbulb className="w-4 h-4" />,
      description: 'List-based content',
      examples: ['5 Ways to', '10 Tips for', '7 Strategies to']
    },
    {
      id: 'best-practices',
      template: 'Best Practices',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Industry standards',
      examples: ['Best Practices for', 'Top Strategies for', 'Essential Tips for']
    },
    {
      id: 'case-study',
      template: 'Case Study',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Real-world examples',
      examples: ['Case Study:', 'Success Story:', 'How [Company] Achieved']
    }
  ], []);

  // Industry-specific topic ideas
  const industryTopics: Record<string, string[]> = useMemo(() => ({
    'marketing': [
      'content marketing strategy',
      'social media engagement',
      'email marketing campaigns',
      'brand storytelling',
      'influencer partnerships',
      'conversion optimization',
      'customer acquisition',
      'digital advertising'
    ],
    'technology': [
      'artificial intelligence implementation',
      'cloud migration',
      'cybersecurity best practices',
      'software development lifecycle',
      'data analytics',
      'automation tools',
      'digital transformation',
      'API integration'
    ],
    'health': [
      'mental wellness',
      'nutrition planning',
      'fitness routines',
      'preventive healthcare',
      'stress management',
      'healthy lifestyle habits',
      'medical technology',
      'patient care'
    ],
    'finance': [
      'investment strategies',
      'budgeting techniques',
      'retirement planning',
      'tax optimization',
      'cryptocurrency basics',
      'financial literacy',
      'wealth building',
      'risk management'
    ],
    'education': [
      'online learning strategies',
      'student engagement',
      'curriculum development',
      'educational technology',
      'assessment methods',
      'classroom management',
      'skill development',
      'learning analytics'
    ],
    'coaching': [
      'goal setting strategies',
      'leadership development',
      'personal growth',
      'performance improvement',
      'mindset coaching',
      'career advancement',
      'communication skills',
      'team building'
    ],
    'e-commerce': [
      'online store optimization',
      'customer experience',
      'product photography',
      'inventory management',
      'conversion rate optimization',
      'shipping strategies',
      'customer retention',
      'marketplace selling'
    ],
    'food & cooking': [
      'meal preparation',
      'cooking techniques',
      'kitchen organization',
      'seasonal recipes',
      'dietary restrictions',
      'food photography',
      'restaurant management',
      'nutrition education'
    ],
    'fitness': [
      'workout routines',
      'strength training',
      'cardio exercises',
      'nutrition for athletes',
      'injury prevention',
      'fitness tracking',
      'gym equipment',
      'home workouts'
    ],
    'beauty': [
      'skincare routines',
      'makeup techniques',
      'product reviews',
      'beauty trends',
      'self-care practices',
      'natural remedies',
      'professional treatments',
      'beauty tools'
    ],
    'fashion': [
      'style guides',
      'wardrobe essentials',
      'fashion trends',
      'sustainable fashion',
      'outfit coordination',
      'accessory styling',
      'fashion photography',
      'personal branding'
    ],
    'travel': [
      'destination guides',
      'travel planning',
      'budget travel',
      'solo travel tips',
      'cultural experiences',
      'adventure activities',
      'travel photography',
      'packing strategies'
    ]
  }), []);

  // Audience-specific modifiers
  const audienceModifiers: Record<string, string[]> = useMemo(() => ({
    'beginners': ['for beginners', 'getting started with', 'basics of', 'introduction to'],
    'professionals': ['for professionals', 'advanced', 'expert-level', 'industry insights'],
    'entrepreneurs': ['for entrepreneurs', 'business-focused', 'startup', 'growth strategies'],
    'students': ['for students', 'academic', 'learning', 'educational'],
    'small business owners': ['for small businesses', 'cost-effective', 'scalable', 'practical'],
    'millennials': ['for millennials', 'modern', 'tech-savvy', 'career-focused'],
    'gen z': ['for gen z', 'digital-first', 'innovative', 'trend-setting'],
    'parents': ['for parents', 'family-friendly', 'time-efficient', 'practical'],
    'seniors': ['for seniors', 'accessible', 'simplified', 'traditional'],
    'freelancers': ['for freelancers', 'independent', 'flexible', 'remote work']
  }), []);

  // Generate topic suggestions
  const generateTopicSuggestions = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newSuggestions: TopicSuggestion[] = [];
      
      // Get industry-specific topics
      const industryKey = Object.keys(industryTopics).find(key => 
        industry?.toLowerCase().includes(key) || key.includes(industry?.toLowerCase() || '')
      ) || 'marketing';
      
      const availableTopics = industryTopics[industryKey] || industryTopics['marketing'];
      
      // Get audience modifiers
      const audienceKey = Object.keys(audienceModifiers).find(key =>
        audience?.toLowerCase().includes(key) || key.includes(audience?.toLowerCase() || '')
      );
      
      const modifiers = audienceKey ? audienceModifiers[audienceKey] : ['for professionals'];
      
      // Generate suggestions using different templates
      const usedTopics = new Set<string>();
      let suggestionCount = 0;
      
      topicTemplates.forEach(template => {
        if (suggestionCount >= 5) return;
        
        // Get random topics for this template
        const shuffledTopics = [...availableTopics].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(2, shuffledTopics.length) && suggestionCount < 5; i++) {
          const baseTopic = shuffledTopics[i];
          if (usedTopics.has(baseTopic)) continue;
          
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
          let generatedTopic = '';
          
          switch (template.id) {
            case 'how-to':
              generatedTopic = `How to ${baseTopic} ${modifier}`;
              break;
            case 'ultimate-guide':
              generatedTopic = `The Ultimate Guide to ${baseTopic} ${modifier}`;
              break;
            case 'ways-to':
              const number = [5, 7, 10, 15][Math.floor(Math.random() * 4)];
              generatedTopic = `${number} Ways to Improve Your ${baseTopic}`;
              break;
            case 'best-practices':
              generatedTopic = `Best Practices for ${baseTopic} ${modifier}`;
              break;
            case 'case-study':
              generatedTopic = `Case Study: How to Master ${baseTopic}`;
              break;
            default:
              generatedTopic = `${baseTopic} ${modifier}`;
          }
          
          // Clean up the topic
          generatedTopic = generatedTopic
            .replace(/\s+/g, ' ')
            .replace(/for for/g, 'for')
            .trim();
          
          newSuggestions.push({
            id: `${template.id}-${i}`,
            topic: generatedTopic,
            template: template.template,
            confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
            reason: `Popular ${template.template.toLowerCase()} format for ${industry || 'this industry'}`
          });
          
          usedTopics.add(baseTopic);
          suggestionCount++;
        }
      });
      
      // If we don't have enough suggestions, add some generic ones
      while (newSuggestions.length < 5) {
        const remainingTopics = availableTopics.filter(topic => !usedTopics.has(topic));
        if (remainingTopics.length === 0) break;
        
        const randomTopic = remainingTopics[Math.floor(Math.random() * remainingTopics.length)];
        const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        
        newSuggestions.push({
          id: `generic-${newSuggestions.length}`,
          topic: `Understanding ${randomTopic} ${randomModifier}`,
          template: 'General',
          confidence: Math.floor(Math.random() * 15) + 70, // 70-85% confidence
          reason: `Relevant to ${industry || 'your industry'} and ${audience || 'your audience'}`
        });
        
        usedTopics.add(randomTopic);
      }
      
      setSuggestions(newSuggestions.slice(0, 5));
      setIsLoading(false);
    }, 800);
  };

  // Generate suggestions when industry or audience changes
  useEffect(() => {
    if (industry || audience) {
      generateTopicSuggestions();
    }
  }, [industry, audience]);

  // Handle topic selection
  const handleTopicSelect = (suggestion: TopicSuggestion) => {
    onTopicSelect(suggestion.topic);
  };

  // Handle template filter
  const handleTemplateFilter = (templateId: string) => {
    setSelectedTemplate(templateId === selectedTemplate ? '' : templateId);
  };

  // Filter suggestions by template
  const filteredSuggestions = selectedTemplate 
    ? suggestions.filter(s => s.template.toLowerCase().includes(selectedTemplate.replace('-', ' ')))
    : suggestions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Topic Suggestions
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart topic ideas based on your industry and audience
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={generateTopicSuggestions}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Generate More
        </Button>
      </div>

      {/* Template Filters */}
      <div className="flex flex-wrap gap-2">
        {topicTemplates.map(template => (
          <Button
            key={template.id}
            variant={selectedTemplate === template.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleTemplateFilter(template.id)}
            className="flex items-center gap-1 text-xs"
          >
            {template.icon}
            {template.template}
          </Button>
        ))}
      </div>

      {/* Topic Suggestions */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="p-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            </Card>
          ))
        ) : filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion) => (
            <Card 
              key={suggestion.id} 
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                currentTopic === suggestion.topic 
                  ? 'border-l-primary bg-primary/5' 
                  : 'border-l-transparent hover:border-l-primary/50'
              }`}
              onClick={() => handleTopicSelect(suggestion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {suggestion.topic}
                    </h4>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full shrink-0">
                      {suggestion.template}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.confidence >= 90 ? 'bg-green-500' : 
                        suggestion.confidence >= 80 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}></div>
                      {suggestion.confidence}% match
                    </span>
                    <span>•</span>
                    <span className="truncate">{suggestion.reason}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTopicSelect(suggestion);
                  }}
                >
                  Select
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center">
            <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {industry || audience 
                ? 'No suggestions available. Try generating more topics.' 
                : 'Select an industry and audience to see topic suggestions.'
              }
            </p>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      {suggestions.length > 0 && !isLoading && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {suggestions.length} suggestions generated • 
          Average confidence: {Math.round(suggestions.reduce((acc, s) => acc + s.confidence, 0) / suggestions.length)}%
        </div>
      )}
    </div>
  );
};

export default TopicSuggestionEngine;
