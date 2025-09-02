import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

/**
 * Client-side function to create a Stripe checkout session with referral metadata
 * 
 * This function calls the Firebase Cloud Function `createCheckoutSession` which:
 * 1. Validates the referral code against Firestore partner database
 * 2. Resolves partnerId from the referral code
 * 3. Creates a Stripe checkout session with proper metadata
 * 4. Sets client_reference_id to referral code for tracking
 * 5. Ensures customer_creation: 'always' for future referral attribution
 */

interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  quantity?: number;
  referralCode?: string;
  couponCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CreateCheckoutResponse {
  sessionId: string;
  url: string | null;
  hasReferral: boolean;
  partnerId: string | null;
  success: boolean;
}

/**
 * Creates a Stripe checkout session with comprehensive referral tracking
 * 
 * @param request - Checkout session parameters
 * @returns Promise resolving to checkout session details
 */
export const createCheckoutSessionWithReferral = async (
  request: CreateCheckoutRequest
): Promise<CreateCheckoutResponse> => {
  try {
    const functions = getFunctions();
    const createCheckoutSession = httpsCallable<CreateCheckoutRequest, CreateCheckoutResponse>(
      functions,
      'createCheckoutSession'
    );

    console.log('🚀 Creating checkout session with referral tracking:', {
      mode: request.mode,
      hasReferralCode: !!request.referralCode,
      priceId: request.priceId
    });

    const result = await createCheckoutSession(request);
    
    console.log('✅ Checkout session created successfully:', {
      sessionId: result.data.sessionId,
      hasReferral: result.data.hasReferral,
      partnerId: result.data.partnerId
    });

    return result.data;
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Helper function to create a subscription checkout with referral tracking
 */
export const createSubscriptionCheckoutWithReferral = async (
  userId: string,
  priceId: string,
  options: {
    referralCode?: string;
    couponCode?: string;
    successUrl?: string;
    cancelUrl?: string;
  } = {}
): Promise<CreateCheckoutResponse> => {
  return createCheckoutSessionWithReferral({
    userId,
    priceId,
    mode: 'subscription',
    ...options
  });
};

/**
 * Helper function to create a one-time payment checkout with referral tracking
 */
export const createPaymentCheckoutWithReferral = async (
  userId: string,
  priceId: string,
  quantity: number = 1,
  options: {
    referralCode?: string;
    couponCode?: string;
    successUrl?: string;
    cancelUrl?: string;
  } = {}
): Promise<CreateCheckoutResponse> => {
  return createCheckoutSessionWithReferral({
    userId,
    priceId,
    mode: 'payment',
    quantity,
    ...options
  });
};

/**
 * Automatically detects referral code from URL parameters and creates checkout session
 */
export const createAutoReferralCheckout = async (
  userId: string,
  priceId: string,
  mode: 'subscription' | 'payment',
  options: {
    quantity?: number;
    couponCode?: string;
    successUrl?: string;
    cancelUrl?: string;
  } = {}
): Promise<CreateCheckoutResponse> => {
  // Extract referral code from current URL
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref') || 
                      urlParams.get('referral') || 
                      urlParams.get('partner') ||
                      localStorage.getItem('referralCode') ||
                      undefined;

  if (referralCode) {
    console.log('🎯 Auto-detected referral code:', referralCode);
    // Store referral code for future use
    localStorage.setItem('referralCode', referralCode);
  }

  return createCheckoutSessionWithReferral({
    userId,
    priceId,
    mode,
    referralCode,
    ...options
  });
};
