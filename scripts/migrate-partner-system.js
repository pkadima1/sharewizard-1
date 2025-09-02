#!/usr/bin/env node

/**
 * Partner System Database Migration Script
 * 
 * This script sets up the partner/affiliate system database structure
 * Run this after deploying the partner system code
 * 
 * Usage:
 *   node scripts/migrate-partner-system.js [--cleanup] [--validate] [--production]
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isCleanup = args.includes('--cleanup');
const isValidate = args.includes('--validate');
const isProduction = args.includes('--production');

console.log('🚀 Partner System Database Migration');
console.log('=====================================');

// Initialize Firebase Admin
let app;
let db;

try {
  if (isProduction) {
    // Production mode - use service account
    console.log('🌐 Initializing for PRODUCTION environment');
    
    // You should set this environment variable or provide the path
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                              join(__dirname, '../service-account-key.json');
    
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'engperfecthlc'
      });
    } catch (error) {
      console.error('❌ Error loading service account. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set or place service-account-key.json in the project root');
      process.exit(1);
    }
  } else {
    // Development mode - use emulator or default credentials
    console.log('🔧 Initializing for DEVELOPMENT environment');
    app = initializeApp({
      projectId: 'engperfecthlc'
    });
  }
  
  db = getFirestore(app);
  console.log('✅ Firebase Admin initialized successfully');
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

/**
 * Create initial partner collections with sample data
 */
async function createInitialCollections() {
  console.log('\n📝 Creating initial partner collections...');
  
  try {
    const batch = db.batch();
    
    // Create sample partner
    const samplePartnerId = 'sample-partner-migration';
    const partnerRef = db.collection('partners').doc(samplePartnerId);
    batch.set(partnerRef, {
      uid: 'sample-migration-uid',
      email: 'migration@example.com',
      displayName: 'Migration Test Partner',
      commissionRate: 0.6,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      companyName: 'Test Company',
      website: 'https://example.com',
      stats: {
        totalReferrals: 0,
        totalConversions: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        lastCalculated: new Date()
      },
      marketingPreferences: {
        language: 'en',
        receiveUpdates: true
      }
    });

    // Create sample partner code
    const codeRef = db.collection('partnerCodes').doc('MIGRATION123');
    batch.set(codeRef, {
      code: 'MIGRATION123',
      partnerId: samplePartnerId,
      active: true,
      createdAt: new Date(),
      uses: 0,
      description: 'Migration test code'
    });

    // Create sample referral
    const referralId = 'sample-referral-migration';
    const referralRef = db.collection('referrals').doc(referralId);
    batch.set(referralRef, {
      partnerId: samplePartnerId,
      code: 'MIGRATION123',
      currency: 'usd',
      createdAt: new Date(),
      source: 'link',
      metadata: {
        referrerUrl: 'https://example.com',
        landingPage: '/pricing',
        country: 'US',
        deviceType: 'desktop'
      }
    });

    // Create sample commission entry
    const commissionRef = db.collection('commission_ledger').doc('sample-commission-migration');
    batch.set(commissionRef, {
      partnerId: samplePartnerId,
      referralId: referralId,
      stripeInvoiceId: 'in_migration_test',
      stripeSubscriptionId: 'sub_migration_test',
      amountGross: 800, // $8.00 in cents
      commissionRate: 0.6,
      commissionAmount: 480, // $4.80 in cents
      currency: 'usd',
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'accrued',
      createdAt: new Date(),
      stripeMetadata: {
        invoiceStatus: 'paid',
        subscriptionStatus: 'active',
        customerId: 'cus_migration_test',
        priceId: 'price_migration_test'
      }
    });

    await batch.commit();
    console.log('✅ Initial collections created successfully');
    
    return {
      partnerId: samplePartnerId,
      codeId: 'MIGRATION123',
      referralId: referralId,
      commissionId: 'sample-commission-migration'
    };
    
  } catch (error) {
    console.error('❌ Error creating initial collections:', error);
    throw error;
  }
}

/**
 * Validate existing collections for compatibility
 */
