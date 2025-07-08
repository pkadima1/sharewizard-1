export function getStructureFormatOptions(t) {
  return [
    {
      value: 'intro-points-cta',
      label: t('step4.structure.options.introPointsCta.label', 'Intro + 3 Main Points + CTA'),
      category: t('step4.structure.categories.classic', 'Classic'),
      icon: 'BookOpen',
      useCase: t('step4.structure.options.introPointsCta.useCase', 'General blog posts, thought leadership'),
      flow: t('step4.structure.options.introPointsCta.flow', 'Hook → Point 1 → Point 2 → Point 3 → Action'),
      difficulty: t('step4.structure.difficulty.easy', 'Easy'),
      seoScore: t('step4.structure.seoScore.high', 'High'),
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      sections: []
    },
    {
      value: 'problem-solution-cta',
      label: t('step4.structure.options.problemSolutionCta.label', 'Problem → Solution → Call to Action'),
      category: t('step4.structure.categories.business', 'Business'),
      icon: 'Lightbulb',
      useCase: t('step4.structure.options.problemSolutionCta.useCase', 'Sales content, service explanations'),
      flow: t('step4.structure.options.problemSolutionCta.flow', 'Problem → Impact → Solution → Steps → Action'),
      difficulty: t('step4.structure.difficulty.medium', 'Medium'),
      seoScore: t('step4.structure.seoScore.high', 'High'),
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      sections: []
    },
    {
      value: 'how-to-steps',
      label: t('step4.structure.options.howToSteps.label', 'How-To / Step-by-Step'),
      category: t('step4.structure.categories.tutorial', 'Tutorial'),
      icon: 'List',
      useCase: t('step4.structure.options.howToSteps.useCase', 'Tutorials, process guides, actionable posts'),
      flow: t('step4.structure.options.howToSteps.flow', 'Intro → Prerequisites → Step 1 → Step 2 → Step 3 → Tips'),
      difficulty: t('step4.structure.difficulty.easy', 'Easy'),
      seoScore: t('step4.structure.seoScore.veryHigh', 'Very High'),
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      sections: []
    },
    {
      value: 'faq-qa',
      label: t('step4.structure.options.faqQa.label', 'FAQ / Q&A Format'),
      category: t('step4.structure.categories.support', 'Support'),
      icon: 'HelpCircle',
      useCase: t('step4.structure.options.faqQa.useCase', 'SEO pages, product explanations, service overviews'),
      flow: t('step4.structure.options.faqQa.flow', 'Intro → Q1+A → Q2+A → Q3+A → More Q&As → Conclusion'),
      difficulty: t('step4.structure.difficulty.easy', 'Easy'),
      seoScore: t('step4.structure.seoScore.veryHigh', 'Very High'),
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      sections: []
    },
    {
      value: 'comparison-vs',
      label: t('step4.structure.options.comparisonVs.label', 'Comparison / vs.'),
      category: t('step4.structure.categories.analysis', 'Analysis'),
      icon: 'Scale',
      useCase: t('step4.structure.options.comparisonVs.useCase', 'Product comparisons, software alternatives, decision-making content'),
      flow: t('step4.structure.options.comparisonVs.flow', 'Intro → Option A → Option B → Side-by-Side → Pros/Cons → Recommendation'),
      difficulty: t('step4.structure.difficulty.medium', 'Medium'),
      seoScore: t('step4.structure.seoScore.high', 'High'),
      color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      sections: []
    },
    {
      value: 'review-analysis',
      label: t('step4.structure.options.reviewAnalysis.label', 'Review / Analysis'),
      category: t('step4.structure.categories.analysis', 'Analysis'),
      icon: 'Star',
      useCase: t('step4.structure.options.reviewAnalysis.useCase', 'Product reviews, service evaluations'),
      flow: t('step4.structure.options.reviewAnalysis.flow', 'Intro → Features → Pros → Cons → Performance → Verdict'),
      difficulty: t('step4.structure.difficulty.medium', 'Medium'),
      seoScore: t('step4.structure.seoScore.high', 'High'),
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      sections: []
    },
    {
      value: 'case-study-detailed',
      label: t('step4.structure.options.caseStudyDetailed.label', 'Case Study'),
      category: t('step4.structure.categories.business', 'Business'),
      icon: 'Briefcase',
      useCase: t('step4.structure.options.caseStudyDetailed.useCase', 'Showcasing client success stories'),
      flow: t('step4.structure.options.caseStudyDetailed.flow', 'Intro → Background → Challenge → Solution → Results → Lessons'),
      difficulty: t('step4.structure.difficulty.hard', 'Hard'),
      seoScore: t('step4.structure.seoScore.medium', 'Medium'),
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      sections: []
    },
    {
      value: 'story-facts-lessons',
      label: t('step4.structure.options.storyFactsLessons.label', 'Story + Facts + Lessons'),
      category: t('step4.structure.categories.narrative', 'Narrative'),
      icon: 'PenTool',
      useCase: t('step4.structure.options.storyFactsLessons.useCase', 'Engaging storytelling with data backing'),
      flow: t('step4.structure.options.storyFactsLessons.flow', 'Story → Facts → Analysis → Lessons → Application'),
      difficulty: t('step4.structure.difficulty.medium', 'Medium'),
      seoScore: t('step4.structure.seoScore.medium', 'Medium'),
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      sections: []
    },
    {
      value: 'listicle',
      label: t('step4.structure.options.listicle.label', 'Listicle (e.g. 5 ways to...)'),
      category: t('step4.structure.categories.classic', 'Classic'),
      icon: 'Zap',
      useCase: t('step4.structure.options.listicle.useCase', 'Social media friendly, quick consumption'),
      flow: t('step4.structure.options.listicle.flow', 'Intro → Point 1 → Point 2 → Point 3 → Point 4 → Point 5'),
      difficulty: t('step4.structure.difficulty.easy', 'Easy'),
      seoScore: t('step4.structure.seoScore.medium', 'Medium'),
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      sections: []
    },
    {
      value: 'custom',
      label: t('step4.structure.options.custom.label', 'Custom outline'),
      category: t('step4.structure.categories.advanced', 'Advanced'),
      icon: 'Users',
      useCase: t('step4.structure.options.custom.useCase', 'Unique content structures'),
      flow: t('step4.structure.options.custom.flow', 'Define your own flow'),
      difficulty: t('step4.structure.difficulty.hard', 'Hard'),
      seoScore: t('step4.structure.seoScore.variable', 'Variable'),
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      sections: []
    }
  ];
} 