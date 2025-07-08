/**
 * Simple test to identify the exact issue with longform generation
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

// Minimal test data
const testData = {
  topic: "Simple Test Topic",
  audience: "test users",
  industry: "technology",
  contentType: "blog-article",
  contentTone: "professional",
  structureFormat: "intro-points-cta",
  wordCount: 500, // Very small for testing
  keywords: ["test"],
  outputFormat: "markdown",
  ctaType: "none",
  mediaUrls: []
};

async function simpleTest() {
  try {
    console.log('🧪 Running simple longform test...');
    
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Try to connect to emulator first
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log('🔗 Connected to emulator');
    } catch (error) {
      console.log('☁️  Using production');
    }
    
    // Create callable function
    const generateLongformContent = httpsCallable(functions, 'generateLongformContent');
    
    console.log('⏳ Calling function...');
    const result = await generateLongformContent(testData);
    
    console.log('✅ Success:', result.data);
    
  } catch (error) {
    console.error('💥 Error:', error.code, error.message);
    
    // Analyze the error
    if (error.code === 'functions/unauthenticated') {
      console.log('🔐 Authentication required - this is expected');
      console.log('The function requires a logged-in user to work');
    } else if (error.code === 'functions/not-found') {
      console.log('❌ Function not found - deployment issue');
    } else if (error.code === 'functions/deadline-exceeded') {
      console.log('⏰ Function timeout - performance issue');
    } else if (error.code === 'functions/internal') {
      console.log('💥 Internal error - check function logs');
      console.log('Error details:', error.details);
    } else {
      console.log('🔍 Unknown error type');
    }
  }
}

simpleTest();
