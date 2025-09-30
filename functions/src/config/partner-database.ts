/**
 * Firestore Indexes for Partner/Affiliate System
 * 
 * Add these indexes to your firestore.indexes.json file
 * These indexes optimize queries for the partner dashboard and admin functions
 */

// Add to firestore.indexes.json:
export const PARTNER_FIRESTORE_INDEXES = {
  "indexes": [
    // Partner queries by status
    {
      "collectionGroup": "partners",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Partner codes by partnerId and status
    {
      "collectionGroup": "partnerCodes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "partnerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "active",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Referrals by partnerId for dashboard
    {
      "collectionGroup": "referrals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "partnerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Referrals by partnerId and conversion status
    {
      "collectionGroup": "referrals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "partnerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "subscribedAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Commission ledger by partnerId for dashboard
    {
      "collectionGroup": "commission_ledger",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "partnerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Commission ledger by partnerId and status
    {
      "collectionGroup": "commission_ledger",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "partnerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Commission ledger by status for admin queries
    {
      "collectionGroup": "commission_ledger",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Referrals by stripeCustomerId for commission calculation
    {
      "collectionGroup": "referrals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "stripeCustomerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    
    // Commission ledger by stripeSubscriptionId for recurring commissions
    {
      "collectionGroup": "commission_ledger",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "stripeSubscriptionId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "periodStart",
          "order": "DESCENDING"
        }
      ]
    },
    
    // Partner codes by code for lookup (single field, but shown for completeness)
    {
      "collectionGroup": "partnerCodes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "code",
          "order": "ASCENDING"
        }
      ]
    }
  ]
};

/**
 * Firestore Security Rules for Partner/Affiliate System
 * 
 * Add these rules to your firestore.rules file
 */
export const PARTNER_SECURITY_RULES = `
// Partner/Affiliate System Security Rules

// Partners collection
match /partners/{partnerId} {
  // Partners can read their own data
  allow read: if request.auth != null && request.auth.uid == resource.data.uid;
  
  // Admins can read/write all partner data
  allow read, write: if request.auth != null && 
    (request.auth.token.email == 'engageperfect@gmail.com');
     
  // Partners can update specific fields of their own profile
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.uid &&
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['displayName', 'companyName', 'website', 'paymentDetails', 'marketingPreferences', 'updatedAt']);
}

// Partner codes collection
match /partnerCodes/{codeId} {
  // Anyone can read active codes for referral tracking
  allow read: if resource.data.active == true;
  
  // Partners can read their own codes
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/partners/$(resource.data.partnerId)) &&
    get(/databases/$(database)/documents/partners/$(resource.data.partnerId)).data.uid == request.auth.uid;
    
  // Admins can read/write all codes
  allow read, write: if request.auth != null && 
    (request.auth.token.email == 'engageperfect@gmail.com');
     
  // System can update usage statistics
  allow update: if request.auth != null &&
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['uses', 'lastUsedAt']);
}

// Referrals collection
match /referrals/{referralId} {
  // Partners can read their own referrals
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/partners/$(resource.data.partnerId)) &&
    get(/databases/$(database)/documents/partners/$(resource.data.partnerId)).data.uid == request.auth.uid;
    
  // Admins can read/write all referrals
  allow read, write: if request.auth != null && 
    (request.auth.token.email == 'engageperfect@gmail.com');
     
  // System can create referrals and update conversion data
  allow create, update: if request.auth != null;
}

// Commission ledger collection
match /commission_ledger/{entryId} {
  // Partners can read their own commission entries
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/partners/$(resource.data.partnerId)) &&
    get(/databases/$(database)/documents/partners/$(resource.data.partnerId)).data.uid == request.auth.uid;
    
  // Admins can read/write all commission entries
  allow read, write: if request.auth != null && 
    (request.auth.token.email == 'engageperfect@gmail.com');
     
  // System can create and update commission entries
  allow create, update: if request.auth != null;
}

// Payout requests collection (if implemented)
match /payout_requests/{payoutId} {
  // Partners can read their own payout requests
  allow read: if request.auth != null && request.auth.uid == resource.data.partnerId;
  
  // Partners can create payout requests for themselves
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.partnerId &&
    exists(/databases/$(database)/documents/partners/$(request.resource.data.partnerId)) &&
    get(/databases/$(database)/documents/partners/$(request.resource.data.partnerId)).data.uid == request.auth.uid;
    
  // Admins can read/write all payout requests
  allow read, write: if request.auth != null && 
    (request.auth.token.email == 'engageperfect@gmail.com');
}
`;

/**
 * Database Migration Helper Functions
 * Use these to set up the initial collections and indexes
 */

import { getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_COMMISSION_RATE } from '../types/partners.js';

export class PartnerDatabaseMigration {
  private db = getFirestore();

  /**
   * Create initial collections with proper structure
   */
  async createInitialCollections(): Promise<void> {
    try {
      // Create a sample partner (can be deleted later)
      const samplePartnerId = 'sample-partner-id';
      await this.db.collection('partners').doc(samplePartnerId).set({
        uid: 'sample-uid',
        email: 'sample@example.com',
        displayName: 'Sample Partner',
        commissionRate: DEFAULT_COMMISSION_RATE,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalReferrals: 0,
          totalConversions: 0,
          totalCommissionEarned: 0,
          totalCommissionPaid: 0,
          lastCalculated: new Date()
        }
      });

      // Create a sample partner code
      await this.db.collection('partnerCodes').doc('SAMPLE123').set({
        code: 'SAMPLE123',
        partnerId: samplePartnerId,
        active: true,
        createdAt: new Date(),
        uses: 0,
        description: 'Sample partner code'
      });

      // Create a sample referral
      const sampleReferralId = 'sample-referral-id';
      await this.db.collection('referrals').doc(sampleReferralId).set({
        partnerId: samplePartnerId,
        code: 'SAMPLE123',
        currency: 'usd',
        createdAt: new Date(),
        source: 'link'
      });

      // Create a sample commission entry
      await this.db.collection('commission_ledger').doc('sample-commission-id').set({
        partnerId: samplePartnerId,
        referralId: sampleReferralId,
        stripeInvoiceId: 'in_sample123',
        stripeSubscriptionId: 'sub_sample123',
        amountGross: 800, // $8.00 in cents
        commissionRate: DEFAULT_COMMISSION_RATE,
        commissionAmount: 480, // $4.80 in cents
        currency: 'usd',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'accrued',
        createdAt: new Date()
      });

      console.log('✅ Initial partner collections created successfully');
      console.log('🗑️  Remember to delete sample documents in production');
      
    } catch (error) {
      console.error('❌ Error creating initial collections:', error);
      throw error;
    }
  }

  /**
   * Add partner system indexes
   * Note: Indexes are typically managed through firestore.indexes.json
   * This is provided for reference/automation
   */
  async addIndexes(): Promise<void> {
    console.log('📋 Partner system requires the following indexes:');
    console.log('   Add these to your firestore.indexes.json file:');
    console.log(JSON.stringify(PARTNER_FIRESTORE_INDEXES, null, 2));
  }

  /**
   * Validate existing collections for partner system compatibility
   */
  async validateExistingCollections(): Promise<boolean> {
    try {
      // Check if users collection exists (required for partner validation)
      const usersCollection = await this.db.collection('users').limit(1).get();
      if (usersCollection.empty) {
        console.warn('⚠️  Users collection is empty - partners need Firebase Auth users');
      }

      // Check if customers collection exists (for Stripe integration)
      const customersCollection = await this.db.collection('customers').limit(1).get();
      if (customersCollection.empty) {
        console.warn('⚠️  Customers collection is empty - needed for commission tracking');
      }

      console.log('✅ Existing collections validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Error validating existing collections:', error);
      return false;
    }
  }

  /**
   * Clean up sample data (run in production after testing)
   */
  async cleanupSampleData(): Promise<void> {
    try {
      const batch = this.db.batch();
      
      batch.delete(this.db.collection('partners').doc('sample-partner-id'));
      batch.delete(this.db.collection('partnerCodes').doc('SAMPLE123'));
      batch.delete(this.db.collection('referrals').doc('sample-referral-id'));
      batch.delete(this.db.collection('commission_ledger').doc('sample-commission-id'));
      
      await batch.commit();
      console.log('✅ Sample data cleaned up successfully');
      
    } catch (error) {
      console.error('❌ Error cleaning up sample data:', error);
      throw error;
    }
  }
}

export default PartnerDatabaseMigration;
