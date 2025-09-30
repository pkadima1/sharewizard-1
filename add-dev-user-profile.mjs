/**
 * Add Development User Profile Script
 * This script adds a test user profile for the development user ID that's causing the error
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAboJ3IB1MM3GkOBwC1RTjzgvAGo2ablTo",
  authDomain: "engperfecthlc.firebaseapp.com",
  projectId: "engperfecthlc",
  storageBucket: "engperfecthlc.firebasestorage.app",
  messagingSenderId: "503333252583",
  appId: "1:503333252583:web:633b5ce3ba3619df572142",
  measurementId: "G-W98PHG26B4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addDevUserProfile() {
  console.log('🔧 Adding development user profile to production Firestore...');
  
  try {
    const userId = 'MuoWoqCRUYYMEtLMaeNy62DMRhT2'; // The failing user ID from logs
    const now = new Date();
    
    const userProfile = {
      displayName: 'Development User',
      email: 'dev@sharewizard.com',
      photoURL: '',
      createdAt: now,
      requests_used: 0,
      plan_type: 'free',
      requests_limit: 10,
      flexy_requests: 0,
      updatedAt: now
    };
    
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, userProfile);
    
    console.log(`✅ Development user profile created successfully for: ${userId}`);
    console.log(`📊 Profile details:`, userProfile);
    
  } catch (error) {
    console.error('❌ Error adding development user profile:', error);
    process.exit(1);
  }
}

addDevUserProfile().then(() => {
  console.log('🎉 Script completed successfully!');
  process.exit(0);
});