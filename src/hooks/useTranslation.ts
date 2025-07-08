/**
 * Translation utility for content structure components
 * Basic implementation that can be extended with react-i18next or similar
 */

import enTranslations from '../locales/en.json';

type TranslationPath = string;

// Basic translation function - can be replaced with i18n library
export const useTranslation = () => {
  const t = (path: TranslationPath, defaultValue?: string): string => {
    const keys = path.split('.');
    let value: any = enTranslations;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return defaultValue || path;
      }
    }
    
    return typeof value === 'string' ? value : defaultValue || path;
  };

  return { t };
};

// Content structure translation keys
export const CONTENT_STRUCTURE_KEYS = {
  HOW_TO_STEPS: 'contentStructures.howToSteps',
  FAQ_QA: 'contentStructures.faqQa',
  COMPARISON_VS: 'contentStructures.comparisonVs',
  REVIEW_ANALYSIS: 'contentStructures.reviewAnalysis',
  CASE_STUDY_DETAILED: 'contentStructures.caseStudyDetailed',
} as const;

// Reading level translation keys
export const READING_LEVEL_KEYS = {
  BEGINNER: 'readingLevels.beginner',
  INTERMEDIATE: 'readingLevels.intermediate',
  ADVANCED: 'readingLevels.advanced',
} as const;

// Format option translation keys
export const FORMAT_OPTION_KEYS = {
  MARKDOWN: 'formatOptions.markdown',
  HTML: 'formatOptions.html',
  GDOCS: 'formatOptions.gdocs',
} as const;

// Content generation translation keys
export const CONTENT_GENERATION_KEYS = {
  PLAGIARISM_CHECK: 'contentGeneration.plagiarismCheck',
  PLAGIARISM_CHECK_DESC: 'contentGeneration.plagiarismCheckDescription',
  INCLUDE_IMAGES: 'contentGeneration.includeImages',
  INCLUDE_IMAGES_DESC: 'contentGeneration.includeImagesDescription',
  ESTIMATED_TIME: 'contentGeneration.estimatedTime',
  BASED_ON_COMPLEXITY: 'contentGeneration.basedOnComplexity',
  GENERATION_FEATURES: 'contentGeneration.generationFeatures',
} as const;
