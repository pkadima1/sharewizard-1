/**
 * Test script for new content structure formats
 * Tests all 5 new content structures: How-To, FAQ, Comparison, Review, and Case Study
 */

const TEST_DATA = {
  // Common parameters
  topic: "Social Media Marketing for Small Businesses",
  audience: "Small Business Owners",
  industry: "Digital Marketing",
  keywords: ["social media", "marketing", "small business", "engagement"],
  contentTone: "friendly",
  wordCount: 1500,
  includeStats: true,
  includeReferences: true,
  outputFormat: "markdown"
};

const STRUCTURE_FORMATS = [
  {
    id: 'how-to-steps',
    name: 'How-To / Step-by-Step',
    description: 'Tests step-by-step tutorial format',
    testData: {
      ...TEST_DATA,
      structureFormat: 'how-to-steps',
      topic: "How to Create a Social Media Marketing Strategy"
    }
  },
  {
    id: 'faq-qa',
    name: 'FAQ / Q&A',
    description: 'Tests question and answer format',
    testData: {
      ...TEST_DATA,
      structureFormat: 'faq-qa',
      topic: "Social Media Marketing: Frequently Asked Questions"
    }
  },
  {
    id: 'comparison-vs',
    name: 'Comparison / vs.',
    description: 'Tests comparison format',
    testData: {
      ...TEST_DATA,
      structureFormat: 'comparison-vs',
      topic: "Facebook Ads vs Google Ads for Small Businesses"
    }
  },
  {
    id: 'review-analysis',
    name: 'Review / Analysis',
    description: 'Tests review and analysis format',
    testData: {
      ...TEST_DATA,
      structureFormat: 'review-analysis',
      topic: "Hootsuite Review: Complete Social Media Management Analysis"
    }
  },
  {
    id: 'case-study-detailed',
    name: 'Case Study',
    description: 'Tests detailed case study format',
    testData: {
      ...TEST_DATA,
      structureFormat: 'case-study-detailed',
      topic: "How Local Bakery Increased Sales 300% with Social Media"
    }
  }
];

// Test function that would be called from frontend
const testContentStructure = async (structureFormat) => {
  const testConfig = STRUCTURE_FORMATS.find(s => s.id === structureFormat);
  if (!testConfig) {
    throw new Error(`Unknown structure format: ${structureFormat}`);
  }

  console.log(`\n=== Testing ${testConfig.name} ===`);
  console.log(`Description: ${testConfig.description}`);
  console.log(`Topic: ${testConfig.testData.topic}`);
  
  try {
    // This would call the Firebase function
    const result = await generateLongformContent(testConfig.testData);
    
    if (result.success) {
      console.log(`✅ ${testConfig.name} - Success`);
      console.log(`Generated ${result.metadata.actualWordCount} words`);
      console.log(`Reading time: ${result.metadata.estimatedReadingTime} minutes`);
      
      // Validate structure-specific elements
      validateStructureElements(structureFormat, result.content);
      
      return {
        success: true,
        structure: structureFormat,
        wordCount: result.metadata.actualWordCount,
        outline: result.outline
      };
    } else {
      console.log(`❌ ${testConfig.name} - Failed`);
      console.log(`Error: ${result.error}`);
      return { success: false, structure: structureFormat, error: result.error };
    }
  } catch (error) {
    console.log(`❌ ${testConfig.name} - Exception`);
    console.log(`Error: ${error.message}`);
    return { success: false, structure: structureFormat, error: error.message };
  }
};

// Validation function to check structure-specific elements
const validateStructureElements = (structureFormat, content) => {
  console.log(`\n--- Validating ${structureFormat} structure ---`);
  
  switch (structureFormat) {
    case 'how-to-steps':
      const hasSteps = /Step \d+:/.test(content);
      const hasIntro = /Introduction|Overview/.test(content);
      const hasConclusion = /Conclusion|Next Steps/.test(content);
      console.log(`Has steps: ${hasSteps ? '✅' : '❌'}`);
      console.log(`Has introduction: ${hasIntro ? '✅' : '❌'}`);
      console.log(`Has conclusion: ${hasConclusion ? '✅' : '❌'}`);
      break;
      
    case 'faq-qa':
      const hasQuestions = /Q\d+:|Question \d+|What is|How do|Why/.test(content);
      const hasAnswers = content.includes('A:') || content.includes('Answer:');
      console.log(`Has questions: ${hasQuestions ? '✅' : '❌'}`);
      console.log(`Has structured answers: ${hasAnswers ? '✅' : '❌'}`);
      break;
      
    case 'comparison-vs':
      const hasOptionA = /Option A|First option/.test(content);
      const hasOptionB = /Option B|Second option/.test(content);
      const hasComparison = /comparison|vs|versus/.test(content);
      const hasRecommendation = /recommendation|verdict|choose/.test(content);
      console.log(`Has Option A: ${hasOptionA ? '✅' : '❌'}`);
      console.log(`Has Option B: ${hasOptionB ? '✅' : '❌'}`);
      console.log(`Has comparison: ${hasComparison ? '✅' : '❌'}`);
      console.log(`Has recommendation: ${hasRecommendation ? '✅' : '❌'}`);
      break;
      
    case 'review-analysis':
      const hasFeatures = /features|capabilities/.test(content);
      const hasPros = /pros|advantages|what we liked/.test(content);
      const hasCons = /cons|disadvantages|limitations/.test(content);
      const hasVerdict = /verdict|rating|recommendation/.test(content);
      console.log(`Has features: ${hasFeatures ? '✅' : '❌'}`);
      console.log(`Has pros: ${hasPros ? '✅' : '❌'}`);
      console.log(`Has cons: ${hasCons ? '✅' : '❌'}`);
      console.log(`Has verdict: ${hasVerdict ? '✅' : '❌'}`);
      break;
      
    case 'case-study-detailed':
      const hasBackground = /background|context/.test(content);
      const hasChallenge = /challenge|problem/.test(content);
      const hasSolution = /solution|approach/.test(content);
      const hasResults = /results|outcomes|metrics/.test(content);
      console.log(`Has background: ${hasBackground ? '✅' : '❌'}`);
      console.log(`Has challenge: ${hasChallenge ? '✅' : '❌'}`);
      console.log(`Has solution: ${hasSolution ? '✅' : '❌'}`);
      console.log(`Has results: ${hasResults ? '✅' : '❌'}`);
      break;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Content Structure Tests');
  console.log(`Testing ${STRUCTURE_FORMATS.length} structure formats...\n`);
  
  const results = [];
  
  for (const format of STRUCTURE_FORMATS) {
    const result = await testContentStructure(format.id);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n\n=== TEST SUMMARY ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${(successful / results.length * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n--- Failed Tests ---');
    results.filter(r => !r.success).forEach(r => {
      console.log(`❌ ${r.structure}: ${r.error}`);
    });
  }
  
  return results;
};

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testContentStructure,
    validateStructureElements,
    runAllTests,
    STRUCTURE_FORMATS
  };
}

// For browser testing
if (typeof window !== 'undefined') {
  window.ContentStructureTests = {
    testContentStructure,
    validateStructureElements,
    runAllTests,
    STRUCTURE_FORMATS
  };
}

console.log('Content Structure Tests loaded. Use runAllTests() to test all formats.');
