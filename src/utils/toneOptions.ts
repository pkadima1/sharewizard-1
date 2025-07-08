export function getToneOptions(t) {
  return [
    { value: 'friendly', label: t('step4.tone.options.friendly', 'Friendly') },
    { value: 'professional', label: t('step4.tone.options.professional', 'Professional') },
    { value: 'thought-provoking', label: t('step4.tone.options.thoughtProvoking', 'Thought-Provoking') },
    { value: 'expert', label: t('step4.tone.options.expert', 'Expert') },
    { value: 'persuasive', label: t('step4.tone.options.persuasive', 'Persuasive') },
    { value: 'informative', label: t('step4.tone.options.informative', 'Informative / Neutral') },
    { value: 'casual', label: t('step4.tone.options.casual', 'Casual / Conversational') },
    { value: 'authoritative', label: t('step4.tone.options.authoritative', 'Authoritative / Confident') },
    { value: 'inspirational', label: t('step4.tone.options.inspirational', 'Inspirational / Motivational') },
    { value: 'humorous', label: t('step4.tone.options.humorous', 'Humorous / Witty') },
    { value: 'empathetic', label: t('step4.tone.options.empathetic', 'Empathetic') }
  ];
} 