/**
 * Test the longform function without authentication to isolate issues
 */

require('dotenv').config();

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

// Test data
const testData = {
  topic: "Digital Marketing Strategies for Small Businesses",
  audience: "small business owners",
  industry: "digital marketing",
  contentType: "blog-article",
  contentTone: "professional",
  structureFormat: "intro-points-cta",
  wordCount: 800,
  keywords: ["digital marketing", "small business"],
  optimizedTitle: "Essential Digital Marketing Strategies for Small Business Success",
  includeImages: false,
  includeStats: false,
  plagiarismCheck: true,
  outputFormat: "markdown",
  ctaType: "visit-website",
  structureNotes: "Focus on actionable strategies",
  mediaUrls: []
};

async function testLongformNoAuth() {
  try {
    console.log('🧪 Testing longform function (no auth)...');
    
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Connect to emulator
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log('🔗 Connected to emulator');
    } catch (error) {
      console.log('☁️  Using production');
    }
    
    // Create callable function
    const testLongformNoAuth = httpsCallable(functions, 'testLongformNoAuth');
    
    console.log('⏳ Calling testLongformNoAuth function...');
    console.log('📋 Test data:', JSON.stringify(testData, null, 2));
    const startTime = Date.now();
    
    const result = await testLongformNoAuth(testData);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('⏱️  Duration:', duration.toFixed(1), 'seconds');
    console.log('📋 Result:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('✅ Longform test PASSED!');
      console.log('🎉 Both Gemini and OpenAI are working correctly');
      console.log('💡 This means the issue is likely with authentication or usage limits');
    } else {
      console.log('❌ Longform test FAILED');
      console.log('💥 Error:', result.data.error);
      console.log('🔍 Error code:', result.data.errorCode);
      if (result.data.stack) {
        console.log('📋 Stack trace:', result.data.stack);
      }
    }
    
  } catch (error) {
    console.error('💥 Test script error:', error.code, error.message);
  }
}

console.log('🚀 Starting Longform No-Auth Test');
console.log('=' .repeat(50));
testLongformNoAuth();
