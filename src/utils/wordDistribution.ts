/**
 * Shared word/character distribution utility
 * Calculates allocation for content structures based on user's total word or character count
 * Now supports localization, configurability, section flexibility, and error handling
 *
 * @param structureFormat - The content structure format key
 * @param totalCount - The total word or character count
 * @param options - Optional config: { useCharacters, includeImages, t, config }
 *   - useCharacters: boolean (default false, use words)
 *   - includeImages: boolean (default false)
 *   - t: translation function (key, defaultValue) => string
 *   - config: external config object for formats/sections
 * @returns Array of section objects with translation keys and counts
 */

export interface WordDistributionSection {
  id: string;
  nameKey: string; // translation key
  descriptionKey: string; // translation key
  percentage: number;
  min: number;
  estimated: number;
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'quote' | 'cta';
}

interface CalculateOptions {
  useCharacters?: boolean;
  includeImages?: boolean;
  t?: (key: string, defaultValue?: string) => string;
  config?: Record<string, any>;
}

export const calculateWordDistribution = (
  structureFormat: string,
  totalCount: number,
  options: CalculateOptions = {}
): WordDistributionSection[] => {
  const {
    useCharacters = false,
    includeImages = false,
    t = (k: string, d?: string) => d || k,
    config = undefined
  } = options;

  // Use external config if provided, else fallback to built-in
  const formatConfig = config?.[structureFormat] || getDefaultFormatConfig(structureFormat);
  if (!formatConfig) {
    // Unknown format fallback
    return [{
      id: '1',
      nameKey: 'structure.unknown',
      descriptionKey: 'structure.unknownDesc',
      percentage: 1.0,
      min: totalCount,
      estimated: totalCount,
      type: 'paragraph'
    }];
  }

  let remaining = totalCount;
  const sections: WordDistributionSection[] = [];

  // Helper for allocation
  const allocate = (percentage: number, min: number = 10): number => {
    const allocated = Math.max(Math.floor(remaining * percentage), min);
    remaining = Math.max(0, remaining - allocated);
    return allocated;
  };

  // Flexible section allocation
  for (const [i, section] of formatConfig.sections.entries()) {
    const pct = section.percentage;
    const min = section.min || 10;
    const est = allocate(pct, min);
    sections.push({
      id: String(i + 1),
      nameKey: section.nameKey,
      descriptionKey: section.descriptionKey,
      percentage: pct,
      min,
      estimated: est,
      type: section.type
    });
  }

  // If any remaining, add to last section
  if (remaining > 0 && sections.length > 0) {
    sections[sections.length - 1].estimated += remaining;
  }

  return sections;
};

