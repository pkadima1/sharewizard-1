/**
 * Test new tone instructions implementation
 * Validates that all tone options map to proper instructions
 */

const tones = [
  'friendly',
  'professional', 
  'thoughtProvoking',
  'expert',
  'persuasive',
  'informative',
  'casual',
  'authoritative', 
  'inspirational',
  'humorous',
  'empathetic'
];

/**
 * Maps tone selection to detailed AI generation instructions
 * (Copy of function from longformContent.ts for testing)
 */
const getToneInstructions = (tone) => {
  switch (tone.toLowerCase()) {
    case 'friendly':
      return `
TONE GUIDELINES - FRIENDLY:
• Use warm, approachable language that feels like a conversation with a trusted friend
• Include personal touches and relatable examples from everyday life
• Ask rhetorical questions to engage readers and create dialogue
• Use "you" frequently to create direct connection
• Share experiences and insights in a personal way
• Maintain optimism and positivity throughout
• Use contractions and casual language where appropriate
• Include encouraging phrases and supportive language
• Make complex topics feel accessible and non-intimidating`;

    case 'professional':
      return `
TONE GUIDELINES - PROFESSIONAL:
• Maintain formal, authoritative language appropriate for business contexts
• Use industry-standard terminology and proper business etiquette
• Structure content with clear, logical progression
• Support statements with credible sources and data
• Avoid overly casual expressions or slang
• Use third-person perspective when appropriate
• Include executive summaries and key takeaways
• Maintain objectivity while providing expert insights
• Present information in a polished, corporate-appropriate manner`;

    case 'thoughtprovoking':
    case 'thought-provoking':
      return `
TONE GUIDELINES - THOUGHT-PROVOKING:
• Challenge conventional thinking and present new perspectives
• Ask deep, meaningful questions that encourage reflection
• Present contrasting viewpoints and explore nuances
• Use thought experiments and hypothetical scenarios
• Connect ideas across different domains and disciplines
• Encourage critical thinking and self-examination
• Present complex concepts that require mental engagement
• Use philosophical approaches and broader implications
• Inspire readers to reconsider their assumptions and beliefs`;

    case 'expert':
      return `
TONE GUIDELINES - EXPERT:
• Demonstrate deep, specialized knowledge and years of experience
• Use technical terminology appropriately with clear explanations
• Share insider knowledge and industry secrets
• Reference specific methodologies, frameworks, and best practices
• Include detailed analysis and sophisticated insights
• Cite authoritative sources and recent research
• Provide advanced strategies beyond basic advice
• Show mastery through nuanced understanding of complex topics
• Offer strategic perspectives that only experienced professionals would know`;

    case 'persuasive':
      return `
TONE GUIDELINES - PERSUASIVE:
• Build compelling arguments using logical reasoning and emotional appeal
• Use social proof, testimonials, and success stories
• Address objections and counterarguments proactively
• Create urgency and emphasize benefits clearly
• Use powerful action words and decisive language
• Structure arguments with strong opening and closing statements
• Include specific examples and case studies as evidence
• Appeal to readers' desires, fears, and aspirations
• Guide readers toward a specific conclusion or action`;

    case 'informative':
    case 'informative/neutral':
    case 'neutral':
      return `
TONE GUIDELINES - INFORMATIVE/NEUTRAL:
• Present information objectively without bias or personal opinion
• Use clear, straightforward language that's easy to understand
• Focus on facts, data, and verifiable information
• Organize content logically with clear headings and structure
• Provide balanced coverage of different aspects or viewpoints
• Use examples and analogies to clarify complex concepts
• Maintain educational focus without trying to persuade
• Include relevant statistics and research findings
• Write in an accessible style suitable for general audiences`;

    case 'casual':
    case 'casual/conversational':
    case 'conversational':
      return `
TONE GUIDELINES - CASUAL/CONVERSATIONAL:
• Write as if speaking directly to a friend over coffee
• Use everyday language, contractions, and natural speech patterns
• Include personal anecdotes and relatable stories
• Use humor, pop culture references, and current trends
• Break complex ideas into bite-sized, digestible pieces
• Include rhetorical questions and direct reader engagement
• Use shorter sentences and paragraphs for easy reading
• Add personality and authentic voice throughout
• Make content feel effortless and enjoyable to read`;

    case 'authoritative':
    case 'authoritative/confident':
    case 'confident':
      return `
TONE GUIDELINES - AUTHORITATIVE/CONFIDENT:
• Make definitive statements backed by expertise and evidence
• Use commanding language that demonstrates leadership
• Present information with unwavering confidence and clarity
• Establish credibility through demonstrated knowledge and experience
• Use assertive statements rather than tentative suggestions
• Include specific metrics, results, and proven outcomes
• Take clear positions on controversial or debated topics
• Show mastery through comprehensive understanding
• Guide readers with confidence and decisive recommendations`;

    case 'inspirational':
    case 'inspirational/motivational':
    case 'motivational':
      return `
TONE GUIDELINES - INSPIRATIONAL/MOTIVATIONAL:
• Use uplifting language that energizes and motivates action
• Share success stories and transformation examples
• Focus on possibilities, potential, and positive outcomes
• Include calls to action that inspire immediate steps
• Use empowering language that builds confidence
• Address challenges as opportunities for growth
• Create vision of better future and achievable goals
• Include motivational quotes and inspiring examples
• End sections with encouraging and actionable insights`;

    case 'humorous':
    case 'humorous/witty':
    case 'witty':
      return `
TONE GUIDELINES - HUMOROUS/WITTY:
• Include appropriate humor, wordplay, and clever observations
• Use funny analogies and entertaining examples
• Make light of common frustrations and shared experiences
• Include witty one-liners and amusing anecdotes
• Use self-deprecating humor when appropriate
• Keep humor relevant to the topic and audience
• Balance entertainment with valuable information
• Use unexpected comparisons and creative metaphors
• Maintain professionalism while being entertaining`;

    case 'empathetic':
      return `
TONE GUIDELINES - EMPATHETIC:
• Acknowledge readers' feelings, struggles, and challenges
• Use understanding and compassionate language
• Validate emotions and experiences without judgment
• Share relatable stories of overcoming difficulties
• Offer support and encouragement throughout content
• Use inclusive language that makes everyone feel welcome
• Address common pain points with sensitivity
• Provide comfort and reassurance alongside practical advice
• Show genuine care for readers' wellbeing and success`;

    default:
      return `
TONE GUIDELINES - ${tone.toUpperCase()}:
• Write in a ${tone} tone that resonates with your target audience
• Maintain consistency throughout the content
• Use language appropriate for the selected tone
• Ensure the tone enhances rather than distracts from the message`;
  }
};

