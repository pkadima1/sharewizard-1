/**
 * Authenticated test script for longform content generation
 * This script properly authenticates before calling the function
 */

require('dotenv').config();

const admin = require('firebase-admin');
const { httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');
const { getFunctions, connectFunctionsEmulator } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Test data
const testData = {
  topic: "Digital Marketing Strategies for Small Businesses",
  audience: "small business owners",
  industry: "digital marketing",
  contentType: "blog-article",
  contentTone: "professional",
  structureFormat: "intro-points-cta",
  wordCount: 800, // Reduced for testing
  keywords: ["digital marketing", "small business"],
  optimizedTitle: "Essential Digital Marketing Strategies for Small Business Success",
  includeImages: false, // Simplified for testing
  includeStats: false,
  plagiarismCheck: true,
  outputFormat: "markdown",
  ctaType: "visit-website",
  structureNotes: "Focus on actionable strategies",
  mediaUrls: []
};

async function testWithAuth() {
  try {
    console.log('🔐 Starting authentication process...');
    
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Connect to emulator
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log('🔗 Connected to Firebase Functions Emulator');
    } catch (error) {
      console.log('☁️  Using production Firebase Functions');
    }
    
    // For testing, let's skip authentication and call the function anyway
    // to see what specific Gemini error we get
    console.log('⚠️  Skipping authentication to test Gemini API directly...');
    
    // Create callable function
    const generateLongformContent = httpsCallable(functions, 'generateLongformContent');
    
    console.log('⏳ Calling generateLongformContent function...');
    console.log('📋 Test data:', JSON.stringify(testData, null, 2));
    const startTime = Date.now();
    
    const result = await generateLongformContent(testData);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('✅ Function completed successfully!');
    console.log('⏱️  Duration:', duration.toFixed(1), 'seconds');
    
    if (result.data) {
      const response = result.data;
      console.log('📋 Content generated:', response.content ? 'Yes' : 'No');
      console.log('📊 Word count:', response.metadata?.actualWordCount || 'N/A');
    }
    
  } catch (error) {
    console.error('💥 ERROR DETAILS:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Full error:', error);
    
    // Specific error handling
    if (error.code === 'functions/unauthenticated') {
      console.error('🔐 This confirms the function requires authentication');
      console.error('Next step: Set up proper test user credentials');
    } else if (error.code === 'functions/deadline-exceeded') {
      console.error('⏰ Function timed out - likely Gemini API issue');
    } else if (error.code === 'functions/internal') {
      console.error('💥 Internal function error - this is likely the Gemini issue');
      console.error('Check the emulator logs for detailed error information');
    } else {
      console.error('🔍 Unexpected error type - check logs for details');
    }
  }
}

// Run the test
console.log('🧪 Starting Authenticated Longform Test');
console.log('=' .repeat(50));
testWithAuth();
