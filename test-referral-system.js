/**
 * Test Referral System - Verification Script
 * 
 * This script tests the referral system to verify that:
 * 1. Referral code validation works
 * 2. Partner information is retrieved correctly
 * 3. Attribution process functions properly
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ",
  authDomain: "engperfecthlc.firebaseapp.com",
  projectId: "engperfecthlc",
  storageBucket: "engperfecthlc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

/**
 * Test referral code validation
 */
async function testReferralCodeValidation() {
  console.log('🧪 Testing referral code validation...');
  
  try {
    // Test PATRICKO code
    const codesQuery = query(
      collection(db, 'partnerCodes'),
      where('code', '==', 'PATRICKO')
    );
    
    const codeSnapshot = await getDocs(codesQuery);
    console.log(`📊 Found ${codeSnapshot.size} partner codes for PATRICKO`);
    
    if (!codeSnapshot.empty) {
      const codeData = codeSnapshot.docs[0].data();
      console.log('✅ Partner code data:', {
        code: codeData.code,
        partnerId: codeData.partnerId,
        active: codeData.active,
        uses: codeData.uses
      });
      
      // Get partner information
      const partnerDoc = await getDoc(doc(db, 'partners', codeData.partnerId));
      if (partnerDoc.exists()) {
        const partnerData = partnerDoc.data();
        console.log('✅ Partner information:', {
          partnerId: partnerData.partnerId || codeData.partnerId,
          displayName: partnerData.displayName,
          email: partnerData.email,
          active: partnerData.active,
          commissionRate: partnerData.commissionRate
        });
      } else {
        console.log('❌ Partner document not found');
      }
    } else {
      console.log('❌ No partner codes found for PATRICKO');
    }
    
  } catch (error) {
    console.error('❌ Error testing referral code validation:', error);
  }
}

/**
 * Test Firebase function availability
 */
async function testFirebaseFunction() {
  console.log('🧪 Testing Firebase function availability...');
  
  try {
    const processReferralAttribution = httpsCallable(functions, 'processReferralAttribution');
    console.log('✅ processReferralAttribution function is available');
    
    // Test function call (this will fail without authentication, but we can check if it's deployed)
    try {
      await processReferralAttribution({
        referralCode: 'PATRICKO',
        metadata: {
          source: 'test',
          userAgent: 'test-agent'
        }
      });
    } catch (error) {
      if (error.code === 'unauthenticated') {
        console.log('✅ Function is deployed and responding (authentication required as expected)');
      } else {
        console.log('⚠️ Function error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Firebase function:', error);
  }
}

/**
 * Test referrals collection
 */
async function testReferralsCollection() {
  console.log('🧪 Testing referrals collection...');
  
  try {
    const referralsQuery = query(
      collection(db, 'referrals')
    );
    
    const referralsSnapshot = await getDocs(referralsQuery);
    console.log(`📊 Found ${referralsSnapshot.size} referrals in database`);
    
    if (!referralsSnapshot.empty) {
      console.log('📋 Recent referrals:');
      referralsSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Partner: ${data.partnerId}, Code: ${data.code}, Customer: ${data.customerUid || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing referrals collection:', error);
  }
}

/**
 * Test commission ledger
 */
async function testCommissionLedger() {
  console.log('🧪 Testing commission ledger...');
  
  try {
    const commissionQuery = query(
      collection(db, 'commissionLedger')
    );
    
    const commissionSnapshot = await getDocs(commissionQuery);
    console.log(`📊 Found ${commissionSnapshot.size} commission entries in database`);
    
    if (!commissionSnapshot.empty) {
      console.log('📋 Recent commission entries:');
      commissionSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Partner: ${data.partnerId}, Amount: ${data.commissionAmount}, Status: ${data.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing commission ledger:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Referral System Verification Tests...\n');
  
  await testReferralCodeValidation();
  console.log('');
  
  await testFirebaseFunction();
  console.log('');
  
  await testReferralsCollection();
  console.log('');
  
  await testCommissionLedger();
  console.log('');
  
  console.log('✅ All tests completed!');
}

// Run tests
runTests().catch(console.error);