async function validateExistingCollections() {
  console.log('\n🔍 Validating existing collections...');
  
  try {
    // Check users collection
    const usersSnapshot = await db.collection('users').limit(1).get();
    console.log(`✅ Users collection: ${usersSnapshot.size > 0 ? 'Has data' : 'Empty (this is okay for new deployments)'}`);
    
    // Check customers collection (Stripe extension)
    const customersSnapshot = await db.collection('customers').limit(1).get();
    console.log(`✅ Customers collection: ${customersSnapshot.size > 0 ? 'Has data' : 'Empty (will be populated by Stripe)'}`);
    
    // Check if partner collections already exist
    const partnersSnapshot = await db.collection('partners').limit(1).get();
    const codesSnapshot = await db.collection('partnerCodes').limit(1).get();
    const referralsSnapshot = await db.collection('referrals').limit(1).get();
    const commissionsSnapshot = await db.collection('commission_ledger').limit(1).get();
    
    console.log(`📊 Partner collections status:`);
    console.log(`   Partners: ${partnersSnapshot.size} documents`);
    console.log(`   Partner Codes: ${codesSnapshot.size} documents`);
    console.log(`   Referrals: ${referralsSnapshot.size} documents`);
    console.log(`   Commission Ledger: ${commissionsSnapshot.size} documents`);
    
    return {
      hasPartners: !partnersSnapshot.empty,
      hasCodes: !codesSnapshot.empty,
      hasReferrals: !referralsSnapshot.empty,
      hasCommissions: !commissionsSnapshot.empty
    };
    
  } catch (error) {
    console.error('❌ Error validating collections:', error);
    throw error;
  }
}

/**
 * Clean up sample data
 */
async function cleanupSampleData() {
  console.log('\n🗑️  Cleaning up sample data...');
  
  try {
    const batch = db.batch();
    
    // List of sample document IDs to delete
    const sampleDocs = [
      { collection: 'partners', id: 'sample-partner-migration' },
      { collection: 'partners', id: 'sample-partner-id' },
      { collection: 'partnerCodes', id: 'MIGRATION123' },
      { collection: 'partnerCodes', id: 'SAMPLE123' },
      { collection: 'referrals', id: 'sample-referral-migration' },
      { collection: 'referrals', id: 'sample-referral-id' },
      { collection: 'commission_ledger', id: 'sample-commission-migration' },
      { collection: 'commission_ledger', id: 'sample-commission-id' }
    ];
    
    for (const doc of sampleDocs) {
      const docRef = db.collection(doc.collection).doc(doc.id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        batch.delete(docRef);
        console.log(`   Marking ${doc.collection}/${doc.id} for deletion`);
      }
    }
    
    await batch.commit();
    console.log('✅ Sample data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up sample data:', error);
    throw error;
  }
}

/**
 * Display post-migration instructions
 */
function displayInstructions(sampleIds) {
  console.log('\n📋 Post-Migration Instructions');
  console.log('=============================');
  
  if (sampleIds) {
    console.log('🧪 Sample data created with IDs:');
    console.log(`   Partner: ${sampleIds.partnerId}`);
    console.log(`   Code: ${sampleIds.codeId}`);
    console.log(`   Referral: ${sampleIds.referralId}`);
    console.log(`   Commission: ${sampleIds.commissionId}`);
    console.log('');
    console.log('⚠️  Remember to clean up sample data in production:');
    console.log('   node scripts/migrate-partner-system.js --cleanup --production');
  }
  
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
  console.log('2. Deploy security rules: firebase deploy --only firestore:rules');
  console.log('3. Deploy Cloud Functions with partner functions');
  console.log('4. Test the partner system with the admin dashboard');
  console.log('5. Configure Stripe webhooks to call partner commission functions');
  
  console.log('');
  console.log('🔧 Required Firestore Indexes:');
  console.log('   Check firestore.indexes.json for the complete list');
  console.log('   Indexes will be automatically created when you deploy');
  
  console.log('');
  console.log('🛡️  Security Rules:');
  console.log('   Partner system rules have been added to firestore.rules');
  console.log('   Deploy them with: firebase deploy --only firestore:rules');
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    if (isValidate) {
      await validateExistingCollections();
      console.log('\n✅ Validation completed successfully');
      return;
    }
    
    if (isCleanup) {
      await cleanupSampleData();
      console.log('\n✅ Cleanup completed successfully');
      return;
    }
    
    // Run full migration
    console.log('🎯 Running full partner system migration...');
    
    const validation = await validateExistingCollections();
    
    if (validation.hasPartners && !isProduction) {
      console.log('⚠️  Partner collections already exist. Use --cleanup to remove sample data first.');
      return;
    }
    
    const sampleIds = await createInitialCollections();
    
    displayInstructions(sampleIds);
    
    console.log('\n🎉 Partner system migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n👋 Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
