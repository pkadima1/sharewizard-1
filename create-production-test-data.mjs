/**
 * Create Production Test Data
 * 
 * This script creates comprehensive test data for the partner dashboard
 * using Firebase Admin SDK for production-ready testing.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const serviceAccount = {
  // Add your service account key here
  // For now, we'll use the default credentials
};

try {
  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://engperfecthlc-default-rtdb.firebaseio.com'
  });
  
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  console.log('🔧 Creating Production Test Data...');
  console.log('');
  
  // Create test partner user
  const partnerUid = 'test-partner-production';
  const partnerEmail = 'test.partner@sharewizard.com';
  
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      uid: partnerUid,
      email: partnerEmail,
      displayName: 'Test Partner Production',
      emailVerified: true
    });
    
    console.log('✅ Created partner user:', userRecord.uid);
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log('ℹ️ Partner user already exists');
    } else {
      console.error('❌ Error creating partner user:', error);
    }
  }
  
  // Create partner document
  const partnerData = {
    uid: partnerUid,
    email: partnerEmail,
    displayName: 'Test Partner Production',
    companyName: 'ShareWizard Test Company',
    website: 'https://testcompany.sharewizard.com',
    commissionRate: 0.7,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedAt: new Date(),
    description: 'Test partner for production dashboard validation',
    stats: {
      totalReferrals: 25,
      totalConversions: 18,
      totalCommissionEarned: 2500.00,
      totalCommissionPaid: 1800.00,
      lastCalculated: new Date()
    }
  };
  
  await db.collection('partners').doc(partnerUid).set(partnerData);
  console.log('✅ Created partner document');
  
  // Create partner codes
  const codes = [
    {
      id: 'code-prod-1',
      partnerId: partnerUid,
      code: 'PROD2024',
      description: 'Code principal production 2024',
      active: true,
      uses: 12,
      maxUses: 1000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'code-prod-2',
      partnerId: partnerUid,
      code: 'PRODSPECIAL',
      description: 'Code spécial production',
      active: true,
      uses: 8,
      maxUses: 500,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'code-prod-3',
      partnerId: partnerUid,
      code: 'PRODBONUS',
      description: 'Code bonus production',
      active: true,
      uses: 5,
      maxUses: 200,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const code of codes) {
    await db.collection('partnerCodes').doc(code.id).set(code);
  }
  console.log('✅ Created partner codes');
  
  // Create referral customers
  const customers = [
    {
      id: 'customer-prod-1',
      partnerId: partnerUid,
      customerUid: 'customer-1-uid',
      customerEmail: 'customer1@example.com',
      customerName: 'Jean Dupont',
      referralCode: 'PROD2024',
      status: 'active',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalSpent: 150.00,
      lastActivity: new Date()
    },
    {
      id: 'customer-prod-2',
      partnerId: partnerUid,
      customerUid: 'customer-2-uid',
      customerEmail: 'customer2@example.com',
      customerName: 'Marie Martin',
      referralCode: 'PROD2024',
      status: 'active',
      joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      totalSpent: 200.00,
      lastActivity: new Date()
    },
    {
      id: 'customer-prod-3',
      partnerId: partnerUid,
      customerUid: 'customer-3-uid',
      customerEmail: 'customer3@example.com',
      customerName: 'Pierre Durand',
      referralCode: 'PRODSPECIAL',
      status: 'active',
      joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      totalSpent: 300.00,
      lastActivity: new Date()
    },
    {
      id: 'customer-prod-4',
      partnerId: partnerUid,
      customerUid: 'customer-4-uid',
      customerEmail: 'customer4@example.com',
      customerName: 'Sophie Bernard',
      referralCode: 'PRODBONUS',
      status: 'active',
      joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      totalSpent: 250.00,
      lastActivity: new Date()
    },
    {
      id: 'customer-prod-5',
      partnerId: partnerUid,
      customerUid: 'customer-5-uid',
      customerEmail: 'customer5@example.com',
      customerName: 'Lucas Moreau',
      referralCode: 'PROD2024',
      status: 'active',
      joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      totalSpent: 180.00,
      lastActivity: new Date()
    }
  ];
  
  for (const customer of customers) {
    await db.collection('referralCustomers').doc(customer.id).set(customer);
  }
  console.log('✅ Created referral customers');
  
  // Create commission ledger entries
  const commissions = [
    {
      id: 'commission-prod-1',
      partnerId: partnerUid,
      customerEmail: 'customer1@example.com',
      invoiceId: 'inv-001',
      amount: 25.50,
      commission: 17.85,
      status: 'paid',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-2',
      partnerId: partnerUid,
      customerEmail: 'customer2@example.com',
      invoiceId: 'inv-002',
      amount: 32.00,
      commission: 22.40,
      status: 'paid',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-3',
      partnerId: partnerUid,
      customerEmail: 'customer3@example.com',
      invoiceId: 'inv-003',
      amount: 45.00,
      commission: 31.50,
      status: 'paid',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-4',
      partnerId: partnerUid,
      customerEmail: 'customer4@example.com',
      invoiceId: 'inv-004',
      amount: 35.00,
      commission: 24.50,
      status: 'paid',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-5',
      partnerId: partnerUid,
      customerEmail: 'customer5@example.com',
      invoiceId: 'inv-005',
      amount: 28.00,
      commission: 19.60,
      status: 'paid',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-6',
      partnerId: partnerUid,
      customerEmail: 'customer1@example.com',
      invoiceId: 'inv-006',
      amount: 22.00,
      commission: 15.40,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'commission-prod-7',
      partnerId: partnerUid,
      customerEmail: 'customer2@example.com',
      invoiceId: 'inv-007',
      amount: 18.50,
      commission: 12.95,
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
  
  for (const commission of commissions) {
    await db.collection('commissionLedger').doc(commission.id).set(commission);
  }
  console.log('✅ Created commission ledger entries');
  
  // Create invoices
  const invoices = [
    {
      id: 'invoice-prod-1',
      partnerId: partnerUid,
      invoiceId: 'inv-partner-001',
      customerEmail: 'partner@sharewizard.com',
      amount: 150.00,
      commission: 105.00,
      status: 'paid',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'invoice-prod-2',
      partnerId: partnerUid,
      invoiceId: 'inv-partner-002',
      customerEmail: 'partner@sharewizard.com',
      amount: 175.50,
      commission: 122.85,
      status: 'pending',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'invoice-prod-3',
      partnerId: partnerUid,
      invoiceId: 'inv-partner-003',
      customerEmail: 'partner@sharewizard.com',
      amount: 125.25,
      commission: 87.68,
      status: 'paid',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000)
    }
  ];
  
  for (const invoice of invoices) {
    await db.collection('invoices').doc(invoice.id).set(invoice);
  }
  console.log('✅ Created invoices');
  
  console.log('');
  console.log('🎉 Production test data created successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('- Partner: test-partner-production');
  console.log('- Partner codes: 3');
  console.log('- Referral customers: 5');
  console.log('- Commission entries: 7');
  console.log('- Invoices: 3');
  console.log('');
  console.log('🔗 Test the dashboard at: http://localhost:8082/en/partner/dashboard');
  console.log('📧 Login with: test.partner@sharewizard.com');
  console.log('');
  console.log('✅ All test data is now ready for production testing!');
  
} catch (error) {
  console.error('❌ Error creating test data:', error);
  console.log('');
  console.log('💡 Manual setup required:');
  console.log('1. Use Firebase Console to add data manually');
  console.log('2. Follow instructions in INSTRUCTIONS_DONNEES_TEST.md');
  console.log('3. Or use the create-test-data-direct.mjs script');
}