console.log('🧪 Testing Tone Instructions Mapping...\n');

// Test all defined tones
for (const tone of tones) {
  console.log(`🎯 Testing tone: "${tone}"`);
  const instructions = getToneInstructions(tone);
  
  if (instructions.includes(`TONE GUIDELINES - ${tone.toUpperCase()}`)) {
    console.log(`✅ ${tone}: Specific instructions found`);
  } else {
    console.log(`❌ ${tone}: Using default/generic instructions`);
  }
  
  // Check if instructions are comprehensive (more than 100 characters)
  if (instructions.length > 100) {
    console.log(`✅ ${tone}: Comprehensive instructions (${instructions.length} chars)`);
  } else {
    console.log(`⚠️  ${tone}: Instructions might be too brief (${instructions.length} chars)`);
  }
  
  console.log('---');
}

// Test specific variations and aliases
console.log('\n🔄 Testing tone variations and aliases...');

const variations = [
  { input: 'informative/neutral', expected: 'INFORMATIVE/NEUTRAL' },
  { input: 'casual/conversational', expected: 'CASUAL/CONVERSATIONAL' },
  { input: 'authoritative/confident', expected: 'AUTHORITATIVE/CONFIDENT' },
  { input: 'inspirational/motivational', expected: 'INSPIRATIONAL/MOTIVATIONAL' },
  { input: 'humorous/witty', expected: 'HUMOROUS/WITTY' },
  { input: 'thoughtprovoking', expected: 'THOUGHT-PROVOKING' },
  { input: 'thought-provoking', expected: 'THOUGHT-PROVOKING' }
];

for (const { input, expected } of variations) {
  const instructions = getToneInstructions(input);
  if (instructions.includes(`TONE GUIDELINES - ${expected}`)) {
    console.log(`✅ "${input}" → Mapped to ${expected} instructions`);
  } else {
    console.log(`❌ "${input}" → NOT properly mapped to ${expected}`);
    console.log(`   Found: ${instructions.substring(0, 50)}...`);
  }
}

console.log('\n✨ Tone instruction testing complete!');
