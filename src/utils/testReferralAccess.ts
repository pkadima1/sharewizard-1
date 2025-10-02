/**
 * Test Referral Access Utility
 * 
 * This utility helps debug referral code access issues by testing
 * Firestore permissions and data retrieval directly.
 */

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Test if we can access partnerCodes collection
 */
export async function testPartnerCodesAccess(): Promise<{
  success: boolean;
  error?: string;
  data?: any[];
}> {
  try {
    console.log('🧪 Testing partnerCodes collection access...');
    
    const codesQuery = query(
      collection(db, 'partnerCodes'),
      where('code', '==', 'PATRICKO')
    );
    
    const snapshot = await getDocs(codesQuery);
    console.log('🧪 Query executed successfully, found', snapshot.size, 'documents');
    
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('🧪 Error testing partnerCodes access:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test if we can access a specific partner document
 */
export async function testPartnerAccess(partnerId: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    console.log('🧪 Testing partner document access for:', partnerId);
    
    const partnerDoc = await getDoc(doc(db, 'partners', partnerId));
    
    if (!partnerDoc.exists()) {
      return {
        success: false,
        error: 'Partner document not found'
      };
    }
    
    const data = partnerDoc.data();
    console.log('🧪 Partner document accessed successfully:', data.displayName);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('🧪 Error testing partner access:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Comprehensive test of the entire referral flow
 */
export async function testReferralFlow(): Promise<{
  codesAccess: boolean;
  partnerAccess: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  // Test partnerCodes access
  const codesTest = await testPartnerCodesAccess();
  if (!codesTest.success) {
    errors.push(`PartnerCodes access failed: ${codesTest.error}`);
  }
  
  // If we found codes, test partner access
  let partnerAccess = false;
  if (codesTest.success && codesTest.data && codesTest.data.length > 0) {
    const partnerId = codesTest.data[0].partnerId;
    const partnerTest = await testPartnerAccess(partnerId);
    if (!partnerTest.success) {
      errors.push(`Partner access failed: ${partnerTest.error}`);
    } else {
      partnerAccess = true;
    }
  }
  
  return {
    codesAccess: codesTest.success,
    partnerAccess,
    errors
  };
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testReferralAccess = {
    testPartnerCodesAccess,
    testPartnerAccess,
    testReferralFlow
  };
}
