/**
 * Test script for the isolated Gemini function
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

async function testGeminiAPI() {
  try {
    console.log('🧪 Testing Gemini API directly...');
    
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
    const testGeminiOnly = httpsCallable(functions, 'testGeminiOnly');
    
    console.log('⏳ Calling testGeminiOnly function...');
    const startTime = Date.now();
    
    const result = await testGeminiOnly({});
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('⏱️  Duration:', duration.toFixed(1), 'seconds');
    console.log('📋 Result:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('✅ Gemini test PASSED!');
      console.log('🎉 The Gemini API is working correctly');
    } else {
      console.log('❌ Gemini test FAILED');
      console.log('💥 Error:', result.data.error);
      console.log('🔍 Error code:', result.data.errorCode);
      console.log('📋 Error details:', result.data.errorDetails);
    }
    
  } catch (error) {
    console.error('💥 Test script error:', error.code, error.message);
  }
}

console.log('🚀 Starting Gemini API Test');
console.log('=' .repeat(50));
testGeminiAPI();
