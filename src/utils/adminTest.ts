/**
 * adminTest.ts - Admin Authentication and Data Access Test
 * 
 * Purpose: Test admin authentication and Firestore access
 * This can be called from the browser console for debugging
 */

import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const testAdminAccess = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  console.log('=== Admin Access Test ===');
  console.log('Current User:', user?.email);
  console.log('User UID:', user?.uid);
  console.log('Is Authenticated:', !!user);
  
  // Test admin check
  const isAdmin = user?.email?.toLowerCase() === 'engageperfect@gmail.com';
  console.log('Is Admin:', isAdmin);
  
  if (!isAdmin) {
    console.log('❌ Not an admin user');
    return;
  }
  
  try {
    // Test Firestore access
    console.log('Testing Firestore access...');
    const partnersQuery = query(
      collection(db, 'partners'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(partnersQuery);
    console.log('✅ Firestore access successful');
    console.log('Documents found:', snapshot.docs.length);
    
    // Log sample data
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Document ${index + 1}:`, {
        id: doc.id,
        displayName: data.displayName,
        email: data.email,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toLocaleDateString()
      });
    });
    
    // Check for pending applications
    const pendingDocs = snapshot.docs.filter(doc => doc.data().status === 'pending');
    console.log('Pending applications:', pendingDocs.length);
    
    if (pendingDocs.length === 0) {
      console.log('⚠️ No pending applications found. This is why the buttons are not visible.');
    }
    
  } catch (error) {
    console.error('❌ Firestore access failed:', error);
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testAdminAccess = testAdminAccess;
}

