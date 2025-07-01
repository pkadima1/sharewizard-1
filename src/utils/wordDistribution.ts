/**
 * Shared word distribution utility
 * Calculates word allocation for content structures based on user's total word count
 */

export interface WordDistributionSection {
  id: string;
  name: string;
  description: string;
  percentage: number;
  minWords: number;
  estimatedWords: number;
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'quote' | 'cta';
}

/**
 * Calculate word distribution for different content structure formats
 */
export const calculateWordDistribution = (
  structureFormat: string,
  totalWordCount: number,
  includeImages: boolean = false
): WordDistributionSection[] => {
  let remainingWords = totalWordCount;
  const sections: WordDistributionSection[] = [];

  // Helper function to allocate words and track remaining
  const allocateWords = (percentage: number, minWords: number = 10): number => {
    const allocated = Math.max(Math.floor(remainingWords * percentage), minWords);
    remainingWords = Math.max(0, remainingWords - allocated);
    return allocated;
  };

  switch (structureFormat) {
    case 'intro-points-cta':
      sections.push(
        {
          id: '1',
          name: 'Introduction',
          description: 'Hook and overview',
          percentage: 0.15,
          minWords: 50,
          estimatedWords: allocateWords(0.15, 50),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Main Point 1',
          description: 'First key concept',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Main Point 2',
          description: 'Second key concept',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Main Point 3',
          description: 'Third key concept',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Call to Action',
          description: 'Clear next step',
          percentage: 0.1,
          minWords: 30,
          estimatedWords: Math.max(remainingWords, 30),
          type: 'cta'
        }
      );
      break;

    case 'problem-solution-cta':
      sections.push(
        {
          id: '1',
          name: 'Problem Identification',
          description: 'Define the challenge',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '2',
          name: 'Impact & Consequences',
          description: 'Why it matters',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'paragraph'
        },
        {
          id: '3',
          name: 'Solution Overview',
          description: 'Your approach',
          percentage: 0.3,
          minWords: 120,
          estimatedWords: allocateWords(0.3, 120),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Implementation Steps',
          description: 'How to apply',
          percentage: 0.15,
          minWords: 80,
          estimatedWords: allocateWords(0.15, 80),
          type: 'list'
        },
        {
          id: '5',
          name: 'Call to Action',
          description: 'Next steps',
          percentage: 0.1,
          minWords: 30,
          estimatedWords: Math.max(remainingWords, 30),
          type: 'cta'
        }
      );
      break;

    case 'listicle':
      const numListItems = 7;
      const introWords = allocateWords(0.1, 50);
      const wordsPerItem = Math.floor((remainingWords - 50) / numListItems);
      
      sections.push({
        id: '1',
        name: 'Introduction',
        description: 'List overview',
        percentage: 0.1,
        minWords: 50,
        estimatedWords: introWords,
        type: 'paragraph'
      });

      for (let i = 1; i <= numListItems; i++) {
        const itemWords = Math.min(wordsPerItem, remainingWords);
        remainingWords = Math.max(0, remainingWords - itemWords);
        
        sections.push({
          id: `item-${i}`,
          name: `Point ${i}`,
          description: `List item #${i}`,
          percentage: wordsPerItem / totalWordCount,
          minWords: 50,
          estimatedWords: itemWords,
          type: 'list'
        });
      }

      sections.push({
        id: 'conclusion',
        name: 'Conclusion',
        description: 'Clear next step',
        percentage: 0.1,
        minWords: 30,
        estimatedWords: Math.max(remainingWords, 30),
        type: 'cta'
      });
      break;

    case 'how-to-step-by-step':
      sections.push(
        {
          id: '1',
          name: 'What You\'ll Learn',
          description: 'Process overview',
          percentage: 0.1,
          minWords: 50,
          estimatedWords: allocateWords(0.1, 50),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Step 1',
          description: 'First step',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Step 2',
          description: 'Second step',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Step 3',
          description: 'Third step',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Step 4',
          description: 'Fourth step',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '6',
          name: 'Next Steps',
          description: 'Clear next steps',
          percentage: 0.1,
          minWords: 30,
          estimatedWords: Math.max(remainingWords, 30),
          type: 'cta'
        }
      );
      break;

    case 'faq-qa':
      const numQuestions = Math.min(7, Math.max(3, Math.floor(totalWordCount / 100)));
      const introWordsFAQ = allocateWords(0.1, 50);
      const wordsPerQuestionFAQ = Math.floor((remainingWords - 50) / numQuestions);

      sections.push({
        id: '1',
        name: 'Introduction',
        description: 'FAQ overview',
        percentage: 0.1,
        minWords: 50,
        estimatedWords: introWordsFAQ,
        type: 'paragraph'
      });

      for (let i = 1; i <= numQuestions; i++) {
        const qWords = Math.min(wordsPerQuestionFAQ, remainingWords);
        remainingWords = Math.max(0, remainingWords - qWords);
        
        sections.push({
          id: `faq-${i}`,
          name: `Question ${i}`,
          description: 'FAQ question and answer',
          percentage: qWords / totalWordCount,
          minWords: 50,
          estimatedWords: qWords,
          type: 'heading'
        });
      }

      sections.push({
        id: 'conclusion',
        name: 'Still Have Questions?',
        description: 'Summary and resources',
        percentage: 0.05,
        minWords: 30,
        estimatedWords: Math.max(remainingWords, 30),
        type: 'paragraph'
      });
      break;

    case 'story-facts-lessons':
      sections.push(
        {
          id: '1',
          name: 'Opening Story',
          description: 'Engaging narrative',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Key Facts & Data',
          description: 'Supporting evidence',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'paragraph'
        },
        {
          id: '3',
          name: 'Analysis',
          description: 'What it means',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Lessons Learned',
          description: 'Key takeaways',
          percentage: 0.15,
          minWords: 80,
          estimatedWords: allocateWords(0.15, 80),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Application',
          description: 'How to use',
          percentage: 0.1,
          minWords: 30,
          estimatedWords: Math.max(remainingWords, 30),
          type: 'cta'
        }
      );
      break;

    case 'comparison-vs':
      sections.push(
        {
          id: '1',
          name: 'Comparison Overview',
          description: 'What being compared',
          percentage: 0.15,
          minWords: 60,
          estimatedWords: allocateWords(0.15, 60),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Option A',
          description: 'First option',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Option B',
          description: 'Second option',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Side by Side',
          description: 'Direct comparison',
          percentage: 0.25,
          minWords: 100,
          estimatedWords: allocateWords(0.25, 100),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Recommendation',
          description: 'Best choice',
          percentage: 0.1,
          minWords: 50,
          estimatedWords: Math.max(remainingWords, 50),
          type: 'paragraph'
        }
      );
      break;

    case 'review-analysis':
      sections.push(
        {
          id: '1',
          name: 'Overview',
          description: 'Subject introduction',
          percentage: 0.12,
          minWords: 50,
          estimatedWords: allocateWords(0.12, 50),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Key Features',
          description: 'Main features',
          percentage: 0.22,
          minWords: 80,
          estimatedWords: allocateWords(0.22, 80),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Pros',
          description: 'Strengths',
          percentage: 0.18,
          minWords: 70,
          estimatedWords: allocateWords(0.18, 70),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Cons',
          description: 'Weaknesses',
          percentage: 0.18,
          minWords: 70,
          estimatedWords: allocateWords(0.18, 70),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Pricing & Value',
          description: 'Cost analysis',
          percentage: 0.15,
          minWords: 60,
          estimatedWords: allocateWords(0.15, 60),
          type: 'heading'
        },
        {
          id: '6',
          name: 'Final Verdict',
          description: 'Recommendation',
          percentage: 0.15,
          minWords: 50,
          estimatedWords: Math.max(remainingWords, 50),
          type: 'paragraph'
        }
      );
      break;

    case 'case-study':
      sections.push(
        {
          id: '1',
          name: 'Executive Summary',
          description: 'Brief overview',
          percentage: 0.1,
          minWords: 40,
          estimatedWords: allocateWords(0.1, 40),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Background',
          description: 'Client context',
          percentage: 0.18,
          minWords: 80,
          estimatedWords: allocateWords(0.18, 80),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Challenge',
          description: 'Problem statement',
          percentage: 0.22,
          minWords: 100,
          estimatedWords: allocateWords(0.22, 100),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Solution',
          description: 'Approach used',
          percentage: 0.25,
          minWords: 120,
          estimatedWords: allocateWords(0.25, 120),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Results',
          description: 'Outcomes achieved',
          percentage: 0.15,
          minWords: 70,
          estimatedWords: allocateWords(0.15, 70),
          type: 'heading'
        },
        {
          id: '6',
          name: 'Lessons Learned',
          description: 'Key insights',
          percentage: 0.1,
          minWords: 40,
          estimatedWords: Math.max(remainingWords, 40),
          type: 'paragraph'
        }
      );
      break;

    case 'custom':
      // For custom structures, allocate all words to a single section
      sections.push({
        id: '1',
        name: 'Custom Structure',
        description: 'Define your own sections',
        percentage: 1.0,
        minWords: totalWordCount,
        estimatedWords: totalWordCount,
        type: 'paragraph'
      });
      break;

    default: // article or other formats
      sections.push(
        {
          id: '1',
          name: 'Introduction',
          description: 'Subject introduction',
          percentage: 0.15,
          minWords: 50,
          estimatedWords: allocateWords(0.15, 50),
          type: 'paragraph'
        },
        {
          id: '2',
          name: 'Background',
          description: 'Context and background',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '3',
          name: 'Key Features',
          description: 'Main features and benefits',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '4',
          name: 'Approach Used',
          description: 'Methodology and approach',
          percentage: 0.2,
          minWords: 80,
          estimatedWords: allocateWords(0.2, 80),
          type: 'heading'
        },
        {
          id: '5',
          name: 'Best Choice',
          description: 'Recommendations',
          percentage: 0.15,
          minWords: 60,
          estimatedWords: allocateWords(0.15, 60),
          type: 'heading'
        },
        {
          id: '6',
          name: 'Conclusion',
          description: 'Summary and takeaways',
          percentage: 0.1,
          minWords: 30,
          estimatedWords: Math.max(remainingWords, 30),
          type: 'paragraph'
        }
      );
      break;
  }

  return sections;
};

/**
 * Calculate total words from a distribution
 */
export const getTotalWordsFromDistribution = (sections: WordDistributionSection[]): number => {
  return sections.reduce((total, section) => total + section.estimatedWords, 0);
};
