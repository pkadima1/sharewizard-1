/**
 * Create Test Data Directly
 * 
 * This script creates test data by directly accessing
 * the Firebase console to add partner data.
 */

console.log('🔧 Creating Test Data for Partner Dashboard...');
console.log('');
console.log('📋 MANUAL STEPS REQUIRED:');
console.log('');
console.log('1. Open Firebase Console: https://console.firebase.google.com/project/engperfecthlc/firestore');
console.log('');
console.log('2. Add the following documents:');
console.log('');
console.log('📊 PARTNER DOCUMENT:');
console.log('Collection: partners');
console.log('Document ID: test-partner-dashboard');
console.log('Data:');
console.log(JSON.stringify({
  uid: 'test-partner-dashboard-uid',
  email: 'test.partner@example.com',
  displayName: 'Test Partner Dashboard',
  companyName: 'Test Company LLC',
  website: 'https://testcompany.com',
  commissionRate: 0.7,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  approvedAt: new Date(),
  description: 'Test partner for dashboard validation',
  stats: {
    totalReferrals: 15,
    totalConversions: 10,
    totalCommissionEarned: 1500.00,
    totalCommissionPaid: 1000.00,
    lastCalculated: new Date()
  }
}, null, 2));
console.log('');
console.log('🔑 PARTNER CODE DOCUMENT:');
console.log('Collection: partnerCodes');
console.log('Document ID: test-code-dashboard');
console.log('Data:');
console.log(JSON.stringify({
  code: 'DASHBOARD',
  partnerId: 'test-partner-dashboard-uid',
  active: true,
  uses: 8,
  maxUses: 100,
  description: 'Test referral code for dashboard',
  createdAt: new Date()
}, null, 2));
console.log('');
console.log('💰 COMMISSION ENTRIES:');
console.log('Collection: commissionLedger');
console.log('Document ID: test-commission-1');
console.log('Data:');
console.log(JSON.stringify({
  partnerId: 'test-partner-dashboard-uid',
  amount: 150.00,
  type: 'referral',
  status: 'credited',
  description: 'Commission for referral conversion',
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  stripeCustomerId: 'cus_test_001',
  stripeSubscriptionId: 'sub_test_001'
}, null, 2));
console.log('');
console.log('Document ID: test-commission-2');
console.log('Data:');
console.log(JSON.stringify({
  partnerId: 'test-partner-dashboard-uid',
  amount: 200.00,
  type: 'referral',
  status: 'credited',
  description: 'Commission for referral conversion',
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  stripeCustomerId: 'cus_test_002',
  stripeSubscriptionId: 'sub_test_002'
}, null, 2));
console.log('');
console.log('👥 REFERRAL CUSTOMERS:');
console.log('Collection: referralCustomers');
console.log('Document ID: test-customer-1');
console.log('Data:');
console.log(JSON.stringify({
  partnerId: 'test-partner-dashboard-uid',
  customerEmail: 'customer1@example.com',
  customerName: 'Customer One',
  status: 'active',
  joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  stripeCustomerId: 'cus_test_001',
  referralCode: 'DASHBOARD'
}, null, 2));
console.log('');
console.log('Document ID: test-customer-2');
console.log('Data:');
console.log(JSON.stringify({
  partnerId: 'test-partner-dashboard-uid',
  customerEmail: 'customer2@example.com',
  customerName: 'Customer Two',
  status: 'active',
  joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  stripeCustomerId: 'cus_test_002',
  referralCode: 'DASHBOARD'
}, null, 2));
console.log('');
console.log('📄 INVOICES:');
console.log('Collection: invoices');
console.log('Document ID: test-invoice-1');
console.log('Data:');
console.log(JSON.stringify({
  partnerId: 'test-partner-dashboard-uid',
  amount: 150.00,
  status: 'paid',
  description: 'Commission payment for referrals',
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
}, null, 2));
console.log('');
console.log('3. After adding all documents, test the dashboard at:');
console.log('   http://localhost:8081/en/partner/dashboard');
console.log('');
console.log('4. Sign in with a partner account or create a test account');
console.log('');
console.log('✅ Test data creation instructions completed!');




