import { doc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { getReferralCode, getCachedPartnerInfo, validateReferralCode } from './referrals';

/**
 * Enhanced version of subscription checkout that includes trial periods, upsells, coupons, and referral tracking
 * This creates a checkout session with more options mimicking direct payment links
 */
export const createEnhancedSubscriptionCheckout = async (
  userId: string, 
  priceId: string, 
  options: {
    couponCode?: string;
    trialDays?: number;
    includeUpsells?: boolean;
  } = {}
) => {
  try {
    // Default values
    const trialDays = options.trialDays ?? 5; // Default 5-day trial
    const includeUpsells = options.includeUpsells ?? true; // Default to include upsells
    
    // ========================================
    // REFERRAL CAPTURE & VALIDATION
    // ========================================
    
    // Get current referral code from storage (URL params, cookies, or localStorage)
    const currentUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(currentUrl.search);
    const referralCode = getReferralCode(urlParams);
    
    let referralMetadata: Record<string, string> = {};
    
    if (referralCode) {
      console.log('🎯 Processing checkout with referral code:', referralCode);
      
      try {
        // Validate referral code against Firebase/mock data
        const partnerData = await validateReferralCode(referralCode);
        
        if (partnerData) {
          console.log('✅ Valid referral code found for partner:', partnerData.displayName);
          
          // Set referral metadata for Stripe
          // This metadata will be attached to the checkout session and passed to webhooks
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
        console.error('❌ Error validating referral code during checkout:', error);
        // Continue checkout without referral attribution on validation error
      }
    }
    
    // Build checkout session payload
    const checkoutPayload: any = {
      price: priceId,
      success_url: `${window.location.origin}/dashboard?checkout_success=true`,
      cancel_url: `${window.location.origin}/pricing?checkout_canceled=true`,
      subscription_data: {
        trial_period_days: trialDays,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
      mode: 'subscription',
      
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
    };
    
    // Add coupon if provided
    if (options.couponCode) {
      checkoutPayload.coupon = options.couponCode;
    }
    
    // Create the checkout session
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      checkoutPayload
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
    console.error("Error creating enhanced subscription checkout:", error);
    throw new Error(`Failed to create enhanced checkout session: ${error.message}`);
  }
};

/**
 * Enhanced version of flex checkout that includes promotional options and referral tracking
 */
export const createEnhancedFlexCheckout = async (
  userId: string, 
  priceId: string, 
  quantity: number = 1, 
  options: {
    couponCode?: string;
  } = {}
) => {
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
          // This metadata will be attached to the checkout session and passed to webhooks
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
        // Continue checkout without referral attribution on validation error
      }
    }
    
    // Build checkout session payload
    const checkoutPayload: any = {
      mode: "payment",
      price: priceId,
      quantity: quantity,
      success_url: `${window.location.origin}/dashboard?checkout_success=true`,
      cancel_url: `${window.location.origin}/pricing?checkout_canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
      
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
    };
    
    // Add coupon if provided
    if (options.couponCode) {
      checkoutPayload.coupon = options.couponCode;
    }
    
    // Create the checkout session
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      checkoutPayload
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
    console.error("Error creating enhanced flex checkout:", error);
    throw new Error(`Failed to create enhanced checkout session: ${error.message}`);
  }
};
