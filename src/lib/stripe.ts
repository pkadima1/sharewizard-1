
import { doc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from './firebase';
import { STRIPE_CUSTOMER_PORTAL_URL } from './subscriptionUtils';
import { getReferralCode, validateReferralCode } from './referrals';

/**
 * Creates a checkout session for a subscription with referral tracking
 */
export const createSubscriptionCheckout = async (userId: string, priceId: string) => {
  try {
    // ========================================
    // REFERRAL CAPTURE & VALIDATION
    // ========================================
    
    // Get current referral code from storage (URL params, cookies, or localStorage)
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    const referralCode = getReferralCode(urlParams);
    
    let referralMetadata: Record<string, string> = {};
    
    if (referralCode) {
      console.log('🎯 Processing subscription checkout with referral code:', referralCode);
      
      try {
        // Validate referral code against Firebase/mock data
        const partnerData = await validateReferralCode(referralCode);
        
        if (partnerData) {
          console.log('✅ Valid referral code found for partner:', partnerData.displayName);
          
          // Set referral metadata for Stripe
          referralMetadata = {
            referralCode,
            partnerId: partnerData.partnerId || '',
            partnerName: partnerData.displayName || 'Unknown Partner',
            partnerEmail: partnerData.email || '',
            source: 'referral_link'
          };
          
          // Remove any undefined or empty values
          referralMetadata = Object.fromEntries(
            Object.entries(referralMetadata).filter(([_, value]) => value && value !== '' && value !== undefined)
          );
        } else {
          console.log('⚠️ Invalid referral code, proceeding without referral attribution');
        }
      } catch (error) {
        console.error('❌ Error validating referral code during subscription checkout:', error);
      }
    }
    
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"), 
      {
        price: priceId,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
        subscription_data: {
          trial_period_days: 5, // Add 5-day trial
        },
        allow_promotion_codes: true, // Enable promo code field
        billing_address_collection: 'auto', // Collect billing address
        payment_method_types: ['card'], // Payment method types
        mode: 'subscription', // Subscription mode
        
        // ========================================
        // REFERRAL METADATA ATTACHMENT
        // ========================================
        // 
        // Why we attach this metadata:
        // 1. client_reference_id: Used for tracking and linking back to our referral system
        // 2. metadata: Passed through to Stripe webhooks for commission processing
        // 3. customer_creation: Ensures we always have a Stripe customer for future referrals
        //
        client_reference_id: referralCode || userId, // Use referral code as primary reference
        customer_creation: 'always', // Always create customer for referral tracking
        
        // Base metadata + referral metadata
        metadata: {
          user_id: userId,
          source: referralMetadata.source || 'EngagePerfect AI Web App',
          created_at: new Date().toISOString(),
          checkout_type: 'subscription',
          // Only spread defined referral metadata fields
          ...(Object.keys(referralMetadata).length > 0 ? Object.fromEntries(
            Object.entries(referralMetadata).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          ) : {})
        }
      }
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Creates a checkout session for a one-time Flex purchase with referral tracking
 */
export const createFlexCheckout = async (userId: string, priceId: string, quantity: number = 1) => {
  try {
    // ========================================
    // REFERRAL CAPTURE & VALIDATION
    // ========================================
    
    // Get current referral code from storage (URL params, cookies, or localStorage)
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    const referralCode = getReferralCode(urlParams);
    
    let referralMetadata: Record<string, string> = {};
    
    if (referralCode) {
      console.log('🎯 Processing flex checkout with referral code:', referralCode);
      
      try {
        // Validate referral code against Firebase/mock data
        const partnerData = await validateReferralCode(referralCode);
        
        if (partnerData) {
          console.log('✅ Valid referral code found for partner:', partnerData.displayName);
          
          // Set referral metadata for Stripe
          referralMetadata = {
            referralCode,
            partnerId: partnerData.partnerId || '',
            partnerName: partnerData.displayName || 'Unknown Partner',
            partnerEmail: partnerData.email || '',
            source: 'referral_link'
          };
          
          // Remove any undefined or empty values
          referralMetadata = Object.fromEntries(
            Object.entries(referralMetadata).filter(([_, value]) => value && value !== '' && value !== undefined)
          );
        } else {
          console.log('⚠️ Invalid referral code, proceeding without referral attribution');
        }
      } catch (error) {
        console.error('❌ Error validating referral code during flex checkout:', error);
      }
    }
    
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      {
        mode: "payment",
        price: priceId,
        quantity: quantity,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
        allow_promotion_codes: true, // Enable promo code field
        billing_address_collection: 'auto', // Collect billing address
        payment_method_types: ['card'], // Payment method types
        
        // ========================================
        // REFERRAL METADATA ATTACHMENT
        // ========================================
        // 
        // Why we attach this metadata:
        // 1. client_reference_id: Used for tracking and linking back to our referral system
        // 2. metadata: Passed through to Stripe webhooks for commission processing
        // 3. customer_creation: Ensures we always have a Stripe customer for future referrals
        //
        client_reference_id: referralCode || userId, // Use referral code as primary reference
        customer_creation: 'always', // Always create customer for referral tracking
        
        // Base metadata + referral metadata
        metadata: {
          user_id: userId,
          source: referralMetadata.source || 'EngagePerfect AI Web App',
          created_at: new Date().toISOString(),
          checkout_type: 'payment',
          product_type: 'flex_pack',
          quantity: quantity.toString(),
          // Only spread defined referral metadata fields
          ...(Object.keys(referralMetadata).length > 0 ? Object.fromEntries(
            Object.entries(referralMetadata).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          ) : {})
        }
      }
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating flex checkout:", error);
    throw new Error(`Failed to create flex checkout session: ${error.message}`);
  }
};

/**
 * Opens the Stripe Customer Portal
 */
export const openCustomerPortal = async () => {
  try {
    // Redirect to the Stripe Customer Portal URL
    window.location.href = STRIPE_CUSTOMER_PORTAL_URL;
    return STRIPE_CUSTOMER_PORTAL_URL;
  } catch (error: any) {
    console.error("Error opening customer portal:", error);
    throw new Error(`Failed to open customer portal: ${error.message}`);
  }
};

/**
 * Gets user role from Firebase custom claims
 */
export const getUserRole = async (): Promise<string | null> => {
  try {
    // Force refresh token to get the latest custom claims
    await auth.currentUser?.getIdToken(true);
    const decodedToken = await auth.currentUser?.getIdTokenResult();
    
    return decodedToken?.claims?.stripeRole as string || null;
  } catch (error: any) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Checks if user has access to specified tier
 */
export const checkUserAccess = async (requiredTier: 'basic' | 'premium' | 'flexy'): Promise<boolean> => {
  try {
    const role = await getUserRole();
    
    if (!role) return false;
    
    switch (requiredTier) {
      case 'basic':
        // Basic, Premium and Flexy users can access basic features
        return role === 'basic' || role === 'basicMonth' || role === 'basicYear' || 
               role === 'premiumMonth' || role === 'premiumYear' || role === 'flexy';
      case 'premium':
        // Premium and Flexy users can access premium features
        return role === 'premiumMonth' || role === 'premiumYear' || role === 'flexy';
      case 'flexy':
        // Only Flexy users can access flexy features
        return role === 'flexy';
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking user access:", error);
    return false;
  }
};