// Default config for built-in formats (translation keys only)
function getDefaultFormatConfig(format: string) {
  switch (format) {
    case 'problem-solution-cta':
      // Alias to intro-points-cta for now
      format = 'intro-points-cta';
      // fallthrough
    case 'intro-points-cta':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.introductionDesc', percentage: 0.15, min: 50, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.mainPoint1', descriptionKey: 'step4.structure.sections.mainPoint1Desc', percentage: 0.25, min: 100, type: 'heading' },
          { nameKey: 'step4.structure.sections.mainPoint2', descriptionKey: 'step4.structure.sections.mainPoint2Desc', percentage: 0.25, min: 100, type: 'heading' },
          { nameKey: 'step4.structure.sections.mainPoint3', descriptionKey: 'step4.structure.sections.mainPoint3Desc', percentage: 0.25, min: 100, type: 'heading' },
          { nameKey: 'step4.structure.sections.callToAction', descriptionKey: 'step4.structure.sections.callToActionDesc', percentage: 0.1, min: 30, type: 'cta' }
        ]
      };
    case 'how-to-steps':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.howToIntroDesc', percentage: 0.15, min: 50, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.prerequisites', descriptionKey: 'step4.structure.sections.prerequisitesDesc', percentage: 0.1, min: 30, type: 'list' },
          { nameKey: 'step4.structure.sections.step1', descriptionKey: 'step4.structure.sections.step1Desc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.step2', descriptionKey: 'step4.structure.sections.step2Desc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.step3', descriptionKey: 'step4.structure.sections.step3Desc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.additionalSteps', descriptionKey: 'step4.structure.sections.additionalStepsDesc', percentage: 0.15, min: 30, type: 'list' },
          { nameKey: 'step4.structure.sections.conclusionTips', descriptionKey: 'step4.structure.sections.conclusionTipsDesc', percentage: 0.06, min: 30, type: 'paragraph' }
        ]
      };
    case 'faq-qa':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.topicOverviewDesc', percentage: 0.12, min: 40, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.question1Answer', descriptionKey: 'step4.structure.sections.question1AnswerDesc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.question2Answer', descriptionKey: 'step4.structure.sections.question2AnswerDesc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.question3Answer', descriptionKey: 'step4.structure.sections.question3AnswerDesc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.additionalQAs', descriptionKey: 'step4.structure.sections.additionalQAsDesc', percentage: 0.15, min: 30, type: 'list' },
          { nameKey: 'step4.structure.sections.conclusion', descriptionKey: 'step4.structure.sections.conclusionDesc', percentage: 0.1, min: 30, type: 'paragraph' }
        ]
      };
    case 'comparison-vs':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.comparisonIntroDesc', percentage: 0.15, min: 50, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.optionAOverview', descriptionKey: 'step4.structure.sections.optionAOverviewDesc', percentage: 0.2, min: 60, type: 'heading' },
          { nameKey: 'step4.structure.sections.optionBOverview', descriptionKey: 'step4.structure.sections.optionBOverviewDesc', percentage: 0.2, min: 60, type: 'heading' },
          { nameKey: 'step4.structure.sections.sideBySideComparison', descriptionKey: 'step4.structure.sections.sideBySideComparisonDesc', percentage: 0.25, min: 80, type: 'list' },
          { nameKey: 'step4.structure.sections.prosAndCons', descriptionKey: 'step4.structure.sections.prosAndConsDesc', percentage: 0.15, min: 40, type: 'list' },
          { nameKey: 'step4.structure.sections.recommendation', descriptionKey: 'step4.structure.sections.recommendationDesc', percentage: 0.1, min: 30, type: 'paragraph' }
        ]
      };
    case 'review-analysis':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.reviewIntroDesc', percentage: 0.12, min: 40, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.keyFeatures', descriptionKey: 'step4.structure.sections.keyFeaturesDesc', percentage: 0.22, min: 60, type: 'heading' },
          { nameKey: 'step4.structure.sections.pros', descriptionKey: 'step4.structure.sections.prosDesc', percentage: 0.18, min: 40, type: 'heading' },
          { nameKey: 'step4.structure.sections.cons', descriptionKey: 'step4.structure.sections.consDesc', percentage: 0.18, min: 40, type: 'heading' },
          { nameKey: 'step4.structure.sections.performanceAnalysis', descriptionKey: 'step4.structure.sections.performanceAnalysisDesc', percentage: 0.15, min: 40, type: 'heading' },
          { nameKey: 'step4.structure.sections.finalVerdict', descriptionKey: 'step4.structure.sections.finalVerdictDesc', percentage: 0.15, min: 30, type: 'paragraph' }
        ]
      };
    case 'case-study-detailed':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.caseStudyOverviewDesc', percentage: 0.1, min: 30, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.background', descriptionKey: 'step4.structure.sections.backgroundDesc', percentage: 0.18, min: 50, type: 'heading' },
          { nameKey: 'step4.structure.sections.challenge', descriptionKey: 'step4.structure.sections.challengeDesc', percentage: 0.22, min: 60, type: 'heading' },
          { nameKey: 'step4.structure.sections.solution', descriptionKey: 'step4.structure.sections.solutionDesc', percentage: 0.25, min: 70, type: 'heading' },
          { nameKey: 'step4.structure.sections.results', descriptionKey: 'step4.structure.sections.resultsDesc', percentage: 0.15, min: 40, type: 'heading' },
          { nameKey: 'step4.structure.sections.lessonsLearned', descriptionKey: 'step4.structure.sections.lessonsLearnedDesc', percentage: 0.1, min: 30, type: 'paragraph' }
        ]
      };
    case 'story-facts-lessons':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.openingStory', descriptionKey: 'step4.structure.sections.openingStoryDesc', percentage: 0.25, min: 60, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.keyFactsData', descriptionKey: 'step4.structure.sections.keyFactsDataDesc', percentage: 0.25, min: 60, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.analysis', descriptionKey: 'step4.structure.sections.analysisDesc', percentage: 0.25, min: 60, type: 'heading' },
          { nameKey: 'step4.structure.sections.lessonsLearned', descriptionKey: 'step4.structure.sections.lessonsLearnedDesc', percentage: 0.15, min: 40, type: 'heading' },
          { nameKey: 'step4.structure.sections.application', descriptionKey: 'step4.structure.sections.applicationDesc', percentage: 0.1, min: 30, type: 'cta' }
        ]
      };
    case 'listicle':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.introduction', descriptionKey: 'step4.structure.sections.listOverviewDesc', percentage: 0.1, min: 30, type: 'paragraph' },
          { nameKey: 'step4.structure.sections.point1', descriptionKey: 'step4.structure.sections.point1Desc', percentage: 0.18, min: 40, type: 'list' },
          { nameKey: 'step4.structure.sections.point2', descriptionKey: 'step4.structure.sections.point2Desc', percentage: 0.18, min: 40, type: 'list' },
          { nameKey: 'step4.structure.sections.point3', descriptionKey: 'step4.structure.sections.point3Desc', percentage: 0.18, min: 40, type: 'list' },
          { nameKey: 'step4.structure.sections.point4', descriptionKey: 'step4.structure.sections.point4Desc', percentage: 0.18, min: 40, type: 'list' },
          { nameKey: 'step4.structure.sections.point5', descriptionKey: 'step4.structure.sections.point5Desc', percentage: 0.18, min: 40, type: 'list' }
        ]
      };
    case 'custom':
      return {
        sections: [
          { nameKey: 'step4.structure.sections.customStructure', descriptionKey: 'step4.structure.sections.customStructureDesc', percentage: 1.0, min: 100, type: 'paragraph' }
        ]
      };
    default:
      return null;
  }
}

/**
 * Calculate total from a distribution (words or characters)
 */
export const getTotalFromDistribution = (sections: WordDistributionSection[]): number => {
  return sections.reduce((total, section) => total + section.estimated, 0);
};
