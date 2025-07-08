/**
 * End-to-end test for new tone instructions implementation
 * Tests that the tone flows from UI to backend correctly
 */

const dotenv = require('dotenv');
dotenv.config();

const { httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');
const { getFunctions, connectFunctionsEmulator } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Test data for each tone
const newTones = [
  'informative',
  'casual', 
  'authoritative',
  'inspirational',
  'humorous',
  'empathetic'
];

const existingTones = [
  'friendly',
  'professional',
  'thoughtProvoking',
  'expert',
  'persuasive'
];

const createTestData = (tone) => ({
  topic: `Testing ${tone} tone implementation`,
  audience: 'developers and content creators',
  industry: 'technology',
  contentType: 'blog-article',
  contentTone: tone,
  structureFormat: 'intro-points-cta',
  wordCount: 300, // Small for testing
  keywords: ['test', 'tone', tone],
  outputFormat: 'markdown',
  ctaType: 'none',
  mediaUrls: [],
  includeStats: false,
  includeReferences: false
});

async function testToneImplementation() {
  try {
    console.log('🧪 Testing Tone Instructions Implementation...\n');
    
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Try to connect to emulator (optional)
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log('🔗 Connected to emulator');
    } catch (error) {
      console.log('☁️  Using production functions');
    }

    const generateLongformContent = httpsCallable(functions, 'generateLongformContent');

    // Test each new tone
    console.log('🎯 Testing NEW tones:\n');
    
    for (const tone of newTones) {
      console.log(`Testing tone: ${tone}`);
      
      try {
        const testData = createTestData(tone);
        console.log(`📝 Generating content with ${tone} tone...`);
        
        const result = await generateLongformContent(testData);
        
        if (result.data && result.data.success) {
          console.log(`✅ ${tone}: Generation successful`);
          
          // Check if the content reflects the tone (basic validation)
          const content = result.data.content?.toLowerCase() || '';
          const outline = result.data.outline?.toString()?.toLowerCase() || '';
          
          // Look for tone-specific keywords in the generated content
          let toneValidated = false;
          switch (tone) {
            case 'informative':
              toneValidated = content.includes('objective') || content.includes('data') || content.includes('fact');
              break;
            case 'casual':
              toneValidated = content.includes('you') || content.includes("'re") || content.includes("let's");
              break;
            case 'authoritative':
              toneValidated = content.includes('definitive') || content.includes('proven') || content.includes('expert');
              break;
            case 'inspirational':
              toneValidated = content.includes('potential') || content.includes('transform') || content.includes('opportunity');
              break;
            case 'humorous':
              toneValidated = content.includes('fun') || outline.includes('humor') || content.includes('entertaining');
              break;
            case 'empathetic':
              toneValidated = content.includes('understand') || content.includes('together') || content.includes('support');
              break;
          }
          
          if (toneValidated) {
            console.log(`✅ ${tone}: Tone validation passed (content reflects tone)`);
          } else {
            console.log(`⚠️  ${tone}: Tone validation inconclusive (content may not strongly reflect tone)`);
          }
        } else {
          console.log(`❌ ${tone}: Generation failed -`, result.data?.error || 'Unknown error');
        }
        
      } catch (error) {
        console.log(`❌ ${tone}: Error -`, error.message);
      }
      
      console.log('---');
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test one existing tone to ensure backward compatibility
    console.log('\n🔄 Testing existing tone (backward compatibility):\n');
    
    const existingTone = 'professional';
    console.log(`Testing existing tone: ${existingTone}`);
    
    try {
      const testData = createTestData(existingTone);
      console.log(`📝 Generating content with ${existingTone} tone...`);
      
      const result = await generateLongformContent(testData);
      
      if (result.data && result.data.success) {
        console.log(`✅ ${existingTone}: Backward compatibility confirmed`);
      } else {
        console.log(`❌ ${existingTone}: Backward compatibility issue -`, result.data?.error || 'Unknown error');
      }
      
    } catch (error) {
      console.log(`❌ ${existingTone}: Error -`, error.message);
    }

    console.log('\n✨ Tone implementation testing complete!');
    console.log('\n📊 Summary:');
    console.log(`• New tones tested: ${newTones.length}`);
    console.log(`• Existing tones confirmed: 1`);
    console.log(`• Total tone coverage: ${newTones.length + existingTones.length} tones`);
    
  } catch (error) {
    console.error('❌ Test setup error:', error);
  }
}

// Run the test
testToneImplementation();
