/**
 * Debug script to check partner access and admin permissions
 * Run this with: node debug-partner-access.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (for emulator)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'engperfecthlc'
  });
}

// Connect to Firestore emulator
const db = admin.firestore();
db.settings({
  host: '127.0.0.1:8082',
  ssl: false
});

async function debugPartnerAccess() {
  try {
    console.log('🔍 Debugging Partner Access...\n');
    
    // 1. Check if partners collection exists and has data
    console.log('1. Checking partners collection...');
    const partnersSnapshot = await db.collection('partners').get();
    console.log(`   Found ${partnersSnapshot.size} partners in collection`);
    
    if (!partnersSnapshot.empty) {
      partnersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   Partner: ${doc.id}`);
        console.log(`     Email: ${data.email}`);
        console.log(`     Status: ${data.status}`);
        console.log(`     Display Name: ${data.displayName}`);
        console.log(`     Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
      });
    }
    
    // 2. Check partner codes collection
    console.log('\n2. Checking partnerCodes collection...');
    const codesSnapshot = await db.collection('partnerCodes').get();
    console.log(`   Found ${codesSnapshot.size} partner codes`);
    
    if (!codesSnapshot.empty) {
      codesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   Code: ${data.code} (Partner: ${data.partnerId})`);
      });
    }
    
    // 3. Check admin notifications
    console.log('\n3. Checking adminNotifications collection...');
    const notificationsSnapshot = await db.collection('adminNotifications').get();
    console.log(`   Found ${notificationsSnapshot.size} admin notifications`);
    
    // 4. Create a test partner if none exist
    if (partnersSnapshot.empty) {
      console.log('\n4. Creating test partner...');
      const testPartner = {
        uid: 'test-partner-uid-123',
        email: 'test.partner@example.com',
        displayName: 'Test Partner',
        commissionRate: 0.6,
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        stats: {
          totalReferrals: 0,
          totalConversions: 0,
          totalCommissionEarned: 0,
          totalCommissionPaid: 0,
          lastCalculated: admin.firestore.Timestamp.now()
        }
      };
      
      await db.collection('partners').doc('test-partner-123').set(testPartner);
      console.log('   ✅ Test partner created with ID: test-partner-123');
    }
    
    console.log('\n✅ Debug complete! Check the console output above for issues.');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugPartnerAccess().then(() => {
  console.log('\n🏁 Script finished. You can now test the admin interface.');
  process.exit(0);
}).catch(console.error);
