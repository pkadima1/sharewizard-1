/**
 * Add Test Partner Data Script
 * This script adds test partners directly to the production Firestore database
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

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

async function addTestPartners() {
  console.log('🔧 Adding test partner data to production Firestore...');
  
  try {
    const now = new Date();
    
    // Test Partner 1 - Pending Application
    const pendingPartner = {
      uid: 'test-pending-partner-uid',
      email: 'pending.partner@example.com',
      displayName: 'Pending Test Partner',
      companyName: 'Pending Partner Co.',
      website: 'https://pendingpartner.com',
      commissionRate: 0.6,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      description: 'This is a test pending partner application for debugging.',
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: now
      },
      registrationData: {
        submittedAt: now,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        source: 'public_registration'
      }
    };
    
    await setDoc(doc(db, 'partners', 'test-pending-partner'), pendingPartner);
    console.log('✅ Added Test Pending Partner');
    
    // Test Partner 2 - Active Partner
    const activePartner = {
      uid: 'test-active-partner-uid',
      email: 'active.partner@example.com',
      displayName: 'Active Test Partner',
      companyName: 'Active Partner LLC',
      website: 'https://activepartner.com',
      commissionRate: 0.7,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      description: 'This is a test active partner for debugging.',
      stats: {
        totalReferrals: 25,
        totalConversions: 15,
        totalCommissionEarned: 2500.00,
        totalCommissionPaid: 1800.00,
        lastCalculated: now
      },
      registrationData: {
        submittedAt: now,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        source: 'admin_created'
      }
    };
    
    await setDoc(doc(db, 'partners', 'test-active-partner'), activePartner);
    console.log('✅ Added Test Active Partner');
    
    // Test Partner 3 - Rejected Application
    const rejectedPartner = {
      uid: 'test-rejected-partner-uid',
      email: 'rejected.partner@example.com',
      displayName: 'Rejected Test Partner',
      commissionRate: 0.5,
      status: 'rejected',
      createdAt: now,
      updatedAt: now,
      rejectedAt: now,
      rejectionReason: 'Test rejection for debugging purposes.',
      description: 'This is a test rejected partner application.',
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: now
      }
    };
    
    await setDoc(doc(db, 'partners', 'test-rejected-partner'), rejectedPartner);
    console.log('✅ Added Test Rejected Partner');
    
    // Also add some partner codes
    const partnerCode1 = {
      code: 'TESTPENDING',
      partnerId: 'test-pending-partner',
      active: false,
      uses: 0,
      description: 'Test code for pending partner',
      createdAt: now
    };
    
    await setDoc(doc(db, 'partnerCodes', 'test-code-pending'), partnerCode1);
    console.log('✅ Added Test Partner Code for Pending Partner');
    
    const partnerCode2 = {
      code: 'TESTACTIVE',
      partnerId: 'test-active-partner',
      active: true,
      uses: 12,
      maxUses: 100,
      description: 'Test code for active partner',
      createdAt: now
    };
    
    await setDoc(doc(db, 'partnerCodes', 'test-code-active'), partnerCode2);
    console.log('✅ Added Test Partner Code for Active Partner');
    
    console.log('🎉 Test data added successfully!');
    console.log('📋 Summary:');
    console.log('   - 1 pending partner application');
    console.log('   - 1 active partner');
    console.log('   - 1 rejected partner application');
    console.log('   - 2 partner codes');
    console.log('');
    console.log('🔗 You can now test the admin interfaces at:');
    console.log('   http://localhost:8081/admin/partners');
    console.log('   http://localhost:8081/admin/pending-partners');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

addTestPartners().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(console.error);
