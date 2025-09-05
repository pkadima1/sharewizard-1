/**
 * Firebase Cloud Function for creating Stripe checkout sessions with referral metadata
 * 
 * This function handles both subscription and one-time payment checkout sessions,
 * ensuring proper referral code validation and metadata attachment for webhook processing.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import Stripe from "stripe";
import { initializeFirebaseAdmin, getFirestore } from "./config/firebase-admin.js";
import { config } from "./config/secrets.js";

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

// Get Stripe secret key from env or extension config
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || config.stripeSecretKey;

// Initialize Stripe (only if key is available)
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-04-30.basil"
  });
} else {
  console.warn("⚠️ Stripe not initialized due to missing secret key");
}

// Interface for checkout session request
interface CheckoutSessionRequest {
  userId: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  quantity?: number;
  referralCode?: string;
  couponCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe checkout session with referral metadata
 * 
 * This function:
 * 1. Reads the referral code from the client request
 * 2. Validates the referral code against Firestore partner database
 * 3. Resolves the partnerId from the referral code
 * 4. Sets client_reference_id to the referral code for tracking
 * 5. Attaches comprehensive metadata for webhook processing
 * 6. Ensures customer_creation: 'always' for future referral tracking
 */
export const createCheckoutSession = onCall(async (request) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      throw new HttpsError('failed-precondition', 'Stripe is not configured. Please set STRIPE_SECRET_KEY.');
    }
    
    // Verify user authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as CheckoutSessionRequest;
    const { userId, priceId, mode, quantity = 1, referralCode, couponCode, successUrl, cancelUrl } = data;
    
    // Validate required parameters
    if (!userId || !priceId || !mode) {
      throw new HttpsError('invalid-argument', 'Missing required parameters: userId, priceId, or mode');
    }

    console.log('🚀 Creating checkout session with referral tracking:', {
      userId,
      priceId,
      mode,
      quantity,
      hasReferralCode: !!referralCode
    });

    // ========================================
    // REFERRAL CODE VALIDATION & PARTNER RESOLUTION
    // ========================================
    
    let referralMetadata: Record<string, string> = {};
    let partnerId: string | null = null;
    
    if (referralCode) {
      console.log('🎯 Processing checkout with referral code:', referralCode);
      
      try {
        // Validate referral code against Firestore partner database
        const partnerQuery = await db.collection('partners')
          .where('referralCodes', 'array-contains', referralCode)
          .where('active', '==', true)
          .limit(1)
          .get();
        
        if (!partnerQuery.empty) {
          const partnerDoc = partnerQuery.docs[0];
          const partnerData = partnerDoc.data();
          
          // Resolve partnerId from validated referral code
          partnerId = partnerDoc.id;
          
          console.log('✅ Valid referral code found for partner:', {
            partnerId,
            partnerName: partnerData.displayName,
            referralCode
          });
          
          // ========================================
          // METADATA ATTACHMENT FOR WEBHOOK PROCESSING
          // ========================================
          // 
          // Why we attach this metadata:
          // 1. Enables automatic commission calculation in webhooks
          // 2. Provides partner correlation for referral tracking
          // 3. Supports comprehensive analytics and reporting
          // 4. Ensures proper attribution even if session is resumed later
          //
          referralMetadata = {
            referralCode,
            partnerId,
            partnerName: partnerData.displayName || 'Unknown Partner',
            partnerEmail: partnerData.email || '',
            source: 'referral_link'
          };
        } else {
          console.log('⚠️ Invalid or inactive referral code, proceeding without referral attribution');
          // Note: We don't throw an error here - invalid referral codes should not block checkout
        }
      } catch (error) {
        console.error('❌ Error validating referral code:', error);
        // Continue checkout without referral attribution on validation error
        // This ensures checkout flow is never interrupted by referral system issues
      }
    }

    // ========================================
    // STRIPE CHECKOUT SESSION CREATION
    // ========================================
    
    // Prepare base checkout session configuration
    const checkoutSessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ['card'],
      
      // ========================================
      // CRITICAL REFERRAL TRACKING CONFIGURATION
      // ========================================
      // 
      // client_reference_id: Set to referral code for easy tracking and correlation
      // This enables us to link completed checkouts back to referral campaigns
      // even if webhook metadata is somehow lost or corrupted
      //
      client_reference_id: referralCode || userId,
      
      // ========================================
      // CUSTOMER CREATION STRATEGY
      // ========================================
      // 
      // customer_creation: 'always' ensures we have a Stripe customer record
      // This is essential for:
      // 1. Future referral tracking and attribution
      // 2. Subscription management and upgrades
      // 3. Commission calculations and partner payouts
      // 4. Customer lifetime value analytics
      //
      customer_creation: 'always',
      
      // Line items configuration
      line_items: [
        {
          price: priceId,
          quantity: mode === 'payment' ? quantity : 1, // Subscriptions always quantity 1
        },
      ],
      
      // Success and cancel URLs
      success_url: successUrl || `${process.env.DOMAIN_URL || 'https://yourdomain.com'}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.DOMAIN_URL || 'https://yourdomain.com'}/pricing?checkout_canceled=true`,
      
      // Enable promotional codes
      allow_promotion_codes: true,
      
      // Collect billing address for tax compliance
      billing_address_collection: 'auto',
      
      // ========================================
      // COMPREHENSIVE METADATA FOR WEBHOOK PROCESSING
      // ========================================
      // 
      // This metadata is attached to the checkout session and automatically
      // passed to all webhook events (checkout.session.completed, etc.)
      // 
      // The webhook handler uses this metadata to:
      // 1. Identify referral transactions and calculate commissions
      // 2. Update partner statistics and performance metrics
      // 3. Send notification emails to partners about successful referrals
      // 4. Generate accurate reporting and analytics data
      // 5. Handle subscription vs one-time payment logic appropriately
      //
      metadata: {
        // Core identification
        user_id: userId,
        source: referralMetadata.source || 'ShareWizard Web App',
        created_at: new Date().toISOString(),
        checkout_type: mode, // 'subscription' or 'payment'
        
        // Product information for commission calculation
        ...(mode === 'payment' && {
          product_type: 'flex_pack',
          quantity: quantity.toString()
        }),
        
        // Referral attribution (only if referral present)
        // This spreads the referral metadata object, adding:
        // - referralCode: The referral code used
        // - partnerId: UUID of the referring partner
        // - partnerName: Display name of partner for notifications
        // - partnerEmail: Partner email for commission notifications
        ...referralMetadata
      }
    };
    
    // Add coupon if provided
    if (couponCode) {
      checkoutSessionConfig.discounts = [{
        coupon: couponCode
      }];
    }
    
    // Add subscription-specific configuration
    if (mode === 'subscription') {
      checkoutSessionConfig.subscription_data = {
        trial_period_days: 5, // Default trial period
      };
    }
    
    // Create the checkout session
    console.log('💳 Creating Stripe checkout session with configuration:', {
      mode,
      hasReferral: !!referralCode,
      partnerId,
      clientReferenceId: checkoutSessionConfig.client_reference_id,
      customerCreation: checkoutSessionConfig.customer_creation
    });
    
    const session = await stripe.checkout.sessions.create(checkoutSessionConfig);
    
    console.log('✅ Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
      hasReferralMetadata: Object.keys(referralMetadata).length > 0
    });
    
    // Return the session details to the client
    return {
      sessionId: session.id,
      url: session.url,
      hasReferral: !!referralCode,
      partnerId,
      success: true
    };
    
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    
    // Return structured error for client handling
    throw new HttpsError('internal', `Failed to create checkout session: ${error.message}`);
  }
});
