/**
 * Add Test Partner Data to Firestore Emulator
 * This script adds test partners for debugging admin interface
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase config - matches your .env
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

// Connect to emulator
connectFirestoreEmulator(db, '127.0.0.1', 8082);

async function addTestPartners() {
  console.log('🔧 Adding test partner data to Firestore emulator...');
  
  try {
    // Test Partner 1 - Active
    const partner1Data = {
      uid: 'test-partner-1-uid',
      email: 'partner1@example.com',
      displayName: 'Test Partner One',
      companyName: 'Partner Company 1',
      website: 'https://partner1.com',
      commissionRate: 0.6,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'This is a test partner for development and debugging.',
      stats: {
        totalReferrals: 15,
        totalConversions: 8,
        totalCommissionEarned: 1200.50,
        totalCommissionPaid: 800.00,
        lastCalculated: new Date()
      }
    };
    
    await setDoc(doc(db, 'partners', 'test-partner-1'), partner1Data);
    console.log('✅ Added Test Partner 1');
    
    // Test Partner 2 - Pending
    const partner2Data = {
      uid: 'test-partner-2-uid',
      email: 'partner2@example.com',
      displayName: 'Test Partner Two',
      companyName: 'Partner Company 2',
      commissionRate: 0.5,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'This is a pending test partner awaiting approval.',
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: new Date()
      }
    };
    
    await setDoc(doc(db, 'partners', 'test-partner-2'), partner2Data);
    console.log('✅ Added Test Partner 2 (Pending)');
    
    // Test Partner Code 1
    const code1Data = {
      code: 'TESTCODE1',
      partnerId: 'test-partner-1',
      active: true,
      uses: 12,
      maxUses: 100,
      description: 'Main referral code for Test Partner 1',
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'partnerCodes', 'test-code-1'), code1Data);
    console.log('✅ Added Test Partner Code 1');
    
    // Test Partner Code 2
    const code2Data = {
      code: 'TESTCODE2',
      partnerId: 'test-partner-2',
      active: false,
      uses: 0,
      description: 'Inactive code for Test Partner 2',
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'partnerCodes', 'test-code-2'), code2Data);
    console.log('✅ Added Test Partner Code 2');
    
    console.log('🎉 Test data added successfully!');
    console.log('📋 Summary:');
    console.log('   - 2 test partners added');
    console.log('   - 1 active partner, 1 pending partner');
    console.log('   - 2 partner codes added');
    console.log('');
    console.log('🔗 You can now test the admin interface at:');
    console.log('   http://localhost:8081/admin/partners');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

addTestPartners().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(console.error);
