/**
 * Script to sync your real user profile from production Firestore to local emulator
 * This allows you to use real user data while developing locally
 */

const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Production Firebase config
const productionConfig = {
  projectId: 'engperfecthlc',
  // Add your service account key path here if needed
  // credential: cert(require('./path-to-service-account-key.json'))
};

// Initialize production Firebase Admin
const productionApp = initializeApp(productionConfig, 'production');
const productionDb = getFirestore(productionApp);

// Initialize local emulator Firebase Admin  
const emulatorApp = initializeApp({
  projectId: 'engperfecthlc',
}, 'emulator');

// Connect to local Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const emulatorDb = getFirestore(emulatorApp);

async function syncUserProfile(userId) {
  try {
    console.log(`🔄 Syncing user profile for: ${userId}`);
    
    // Get user profile from production
    const productionUserDoc = await productionDb.collection('users').doc(userId).get();
    
    if (!productionUserDoc.exists) {
      console.error(`❌ User profile not found in production: ${userId}`);
      return false;
    }
    
    const userData = productionUserDoc.data();
    console.log(`📋 Found user profile:`, {
      email: userData.email,
      displayName: userData.displayName,
      plan_type: userData.plan_type,
      requests_used: userData.requests_used,
      requests_limit: userData.requests_limit
    });
    
    // Sync to local emulator
    await emulatorDb.collection('users').doc(userId).set(userData);
    console.log(`✅ User profile synced to local emulator`);
    
    // Optionally sync some recent generations for testing
    const generationsQuery = await productionDb
      .collection('users')
      .doc(userId)
      .collection('generations')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`🔄 Syncing ${generationsQuery.docs.length} recent generations...`);
    
    const batch = emulatorDb.batch();
    generationsQuery.docs.forEach(doc => {
      const emulatorGenRef = emulatorDb
        .collection('users')
        .doc(userId)
        .collection('generations')
        .doc(doc.id);
      batch.set(emulatorGenRef, doc.data());
    });
    
    await batch.commit();
    console.log(`✅ Synced ${generationsQuery.docs.length} generations to local emulator`);
    
    return true;
  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    return false;
  }
}

// Main execution
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('❌ Please provide a user ID as an argument');
    console.log('Usage: node sync-user-profile.js <USER_ID>');
    process.exit(1);
  }
  
  const success = await syncUserProfile(userId);
  
  if (success) {
    console.log('🎉 User profile sync completed successfully!');
    console.log('📝 You can now use the caption generator with your real user data');
  } else {
    console.log('❌ User profile sync failed');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { syncUserProfile };
