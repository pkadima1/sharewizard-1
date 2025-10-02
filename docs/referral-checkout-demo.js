/**
 * Enhanced Checkout Demo Script
 * 
 * This script demonstrates how the enhanced checkout system works with referral codes.
 * Run this in the browser console to see the referral capture and checkout flow.
 */

// Demo configuration
const DEMO_CONFIG = {
  referralCode: 'ACME2024',
  userId: 'demo-user-123',
  subscriptionPriceId: 'price_1RTGhNGCd9fidigraVTwiPFB',
  flexPriceId: 'price_1RTHNhGCd9fidigrric9VnxJ'
};

/**
 * Simulate a user visiting with a referral link
 */
function simulateReferralVisit() {
  console.log('🔗 STEP 1: User visits with referral link');
  console.log(`URL: https://sharewizard.ai/pricing?ref=${DEMO_CONFIG.referralCode}`);
  
  // Simulate URL parameters
  const mockUrl = new URL(`https://sharewizard.ai/pricing?ref=${DEMO_CONFIG.referralCode}`);
  const urlParams = new URLSearchParams(mockUrl.search);
  
  console.log('📝 Referral code detected:', urlParams.get('ref'));
  
  return urlParams;
}

/**
 * Demonstrate subscription checkout with referral
 */
async function demoSubscriptionCheckout() {
  console.log('\n💳 STEP 2: User initiates subscription checkout');
  
  // Simulate the enhanced checkout process
  const urlParams = simulateReferralVisit();
  
  try {
    // This is what happens inside createEnhancedSubscriptionCheckout
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      console.log('🎯 Processing with referral code:', referralCode);
      
      // Simulate partner validation (using mock data)
      const mockPartnerData = {
        partnerId: 'acme-corp-123',
        displayName: 'ACME Corporation',
        email: 'partner@acme.com',
        active: true,
        commissionRate: 0.10
      };
      
      console.log('✅ Partner validated:', mockPartnerData.displayName);
      
      // Simulate checkout payload preparation
      const checkoutPayload = {
        price: DEMO_CONFIG.subscriptionPriceId,
        mode: 'subscription',
        client_reference_id: referralCode, // 🔑 Key: Referral code as reference
        customer_creation: 'always',       // 🔑 Key: Always create customer
        metadata: {
          user_id: DEMO_CONFIG.userId,
          source: 'referral_link',
          checkout_type: 'subscription',
          // 🔑 Key: Referral metadata for webhooks
          referralCode: referralCode,
          partnerId: mockPartnerData.partnerId,
          partnerName: mockPartnerData.displayName,
          partnerEmail: mockPartnerData.email
        }
      };
      
      console.log('📦 Checkout payload prepared:', {
        hasReferralData: true,
        clientReferenceId: checkoutPayload.client_reference_id,
        customerCreation: checkoutPayload.customer_creation,
        metadataKeys: Object.keys(checkoutPayload.metadata)
      });
      
      return checkoutPayload;
    }
  } catch (error) {
    console.error('❌ Checkout preparation failed:', error);
  }
}

/**
 * Demonstrate webhook processing simulation
 */
function demoWebhookProcessing() {
  console.log('\n🎣 STEP 3: Webhook processes completed checkout');
  
  // Simulate a Stripe checkout.session.completed event
  const mockCheckoutSession = {
    id: 'cs_test_demo123',
    customer: 'cus_demo_customer',
    subscription: 'sub_demo_subscription',
    mode: 'subscription',
    amount_total: 800, // $8.00 in cents
    currency: 'usd',
    metadata: {
      user_id: DEMO_CONFIG.userId,
      source: 'referral_link',
      checkout_type: 'subscription',
      referralCode: DEMO_CONFIG.referralCode,
      partnerId: 'acme-corp-123',
      partnerName: 'ACME Corporation',
      partnerEmail: 'partner@acme.com'
    }
  };
  
  console.log('📨 Webhook received checkout.session.completed event');
  console.log('🔍 Extracting referral metadata...');
  
  const metadata = mockCheckoutSession.metadata;
  const hasReferral = !!(metadata.referralCode && metadata.partnerId);
  
  if (hasReferral) {
    console.log('✅ Referral attribution found:', {
      referralCode: metadata.referralCode,
      partnerId: metadata.partnerId,
      partnerName: metadata.partnerName,
      amount: `$${(mockCheckoutSession.amount_total / 100).toFixed(2)}`
    });
    
    // Simulate commission calculation
    const grossAmount = mockCheckoutSession.amount_total;
    const commissionRate = 0.10; // 10%
    const commissionAmount = Math.round(grossAmount * commissionRate);
    
    console.log('💰 Commission calculated:', {
      grossAmount: `$${(grossAmount / 100).toFixed(2)}`,
      commissionRate: `${(commissionRate * 100)}%`,
      commissionAmount: `$${(commissionAmount / 100).toFixed(2)}`,
      currency: mockCheckoutSession.currency
    });
    
    // Simulate commission record creation
    const commissionRecord = {
      id: `comm_demo_${Date.now()}`,
      partnerId: metadata.partnerId,
      referralCode: metadata.referralCode,
      customerId: mockCheckoutSession.customer,
      subscriptionId: mockCheckoutSession.subscription,
      grossAmount,
      commissionRate,
      commissionAmount,
      currency: mockCheckoutSession.currency,
      status: 'pending',
      purchaseType: 'subscription',
      createdAt: new Date().toISOString()
    };
    
    console.log('📊 Commission record created:', {
      recordId: commissionRecord.id,
      status: commissionRecord.status,
      amount: `$${(commissionRecord.commissionAmount / 100).toFixed(2)}`
    });
    
    return commissionRecord;
  } else {
    console.log('ℹ️ No referral attribution - normal checkout processing');
    return null;
  }
}

