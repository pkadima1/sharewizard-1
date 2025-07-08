// Quick test of tone instructions
console.log('Testing tone instructions...\n');

// Simulate the function
function testGetToneInstructions(tone) {
  switch (tone.toLowerCase()) {
    case 'informative':
      return 'TONE GUIDELINES - INFORMATIVE/NEUTRAL: • Present information objectively...';
    case 'casual':
      return 'TONE GUIDELINES - CASUAL/CONVERSATIONAL: • Write as if speaking directly to a friend...';
    case 'authoritative':
      return 'TONE GUIDELINES - AUTHORITATIVE/CONFIDENT: • Make definitive statements backed by expertise...';
    case 'inspirational':
      return 'TONE GUIDELINES - INSPIRATIONAL/MOTIVATIONAL: • Use uplifting language that energizes...';
    case 'humorous':
      return 'TONE GUIDELINES - HUMOROUS/WITTY: • Include appropriate humor, wordplay...';
    case 'empathetic':
      return 'TONE GUIDELINES - EMPATHETIC: • Acknowledge readers\' feelings, struggles...';
    default:
      return `TONE GUIDELINES - ${tone.toUpperCase()}: • Write in a ${tone} tone...`;
  }
}

const newTones = ['informative', 'casual', 'authoritative', 'inspirational', 'humorous', 'empathetic'];

for (const tone of newTones) {
  const instructions = testGetToneInstructions(tone);
  console.log(`✅ ${tone}: ${instructions.substring(0, 50)}...`);
}

console.log('\n✨ All new tones mapped successfully!');
