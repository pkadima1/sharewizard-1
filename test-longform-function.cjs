/**
 * Test script for the updated generateLongformContent function
 * Tests the simplified prompts and JSON parsing fixes
 */

require('dotenv').config();

const admin = require('firebase-admin');
const { httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');
const { getFunctions, connectFunctionsEmulator } = require('firebase/functions');

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Test data that previously caused JSON parsing issues
const testData = {
  topic: "Digital Marketing Strategies for Small Businesses",
  audience: "small business owners",
  industry: "digital marketing",
  contentType: "blog-article",
  contentTone: "professional",
  structureFormat: "intro-points-cta",
  wordCount: 1200,
  keywords: ["digital marketing", "small business", "online presence", "social media marketing", "content strategy"],
  optimizedTitle: "10 Proven Digital Marketing Strategies Every Small Business Owner Should Know",
  includeImages: true,
  includeStats: true,
  plagiarismCheck: true,
  outputFormat: "markdown",
  ctaType: "visit-website",
  structureNotes: "Focus on actionable strategies with real examples",
  mediaUrls: []
};

async function testLongformGeneration() {
  try {
    console.log('🧪 Testing Longform Content Generation...');
    console.log('📝 Test Topic:', testData.topic);
    console.log('👥 Target Audience:', testData.audience);
    console.log('📊 Word Count:', testData.wordCount);
    console.log('');

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Connect to emulator if available, otherwise use production
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log('🔗 Connected to Firebase Functions Emulator');
    } catch (error) {
      console.log('☁️  Using production Firebase Functions');
    }

    // Create callable function
    const generateLongformContent = httpsCallable(functions, 'generateLongformContent');

    console.log('⏳ Calling generateLongformContent function...');
    const startTime = Date.now();

    const result = await generateLongformContent(testData);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('');
    console.log('✅ Function completed successfully!');
    console.log('⏱️  Duration:', duration.toFixed(1), 'seconds');
    console.log('');

    if (result.data) {
      const response = result.data;
      
      console.log('📋 RESULTS:');
      console.log('📝 Content ID:', response.contentId || 'N/A');
      console.log('📰 Title:', response.title || 'N/A');
      console.log('📏 Content Length:', response.content ? response.content.length : 0, 'characters');
      console.log('🎯 Word Count:', response.wordCount || 'N/A');
      console.log('⏱️  Generation Time:', response.generationTime || 'N/A');
      console.log('📊 Outline Sections:', response.outline?.sections?.length || 0);
      
      // Show outline structure
      if (response.outline?.sections) {
        console.log('');
        console.log('📋 OUTLINE STRUCTURE:');
        response.outline.sections.forEach((section, index) => {
          console.log(`  ${index + 1}. ${section.title} (${section.wordCount} words)`);
          console.log(`     Focus: ${section.focus}`);
          console.log(`     Key Points: ${section.keyPoints?.length || 0}`);
        });
      }

      // Show content preview
      if (response.content) {
        console.log('');
        console.log('📖 CONTENT PREVIEW:');
        const preview = response.content.substring(0, 500) + '...';
        console.log(preview);
      }

      console.log('');
      console.log('🎉 Test completed successfully! The JSON parsing issues appear to be resolved.');
      
    } else {
      console.log('❌ No data returned from function');
    }

  } catch (error) {
    console.error('');
    console.error('💥 ERROR during testing:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    
    if (error.message.includes('JSON')) {
      console.error('');
      console.error('❌ JSON parsing error detected - the fix may need further refinement');
    } else if (error.code === 'functions/deadline-exceeded') {
      console.error('');
      console.error('⏰ Function timeout - content generation took too long');
    } else if (error.code === 'functions/unauthenticated') {
      console.error('');
      console.error('🔐 Authentication error - please ensure you are logged in');
    } else {
      console.error('');
      console.error('🔍 Unexpected error - check function logs for more details');
    }
  }
}

// Run the test
console.log('🚀 Starting Longform Content Generation Test');
console.log('=' .repeat(60));

testLongformGeneration().then(() => {
  console.log('');
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