/**
 * Demonstrate partner statistics update
 */
function demoPartnerStatsUpdate(commissionRecord) {
  if (!commissionRecord) return;
  
  console.log('\n📈 STEP 4: Partner statistics updated');
  
  // Simulate partner stats update
  const mockPartnerStats = {
    totalEarnings: 2500, // Previous earnings in cents
    totalReferrals: 12,  // Previous referral count
    commissionsPending: 1800 // Previous pending commissions
  };
  
  const updatedStats = {
    totalEarnings: mockPartnerStats.totalEarnings + commissionRecord.commissionAmount,
    totalReferrals: mockPartnerStats.totalReferrals + 1,
    commissionsPending: mockPartnerStats.commissionsPending + commissionRecord.commissionAmount,
    lastReferralDate: new Date().toISOString()
  };
  
  console.log('📊 Partner statistics updated:', {
    partnerId: commissionRecord.partnerId,
    newTotalEarnings: `$${(updatedStats.totalEarnings / 100).toFixed(2)}`,
    newTotalReferrals: updatedStats.totalReferrals,
    newPendingCommissions: `$${(updatedStats.commissionsPending / 100).toFixed(2)}`
  });
  
  return updatedStats;
}

/**
 * Run complete demo
 */
async function runCompleteDemo() {
  console.log('🚀 REFERRAL-ENHANCED CHECKOUT SYSTEM DEMO');
  console.log('=' .repeat(60));
  console.log(`Demo referral code: ${DEMO_CONFIG.referralCode}`);
  console.log(`Demo user ID: ${DEMO_CONFIG.userId}`);
  console.log('');
  
  try {
    // Step 1 & 2: User visits and initiates checkout
    const checkoutPayload = await demoSubscriptionCheckout();
    
    // Step 3: Webhook processes the completed checkout
    const commissionRecord = demoWebhookProcessing();
    
    // Step 4: Partner statistics are updated
    const updatedStats = demoPartnerStatsUpdate(commissionRecord);
    
    // Summary
    console.log('\n🎉 DEMO COMPLETE - REFERRAL ATTRIBUTION SUCCESS!');
    console.log('=' .repeat(60));
    console.log('✅ Referral code captured from URL');
    console.log('✅ Partner validated and metadata attached');
    console.log('✅ Checkout session created with referral attribution');
    console.log('✅ Webhook processed commission calculation');
    console.log('✅ Partner statistics updated');
    console.log('');
    console.log('💡 Key Benefits:');
    console.log('  • Automatic referral tracking');
    console.log('  • Real-time commission calculation');
    console.log('  • Complete audit trail');
    console.log('  • Partner performance analytics');
    console.log('  • Seamless user experience');
    
    return {
      success: true,
      checkoutPayload,
      commissionRecord,
      updatedStats
    };
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    return { success: false, error };
  }
}

// Export for console use
if (typeof window !== 'undefined') {
  window.demoReferralCheckout = {
    runCompleteDemo,
    simulateReferralVisit,
    demoSubscriptionCheckout,
    demoWebhookProcessing,
    demoPartnerStatsUpdate,
    DEMO_CONFIG
  };
  
  console.log('🎮 Referral checkout demo loaded!');
  console.log('Run: demoReferralCheckout.runCompleteDemo()');
}

// Auto-run in Node.js environment
if (typeof window === 'undefined') {
  runCompleteDemo().catch(console.error);
}

export { runCompleteDemo };
