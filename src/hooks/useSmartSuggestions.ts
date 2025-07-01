import { useState, useEffect } from 'react';

export interface SmartSuggestion {
  id: string;
  value: string;
  confidence: number; // 0-100 confidence score
  reason?: string;
}

export interface ContentStructure {
  id: string;
  name: string;
  description: string;
  template: string;
  suitableFor: string[];
}

export interface SmartSuggestionResult {
  suggestedKeywords: SmartSuggestion[];
  suggestedStructure: ContentStructure;
  suggestedTone: SmartSuggestion;
  isLoading: boolean;
}

interface FormData {
  topic?: string;
  industry?: string;
  audience?: string;
  contentType?: string;
  contentTone?: string;
  structureFormat?: string;
  keywords?: string[];
  [key: string]: any;
}

/**
 * Custom hook that provides smart content suggestions based on form data
 * @param formData - The current form data containing topic, industry, audience etc.
 * @returns Suggested keywords, structure and tone recommendations
 */
export function useSmartSuggestions(formData: FormData): SmartSuggestionResult {
  const [suggestedKeywords, setSuggestedKeywords] = useState<SmartSuggestion[]>([]);
  const [suggestedStructure, setSuggestedStructure] = useState<ContentStructure>({
    id: 'default',
    name: 'Standard Article',
    description: 'A well-structured article with introduction, body and conclusion',
    template: 'intro-body-conclusion',
    suitableFor: ['blog-article', 'guide']
  });
  const [suggestedTone, setSuggestedTone] = useState<SmartSuggestion>({
    id: 'professional',
    value: 'professional',
    confidence: 80,
    reason: 'Default professional tone works well for most content'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);

    // Short timeout to prevent UI blocking and simulate API call
    const timeoutId = setTimeout(() => {
      generateSuggestions();
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.topic, formData.industry, formData.audience, formData.contentType]);

  const generateSuggestions = () => {
    if (!formData) return;

    // Generate keywords based on topic & industry
    const keywords = generateKeywords();
    setSuggestedKeywords(keywords);

    // Determine best structure based on content type and industry
    const structure = determineStructure();
    setSuggestedStructure(structure);

    // Determine appropriate tone based on audience and content type
    const tone = determineTone();
    setSuggestedTone(tone);
  };

  const generateKeywords = (): SmartSuggestion[] => {
    const keywords: SmartSuggestion[] = [];
    const topic = formData.topic?.toLowerCase() || '';
    const industry = formData.industry?.toLowerCase() || '';
    const audience = formData.audience?.toLowerCase() || '';
    
    // Industry-specific keyword mappings
    const industryKeywords: Record<string, string[]> = {
      'marketing': ['content marketing', 'digital strategy', 'audience engagement', 'conversion', 'branding'],
      'technology': ['innovation', 'digital transformation', 'software', 'automation', 'integration'],
      'health': ['wellness', 'nutrition', 'fitness', 'healthcare', 'medical', 'benefits', 'wellbeing'],
      'finance': ['investment', 'budget', 'financial planning', 'savings', 'wealth'],
      'education': ['learning', 'students', 'curriculum', 'teaching', 'skills'],
      'coaching': ['personal development', 'growth', 'mindset', 'leadership', 'performance'],
      'e-commerce': ['online sales', 'customer experience', 'product', 'marketplace', 'conversion'],
      'food & cooking': ['recipe', 'cuisine', 'ingredients', 'cooking techniques', 'meal prep'],
      'fitness': ['workout', 'exercise', 'training', 'muscle', 'strength', 'cardio'],
      'beauty': ['skincare', 'makeup', 'cosmetics', 'beauty routine', 'products'],
      'fashion': ['style', 'trends', 'outfit', 'accessories', 'wardrobe'],
      'travel': ['destination', 'itinerary', 'vacation', 'adventure', 'tourism']
    };

    // Get industry-specific keywords
    const relevantIndustry = Object.keys(industryKeywords).find(key => 
      industry.includes(key) || key.includes(industry)) || 'marketing';
    
    // Extract potential keywords from topic
    let topicWords: string[] = [];
    if (topic) {
      topicWords = topic
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['with', 'and', 'that', 'this', 'from', 'your', 'about'].includes(word));
    }

    // Add industry-specific keywords
    const baseIndustryKeywords = industryKeywords[relevantIndustry] || industryKeywords['marketing'];
    baseIndustryKeywords.forEach(keyword => {
      // Check if keyword is relevant to the topic
      const relevanceScore = calculateRelevance(keyword, topic, industry);
      
      if (relevanceScore > 30) {
        keywords.push({
          id: keyword.replace(/\s+/g, '-'),
          value: keyword,
          confidence: relevanceScore,
          reason: `Common term in ${formData.industry || 'this'} industry`
        });
      }
    });

    // Add audience-specific keywords
    if (audience) {
      keywords.push({
        id: audience.replace(/\s+/g, '-'),
        value: audience,
        confidence: 85,
        reason: 'Matches your target audience'
      });
    }

    // Add topic-derived keywords
    topicWords.forEach(word => {
      // Don't add duplicates
      if (!keywords.some(k => k.value.includes(word))) {
        keywords.push({
          id: word.replace(/\s+/g, '-'),
          value: word,
          confidence: 75,
          reason: 'Extracted from your topic'
        });
      }
    });

    // Ensure we have at least 5 keywords by adding generic ones
    if (keywords.length < 5 && relevantIndustry) {
      const genericKeywords = industryKeywords[relevantIndustry] || [];
      
      genericKeywords.forEach(keyword => {
        if (keywords.length < 5 && !keywords.some(k => k.value === keyword)) {
          keywords.push({
            id: keyword.replace(/\s+/g, '-'),
            value: keyword,
            confidence: 60,
            reason: `Popular in ${formData.industry || 'this'} industry`
          });
        }
      });
    }

    // Sort by confidence
    return keywords.sort((a, b) => b.confidence - a.confidence);
  };

  const determineStructure = (): ContentStructure => {
    const contentType = formData.contentType?.toLowerCase() || '';
    const audience = formData.audience?.toLowerCase() || '';
    const industry = formData.industry?.toLowerCase() || '';
    
    // Define content structures
    const structures: ContentStructure[] = [
      {
        id: 'intro-points-cta',
        name: 'Introduction + Main Points + CTA',
        description: 'Classic structure with a clear introduction, key points, and a strong call-to-action',
        template: 'intro-points-cta',
        suitableFor: ['blog-article', 'newsletter', 'guide']
      },
      {
        id: 'problem-solution',
        name: 'Problem → Solution → Call to Action',
        description: 'Presents a problem, offers a solution, and encourages action',
        template: 'problem-solution-cta',
        suitableFor: ['case-study', 'thought-piece', 'blog-article']
      },
      {
        id: 'story-lessons',
        name: 'Story + Facts + Lessons',
        description: 'Narrative approach that presents a story, backs it with facts, and extracts lessons',
        template: 'story-facts-lessons',
        suitableFor: ['case-study', 'thought-piece', 'newsletter']
      },
      {
        id: 'listicle',
        name: 'Listicle Format',
        description: 'Organized as a numbered list of items, tips, or concepts',
        template: 'listicle',
        suitableFor: ['blog-article', 'guide', 'tutorial']
      },
      {
        id: 'tutorial',
        name: 'Step-by-Step Guide',
        description: 'Clear steps with detailed instructions for achieving a specific outcome',
        template: 'how-to-step-by-step',
        suitableFor: ['tutorial', 'guide', 'how-to']
      },
      {
        id: 'faq',
        name: 'FAQ / Q&A Format',
        description: 'Question and answer format for addressing common concerns',
        template: 'faq-qa',
        suitableFor: ['guide', 'support', 'educational']
      },
      {
        id: 'comparison',
        name: 'Comparison Analysis',
        description: 'Side-by-side analysis of different options or alternatives',
        template: 'comparison-vs',
        suitableFor: ['review', 'analysis', 'guide']
      },
      {
        id: 'review',
        name: 'Review / Analysis',
        description: 'Comprehensive evaluation with pros, cons, and final verdict',
        template: 'review-analysis',
        suitableFor: ['review', 'evaluation', 'analysis']
      },
      {
        id: 'case-study',
        name: 'Case Study',
        description: 'Real-world example showing challenge, solution, and results',
        template: 'case-study',
        suitableFor: ['case-study', 'success-story', 'business']
      }
    ];
    
    // Match content type to appropriate structure
    const matchingStructures = structures.filter(structure => {
      if (!contentType) return true; // No content type specified
      return structure.suitableFor.some(type => contentType.includes(type));
    });
    
    if (matchingStructures.length > 0) {
      // Find the best match based on content type
      if (contentType.includes('tutorial') || contentType.includes('guide')) {
        return structures.find(s => s.id === 'tutorial') || matchingStructures[0];
      } 
      
      if (contentType.includes('case-study')) {
        return structures.find(s => s.id === 'case-study') || matchingStructures[0];
      }

      if (contentType.includes('review') || contentType.includes('analysis')) {
        return structures.find(s => s.id === 'review') || matchingStructures[0];
      }

      if (contentType.includes('comparison') || (formData.topic && (formData.topic.toLowerCase().includes('vs') || formData.topic.toLowerCase().includes('versus')))) {
        return structures.find(s => s.id === 'comparison') || matchingStructures[0];
      }

      if ((formData.topic && (formData.topic.toLowerCase().includes('faq') || formData.topic.toLowerCase().includes('questions')))) {
        return structures.find(s => s.id === 'faq') || matchingStructures[0];
      }
      
      if (industry === 'marketing' || industry === 'business') {
        return structures.find(s => s.id === 'intro-points-cta') || matchingStructures[0];
      }
      
      return matchingStructures[0];
    }
    
    // Default structure
    return structures[0];
  };

  const determineTone = (): SmartSuggestion => {
    const contentType = formData.contentType?.toLowerCase() || '';
    const audience = formData.audience?.toLowerCase() || '';
    const industry = formData.industry?.toLowerCase() || '';
    const topic = formData.topic?.toLowerCase() || '';
    
    // Define tone options with all new tones
    const tones = [
      {
        id: 'professional',
        value: 'professional',
        confidence: 80,
        reason: 'Formal and business-like approach suitable for most content'
      },
      {
        id: 'casual',
        value: 'casual',
        confidence: 75,
        reason: 'Relaxed and friendly tone for more approachable content'
      },
      {
        id: 'informative',
        value: 'informative',
        confidence: 85,
        reason: 'Objective and balanced for factual, encyclopedic content'
      },
      {
        id: 'authoritative',
        value: 'authoritative',
        confidence: 85,
        reason: 'Strong leadership voice for white papers and B2B content'
      },
      {
        id: 'inspirational',
        value: 'inspirational',
        confidence: 70,
        reason: 'Motivating and uplifting tone ideal for coaching content'
      },
      {
        id: 'humorous',
        value: 'humorous',
        confidence: 60,
        reason: 'Fun and entertaining style great for social posts'
      },
      {
        id: 'empathetic',
        value: 'empathetic',
        confidence: 80,
        reason: 'Warm and understanding for sensitive topics'
      },
      {
        id: 'friendly',
        value: 'friendly',
        confidence: 75,
        reason: 'Approachable and conversational tone'
      },
      {
        id: 'expert',
        value: 'expert',
        confidence: 85,
        reason: 'Technical and detailed for specialized content'
      },
      {
        id: 'persuasive',
        value: 'persuasive',
        confidence: 70,
        reason: 'Convincing and compelling tone that drives decisions'
      },
      {
        id: 'thought-provoking',
        value: 'thought-provoking',
        confidence: 65,
        reason: 'Challenging and reflective for deep insights'
      }
    ];
    
    // Topic-based tone suggestions
    if (topic.includes('health') || topic.includes('mental') || topic.includes('wellness')) {
      return tones.find(t => t.id === 'empathetic') || tones[0];
    }
    
    if (topic.includes('faq') || topic.includes('guide') || topic.includes('tutorial')) {
      return tones.find(t => t.id === 'informative') || tones[0];
    }

    if (topic.includes('review') || topic.includes('comparison')) {
      return tones.find(t => t.id === 'authoritative') || tones[0];
    }
    
    // Match audience to appropriate tone
    if (audience) {
      if (audience.includes('beginners') || audience.includes('students')) {
        return tones.find(t => t.id === 'friendly') || tones[0];
      }
      
      if (audience.includes('professionals') || audience.includes('executives')) {
        return tones.find(t => t.id === 'professional') || tones[0];
      }
      
      if (audience.includes('millennials') || audience.includes('gen z')) {
        return tones.find(t => t.id === 'casual') || tones[0];
      }
      
      if (audience.includes('entrepreneurs') || audience.includes('small business')) {
        return tones.find(t => t.id === 'inspirational') || tones[0];
      }

      if (audience.includes('tech') || audience.includes('developers')) {
        return tones.find(t => t.id === 'informative') || tones[0];
      }
    }
    
    // Match industry to appropriate tone
    if (industry) {
      if (industry.includes('finance') || industry.includes('legal') || industry.includes('consulting')) {
        return tones.find(t => t.id === 'authoritative') || tones[0];
      }
      
      if (industry.includes('health') || industry.includes('mental health') || industry.includes('counseling')) {
        return tones.find(t => t.id === 'empathetic') || tones[0];
      }
      
      if (industry.includes('education') || industry.includes('training')) {
        return tones.find(t => t.id === 'informative') || tones[0];
      }
      
      if (industry.includes('entertainment') || industry.includes('gaming') || industry.includes('creative')) {
        return tones.find(t => t.id === 'humorous') || tones[0];
      }
      
      if (industry.includes('coaching') || industry.includes('fitness') || industry.includes('wellness')) {
        return tones.find(t => t.id === 'inspirational') || tones[0];
      }
      
      if (industry.includes('marketing') || industry.includes('e-commerce') || industry.includes('sales')) {
        return tones.find(t => t.id === 'persuasive') || tones[0];
      }

      if (industry.includes('technology') || industry.includes('software') || industry.includes('saas')) {
        return tones.find(t => t.id === 'professional') || tones[0];
      }
    }
    
    // Match content type to appropriate tone
    if (contentType) {
      if (contentType.includes('tutorial') || contentType.includes('guide') || contentType.includes('faq')) {
        return tones.find(t => t.id === 'informative') || tones[0];
      }
      
      if (contentType.includes('case-study') || contentType.includes('review')) {
        return tones.find(t => t.id === 'authoritative') || tones[0];
      }
      
      if (contentType.includes('thought-piece')) {
        return tones.find(t => t.id === 'thought-provoking') || tones[0];
      }

      if (contentType.includes('newsletter')) {
        return tones.find(t => t.id === 'friendly') || tones[0];
      }
    }
    
    // Default to professional
    return tones[0];
  };

  // Helper function to calculate relevance score
  const calculateRelevance = (keyword: string, topic: string, industry: string): number => {
    let score = 50; // Base score
    
    if (!topic) return score;
    
    // Direct match in topic
    if (topic.toLowerCase().includes(keyword.toLowerCase())) {
      score += 30;
    }
    
    // Check for partial word matches
    const words = keyword.toLowerCase().split(' ');
    let matchCount = 0;
    
    words.forEach(word => {
      if (word.length > 3 && topic.toLowerCase().includes(word)) {
        matchCount++;
      }
    });
    
    // Adjust score based on partial matches
    if (matchCount > 0) {
      score += (matchCount / words.length) * 20;
    }
    
    // Industry relevance
    if (industry && keyword.toLowerCase().includes(industry.toLowerCase())) {
      score += 15;
    }
    
    return Math.min(score, 100); // Cap at 100
  };

  return {
    suggestedKeywords,
    suggestedStructure,
    suggestedTone,
    isLoading
  };
}